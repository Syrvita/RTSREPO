/**
 * ROVER FLEET SYSTEMS - FLEET REGISTRY CONTROLLER (js/fleet-registry.js)
 * Scoped Multi-Page Architecture (MPA)
 * Asset Inventory & Fleet Tracking Controller
 * Compatible with local file:// protocol
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
                <a href="admin-service-orders.html" class="nav-item">Dispatch Confirmation</a>
                <a href="fleet-registry.html" class="nav-item active">Fleet Registry</a>
                <a href="users.html" class="nav-item">User Management</a>
                <a href="users.html" class="nav-item">Driver Directory</a>
                <a href="forecasting.html" class="nav-item">Demand Forecasting</a>
                <a href="javascript:void(0)" class="nav-item">Expense Reports</a>
            `;
        }
    }

    const tbody = document.getElementById("fleetTableBody");
    const searchInput = document.getElementById("fleetSearchInput");
    const exportBtn = document.getElementById("exportFleetCsvBtn");

    let currentFilter = "all";

    // 2. Render Fleet Table
    function renderFleetTable() {
        if (!tbody) return;
        const db = ROVER_DB.get();
        const fleet = db.fleet || [];

        // Calculate and update metrics
        const totalUnits = fleet.length;
        const availableUnits = fleet.filter(u => u.status === "Available").length;
        const inUseUnits = fleet.filter(u => u.status !== "Available" && u.status !== "Maintenance").length;
        const maintenanceUnits = fleet.filter(u => u.status === "Maintenance").length;

        const elTotal = document.getElementById("metricFleetTotal");
        const elAvailable = document.getElementById("metricFleetAvailable");
        const elActive = document.getElementById("metricFleetActive");
        const elMaint = document.getElementById("metricFleetMaintenance");

        if (elTotal) elTotal.innerText = totalUnits;
        if (elAvailable) elAvailable.innerText = availableUnits;
        if (elActive) elActive.innerText = inUseUnits;
        if (elMaint) elMaint.innerText = maintenanceUnits;

        // Filter and Search
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const filtered = fleet.filter(unit => {
            const matchesQuery = !query ||
                (unit.id && unit.id.toLowerCase().includes(query)) ||
                (unit.model && unit.model.toLowerCase().includes(query)) ||
                (unit.type && unit.type.toLowerCase().includes(query)) ||
                (unit.plate && unit.plate.toLowerCase().includes(query)) ||
                (unit.hub && unit.hub.toLowerCase().includes(query)) ||
                (unit.status && unit.status.toLowerCase().includes(query));

            if (!matchesQuery) return false;

            if (currentFilter === "all") return true;
            if (currentFilter === "available") return unit.status === "Available";
            if (currentFilter === "in-use") return unit.status !== "Available" && unit.status !== "Maintenance";
            if (currentFilter === "vans") return (unit.type || "").toLowerCase().includes("van") || (unit.model || "").toLowerCase().includes("hiace") || (unit.model || "").toLowerCase().includes("urvan");
            if (currentFilter === "utility") return (unit.type || "").toLowerCase().includes("utility") || (unit.type || "").toLowerCase().includes("cargo") || (unit.model || "").toLowerCase().includes("l300") || (unit.model || "").toLowerCase().includes("traviz");
            if (currentFilter === "exec") return (unit.type || "").toLowerCase().includes("executive") || (unit.model || "").toLowerCase().includes("starex") || (unit.model || "").toLowerCase().includes("staria") || (unit.model || "").toLowerCase().includes("grandia");

            return true;
        });

        tbody.innerHTML = "";

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #78909C; padding: 2rem;">
                        No vehicle assets match the current filter or search criteria.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(unit => {
            const tr = document.createElement("tr");

            const isAvailable = unit.status === "Available";
            const isInUse = unit.status === "Locked / In-Use";
            const isAssigned = unit.status === "Assigned";
            const isMaint = unit.status === "Maintenance";

            const statusPill = isAvailable ?
                `<span class="pill-status pill-available">● Available</span>` :
                isInUse ?
                `<span class="pill-status pill-in-use">● Locked / In-Use</span>` :
                isAssigned ?
                `<span class="pill-status pill-assigned">● Assigned (Clear)</span>` :
                `<span class="pill-status pill-maintenance">● Maintenance</span>`;

            const hubInfo = unit.hub || "Manila Hub";
            const plateInfo = unit.plate ? `Plate: <strong>${escapeHTML(unit.plate)}</strong> • ` : "";
            const bufferInfo = unit.currentTrip ?
                `<strong style="color: #D32F2F;">Trip ${escapeHTML(unit.currentTrip)}</strong>` :
                unit.scheduleBuffer ?
                `<span style="color: #2E7D32; font-weight: 500;">${escapeHTML(unit.scheduleBuffer)}</span>` :
                `<span style="color: #757575;">Ready at ${escapeHTML(hubInfo)}</span>`;

            tr.innerHTML = `
                <td><strong style="color: #1565C0;">${escapeHTML(unit.id)}</strong></td>
                <td>
                    <div style="font-weight: 600; color: #212121;">${escapeHTML(unit.model)}</div>
                    <div style="font-size: 11px; color: #757575;">${plateInfo}${escapeHTML(hubInfo)} • RFID Active</div>
                </td>
                <td><span class="type-badge">${escapeHTML(unit.type)}</span></td>
                <td><strong>${unit.capacity} PAX</strong></td>
                <td>${statusPill}</td>
                <td>${bufferInfo}</td>
                <td>
                    <button type="button" class="btn-inspect-schedule" data-unit-id="${escapeHTML(unit.id)}" style="background: none; border: none; color: #D32F2F; font-weight: 600; font-size: 12px; cursor: pointer; padding: 0; font-family: inherit;">Inspect Schedule &rarr;</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Bind in-page schedule inspection buttons
        const inspectBtns = tbody.querySelectorAll(".btn-inspect-schedule");
        inspectBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.getAttribute("data-unit-id");
                openVehicleScheduleModal(unitId);
            });
        });
    }

    // 3. Search & Filter Handlers
    if (searchInput) {
        searchInput.addEventListener("input", renderFleetTable);
    }

    const filterBtns = [
        { id: "filterFleetAll", filter: "all" },
        { id: "filterFleetAvailable", filter: "available" },
        { id: "filterFleetInUse", filter: "in-use" },
        { id: "filterFleetVans", filter: "vans" },
        { id: "filterFleetUtility", filter: "utility" },
        { id: "filterFleetExec", filter: "exec" }
    ];

    filterBtns.forEach(item => {
        const btn = document.getElementById(item.id);
        if (btn) {
            btn.addEventListener("click", () => {
                filterBtns.forEach(b => {
                    const el = document.getElementById(b.id);
                    if (el) el.classList.remove("active");
                });
                btn.classList.add("active");
                currentFilter = item.filter;
                renderFleetTable();
            });
        }
    });

    // 4. CSV Export
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const db = ROVER_DB.get();
            const fleet = db.fleet || [];
            let csv = "UNIT ID,MODEL,TYPE,CAPACITY,STATUS,CURRENT TRIP / BUFFER\n";
            fleet.forEach(u => {
                csv += `"${u.id}","${u.model}","${u.type}","${u.capacity} PAX","${u.status}","${u.currentTrip || u.scheduleBuffer || 'Ready'}"\n`;
            });
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("href", url);
            a.setAttribute("download", `rover_fleet_manifest_${Date.now()}.csv`);
            a.click();
        });
    }

    // 5. Add Vehicle Modal Logic (#addVehicleModal)
    const addVehicleModal = document.getElementById("addVehicleModal");
    const openAddVehicleModalBtn = document.getElementById("openAddVehicleModalBtn");
    const closeAddVehicleModalTopBtn = document.getElementById("closeAddVehicleModalTopBtn");
    const closeAddVehicleModalBtn = document.getElementById("closeAddVehicleModalBtn");
    const saveNewVehicleBtn = document.getElementById("saveNewVehicleBtn");
    const addVehicleForm = document.getElementById("addVehicleForm");
    const newVehicleModel = document.getElementById("newVehicleModel");
    const newVehicleCapacity = document.getElementById("newVehicleCapacity");
    const newVehiclePlate = document.getElementById("newVehiclePlate");
    const newVehicleHub = document.getElementById("newVehicleHub");
    const newVehicleStatus = document.getElementById("newVehicleStatus");
    const newVehicleRFID = document.getElementById("newVehicleRFID");

    function openAddModal() {
        if (!addVehicleModal) return;
        addVehicleModal.style.display = "flex";
    }

    function closeAddModal() {
        if (!addVehicleModal) return;
        addVehicleModal.style.display = "none";
    }

    if (openAddVehicleModalBtn) {
        openAddVehicleModalBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAddModal();
        });
    }

    if (closeAddVehicleModalTopBtn) {
        closeAddVehicleModalTopBtn.addEventListener("click", closeAddModal);
    }

    if (closeAddVehicleModalBtn) {
        closeAddVehicleModalBtn.addEventListener("click", closeAddModal);
    }

    if (addVehicleModal) {
        addVehicleModal.addEventListener("click", (e) => {
            if (e.target === addVehicleModal) closeAddModal();
        });
    }

    if (newVehicleModel && newVehicleCapacity) {
        newVehicleModel.addEventListener("change", function() {
            const selectedOpt = this.options[this.selectedIndex];
            const cap = selectedOpt.getAttribute("data-capacity") || "14";
            newVehicleCapacity.value = cap;
        });
    }

    if (saveNewVehicleBtn) {
        saveNewVehicleBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const modelOpt = newVehicleModel ? newVehicleModel.options[newVehicleModel.selectedIndex] : null;
            const modelVal = newVehicleModel ? newVehicleModel.value : "";
            const capVal = newVehicleCapacity ? parseInt(newVehicleCapacity.value, 10) : 14;
            let plateVal = newVehiclePlate ? newVehiclePlate.value.trim().toUpperCase() : "";
            const hubVal = newVehicleHub ? newVehicleHub.value : "Metro Manila Central Hub";
            const statusVal = newVehicleStatus ? newVehicleStatus.value : "Available";
            const rfidVal = newVehicleRFID ? newVehicleRFID.value.trim() : "Autosweep & Easytrip Installed";

            // Philippine LTO plate validation (e.g. ABC-1234 or ABC-123)
            const plateRegex = /^[A-Z]{3}-\d{3,4}$/;
            if (!plateVal || !plateRegex.test(plateVal)) {
                alert("Validation Error: Please enter a valid Philippine LTO plate number (e.g., NVA-1234 or ABC-123).");
                if (newVehiclePlate) newVehiclePlate.focus();
                return;
            }

            if (!modelVal || isNaN(capVal) || capVal <= 0) {
                alert("Validation Error: Please ensure all required vehicle specification fields are filled.");
                return;
            }

            const prefix = modelOpt ? (modelOpt.getAttribute("data-prefix") || "RV-HIA") : "RV-HIA";
            const typeVal = modelOpt ? (modelOpt.getAttribute("data-type") || "Passenger Van") : "Passenger Van";

            const db = ROVER_DB.get();
            if (!db.fleet) db.fleet = [];

            // Generate unique unit ID
            let unitId = "";
            let attempts = 0;
            do {
                const randomNum = Math.floor(100 + Math.random() * 900);
                unitId = `${prefix}-${randomNum}`;
                attempts++;
            } while (db.fleet.some(u => u.id === unitId) && attempts < 50);

            const newUnit = {
                id: unitId,
                model: modelVal,
                type: typeVal,
                capacity: capVal,
                plate: plateVal,
                hub: hubVal,
                status: statusVal,
                scheduleBuffer: statusVal === "Available" ? "100% Clear" : "Under Service",
                rfid: rfidVal
            };

            db.fleet.unshift(newUnit);
            ROVER_DB.save(db);

            renderFleetTable();
            closeAddModal();
            if (addVehicleForm) addVehicleForm.reset();
            if (newVehicleCapacity) newVehicleCapacity.value = "14";

            alert(`Asset ${unitId} (${plateVal}) registered successfully to active fleet.`);
        });
    }

    // 6. In-Page Vehicle Schedule Modal Logic (#vehicleScheduleModal)
    const vehicleScheduleModal = document.getElementById("vehicleScheduleModal");
    const closeVehicleScheduleModalBtn = document.getElementById("closeVehicleScheduleModalBtn");
    const closeVehicleScheduleModalFooterBtn = document.getElementById("closeVehicleScheduleModalFooterBtn");

    function openVehicleScheduleModal(unitId) {
        if (!vehicleScheduleModal) return;

        const db = ROVER_DB.get();
        const fleet = db.fleet || [];
        const reservations = db.reservations || [];

        const unit = fleet.find(u => u.id === unitId) || {
            id: unitId,
            model: "Commercial Van",
            plate: "Unassigned",
            hub: "Manila Hub",
            capacity: 14,
            status: "Available"
        };

        const titleEl = document.getElementById("scheduleModalUnitTitle");
        const modelEl = document.getElementById("scheduleModalModel");
        const plateEl = document.getElementById("scheduleModalPlate");
        const capEl = document.getElementById("scheduleModalCap");
        const hubEl = document.getElementById("scheduleModalHub");
        const statusPillEl = document.getElementById("scheduleModalStatusPill");
        const tripFeed = document.getElementById("scheduleModalTripFeed");

        if (titleEl) titleEl.textContent = unit.id;
        if (modelEl) modelEl.textContent = unit.model;
        if (plateEl) plateEl.textContent = unit.plate || "Unassigned";
        if (capEl) capEl.textContent = `${unit.capacity || 14} Pax`;
        if (hubEl) hubEl.textContent = unit.hub || "Metro Manila Central Hub";

        if (statusPillEl) {
            statusPillEl.className = unit.status === "Available" ? "pill-status pill-available" :
                (unit.status === "Maintenance" ? "pill-status pill-maintenance" : "pill-status pill-in-use");
            statusPillEl.textContent = `● ${unit.status}`;
        }

        // Query assigned reservations for this unit
        const matchingTrips = reservations.filter(r => {
            const hasAssigned = r.assignedVehicle && (r.assignedVehicle === unitId || r.assignedVehicle.includes(unitId));
            const hasTextAssigned = r.vehicleAssigned && (r.vehicleAssigned.includes(unitId) || (unit.plate && r.vehicleAssigned.includes(unit.plate)));
            const hasCurrentTrip = unit.currentTrip && (r.id === unit.currentTrip || (r.id && r.id.replace(/^#/, "") === unit.currentTrip.replace(/^#/, "")));
            const hasAllocList = r.assignedVehicles && r.assignedVehicles.some(a => a.unitId === unitId || (unit.plate && a.plate === unit.plate));
            return hasAssigned || hasTextAssigned || hasCurrentTrip || hasAllocList;
        });

        if (tripFeed) {
            tripFeed.innerHTML = "";
            if (matchingTrips.length === 0) {
                tripFeed.innerHTML = `
                    <div style="background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 32px 20px; text-align: center; color: #64748B;">
                        <div style="font-size: 28px; margin-bottom: 8px;">🚐</div>
                        <div style="font-size: 14px; font-weight: 700; color: #111827;">No active trips scheduled.</div>
                        <div style="font-size: 12px; margin-top: 4px; color: #64748B;">Vehicle is idle and available at hub for immediate corridor deployment.</div>
                    </div>
                `;
            } else {
                matchingTrips.forEach(trip => {
                    const cleanTripId = (trip.id || "").replace(/^#/, "");
                    const card = document.createElement("div");
                    card.style.cssText = "background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;";
                    card.innerHTML = `
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 700; color: #D32F2F; font-size: 13px;">#${escapeHTML(cleanTripId)}</span>
                                <span style="font-size: 11px; font-weight: 600; color: #111827;">${escapeHTML(trip.client || "Corporate Client")}</span>
                                <span style="background: #E8F5E9; color: #2E7D32; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${escapeHTML(trip.status || "Assigned")}</span>
                            </div>
                            <div style="font-size: 13px; font-weight: 600; color: #111827; margin-top: 4px;">
                                ${escapeHTML(trip.route || trip.corridor || "Metro Manila Corporate Corridor")}
                            </div>
                            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                                Window: <strong>${escapeHTML(trip.schedule || trip.pickupWindow || "Live Service Window")}</strong> &bull; Driver: <strong>${escapeHTML(trip.driverAssigned || trip.assignedDriver || "Rostered Duty Pilot")}</strong>
                            </div>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #15803D; font-weight: 600; background: #DCFCE7; padding: 4px 8px; border-radius: 4px;">Corridor Cleared</span>
                        </div>
                    `;
                    tripFeed.appendChild(card);
                });
            }
        }

        vehicleScheduleModal.style.display = "flex";
    }

    function closeScheduleModal() {
        if (!vehicleScheduleModal) return;
        vehicleScheduleModal.style.display = "none";
    }

    if (closeVehicleScheduleModalBtn) {
        closeVehicleScheduleModalBtn.addEventListener("click", closeScheduleModal);
    }

    if (closeVehicleScheduleModalFooterBtn) {
        closeVehicleScheduleModalFooterBtn.addEventListener("click", closeScheduleModal);
    }

    if (vehicleScheduleModal) {
        vehicleScheduleModal.addEventListener("click", (e) => {
            if (e.target === vehicleScheduleModal) closeScheduleModal();
        });
    }

    // Initial render
    renderFleetTable();
});
