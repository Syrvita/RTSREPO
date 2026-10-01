/**
 * ROVER FLEET SYSTEMS - RESERVATION DETAILS CONTROLLER (js/reservation-details.js)
 * Form PB-006: Client Reservation Ticket Inspection & Cancellation Workflow
 * Scoped Multi-Page Architecture (MPA)
 * Compatible with local file:// protocol
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session Verification
    const activeUser = ROVER_AUTH.requireRole(["Client", "Admin"]);
    if (!activeUser) return;

    // 2. Data Retrieval
    const urlParams = new URLSearchParams(window.location.search);
    let requestedId = urlParams.get("id");
    if (!requestedId && window.location.hash) {
        requestedId = window.location.hash.replace(/^#/, "");
    }
    if (!requestedId) requestedId = "RQ-1042";

    const normalizedId = requestedId.startsWith("#") ? requestedId : "#" + requestedId;
    const plainId = requestedId.replace(/^#/, "");

    const db = ROVER_DB.get();
    let currentReservation = (db.reservations || []).find(r => 
        r.id === requestedId || 
        r.id === normalizedId || 
        (r.id && r.id.replace(/^#/, "") === plainId)
    );

    // If reservation is missing, generate default fallback record matching RQ-1042
    if (!currentReservation) {
        currentReservation = {
            id: normalizedId,
            client: activeUser.name || "Apex Logistics Global Inc.",
            route: "Makati CBD to Clark Logistics Hub",
            schedule: "Oct 28, 2026 • 06:30 AM",
            start: "Oct 28, 2026 • 06:30 AM",
            return: "Oct 28, 2026 • 06:00 PM",
            pickup: "Makati CBD (Ayala Tower 1)",
            destination: "Clark Logistics Hub Terminal 2",
            vehicleType: "HiAce Commuter (Van - 14 Seater)",
            units: 1,
            estimatedPax: 14,
            costCenter: "APX-LOG-OPS-2026",
            status: "Pending Review",
            notes: "Executive partner and passenger logistics corridor transfer.",
            totalFee: "PHP 12,450.00"
        };
        // Persist default record to db
        db.reservations = db.reservations || [];
        db.reservations.unshift(currentReservation);
        ROVER_DB.save(db);
    }

    // 3. Render Manifest State
    renderManifest(currentReservation);

    function renderManifest(res) {
        const ticketId = res.id.startsWith("#") ? res.id : "#" + res.id;

        // Populate Ticket IDs
        const manifestTicketIdTag = document.getElementById("manifestTicketIdTag");
        const breadcrumbTicketId = document.getElementById("breadcrumbTicketId");
        const cancelModalSubtitle = document.getElementById("cancelModalSubtitleTicketId");
        const cancelSummaryTicketId = document.getElementById("cancelSummaryTicketId");

        if (manifestTicketIdTag) manifestTicketIdTag.innerText = ticketId;
        if (breadcrumbTicketId) breadcrumbTicketId.innerText = ticketId;
        if (cancelModalSubtitle) cancelModalSubtitle.innerText = `FORM PB-006 • MANIFEST TICKET ${ticketId}`;
        if (cancelSummaryTicketId) cancelSummaryTicketId.innerText = ticketId;

        // Populate Locations & Dates
        const pickupLocEl = document.getElementById("manifestPickupLoc");
        const destLocEl = document.getElementById("manifestDestLoc");
        const pickupDateEl = document.getElementById("manifestPickupDate");
        const returnDateEl = document.getElementById("manifestReturnDate");

        if (pickupLocEl) pickupLocEl.innerText = res.pickup || "Makati CBD (Ayala Tower 1)";
        if (destLocEl) destLocEl.innerText = res.destination || "Clark Logistics Hub Terminal 2";
        if (pickupDateEl) pickupDateEl.innerText = res.schedule || res.start || "Oct 28, 2026 • 06:30 AM";
        if (returnDateEl) returnDateEl.innerText = res.return || "Oct 28, 2026 • 06:00 PM";

        // Vehicle & Pax
        const vehicleTypeEl = document.getElementById("manifestVehicleType");
        const paxBadgeEl = document.getElementById("manifestPaxBadge");
        const unitBadgeEl = document.getElementById("manifestUnitCountBadge");

        if (vehicleTypeEl) vehicleTypeEl.innerText = res.vehicleType || "HiAce Commuter (Van - 14 Seater)";
        if (paxBadgeEl) paxBadgeEl.innerText = `${res.estimatedPax || (res.units ? res.units * 14 : 14)} PAX MAX`;
        if (unitBadgeEl) unitBadgeEl.innerText = `Manifest Unit 1 of ${res.units || 1}`;

        // Cost Center & Total Fee
        const costCenterEl = document.getElementById("manifestCostCenter");
        const totalFeeEl = document.getElementById("manifestTotalFee");
        const savingsEl = document.getElementById("cancelEstimatedSavings");

        if (costCenterEl) costCenterEl.innerText = res.costCenter || "APX-LOG-OPS-2026";
        if (totalFeeEl) totalFeeEl.innerText = res.totalFee || "PHP 12,450.00";
        if (savingsEl) savingsEl.innerText = "PHP 10,582.50";

        // Status Badge & Action Controls
        const statusBadgeEl = document.getElementById("manifestStatusBadge");
        const openCancelModalBtn = document.getElementById("openCancelModalBtn");
        const allocationBoxEl = document.getElementById("allocationStatusBox");

        const isCancelled = res.status === "Cancelled";
        const isConfirmed = res.status === "Confirmed";

        if (statusBadgeEl) {
            if (isCancelled) {
                statusBadgeEl.className = "status-pill status-cancelled";
                statusBadgeEl.innerHTML = "✕ Cancelled";
            } else if (isConfirmed) {
                statusBadgeEl.className = "status-pill status-confirmed";
                statusBadgeEl.innerHTML = "✓ Confirmed";
            } else {
                statusBadgeEl.className = "status-pill status-pending";
                statusBadgeEl.innerHTML = "• Pending Review";
            }
        }

        if (openCancelModalBtn) {
            if (isCancelled) {
                openCancelModalBtn.disabled = true;
                openCancelModalBtn.style.opacity = "0.5";
                openCancelModalBtn.style.cursor = "not-allowed";
                openCancelModalBtn.style.background = "#EEEEEE";
                openCancelModalBtn.style.color = "#9E9E9E";
                openCancelModalBtn.style.borderColor = "#E0E0E0";
                openCancelModalBtn.innerHTML = `✕ Reservation Cancelled`;
            } else {
                openCancelModalBtn.disabled = false;
                openCancelModalBtn.style.opacity = "1";
                openCancelModalBtn.style.cursor = "pointer";
                openCancelModalBtn.style.background = "#FFEBEE";
                openCancelModalBtn.style.color = "#D32F2F";
                openCancelModalBtn.style.borderColor = "#FFCDD2";
                openCancelModalBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Cancel Reservation
                `;
            }
        }

        // Allocation Box State Mutation
        if (allocationBoxEl) {
            if (isCancelled) {
                const cancelTimeStr = res.cancelledAt ? new Date(res.cancelledAt).toLocaleString() : "Recent notice";
                const safeReason = escapeHTML(res.cancellationReason || "Client Schedule Change");
                const safeNotes = res.cancellationNotes ? escapeHTML(res.cancellationNotes) : "";
                allocationBoxEl.style.background = "#FFEBEE";
                allocationBoxEl.style.borderColor = "#FFCDD2";
                allocationBoxEl.innerHTML = `
                    <span style="color: #D32F2F; font-size: 16px; margin-top: 1px;">✕</span>
                    <div style="font-size: 12.5px; color: #B71C1C; line-height: 1.5;">
                        <strong>Reservation Cancelled by Client.</strong> Reason: <em>${safeReason}</em>.<br>
                        This ticket manifest was officially cancelled on ${cancelTimeStr}. Reserved fleet units have been returned to active dispatch inventory.
                        ${safeNotes ? `<br><span style="color: #424242;"><strong>Justification:</strong> ${safeNotes}</span>` : ""}
                    </div>
                `;
            } else if (isConfirmed) {
                allocationBoxEl.style.background = "#E8F5E9";
                allocationBoxEl.style.borderColor = "#A5D6A7";
                allocationBoxEl.innerHTML = `
                    <span style="color: #2E7D32; font-size: 16px; margin-top: 1px;">✓</span>
                    <div style="font-size: 12.5px; color: #1B5E20; line-height: 1.5;">
                        <strong>Vehicle &amp; Driver Dispatched.</strong> Assigned fleet unit has been staged and driver clearance verified for scheduled corridor transit.
                    </div>
                `;
            } else {
                allocationBoxEl.style.background = "#FFF8E1";
                allocationBoxEl.style.borderColor = "#FFE082";
                allocationBoxEl.innerHTML = `
                    <span style="color: #F57F17; font-size: 16px; margin-top: 1px;">⏱</span>
                    <div style="font-size: 12.5px; color: #7F5800; line-height: 1.5;">
                        <strong>Vehicle &amp; Driver Allocation Pending.</strong> Operations Manager is currently validating unit availability and driver shift clearance at Manila Hub.
                    </div>
                `;
            }
        }
    }

    // 4. Modal Interactions & Cancellation Workflow
    const cancelModal = document.getElementById("cancelModalOverlay");
    const openCancelModalBtn = document.getElementById("openCancelModalBtn");
    const closeModalCrossBtn = document.getElementById("closeModalCrossBtn");
    const keepReservationBtn = document.getElementById("keepReservationBtn");
    const cancelForm = document.getElementById("cancelReservationForm");

    function openModal() {
        if (currentReservation.status === "Cancelled") return;
        if (cancelModal) cancelModal.style.display = "flex";
    }

    function closeModal() {
        if (cancelModal) cancelModal.style.display = "none";
    }

    if (openCancelModalBtn) openCancelModalBtn.addEventListener("click", openModal);
    if (closeModalCrossBtn) closeModalCrossBtn.addEventListener("click", closeModal);
    if (keepReservationBtn) keepReservationBtn.addEventListener("click", closeModal);

    // Close on overlay backdrop click
    if (cancelModal) {
        cancelModal.addEventListener("click", (e) => {
            if (e.target === cancelModal) closeModal();
        });
    }

    // Handle Form Submission
    if (cancelForm) {
        cancelForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const reasonSelect = document.getElementById("cancelReasonSelect");
            const notesTextarea = document.getElementById("cancelNotesTextarea");

            const selectedReason = reasonSelect ? reasonSelect.value : "Client Schedule Change";
            const enteredNotes = notesTextarea ? notesTextarea.value.trim() : "";

            // Mutate Database
            const database = ROVER_DB.get();
            const target = (database.reservations || []).find(r => r.id === currentReservation.id);
            if (target) {
                target.status = "Cancelled";
                target.cancellationReason = selectedReason;
                target.cancellationNotes = enteredNotes;
                target.cancelledAt = new Date().toISOString();
                currentReservation = target;
                ROVER_DB.save(database);
            } else {
                currentReservation.status = "Cancelled";
                currentReservation.cancellationReason = selectedReason;
                currentReservation.cancellationNotes = enteredNotes;
                currentReservation.cancelledAt = new Date().toISOString();
                database.reservations = database.reservations || [];
                database.reservations.unshift(currentReservation);
                ROVER_DB.save(database);
            }

            closeModal();
            renderManifest(currentReservation);

            // Display Success Notification Banner
            const banner = document.getElementById("manifestNotificationBanner");
            const bannerText = document.getElementById("manifestNotificationText");
            if (banner) {
                if (bannerText) bannerText.innerText = `Reservation ${currentReservation.id} was successfully cancelled. Manifest status and audit trail updated.`;
                banner.style.display = "flex";
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    // 5. Print Manifest
    const printBtn = document.getElementById("printManifestBtn");
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }

    // 6. Logout Binding
    const logoutBtn = document.getElementById("clientLogoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            ROVER_AUTH.logout();
        });
    }
});
