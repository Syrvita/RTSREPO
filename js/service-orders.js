/**
 * ROVER FLEET SYSTEMS - SERVICE ORDERS & DISPATCH CONTROLLER (js/service-orders.js)
 * Scoped Multi-Page Architecture (MPA)
 * Concurrency Clearance & Overlap Resolution Controller (PB-008)
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
                <a href="service-orders.html" class="nav-item active">Service Orders</a>
                <a href="#" class="nav-item">Fleet Registry</a>
                <a href="users.html" class="nav-item">User Management</a>
                <a href="#" class="nav-item">Driver Directory</a>
                <a href="forecasting.html" class="nav-item">Demand Forecasting</a>
                <a href="#" class="nav-item">Expense Reports</a>
            `;
        }
    }

    // Modal elements
    const conflictModal = document.getElementById("conflictModal");
    const btnResolveRQ1042 = document.getElementById("btnResolveRQ1042");
    const closeConflictModalBtn = document.getElementById("closeConflictModalBtn");
    const cancelConflictBtn = document.getElementById("cancelConflictBtn");
    const confirmAssignmentBtn = document.getElementById("confirmAssignmentBtn");

    function openConflictModal() {
        if (conflictModal) {
            conflictModal.classList.add("active");
        }
    }

    function closeConflictModal() {
        if (conflictModal) {
            conflictModal.classList.remove("active");
        }
    }

    if (btnResolveRQ1042) {
        btnResolveRQ1042.addEventListener("click", openConflictModal);
    }

    if (closeConflictModalBtn) {
        closeConflictModalBtn.addEventListener("click", closeConflictModal);
    }

    if (cancelConflictBtn) {
        cancelConflictBtn.addEventListener("click", closeConflictModal);
    }

    if (conflictModal) {
        conflictModal.addEventListener("click", (e) => {
            if (e.target === conflictModal) {
                closeConflictModal();
            }
        });
    }

    // Apply resolved state to #RQ-1042 in the DOM
    function applyResolvedStateInDOM(vehicleText = "RV-VAN-112") {
        const auditCell = document.getElementById("auditStatusRQ1042");
        if (auditCell) {
            auditCell.className = "pill-audit pill-assigned";
            auditCell.innerHTML = `<span class="dot-assigned"></span> Assigned (Clear)`;
        }

        const fleetCell = document.getElementById("fleetCellRQ1042");
        if (fleetCell) {
            fleetCell.innerHTML = `<div style="font-size: 13px; font-weight: 600; color: #212121;">1x HiAce Commuter <span style="font-size: 11px; color: #2E7D32; font-weight: normal;">(${vehicleText} Assigned)</span></div>`;
        }

        const actionCell = document.getElementById("actionCellRQ1042");
        if (actionCell) {
            actionCell.innerHTML = `<a href="#" class="action-link">View Details</a>`;
        }

        const filterPendingBtn = document.getElementById("filterPendingBtn");
        if (filterPendingBtn) filterPendingBtn.innerText = "Pending Conflicts (0)";

        const filterAssignedBtn = document.getElementById("filterAssignedBtn");
        if (filterAssignedBtn) filterAssignedBtn.innerText = "Assigned (3)";

        const rowRQ1042 = document.getElementById("row-RQ-1042");
        if (rowRQ1042) {
            rowRQ1042.dataset.status = "Assigned";
        }
    }

    // Check existing database state on load
    const db = ROVER_DB.get();
    const rq1042 = db.reservations ? db.reservations.find(r => r.id === "#RQ-1042") : null;
    if (rq1042 && rq1042.status === "Assigned") {
        applyResolvedStateInDOM(rq1042.assignedVehicle || "RV-VAN-112");
    }

    // Handle Confirm Assignment & Clear Conflict
    if (confirmAssignmentBtn) {
        confirmAssignmentBtn.addEventListener("click", () => {
            const vehicleSelect = document.getElementById("reassignVehicleSelect");
            const driverSelect = document.getElementById("reassignDriverSelect");
            const notesText = document.getElementById("dispatchNotesText");

            const selectedVehicle = vehicleSelect ? vehicleSelect.value : "RV-VAN-112";
            const selectedDriver = driverSelect ? (driverSelect.options[driverSelect.selectedIndex]?.text || "Eduardo Santos") : "Eduardo Santos";
            const dispatchNotes = notesText ? notesText.value : "PB-008 automated concurrency clearance verified.";

            // 1. Mutate ROVER_DB in localStorage
            const freshDb = ROVER_DB.get();
            const target = freshDb.reservations.find(r => r.id === "#RQ-1042");
            if (target) {
                target.status = "Assigned";
                target.auditStatus = "Assigned (Clear)";
                target.assignedVehicle = selectedVehicle;
                target.assignedDriver = selectedDriver;
                target.dispatchNotes = dispatchNotes;
                target.resolvedAt = new Date().toISOString();
            }

            if (freshDb.fleet) {
                const fleetUnit = freshDb.fleet.find(v => v.id === selectedVehicle);
                if (fleetUnit) {
                    fleetUnit.status = "Assigned";
                    fleetUnit.currentTrip = "#RQ-1042";
                }
            }

            ROVER_DB.save(freshDb);

            // 2. Dynamically update table row
            applyResolvedStateInDOM(selectedVehicle);

            // 3. Close Modal
            closeConflictModal();
        });
    }

    // Search and Filter handling
    const searchInput = document.getElementById("orderSearchInput");
    const filterAllBtn = document.getElementById("filterAllBtn");
    const filterPendingBtn = document.getElementById("filterPendingBtn");
    const filterAssignedBtn = document.getElementById("filterAssignedBtn");
    let currentFilter = "all";

    function filterRows() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const rows = document.querySelectorAll("#dispatchTableBody tr");

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const isAssigned = row.querySelector(".pill-assigned") || row.querySelector(".pill-dispatched") || row.querySelector(".pill-locked");
            const isPending = row.querySelector(".pill-overlap");

            let matchesFilter = true;
            if (currentFilter === "pending") {
                matchesFilter = !!isPending;
            } else if (currentFilter === "assigned") {
                matchesFilter = !!isAssigned;
            }

            const matchesQuery = !query || text.includes(query);

            if (matchesFilter && matchesQuery) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterRows);
    }

    if (filterAllBtn) {
        filterAllBtn.addEventListener("click", () => {
            currentFilter = "all";
            [filterAllBtn, filterPendingBtn, filterAssignedBtn].forEach(b => b && b.classList.remove("active"));
            filterAllBtn.classList.add("active");
            filterRows();
        });
    }

    if (filterPendingBtn) {
        filterPendingBtn.addEventListener("click", () => {
            currentFilter = "pending";
            [filterAllBtn, filterPendingBtn, filterAssignedBtn].forEach(b => b && b.classList.remove("active"));
            filterPendingBtn.classList.add("active");
            filterRows();
        });
    }

    if (filterAssignedBtn) {
        filterAssignedBtn.addEventListener("click", () => {
            currentFilter = "assigned";
            [filterAllBtn, filterPendingBtn, filterAssignedBtn].forEach(b => b && b.classList.remove("active"));
            filterAssignedBtn.classList.add("active");
            filterRows();
        });
    }
});
