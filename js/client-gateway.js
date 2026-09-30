/**
 * ROVER FLEET SYSTEMS - CLIENT GATEWAY CONTROLLER (js/client-gateway.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles Corporate Client Portal & Reservation Gateway (PB-005)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Client only)
    const currentUser = ROVER_AUTH.requireRole("Client");
    if (!currentUser) return;

    // 2. Client Reservations Rendering & State
    function renderClientReservations() {
        const db = ROVER_DB.get();
        const reservations = db.reservations || [];

        // Update Client Metrics
        const totalBookings = reservations.length;
        const pendingCount = reservations.filter(r => r.status === "Pending" || r.status === "Pending Review").length;
        const confirmedCount = reservations.filter(r => r.status === "Confirmed").length;

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
            const matchesFilter = 
                filterVal === "ALL" ? true :
                filterVal === "PENDING" ? (r.status === "Pending" || r.status === "Pending Review") :
                filterVal === "CONFIRMED" ? r.status === "Confirmed" :
                filterVal === "COMPLETED" ? r.status === "Completed" : true;

            const matchesSearch = !q ||
                (r.id && r.id.toLowerCase().includes(q)) ||
                (r.route && r.route.toLowerCase().includes(q)) ||
                (r.pickup && r.pickup.toLowerCase().includes(q)) ||
                (r.destination && r.destination.toLowerCase().includes(q));

            return matchesFilter && matchesSearch;
        });

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

            const isPending = r.status === "Pending" || r.status === "Pending Review";
            const isConfirmed = r.status === "Confirmed";

            const statusBadge = isPending ? 
                `<span class="status-pill status-pending">&#9679; Pending Review</span>` :
                isConfirmed ? 
                `<span class="status-pill status-confirmed">&#10004; Confirmed</span>` :
                `<span class="status-pill status-completed">Completed</span>`;

            const actionText = isPending ? "Modify Request" : "Download Manifest";

            tr.innerHTML = `
                <td style="padding: 16px 20px; font-weight: 700; color: #C62828;">${r.id}</td>
                <td style="padding: 16px 20px;">
                    <div style="font-weight: 600; color: #212121;">${r.vehicleType || "Corporate Shuttle"}</div>
                    <div style="font-size: 11px; color: #78909C;">${r.units || 1} Assigned Unit${(r.units > 1) ? 's' : ''}</div>
                </td>
                <td style="padding: 16px 20px; font-size: 12px; color: #424242;">
                    <div>${r.pickup || "Metro Manila Hub"}</div>
                    <div style="color: #9E9E9E; font-size: 11px;">to</div>
                    <div>${r.destination || "Destination Terminal"}</div>
                </td>
                <td style="padding: 16px 20px; font-size: 12px; color: #37474F;">
                    <div style="font-weight: 600;">${r.schedule || r.start}</div>
                    ${r.return ? `<div style="color: #78909C; font-size: 11px; margin-top: 2px;">Return: ${r.return}</div>` : ''}
                </td>
                <td style="padding: 16px 20px;">${statusBadge}</td>
                <td style="padding: 16px 20px;">
                    <a href="#" style="color: #1976D2; font-size: 12px; font-weight: 600; text-decoration: none;">${actionText} &rarr;</a>
                </td>
            `;
            tbody.appendChild(tr);
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
    const errorDiv = document.getElementById("reservationModalError");

    function openModal() {
        if (errorDiv) errorDiv.style.display = "none";
        if (modal) modal.style.display = "flex";
    }

    function closeModal() {
        if (modal) modal.style.display = "none";
        const form = document.getElementById("reservationForm");
        if (form) form.reset();
    }

    const reservationForm = document.getElementById("reservationForm");
    if (reservationForm) {
        reservationForm.addEventListener("submit", (e) => e.preventDefault());
    }

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const pickupDate = document.getElementById("pickupDateTimeInput") ? document.getElementById("pickupDateTimeInput").value : "";
            const returnDate = document.getElementById("returnDateTimeInput") ? document.getElementById("returnDateTimeInput").value : "";
            const pickupLoc = document.getElementById("pickupLocationInput") ? document.getElementById("pickupLocationInput").value.trim() : "";
            const destLoc = document.getElementById("destinationInput") ? document.getElementById("destinationInput").value.trim() : "";
            const vehicleType = document.getElementById("vehicleTypeSelect") ? document.getElementById("vehicleTypeSelect").value : "";
            const units = parseInt(document.getElementById("unitQuantityInput") ? document.getElementById("unitQuantityInput").value : "1", 10);
            const disclaimer = document.getElementById("disclaimerCheckbox") ? document.getElementById("disclaimerCheckbox").checked : true;

            if (!pickupDate || !returnDate || !pickupLoc || !destLoc || !vehicleType || isNaN(units) || units < 1 || !disclaimer) {
                if (errorDiv) errorDiv.style.display = "block";
                return;
            }

            const db = ROVER_DB.get();
            const newReservation = {
                id: "#RQ-" + Math.floor(1000 + Math.random() * 9000),
                client: currentUser.name || "Rowena Mae Castaneda",
                vehicleType: vehicleType,
                vehiclePref: `${units}x ${vehicleType}`,
                units: units,
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
            let csv = "REQUEST ID,CLIENT,VEHICLE TYPE,UNITS,PICKUP,DESTINATION,SCHEDULE,STATUS\n";
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
