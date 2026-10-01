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
                <a href="service-orders.html" class="nav-item">Service Orders</a>
                <a href="fleet-registry.html" class="nav-item active">Fleet Registry</a>
                <a href="users.html" class="nav-item">User Management</a>
                <a href="#" class="nav-item">Driver Directory</a>
                <a href="forecasting.html" class="nav-item">Demand Forecasting</a>
                <a href="#" class="nav-item">Expense Reports</a>
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
                    <a href="service-orders.html" style="color: #D32F2F; text-decoration: none; font-weight: 600; font-size: 12px;">Inspect Schedule &rarr;</a>
                </td>
            `;

            tbody.appendChild(tr);
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

    // Initial render
    renderFleetTable();
});
