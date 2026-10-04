/**
 * ROVER FLEET SYSTEMS - CLIENT GATEWAY CONTROLLER (js/client-gateway.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles Corporate Client Portal & Reservation Gateway (PB-005)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Client only)
    const currentUser = window.ROVER_AUTH ? ROVER_AUTH.requireRole("Client") : null;
    if (window.ROVER_AUTH && !currentUser) return;

    let currentEditId = null;

    // 2. Client Reservations Rendering & State
    function renderClientReservations() {
        const db = ROVER_DB.get();
        const reservations = db.reservations || [];

        // Update Client Metrics
        const totalBookings = reservations.length;
        const pendingCount = reservations.filter(r => r.status === "Pending" || r.status === "Pending Review").length;
        const confirmedCount = reservations.filter(r => r.status === "Confirmed" || r.status === "Confirmed & Dispatched" || r.status === "Confirmed & Staged" || r.status === "Dispatched").length;

        const metricTotal = document.getElementById("metricTotalBookings");
        const metricPending = document.getElementById("metricPendingReviews") || document.getElementById("metricPendingReview");
        const metricConfirmed = document.getElementById("metricConfirmedShuttles");

        if (metricTotal) metricTotal.innerText = totalBookings;
        if (metricPending) metricPending.innerText = pendingCount;
        if (metricConfirmed) metricConfirmed.innerText = confirmedCount;

        // Render Table if present (request-service.html)
        const tbody = document.getElementById("clientReservationTableBody") || document.getElementById("clientReservationsTableBody");
        if (!tbody) return;

        const searchInput = document.getElementById("reservationSearchInput");
        const filterSelect = document.getElementById("statusFilterSelect");

        const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const filterVal = filterSelect ? filterSelect.value : "ALL";

        const filtered = reservations.filter(r => {
            const fVal = filterVal.toUpperCase();
            const rStat = (r.status || "").toUpperCase();

            const matchesFilter = 
                fVal === "ALL" || fVal === "" ? true :
                fVal.includes("PENDING") ? rStat.includes("PENDING") :
                fVal.includes("CONFIRM") ? (rStat.includes("CONFIRM") || rStat.includes("DISPATCH")) :
                fVal.includes("COMPLETE") ? rStat.includes("COMPLETE") :
                fVal.includes("CANCEL") ? rStat.includes("CANCEL") :
                rStat === fVal;

            const matchesSearch = !q ||
                (r.id && r.id.toLowerCase().includes(q)) ||
                (r.route && r.route.toLowerCase().includes(q)) ||
                (r.pickup && r.pickup.toLowerCase().includes(q)) ||
                (r.destination && r.destination.toLowerCase().includes(q)) ||
                (r.vehicleType && r.vehicleType.toLowerCase().includes(q));

            return matchesFilter && matchesSearch;
        });

        // Update record count badge and pagination info
        const recordCountBadge = document.getElementById("recordCountBadge");
        if (recordCountBadge) {
            recordCountBadge.innerText = `${reservations.length} records`;
        }

        const paginationInfo = document.getElementById("paginationInfo");
        if (paginationInfo) {
            const displayCount = Math.min(filtered.length, 4);
            paginationInfo.innerText = `Showing 1 to ${displayCount} of ${reservations.length} requests`;
        }

        tbody.innerHTML = "";
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #78909C; padding: 2rem;">
                        No reservation records match the criteria.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(r => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #ECEFF1";

            const isCancelled = r.status === "Cancelled";
            const isConflict = r.status === "Pending Assignment / Conflict Block" || r.status === "Conflict" || r.auditStatus === "Schedule Overlap";
            const isInTransit = r.status === "In Transit (Live)" || r.status === "In Transit" || r.status === "En Route";
            const isDispatched = r.status === "Dispatched" || r.status === "Confirmed & Staged" || r.status === "Confirmed & Dispatched";
            const isStaged = r.status === "Staged (Pending Admin Approval)" || r.status === "Staged" || (r.auditStatus && r.auditStatus.includes("Awaiting Gate Pass"));
            const isAssigned = r.status === "Assigned" || (r.auditStatus && r.auditStatus.includes("Assigned"));
            const isPending = r.status === "Pending" || r.status === "Pending Review";
            const isConfirmed = r.status === "Confirmed" || r.status === "Approved";
            const isCompleted = r.status === "Completed" || r.status === "Closed";

            const statusBadge = isCancelled ?
                `<span class="status-pill status-cancelled" style="background: #FFEBEE; color: #C62828; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">&#10006; Cancelled</span>` :
                isConflict ?
                `<span class="status-pill status-conflict" style="background: #FFEBEE; color: #C62828; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="font-size: 8px;">&#9679;</span> Pending Assignment / Conflict Block</span>` :
                isInTransit ?
                `<span class="status-pill status-in-transit" style="background: #E0F2FE; color: #0284C7; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="font-size: 8px;">&#9679;</span> In Transit (Live)</span>` :
                isDispatched ?
                `<span class="status-pill status-dispatched" style="background: #E8F5E9; color: #2E7D32; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">&#10004; Dispatched</span>` :
                isStaged ?
                `<span class="status-pill status-staged" style="background: #FFF8E1; color: #E65100; border: 1px solid #FFE082; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="font-size: 8px;">&#9679;</span> Staged (Pending Admin Approval)</span>` :
                isAssigned ?
                `<span class="status-pill status-assigned" style="background: #E8F5E9; color: #2E7D32; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">&#10004; Assigned (Clear)</span>` :
                isConfirmed ? 
                `<span class="status-pill status-confirmed" style="background: #E8F5E9; color: #2E7D32; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">&#10004; Confirmed</span>` :
                isCompleted ?
                `<span class="status-pill status-completed" style="background: #F5F5F5; color: #616161; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">Completed</span>` :
                `<span class="status-pill status-pending" style="background: #FFF3E0; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><span style="font-size: 8px;">&#9679;</span> Pending Review</span>`;

            // Strict 7-Column Layout mapping 1:1 with Table Headers
            const cleanId = (r.id || "").replace(/^#/, "");
            const paramId = encodeURIComponent(cleanId);
            const safeDisplayId = escapeHTML(r.id);
            const safeVehicleType = escapeHTML(r.vehicleType || "Toyota HiAce Commuter (14 Seats)");
            const safePickup = escapeHTML(r.pickup || r.origin || "Metro Manila Hub");
            const safeDestination = escapeHTML(r.destination || "Destination Terminal");
            const safeSchedule = escapeHTML(r.schedule || r.start || "");
            const safeReturn = r.return ? escapeHTML(r.return) : "";

            tr.innerHTML = `
                <!-- 1. REQUEST ID -->
                <td style="padding: 16px 20px; font-weight: 700; color: #C62828; white-space: nowrap;">
                    <a href="reservation-details.html?id=${paramId}" style="color: #C62828; text-decoration: none; font-weight: 700;">${safeDisplayId}</a>
                </td>

                <!-- 2. VEHICLE TYPE -->
                <td style="padding: 16px 20px;">
                    <div style="font-weight: 600; color: #212121;">${safeVehicleType}</div>
                    <div style="font-size: 11px; color: #78909C; margin-top: 2px;">${r.units || 1} Assigned Unit${(r.units > 1) ? 's' : ''}</div>
                </td>

                <!-- 3. PICKUP LOCATION -->
                <td style="padding: 16px 20px; font-size: 13px; color: #424242;">
                    <div style="font-weight: 500;">${safePickup}</div>
                </td>

                <!-- 4. DESTINATION -->
                <td style="padding: 16px 20px; font-size: 13px; color: #424242;">
                    <div style="font-weight: 500;">${safeDestination}</div>
                </td>

                <!-- 5. DATE & TIME -->
                <td style="padding: 16px 20px; font-size: 12px; color: #37474F;">
                    <div style="font-weight: 600;">${safeSchedule}</div>
                    ${safeReturn ? `<div style="color: #78909C; font-size: 11px; margin-top: 2px;">Return: ${safeReturn}</div>` : ''}
                </td>

                <!-- 6. STATUS -->
                <td style="padding: 16px 20px; white-space: nowrap;">
                    ${statusBadge}
                </td>

                <!-- 7. ACTIONS -->
                <td style="padding: 16px 20px; white-space: nowrap;">
                    ${isCancelled ? `
                        <span style="color: #9E9E9E; font-style: italic; font-size: 12px;">Cancelled</span>
                    ` : `
                        <a href="reservation-details.html?id=${paramId}" style="color: #D32F2F; text-decoration: none; font-weight: 600; font-size: 13px;">View Manifest →</a>
                    `}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // 3. Render Dashboard Table if present on client.html
        const dashTbody = document.getElementById("clientDashboardTableBody");
        if (dashTbody) {
            dashTbody.innerHTML = "";
            const recentFour = reservations.slice(0, 4);
            recentFour.forEach(r => {
                const tr = document.createElement("tr");
                const isCancelled = r.status === "Cancelled";
                const isConflict = r.status === "Pending Assignment / Conflict Block" || r.status === "Conflict" || r.auditStatus === "Schedule Overlap";
                const isInTransit = r.status === "In Transit (Live)" || r.status === "In Transit" || r.status === "En Route";
                const isDispatched = r.status === "Dispatched" || r.status === "Confirmed & Staged" || r.status === "Confirmed & Dispatched";
                const isStaged = r.status === "Staged (Pending Admin Approval)" || r.status === "Staged" || (r.auditStatus && r.auditStatus.includes("Awaiting Gate Pass"));
                const isAssigned = r.status === "Assigned" || (r.auditStatus && r.auditStatus.includes("Assigned"));
                const isPending = r.status === "Pending" || r.status === "Pending Review";
                const isConfirmed = r.status === "Confirmed" || r.status === "Approved";
                const isCompleted = r.status === "Completed" || r.status === "Closed";

                const statusBadge = isCancelled ?
                    `<span class="status-pill status-cancelled" style="background: #FFEBEE; color: #C62828; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">&#10006; Cancelled</span>` :
                    isConflict ?
                    `<span class="status-pill status-conflict" style="background: #FFEBEE; color: #C62828; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">Pending Assignment / Conflict Block</span>` :
                    isInTransit ?
                    `<span class="status-pill status-in-transit" style="background: #E0F2FE; color: #0284C7; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">● In Transit (Live)</span>` :
                    isDispatched ?
                    `<span class="status-pill status-dispatched" style="background: #E8F5E9; color: #2E7D32; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">✓ Dispatched</span>` :
                    isStaged ?
                    `<span class="status-pill status-staged" style="background: #FFF8E1; color: #E65100; border: 1px solid #FFE082; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">● Staged (Pending Admin Approval)</span>` :
                    isAssigned ?
                    `<span class="status-pill status-assigned" style="background: #E8F5E9; color: #2E7D32; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">✓ Assigned (Clear)</span>` :
                    isConfirmed ? 
                    `<span class="status-pill status-confirmed" style="background: #E8F5E9; color: #2E7D32; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">✓ Confirmed</span>` :
                    isCompleted ?
                    `<span class="status-pill status-completed" style="background: #F5F5F5; color: #616161; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">Completed</span>` :
                    `<span class="status-pill status-pending" style="background: #FFF3E0; color: #E65100; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">● Pending Review</span>`;

                const cleanId = (r.id || "").replace(/^#/, "");
                const paramId = encodeURIComponent(cleanId);
                const safeDisplayId = escapeHTML(r.id);
                const safeVehicleType = escapeHTML(r.vehicleType || "Toyota HiAce Commuter (14 Seats)");
                const routeDesc = escapeHTML(r.route || (r.pickup ? `${r.pickup} → ${r.destination}` : "Manila Route"));
                const dateDesc = escapeHTML(r.schedule || r.start || "Scheduled Shift");
                const shiftDesc = escapeHTML(r.pickupWindow || r.notes || "Standard Operations Window");

                tr.innerHTML = `
                    <td style="padding: 1rem 1.5rem; border-bottom: 1px solid #EEEEEE; font-size: 0.875rem;"><strong>${safeDisplayId}</strong></td>
                    <td style="padding: 1rem 1.5rem; border-bottom: 1px solid #EEEEEE; font-size: 0.875rem; color: #424242;">${safeVehicleType}<br><span style="font-size: 0.75rem; color: #757575;">${routeDesc}</span></td>
                    <td style="padding: 1rem 1.5rem; border-bottom: 1px solid #EEEEEE; font-size: 0.875rem; color: #424242;">${dateDesc}<br><span style="font-size: 0.75rem; color: #757575;">${shiftDesc}</span></td>
                    <td style="padding: 1rem 1.5rem; border-bottom: 1px solid #EEEEEE;">${statusBadge}</td>
                    <td style="padding: 1rem 1.5rem; border-bottom: 1px solid #EEEEEE;"><a href="reservation-details.html?id=${paramId}" style="color: #1976D2; font-size: 0.875rem; font-weight: 600; text-decoration: none;">View Details</a></td>
                `;
                dashTbody.appendChild(tr);
            });
        }

        // Bind Action Buttons
        bindActionButtons();
    }

    // Bind Cancel & Modify Buttons
    function bindActionButtons() {
        // Cancel capability
        const cancelButtons = document.querySelectorAll(".btn-cancel-res");
        cancelButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const resId = btn.dataset.id;
                if (!resId) return;

                const db = ROVER_DB.get();
                const res = (db.reservations || []).find(x => x.id === resId);
                if (!res) return;

                const confirmed = confirm(`Are you sure you want to cancel reservation ${resId} (${res.vehicleType})?\n\nThis will release the reserved fleet units and notify dispatch.`);
                if (!confirmed) return;

                res.status = "Cancelled";
                res.cancelledAt = new Date().toISOString();
                ROVER_DB.save(db);
                renderClientReservations();
            });
        });

        // Modify capability
        const modifyButtons = document.querySelectorAll(".btn-modify-res");
        modifyButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const resId = btn.dataset.id;
                if (!resId) return;

                const db = ROVER_DB.get();
                const res = (db.reservations || []).find(x => x.id === resId);
                if (!res) return;

                openModalForEdit(res);
            });
        });
    }

    // Helper: Date Formatter
    function formatDateTimeString(dtStr) {
        if (!dtStr) return "";
        const d = new Date(dtStr);
        if (isNaN(d.getTime())) return dtStr;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[d.getMonth()];
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const strHours = String(hours).padStart(2, '0');
        return `${month} ${day}, ${year} • ${strHours}:${minutes} ${ampm}`;
    }

    // 3. Modal Controls for Request Service
    const modal = document.getElementById("reservationModal");
    const openBtn = document.getElementById("openReservationModalBtn");
    const closeBtn = document.getElementById("closeReservationModalBtn");
    const cancelBtn = document.getElementById("cancelReservationBtn");
    const submitBtn = document.getElementById("submitReservationBtn");
    const deleteBtn = document.getElementById("modalDeleteResBtn");
    const errorDiv = document.getElementById("reservationModalError");
    const modalTitle = document.getElementById("reservationModalTitle");

    // Philippine Fleet Capacity Mapping (Authorized Commercial Fleet Roster)
    const FLEET_CAPACITIES = {
        "Toyota HiAce Commuter (14 Seats)": 14,
        "Toyota HiAce GL Grandia (12 Seats)": 12,
        "Nissan NV350 Urvan (15 Seats)": 15,
        "Hyundai Grand Starex / Staria (10 Seats)": 10,
        "Mitsubishi L300 FB Body (16 Seats)": 16,
        "Isuzu Traviz Commercial Shuttle (16 Seats)": 16
    };

    function getVehicleCapacity(type) {
        if (!type) return 14;
        for (const [key, cap] of Object.entries(FLEET_CAPACITIES)) {
            if (type.includes(key) || key.includes(type)) return cap;
        }
        if (type.includes("Traviz") || type.includes("L300")) return 16;
        if (type.includes("Urvan")) return 15;
        if (type.includes("Grandia")) return 12;
        if (type.includes("Starex") || type.includes("Staria")) return 10;
        return 14;
    }

    const vehicleTypeSelectEl = document.getElementById("vehicleTypeSelect");
    const unitQuantityInputEl = document.getElementById("unitQuantityInput");
    const estimatedPaxInputEl = document.getElementById("estimatedPaxInput");

    function updateCapacityGuards() {
        if (!vehicleTypeSelectEl || !unitQuantityInputEl || !estimatedPaxInputEl) return;
        const selectedType = vehicleTypeSelectEl.value;
        const perUnitCap = getVehicleCapacity(selectedType);
        const qty = parseInt(unitQuantityInputEl.value, 10) || 1;
        const maxCapacity = perUnitCap * qty;
        estimatedPaxInputEl.max = maxCapacity;
        if (parseInt(estimatedPaxInputEl.value, 10) > maxCapacity || !estimatedPaxInputEl.value) {
            estimatedPaxInputEl.value = maxCapacity;
        }
    }

    if (vehicleTypeSelectEl) {
        vehicleTypeSelectEl.addEventListener("change", updateCapacityGuards);
    }
    if (unitQuantityInputEl) {
        unitQuantityInputEl.addEventListener("input", updateCapacityGuards);
    }

    function openModal() {
        currentEditId = null;
        if (modalTitle) modalTitle.innerText = "New Reservation Request";
        if (submitBtn) submitBtn.innerText = "Submit Request";
        if (deleteBtn) deleteBtn.style.display = "none";
        if (errorDiv) errorDiv.style.display = "none";
        const form = document.getElementById("reservationForm");
        if (form) form.reset();
        updateCapacityGuards();
        if (modal) modal.style.display = "flex";
    }

    function openModalForEdit(res) {
        currentEditId = res.id;
        if (modalTitle) modalTitle.innerText = `Modify Reservation Request: ${res.id}`;
        if (submitBtn) submitBtn.innerText = "Save Changes";
        if (deleteBtn) {
            deleteBtn.style.display = (res.status !== "Cancelled") ? "block" : "none";
        }
        if (errorDiv) errorDiv.style.display = "none";

        // Prepopulate inputs
        const pickupLoc = document.getElementById("pickupLocationInput");
        const destLoc = document.getElementById("destinationInput");
        const vehicleType = document.getElementById("vehicleTypeSelect");
        const units = document.getElementById("unitQuantityInput");
        const pax = document.getElementById("estimatedPaxInput");
        const costCenter = document.getElementById("costCenterInput");
        const notes = document.getElementById("tripNotesInput");
        const disclaimer = document.getElementById("disclaimerCheckbox");

        if (pickupLoc) pickupLoc.value = res.pickup || "";
        if (destLoc) destLoc.value = res.destination || "";
        if (vehicleType) vehicleType.value = res.vehicleType || "Toyota HiAce Commuter (14 Seats)";
        if (units) units.value = res.units || 1;
        if (pax) pax.value = res.estimatedPax || (res.units ? res.units * getVehicleCapacity(res.vehicleType) : 14);
        if (costCenter) costCenter.value = res.costCenter || "";
        if (notes) notes.value = res.notes || "";
        if (disclaimer) disclaimer.checked = true;

        updateCapacityGuards();
        if (modal) modal.style.display = "flex";
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
        const form = document.getElementById("reservationForm");
        if (form) form.reset();
        currentEditId = null;
    }

    const reservationForm = document.getElementById("reservationForm");
    if (reservationForm) {
        reservationForm.addEventListener("submit", (e) => e.preventDefault());
    }

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Modal Cancel/Delete Reservation Button
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            if (!currentEditId) return;
            const db = ROVER_DB.get();
            const res = (db.reservations || []).find(x => x.id === currentEditId);
            if (!res) return;

            const confirmed = confirm(`Are you sure you want to cancel reservation ${currentEditId}?\n\nThis will release the reserved fleet units.`);
            if (!confirmed) return;

            res.status = "Cancelled";
            res.cancelledAt = new Date().toISOString();
            ROVER_DB.save(db);
            closeModal();
            renderClientReservations();
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const pickupDate = document.getElementById("pickupDateTimeInput") ? document.getElementById("pickupDateTimeInput").value : "";
            const returnDate = document.getElementById("returnDateTimeInput") ? document.getElementById("returnDateTimeInput").value : "";
            const pickupLoc = document.getElementById("pickupLocationInput") ? document.getElementById("pickupLocationInput").value.trim() : "";
            const destLoc = document.getElementById("destinationInput") ? document.getElementById("destinationInput").value.trim() : "";
            const vehicleType = document.getElementById("vehicleTypeSelect") ? document.getElementById("vehicleTypeSelect").value : "";
            const units = parseInt(document.getElementById("unitQuantityInput") ? document.getElementById("unitQuantityInput").value : "1", 10);
            const estimatedPax = parseInt(document.getElementById("estimatedPaxInput") ? document.getElementById("estimatedPaxInput").value : "0", 10);
            const disclaimer = document.getElementById("disclaimerCheckbox") ? document.getElementById("disclaimerCheckbox").checked : true;

            const maxCapacity = getVehicleCapacity(vehicleType) * units;

            // In edit mode, allow keeping existing schedule if datetime wasn't re-entered
            if (currentEditId) {
                if (!pickupLoc || !destLoc || !vehicleType || isNaN(units) || units < 1) {
                    if (errorDiv) {
                        errorDiv.innerText = "Please complete all required location and vehicle fields.";
                        errorDiv.style.display = "block";
                    }
                    return;
                }

                if (estimatedPax > maxCapacity) {
                    if (errorDiv) {
                        errorDiv.innerText = `Passenger count (${estimatedPax}) exceeds maximum capacity of ${maxCapacity} for ${units}x unit(s).`;
                        errorDiv.style.display = "block";
                    }
                    return;
                }

                const db = ROVER_DB.get();
                const res = (db.reservations || []).find(x => x.id === currentEditId);
                if (res) {
                    res.pickup = pickupLoc;
                    res.destination = destLoc;
                    res.route = `${pickupLoc} to ${destLoc}`;
                    res.vehicleType = vehicleType;
                    res.vehiclePref = `${units}x ${vehicleType}`;
                    res.units = units;
                    res.estimatedPax = estimatedPax || maxCapacity;
                    if (pickupDate) {
                        res.schedule = formatDateTimeString(pickupDate);
                        res.start = formatDateTimeString(pickupDate);
                    }
                    if (returnDate) {
                        res.return = formatDateTimeString(returnDate);
                    }
                    res.costCenter = document.getElementById("costCenterInput") ? document.getElementById("costCenterInput").value.trim() : res.costCenter;
                    res.notes = document.getElementById("tripNotesInput") ? document.getElementById("tripNotesInput").value.trim() : res.notes;

                    ROVER_DB.save(db);
                }

                closeModal();
                renderClientReservations();
                return;
            }

            // New reservation creation
            if (!pickupDate || !returnDate || !pickupLoc || !destLoc || !vehicleType || isNaN(units) || units < 1 || !disclaimer) {
                if (errorDiv) {
                    errorDiv.innerText = "Please complete all required fields and accept the legal disclaimer.";
                    errorDiv.style.display = "block";
                }
                return;
            }

            if (estimatedPax > maxCapacity) {
                if (errorDiv) {
                    errorDiv.innerText = `Passenger count (${estimatedPax}) exceeds maximum capacity of ${maxCapacity} for ${units}x unit(s).`;
                    errorDiv.style.display = "block";
                }
                return;
            }

            const db = ROVER_DB.get();
            const newReservation = {
                id: "#RQ-" + Math.floor(1000 + Math.random() * 9000),
                client: currentUser ? currentUser.name : "Rowena Mae Castaneda",
                vehicleType: vehicleType,
                vehiclePref: `${units}x ${vehicleType}`,
                units: units,
                estimatedPax: estimatedPax || maxCapacity,
                pickup: pickupLoc,
                destination: destLoc,
                route: `${pickupLoc} to ${destLoc}`,
                start: formatDateTimeString(pickupDate),
                return: formatDateTimeString(returnDate),
                schedule: formatDateTimeString(pickupDate),
                status: "Pending Review",
                costCenter: document.getElementById("costCenterInput") ? document.getElementById("costCenterInput").value.trim() : "CC-OPERATIONS",
                notes: document.getElementById("tripNotesInput") ? document.getElementById("tripNotesInput").value.trim() : ""
            };

            db.reservations = db.reservations || [];
            db.reservations.unshift(newReservation);
            ROVER_DB.save(db);

            closeModal();
            renderClientReservations();
        });
    }

    // 4. Search, Filter, and Export Handlers
    const searchInput = document.getElementById("reservationSearchInput");
    if (searchInput) searchInput.addEventListener("input", renderClientReservations);

    const filterSelect = document.getElementById("statusFilterSelect");
    if (filterSelect) filterSelect.addEventListener("change", renderClientReservations);

    const exportBtn = document.getElementById("exportCsvBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            const db = ROVER_DB.get();
            const reservations = db.reservations || [];
            let csv = "REQUEST ID,CLIENT,VEHICLE TYPE,UNITS,PICKUP LOCATION,DESTINATION,SCHEDULE,STATUS\n";
            reservations.forEach(r => {
                csv += `"${r.id}","${r.client}","${r.vehicleType || ''}","${r.units || 1}","${r.pickup || ''}","${r.destination || ''}","${r.schedule || r.start || ''}","${r.status}"\n`;
            });
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("href", url);
            a.setAttribute("download", `reservations_export_${Date.now()}.csv`);
            a.click();
        });
    }

    // Initial Execution
    renderClientReservations();
});
