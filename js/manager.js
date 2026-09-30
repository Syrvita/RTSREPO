/**
 * ROVER FLEET SYSTEMS - OPERATIONS MANAGER CONTROLLER (js/manager.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles Fleet Telemetry & Operations Oversight (manager.html)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Allows Manager and Admin)
    const currentUser = ROVER_AUTH.requireRole(["Manager", "Admin"]);
    if (!currentUser) return;

    // Adapt sidebar if logged in as Admin
    if (currentUser.role === "Admin") {
        const subtext = document.getElementById("sidebarSubtext");
        if (subtext) subtext.innerHTML = "ADMIN PORTAL &bull; FLEET SYSTEMS";
        const nav = document.getElementById("sidebarNav");
        if (nav) {
            nav.innerHTML = `
                <a href="admin.html" class="nav-item">Dashboard</a>
                <a href="admin.html" class="nav-item">KYC Verification</a>
                <a href="service-orders.html" class="nav-item">Service Orders</a>
                <a href="#" class="nav-item">Fleet Registry</a>
                <a href="users.html" class="nav-item">User Management</a>
                <a href="#" class="nav-item">Driver Directory</a>
                <a href="forecasting.html" class="nav-item">Demand Forecasting</a>
                <a href="#" class="nav-item">Expense Reports</a>
            `;
        }
    }

    // 2. Telemetry Queue Dataset
    const telemetryDispatches = [
        {
            vehicleId: "RV-VAN-104",
            model: "Toyota Hiace Commuter",
            driver: "Eduardo Santos",
            driverId: "RVR-FLT-0382",
            client: "Apex Logistics",
            route: "Makati HQ Route",
            status: "EN ROUTE",
            eta: "08:45 AM",
            etaSub: "On-Time",
            etaStatus: "ontime"
        },
        {
            vehicleId: "RV-BUS-022",
            model: "Nissan Civilian",
            driver: "Marco Polo",
            driverId: "RVR-FLT-0211",
            client: "Global Tech Inc.",
            route: "BGC Night Shift",
            status: "EN ROUTE",
            eta: "09:15 AM",
            etaSub: "On-Time",
            etaStatus: "ontime"
        },
        {
            vehicleId: "RV-SUV-008",
            model: "Ford Everest",
            driver: "Juan Dela Cruz",
            driverId: "RVR-FLT-0045",
            client: "Executive Transit",
            route: "Ortigas VIP Run",
            status: "IDLE / LOADING",
            eta: "--:--",
            etaSub: "Waiting for Client",
            etaStatus: "idle"
        },
        {
            vehicleId: "RV-VAN-115",
            model: "Nissan Urvan",
            driver: "Luis Antonio",
            driverId: "RVR-FLT-0410",
            client: "Apex Logistics",
            route: "Pasig Warehouse",
            status: "EN ROUTE",
            eta: "09:30 AM",
            etaSub: "On-Time",
            etaStatus: "ontime"
        },
        {
            vehicleId: "RV-VAN-089",
            model: "Toyota Hiace",
            driver: "Ricardo Gomez",
            driverId: "RVR-FLT-0305",
            client: "Manila Freight",
            route: "Alabang Route",
            status: "DELAYED",
            eta: "10:00 AM",
            etaSub: "Traffic Congestion",
            etaStatus: "delayed"
        },
        {
            vehicleId: "RV-BUS-014",
            model: "Mitsubishi Rosa",
            driver: "Pedro Penduko",
            driverId: "RVR-FLT-0150",
            client: "Global Tech Inc.",
            route: "QC Morning Shift",
            status: "EN ROUTE",
            eta: "10:15 AM",
            etaSub: "On-Time",
            etaStatus: "ontime"
        }
    ];

    let currentFilter = "ALL";
    let searchQuery = "";

    const tbody = document.querySelector(".manager-view .data-table tbody");
    const searchInput = document.querySelector(".manager-view .table-toolbar input");
    const filterBtns = document.querySelectorAll(".manager-view .table-toolbar .toolbar-actions button.btn-ghost");
    const paginationEl = document.querySelector(".manager-view .table-pagination");

    function renderTable() {
        if (!tbody) return;

        const q = searchQuery.toLowerCase().trim();
        const filtered = telemetryDispatches.filter(item => {
            const matchesFilter =
                currentFilter === "ALL" ? true :
                currentFilter === "EN ROUTE" ? item.status === "EN ROUTE" :
                currentFilter === "IDLE / LOADING" ? item.status === "IDLE / LOADING" : true;

            const matchesSearch = !q ||
                item.vehicleId.toLowerCase().includes(q) ||
                item.driver.toLowerCase().includes(q) ||
                item.client.toLowerCase().includes(q) ||
                item.route.toLowerCase().includes(q);

            return matchesFilter && matchesSearch;
        });

        tbody.innerHTML = "";

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #757575; padding: 2rem;">
                        No telemetry records found matching criteria.
                    </td>
                </tr>
            `;
            if (paginationEl) paginationEl.innerText = `Showing 0 of ${telemetryDispatches.length} active dispatches`;
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement("tr");

            let badgeClass = "status-enroute";
            if (item.status === "IDLE / LOADING") badgeClass = "status-idle";
            else if (item.status === "DELAYED") badgeClass = "status-delayed";

            let etaColor = "#388E3C";
            if (item.etaStatus === "delayed") etaColor = "#D32F2F";
            else if (item.etaStatus === "idle") etaColor = "#757575";

            tr.innerHTML = `
                <td><strong>${item.vehicleId}</strong><br><span style="color: #757575; font-size: 0.75rem;">${item.model}</span></td>
                <td>${item.driver}<br><span style="color: #757575; font-size: 0.75rem;">ID: ${item.driverId}</span></td>
                <td>${item.client}<br><span style="color: #757575; font-size: 0.75rem;">${item.route}</span></td>
                <td><span class="status-badge ${badgeClass}">${item.status}</span></td>
                <td>${item.eta}<br><span style="color: ${etaColor}; font-size: 0.75rem;">${item.etaSub}</span></td>
                <td><button class="btn-telemetry" data-id="${item.vehicleId}">TELEMETRY</button></td>
            `;

            // Telemetry button click event
            const btn = tr.querySelector(".btn-telemetry");
            btn.addEventListener("click", () => {
                alert(`[ROVER TELEMETRY MESH]\n\nUnit: ${item.vehicleId} (${item.model})\nDriver: ${item.driver} (${item.driverId})\nLocation: Manila Corridor Live\nSignal: 4G LTE-M (12ms Latency)\nDiagnostics: Engine OK • Fuel 82% • Speed 44 km/h`);
            });

            tbody.appendChild(tr);
        });

        if (paginationEl) {
            paginationEl.innerText = `Showing 1 to ${filtered.length} of ${telemetryDispatches.length} active dispatches`;
        }
    }

    // Filter Buttons
    if (filterBtns && filterBtns.length >= 3) {
        filterBtns[0].addEventListener("click", () => {
            currentFilter = "ALL";
            filterBtns[0].style.fontWeight = "700";
            filterBtns[0].style.color = "#212121";
            filterBtns[0].style.background = "#F5F5F5";
            filterBtns[1].style.fontWeight = "500";
            filterBtns[1].style.color = "#757575";
            filterBtns[1].style.background = "transparent";
            filterBtns[2].style.fontWeight = "500";
            filterBtns[2].style.color = "#757575";
            filterBtns[2].style.background = "transparent";
            renderTable();
        });

        filterBtns[1].addEventListener("click", () => {
            currentFilter = "EN ROUTE";
            filterBtns[1].style.fontWeight = "700";
            filterBtns[1].style.color = "#212121";
            filterBtns[1].style.background = "#F5F5F5";
            filterBtns[0].style.fontWeight = "500";
            filterBtns[0].style.color = "#757575";
            filterBtns[0].style.background = "transparent";
            filterBtns[2].style.fontWeight = "500";
            filterBtns[2].style.color = "#757575";
            filterBtns[2].style.background = "transparent";
            renderTable();
        });

        filterBtns[2].addEventListener("click", () => {
            currentFilter = "IDLE / LOADING";
            filterBtns[2].style.fontWeight = "700";
            filterBtns[2].style.color = "#212121";
            filterBtns[2].style.background = "#F5F5F5";
            filterBtns[0].style.fontWeight = "500";
            filterBtns[0].style.color = "#757575";
            filterBtns[0].style.background = "transparent";
            filterBtns[1].style.fontWeight = "500";
            filterBtns[1].style.color = "#757575";
            filterBtns[1].style.background = "transparent";
            renderTable();
        });
    }

    // Search input listener
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderTable();
        });
    }

    // Refresh button
    const refreshBtn = Array.from(document.querySelectorAll(".manager-view .header-actions button")).find(b => b.innerText.includes("REFRESH"));
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            const originalText = refreshBtn.innerText;
            refreshBtn.innerText = "REFRESHING...";
            refreshBtn.disabled = true;
            setTimeout(() => {
                refreshBtn.innerText = "UPDATED ✓";
                renderTable();
                setTimeout(() => {
                    refreshBtn.innerText = originalText;
                    refreshBtn.disabled = false;
                }, 1000);
            }, 600);
        });
    }

    // Export Log
    const exportBtn = Array.from(document.querySelectorAll(".manager-view .table-toolbar button")).find(b => b.innerText.includes("EXPORT LOG"));
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const csvRows = [
                ["Vehicle ID", "Model", "Driver", "Driver ID", "Client", "Route", "Status", "ETA"]
            ];
            telemetryDispatches.forEach(d => {
                csvRows.push([`"${d.vehicleId}"`, `"${d.model}"`, `"${d.driver}"`, `"${d.driverId}"`, `"${d.client}"`, `"${d.route}"`, `"${d.status}"`, `"${d.eta}"`]);
            });
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `rover_telemetry_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Create Urgent Dispatch button
    const urgentBtn = Array.from(document.querySelectorAll(".manager-view .header-actions button")).find(b => b.innerText.includes("CREATE URGENT DISPATCH"));
    if (urgentBtn) {
        urgentBtn.addEventListener("click", () => {
            window.location.href = "service-orders.html";
        });
    }

    // Initial render
    renderTable();
});
