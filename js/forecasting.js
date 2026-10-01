/**
 * ROVER Enterprise Fleet Systems
 * PB-018: Booking Demand Forecasting Engine
 * High-DPI Canvas Rendering & Interactive Scenario Simulation
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session Security Check
    const currentUser = window.ROVER_AUTH ? ROVER_AUTH.requireRole(["Admin", "Manager"]) : null;
    if (window.ROVER_AUTH && !currentUser) return;

    // Adapt sidebar if logged in as Manager
    if (currentUser && currentUser.role === "Manager") {
        const subtext = document.getElementById("sidebarSubtext");
        if (subtext) subtext.innerHTML = "MANAGEMENT &bull; FLEET OPERATIONS";
        const nav = document.getElementById("sidebarNav");
        if (nav) {
            nav.innerHTML = `
                <a href="manager.html" class="nav-item">Fleet Telemetry</a>
                <a href="service-orders.html" class="nav-item">Service Orders</a>
                <a href="service-orders.html" class="nav-item">Dispatch Queue</a>
                <a href="fleet-registry.html" class="nav-item">Fleet Registry</a>
                <a href="forecasting.html" class="nav-item active">Demand Forecasting</a>
                <a href="#" class="nav-item">SLA Analytics</a>
                <a href="#" class="nav-item">Maintenance Logs</a>
            `;
        }
    }
    if (!window.ROVER_AUTH) {
        const sessionData = sessionStorage.getItem("activeSession");
        if (!sessionData) {
            window.location.href = "index.html";
            return;
        }
        const user = JSON.parse(sessionData);
        if (user.role !== "Admin" && user.role !== "Manager") {
            window.location.href = "index.html";
            return;
        }
    }

    // 2. Forecasting Data Model
    const historicalData = [
        { month: "Nov '25", value: 110 },
        { month: "Dec '25", value: 148 },
        { month: "Jan '26", value: 92 },
        { month: "Feb '26", value: 96 },
        { month: "Mar '26", value: 104 },
        { month: "Apr '26", value: 122 },
        { month: "May '26", value: 118 },
        { month: "Jun '26", value: 112 },
        { month: "Jul '26", value: 116 },
        { month: "Aug '26", value: 124 },
        { month: "Sep '26", value: 128 },
        { month: "Oct '26", value: 132 } // Current baseline anchor
    ];

    const projectedData = [
        { month: "Oct '26", value: 132, lowerCI: 132, upperCI: 132, isAnchor: true },
        { month: "Nov '26", value: 142, lowerCI: 130, upperCI: 154, diff: "+20.3%", vehicles: 24, drivers: 12, status: "Optimal Capacity" },
        { month: "Dec '26", value: 184, lowerCI: 168, upperCI: 202, diff: "+26.9%", vehicles: 29, drivers: 15, status: "High Utilization Warning", isSurge: true },
        { month: "Jan '27", value: 104, lowerCI: 92, upperCI: 116, diff: "+6.1%", vehicles: 18, drivers: 9, status: "Optimal Capacity" },
        { month: "Feb '27", value: 110, lowerCI: 96, upperCI: 124, diff: "+7.8%", vehicles: 19, drivers: 10, status: "Optimal Capacity" }
    ];

    // Combined months for X-Axis (16 total slots: 0 to 15)
    const timelineLabels = [
        "Nov '25", "Dec '25", "Jan '26", "Feb '26", "Mar '26", "Apr '26",
        "May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26", "Oct '26",
        "Nov '26*", "Dec '26*", "Jan '27*", "Feb '27*"
    ];

    const canvas = document.getElementById("forecastChart");
    const ctx = canvas.getContext("2d");
    const decPeakBadge = document.getElementById("decPeakBadge");

    // 3. High-DPI Canvas Rendering
    function drawChart() {
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = 320;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";

        ctx.resetTransform();
        ctx.scale(dpr, dpr);

        const padLeft = 46;
        const padRight = 32;
        const padTop = 36;
        const padBottom = 42;

        const plotW = displayWidth - padLeft - padRight;
        const plotH = displayHeight - padTop - padBottom;
        const maxY = 220;
        const minY = 0;

        const getX = (idx) => padLeft + (idx + 0.5) * (plotW / timelineLabels.length);
        const getY = (val) => padTop + plotH - ((val - minY) / (maxY - minY)) * plotH;

        // Clear canvas
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // A. Horizontal Grid Lines & Y-Axis Labels
        const yTicks = [0, 50, 100, 150, 200, 220];
        ctx.font = "500 11px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        yTicks.forEach((tick) => {
            const y = getY(tick);
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = "#E2E8F0";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(displayWidth - padRight, y);
            ctx.stroke();

            ctx.fillStyle = "#94A3B8";
            ctx.fillText(tick, padLeft - 10, y);
        });

        // B. X-Axis Month Labels
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.setLineDash([]);

        timelineLabels.forEach((label, idx) => {
            const x = getX(idx);
            const isProjection = idx >= 12;

            ctx.font = isProjection ? "600 11px Inter, sans-serif" : "500 11px Inter, sans-serif";
            ctx.fillStyle = isProjection ? "#D32F2F" : "#64748B";
            ctx.fillText(label, x, padTop + plotH + 12);
        });

        // C. Slate-Grey Rounded Bars for Historical Data (Slots 0 to 11)
        const barWidth = Math.min(22, Math.max(12, (plotW / timelineLabels.length) * 0.42));
        historicalData.forEach((item, idx) => {
            const x = getX(idx);
            const y = getY(item.value);
            const barH = (padTop + plotH) - y;
            const radius = 4;

            ctx.fillStyle = idx === 11 ? "#B0BEC5" : "#CFD8DC";
            ctx.beginPath();
            ctx.moveTo(x - barWidth / 2, padTop + plotH);
            ctx.lineTo(x - barWidth / 2, y + radius);
            ctx.quadraticCurveTo(x - barWidth / 2, y, x - barWidth / 2 + radius, y);
            ctx.lineTo(x + barWidth / 2 - radius, y);
            ctx.quadraticCurveTo(x + barWidth / 2, y, x + barWidth / 2, y + radius);
            ctx.lineTo(x + barWidth / 2, padTop + plotH);
            ctx.closePath();
            ctx.fill();
        });

        // D. Historical Spline Line & Nodes (Slots 0 to 11)
        ctx.strokeStyle = "#78909C";
        ctx.lineWidth = 2;
        ctx.beginPath();
        historicalData.forEach((item, idx) => {
            const x = getX(idx);
            const y = getY(item.value);
            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        historicalData.forEach((item, idx) => {
            const x = getX(idx);
            const y = getY(item.value);
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#607D8B";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // E. Vertical Divider Line at Oct 26 ("TODAY")
        const todayX = getX(11);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(todayX, padTop - 8);
        ctx.lineTo(todayX, padTop + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // TODAY Marker Pill
        const pillW = 86;
        const pillH = 20;
        const pillX = todayX - pillW / 2;
        const pillY = padTop - 24;

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 10) : ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 9.5px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TODAY (Oct 26)", todayX, pillY + pillH / 2);

        // F. 95% Confidence Interval Ribbon (Slots 11 to 15)
        const projIndices = [11, 12, 13, 14, 15];
        ctx.fillStyle = "rgba(211, 47, 47, 0.12)";
        ctx.beginPath();

        // Upper boundary
        projIndices.forEach((slotIdx, i) => {
            const x = getX(slotIdx);
            const yUpper = getY(projectedData[i].upperCI);
            if (i === 0) {
                ctx.moveTo(x, yUpper);
            } else {
                ctx.lineTo(x, yUpper);
            }
        });

        // Lower boundary in reverse
        for (let i = projIndices.length - 1; i >= 0; i--) {
            const slotIdx = projIndices[i];
            const x = getX(slotIdx);
            const yLower = getY(projectedData[i].lowerCI);
            ctx.lineTo(x, yLower);
        }
        ctx.closePath();
        ctx.fill();

        // Dashed CI Boundary Lines
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(211, 47, 47, 0.45)";
        ctx.lineWidth = 1.5;

        // Draw upper dashed line
        ctx.beginPath();
        projIndices.forEach((slotIdx, i) => {
            const x = getX(slotIdx);
            const y = getY(projectedData[i].upperCI);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw lower dashed line
        ctx.beginPath();
        projIndices.forEach((slotIdx, i) => {
            const x = getX(slotIdx);
            const y = getY(projectedData[i].lowerCI);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // G. Solid Forecast Line (Slots 11 to 15)
        ctx.strokeStyle = "#D32F2F";
        ctx.lineWidth = 3;
        ctx.beginPath();
        projIndices.forEach((slotIdx, i) => {
            const x = getX(slotIdx);
            const y = getY(projectedData[i].value);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Projection Data Nodes & Values
        projIndices.forEach((slotIdx, i) => {
            if (i === 0) return; // Skip anchor as it's Oct 26
            const x = getX(slotIdx);
            const y = getY(projectedData[i].value);
            const isSurge = projectedData[i].isSurge;

            // Halo for Dec surge
            if (isSurge) {
                ctx.fillStyle = "rgba(211, 47, 47, 0.2)";
                ctx.beginPath();
                ctx.arc(x, y, 11, 0, Math.PI * 2);
                ctx.fill();
            }

            // Outer red node
            ctx.fillStyle = "#D32F2F";
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, isSurge ? 6 : 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Value text above point
            ctx.font = isSurge ? "800 12px Inter, sans-serif" : "700 11px Inter, sans-serif";
            ctx.fillStyle = isSurge ? "#B71C1C" : "#D32F2F";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(projectedData[i].value, x, y - (isSurge ? 12 : 7));
        });

        // H. Dynamic Positioning of Dec 2026 Floating Badge
        if (decPeakBadge) {
            const decX = getX(13);
            const decY = getY(184);

            const badgeLeft = Math.min(displayWidth - 360, Math.max(16, decX - 170));
            const badgeTop = Math.max(8, decY - 60);

            decPeakBadge.style.left = `${badgeLeft}px`;
            decPeakBadge.style.top = `${badgeTop}px`;
        }
    }

    // Initial render & responsive listeners (ResizeObserver + window resize)
    drawChart();
    window.addEventListener("resize", drawChart);
    if (window.ResizeObserver && canvas && canvas.parentElement) {
        const resizeObserver = new ResizeObserver(() => {
            drawChart();
        });
        resizeObserver.observe(canvas.parentElement);
    }

    // 4. Interactivity & Defensive Exceptions (PB-018)
    const toggleDataScenarioBtn = document.getElementById("toggleDataScenarioBtn");
    const insufficientDataAlert = document.getElementById("insufficientDataAlert");
    const dismissAlertBtn = document.getElementById("dismissAlertBtn");
    const runPredictiveModelBtn = document.getElementById("runPredictiveModelBtn");
    const projectionsTableBody = document.getElementById("projectionsTableBody");
    const metricBaselineVal = document.getElementById("metricBaselineVal");
    const metricBaselineSubtext = document.getElementById("metricBaselineSubtext");
    const metricPeakVal = document.getElementById("metricPeakVal");
    const metricCapacityVal = document.getElementById("metricCapacityVal");
    const btn6M = document.getElementById("btn6M");
    const btn12M = document.getElementById("btn12M");
    const filterTableInput = document.getElementById("filterTableInput");
    const exportForecastCsvBtn = document.getElementById("exportForecastCsvBtn");
    const adminLogoutBtn = document.getElementById("adminLogoutBtn") || document.getElementById("logoutBtn");

    let isScenarioException = false;

    if (toggleDataScenarioBtn) {
        toggleDataScenarioBtn.addEventListener("click", () => {
            isScenarioException = !isScenarioException;

            if (isScenarioException) {
                insufficientDataAlert.style.display = "flex";
                runPredictiveModelBtn.style.opacity = "0.5";
                runPredictiveModelBtn.style.cursor = "not-allowed";
                runPredictiveModelBtn.style.pointerEvents = "none";
                projectionsTableBody.style.opacity = "0.3";

                metricBaselineVal.innerText = "84 Days";
                if (metricBaselineSubtext) metricBaselineSubtext.innerText = "84 Confirmed Records (Threshold Failed)";
                metricPeakVal.innerText = "--";
                metricCapacityVal.innerText = "-- / 31 Units";

                toggleDataScenarioBtn.innerHTML = "Restore Historical Baseline";
                toggleDataScenarioBtn.style.background = "#E2E8F0";
                toggleDataScenarioBtn.style.color = "#1E293B";
                toggleDataScenarioBtn.style.borderColor = "#CBD5E1";
            } else {
                insufficientDataAlert.style.display = "none";
                runPredictiveModelBtn.style.opacity = "1";
                runPredictiveModelBtn.style.cursor = "pointer";
                runPredictiveModelBtn.style.pointerEvents = "auto";
                projectionsTableBody.style.opacity = "1";

                metricBaselineVal.innerText = "365 Days";
                if (metricBaselineSubtext) metricBaselineSubtext.innerText = "1,420 Confirmed Records Analyzed";
                metricPeakVal.innerText = "184 Bookings";
                metricCapacityVal.innerText = "29 / 31 Units";

                toggleDataScenarioBtn.innerHTML = "&#9888; Simulate PB-018 Exception";
                toggleDataScenarioBtn.style.background = "#FFF3E0";
                toggleDataScenarioBtn.style.color = "#E65100";
                toggleDataScenarioBtn.style.borderColor = "#FFE082";
            }
        });
    }

    if (dismissAlertBtn) {
        dismissAlertBtn.addEventListener("click", () => {
            insufficientDataAlert.style.display = "none";
        });
    }

    if (runPredictiveModelBtn) {
        runPredictiveModelBtn.addEventListener("click", () => {
            if (isScenarioException) return;

            const originalText = runPredictiveModelBtn.innerHTML;
            runPredictiveModelBtn.innerHTML = '<span style="display:inline-block; animation: spin 1s linear infinite; margin-right: 6px;">&#9696;</span> Computing ARIMA...';
            runPredictiveModelBtn.disabled = true;

            setTimeout(() => {
                runPredictiveModelBtn.innerHTML = originalText;
                runPredictiveModelBtn.disabled = false;
                drawChart();
            }, 600);
        });
    }

    // Segmented Buttons Handler
    if (btn6M && btn12M) {
        btn6M.addEventListener("click", () => {
            btn6M.classList.add("active");
            btn12M.classList.remove("active");
            drawChart();
        });
        btn12M.addEventListener("click", () => {
            btn12M.classList.add("active");
            btn6M.classList.remove("active");
            drawChart();
        });
    }

    // Table Filter Handler
    if (filterTableInput && projectionsTableBody) {
        filterTableInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const rows = projectionsTableBody.querySelectorAll("tr");
            rows.forEach((row) => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? "" : "none";
            });
        });
    }

    // CSV Export Handler
    if (exportForecastCsvBtn) {
        exportForecastCsvBtn.addEventListener("click", () => {
            let csv = "FORECAST MONTH,HISTORICAL BASELINE,PROJECTED BOOKINGS,EST VEHICLE DEMAND,EST DRIVER SHIFTS,CAPACITY STATUS\n";
            csv += '"Nov 2026","118 Bookings","142 Bookings (+20.3%)","24 Units / Day","12 Drivers on Shift","Optimal Capacity"\n';
            csv += '"Dec 2026 (SURGE)","145 Bookings","184 Bookings (+26.9%)","29 Units / Day","15 Drivers on Shift","High Utilization Warning"\n';
            csv += '"Jan 2027","98 Bookings","104 Bookings (+6.1%)","18 Units / Day","9 Drivers on Shift","Optimal Capacity"\n';
            csv += '"Feb 2027","102 Bookings","110 Bookings (+7.8%)","19 Units / Day","10 Drivers on Shift","Optimal Capacity"\n';

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `PB-018_demand_forecast_${Date.now()}.csv`);
            link.click();
        });
    }

    // Logout Handler
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "index.html";
        });
    }
});
