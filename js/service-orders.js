/**
 * ROVER FLEET SYSTEMS - SERVICE ORDERS & DISPATCH CONTROLLER (js/service-orders.js)
 * Scoped Multi-Page Architecture (MPA)
 * Centralized State Machine & Render Loop
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

    // 2. Centralized State Object
    const state = {
        filter: "all", // 'all' | 'pending' | 'assigned'
        searchQuery: "",
        selectedReservationId: null,
        reservations: []
    };

    // Load initial reservations from ROVER_DB
    function loadReservations() {
        const db = ROVER_DB.get();
        state.reservations = db.reservations || [];
    }

    // 3. Centralized Render Loop
    function render() {
        const tbody = document.getElementById("reservationsTableBody");
        if (!tbody) return;

        // Apply filters & search query
        const filtered = state.reservations.filter(req => {
            const matchesFilter = 
                state.filter === "all" ? true :
                state.filter === "pending" ? req.status === "Pending" :
                state.filter === "assigned" ? req.status === "Confirmed" : true;

            const q = state.searchQuery.toLowerCase();
            const matchesSearch = !q || 
                (req.id && req.id.toLowerCase().includes(q)) ||
                (req.client && req.client.toLowerCase().includes(q)) ||
                (req.route && req.route.toLowerCase().includes(q));

            return matchesFilter && matchesSearch;
        });

        // Update Metrics Counters
        const pendingCount = state.reservations.filter(r => r.status === "Pending").length;
        const assignedCount = state.reservations.filter(r => r.status === "Confirmed").length;
        
        const metricPending = document.getElementById("metricPendingCount");
        if (metricPending) metricPending.innerText = pendingCount;

        // Update Filter Button Badges / Counts
        const btnAll = document.getElementById("filterAllBtn");
        const btnPending = document.getElementById("filterPendingBtn");
        const btnAssigned = document.getElementById("filterAssignedBtn");

        if (btnAll) btnAll.innerText = `All Requests (${state.reservations.length})`;
        if (btnPending) btnPending.innerText = `Pending Review (${pendingCount})`;
        if (btnAssigned) btnAssigned.innerText = `Assigned (${assignedCount})`;

        // Render Table Rows
        tbody.innerHTML = "";
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #757575; padding: 2rem;">
                        No service orders match the selected criteria.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(req => {
            const tr = document.createElement("tr");
            const isPending = req.status === "Pending";

            tr.innerHTML = `
                <td><strong style="color: #1565C0;">${req.id}</strong></td>
                <td><strong>${req.client}</strong><br><span style="font-size: 0.75rem; color: #757575;">Apex Logistics Global Inc.</span></td>
                <td>${req.route}</td>
                <td>${req.schedule}</td>
                <td>${req.vehiclePref || (req.units + 'x ' + req.vehicleType)}</td>
                <td>
                    <span class="status-pill ${isPending ? 'status-pending' : 'status-confirmed'}">
                        ${req.status}
                    </span>
                </td>
                <td>
                    ${isPending ? 
                        `<button class="btn-assign" data-id="${req.id}">Review &amp; Assign</button>` : 
                        `<span class="btn-confirmed">&#10004; Dispatched</span>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Rebind assign buttons
        tbody.querySelectorAll(".btn-assign").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                openModal(id);
            });
        });
    }

    // 4. Modal Management & Unit Allocation
    function openModal(id) {
        state.selectedReservationId = id;
        const req = state.reservations.find(r => r.id === id);
        if (!req) return;

        const modal = document.getElementById("confirmationModal");
        const modalReqId = document.getElementById("modalRequestId") || document.getElementById("modalReqId");
        const modalClient = document.getElementById("modalClientName") || document.getElementById("modalClient");
        const modalUnits = document.getElementById("modalUnits");
        const modalRoute = document.getElementById("modalRoute");
        const valError = document.getElementById("validationError");
        const container = document.getElementById("unitAssignmentContainer");

        if (modalReqId) modalReqId.innerText = req.id;
        if (modalClient) modalClient.innerText = req.client;
        if (modalUnits) modalUnits.innerText = req.units || 1;
        if (modalRoute) modalRoute.innerText = `${req.schedule} • ${req.route}`;
        if (valError) valError.style.display = "none";

        if (container) {
            container.innerHTML = "";
            const unitCount = req.units || 1;
            for (let i = 1; i <= unitCount; i++) {
                container.innerHTML += `
                    <div style="background: white; border: 1px solid #E0E0E0; border-radius: 8px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 0.75rem;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: #424242; margin-bottom: 0.75rem;">UNIT ${i} ASSIGNMENT</div>
                        <div style="display: flex; gap: 1rem;">
                            <select class="unit-select-vehicle" style="flex: 1; padding: 0.75rem; border: 1px solid #E0E0E0; border-radius: 6px; font-size: 0.875rem; outline: none; cursor: pointer;" required>
                                <option value="">Select Vehicle...</option>
                                <option value="V1">MPV Unit 14 (NVA-1234)</option>
                                <option value="V2">Corporate Van (XYZ-987)</option>
                                <option value="V3">Executive SUV (ABC-123)</option>
                            </select>
                            <select class="unit-select-driver" style="flex: 1; padding: 0.75rem; border: 1px solid #E0E0E0; border-radius: 6px; font-size: 0.875rem; outline: none; cursor: pointer;" required>
                                <option value="">Select Driver...</option>
                                <option value="D1">Eduardo Santos</option>
                                <option value="D2">Sigmund Malacas</option>
                                <option value="D3">Maria Gonzalez</option>
                            </select>
                        </div>
                    </div>
                `;
            }
        }

        if (modal) modal.classList.add("active");
    }

    function closeModal() {
        const modal = document.getElementById("confirmationModal");
        if (modal) modal.classList.remove("active");
        state.selectedReservationId = null;
    }

    function confirmDispatch() {
        if (!state.selectedReservationId) return;

        const container = document.getElementById("unitAssignmentContainer");
        const selects = container ? container.querySelectorAll("select") : [];
        let valid = true;
        selects.forEach(s => {
            if (!s.value) valid = false;
        });

        const valError = document.getElementById("validationError");
        if (!valid) {
            if (valError) valError.style.display = "flex";
            return;
        }

        // Mutate status in state and ROVER_DB
        const req = state.reservations.find(r => r.id === state.selectedReservationId);
        if (req) {
            req.status = "Confirmed";
            const db = ROVER_DB.get();
            db.reservations = state.reservations;
            ROVER_DB.save(db);
        }

        closeModal();
        render(); // Trigger central reactive UI re-render
    }

    // 5. Event Listeners Setup
    const searchInput = document.getElementById("orderSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.searchQuery = e.target.value.trim();
            render();
        });
    }

    const filterAllBtn = document.getElementById("filterAllBtn");
    const filterPendingBtn = document.getElementById("filterPendingBtn");
    const filterAssignedBtn = document.getElementById("filterAssignedBtn");

    function setFilter(newFilter, activeBtn) {
        state.filter = newFilter;
        [filterAllBtn, filterPendingBtn, filterAssignedBtn].forEach(btn => {
            if (btn) btn.classList.remove("active");
        });
        if (activeBtn) activeBtn.classList.add("active");
        render();
    }

    if (filterAllBtn) filterAllBtn.addEventListener("click", () => setFilter("all", filterAllBtn));
    if (filterPendingBtn) filterPendingBtn.addEventListener("click", () => setFilter("pending", filterPendingBtn));
    if (filterAssignedBtn) filterAssignedBtn.addEventListener("click", () => setFilter("assigned", filterAssignedBtn));

    const cancelModalBtn = document.getElementById("cancelModalBtn");
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    const confirmDispatchBtn = document.getElementById("confirmDispatchBtn");
    if (confirmDispatchBtn) confirmDispatchBtn.addEventListener("click", confirmDispatch);

    // Initial Execution
    loadReservations();
    render();
});
