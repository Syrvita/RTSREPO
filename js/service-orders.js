/**
 * ROVER FLEET SYSTEMS - SERVICE ORDERS & DISPATCH CONTROLLER (js/service-orders.js)
 * Scoped Multi-Page Architecture (MPA)
 * Concurrency Clearance & Overlap Resolution Controller (PB-008)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Allows Manager and Admin)
    const currentUser = ROVER_AUTH.requireRole(["Manager", "Admin"]);
    if (!currentUser) return;

    // Lock Manager workspace identity
    const subtext = document.getElementById("sidebarSubtext");
    if (subtext) subtext.innerHTML = "MANAGEMENT &bull; FLEET OPERATIONS";
    const userFullName = document.getElementById("userFullName");
    if (userFullName) userFullName.innerText = "Sigmund Malacas";
    const userRoleText = document.getElementById("userRoleText");
    if (userRoleText) userRoleText.innerText = "OPERATIONS MANAGER";
    const userAvatarInitials = document.getElementById("userAvatarInitials");
    if (userAvatarInitials) {
        userAvatarInitials.innerText = "SM";
        userAvatarInitials.style.backgroundColor = "#212121";
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
        const safeVehicleText = escapeHTML(vehicleText);
        const auditCell = document.getElementById("auditStatusRQ1042");
        if (auditCell) {
            auditCell.className = "pill-audit pill-assigned";
            auditCell.innerHTML = `<span class="dot-assigned"></span> Assigned (Clear)`;
        }

        const fleetCell = document.getElementById("fleetCellRQ1042");
        if (fleetCell) {
            fleetCell.innerHTML = `<div style="font-size: 13px; font-weight: 600; color: #212121;">1x Toyota HiAce Commuter <span style="font-size: 11px; color: #2E7D32; font-weight: normal;">(${safeVehicleText} Assigned)</span></div>`;
        }

        const actionCell = document.getElementById("actionCellRQ1042");
        if (actionCell) {
            actionCell.innerHTML = `<a href="reservation-details.html?id=RQ-1042" class="action-link">View Details</a>`;
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
    const rq1042 = db.reservations ? db.reservations.find(r => r.id === "#RQ-1042" || r.id === "RQ-1042") : null;
    if (rq1042 && (rq1042.status === "Assigned" || rq1042.auditStatus === "Assigned (Clear)")) {
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
            const target = (freshDb.reservations || []).find(r => r.id === "#RQ-1042" || r.id === "RQ-1042");
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
            const isPending = row.querySelector(".pill-overlap") || row.querySelector(".pill-staged");

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

function initManualDispatchModal() {
  const manualDispatchBtn = Array.from(document.querySelectorAll("button")).find(el => el.textContent.includes("Manual Dispatch")) || document.getElementById("btnManualDispatchTrigger");
  const modal = document.getElementById("manualDispatchModal");
  const closeBtn = document.getElementById("closeManualDispatchModalBtn");
  const cancelBtn = document.getElementById("cancelManualDispatchBtn");
  const submitBtn = document.getElementById("submitManualDispatchBtn");
  const bookingSelect = document.getElementById("dispatchTargetBooking");

  if (!modal) return;

  if (manualDispatchBtn) {
    manualDispatchBtn.id = "btnManualDispatchTrigger";
    manualDispatchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "flex";
    });
  }

  const closeModal = () => { modal.style.display = "none"; };
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (bookingSelect) {
    bookingSelect.addEventListener("change", function() {
      const selectedOption = this.options[this.selectedIndex];
      const client = selectedOption.getAttribute("data-client") || "—";
      const route = selectedOption.getAttribute("data-route") || "Select a reservation above";
      const time = selectedOption.getAttribute("data-time") || "—";

      const clientEl = document.getElementById("summaryClientName");
      const routeEl = document.getElementById("summaryRoute");
      const timeEl = document.getElementById("summaryPickupWindow");

      if (clientEl) clientEl.textContent = client;
      if (routeEl) routeEl.textContent = route;
      if (timeEl) timeEl.textContent = time;
    });
  }

  // Hydrate any previously staged records from roverDB on load
  try {
    const db = typeof ROVER_DB !== "undefined" ? ROVER_DB.get() : JSON.parse(localStorage.getItem("roverDB")) || {};
    const tableBody = document.querySelector("#dispatchTableBody") || document.querySelector("tbody") || document.getElementById("ordersTableBody");
    if (tableBody && db.reservations) {
      const stagedList = db.reservations.filter(r => r.status === "Staged (Pending Admin Approval)");
      stagedList.forEach(stagedRecord => {
        const cleanId = (stagedRecord.id || "").replace(/^#/, "");
        if (document.getElementById(`row-${cleanId}`) || tableBody.innerHTML.includes(`#${cleanId}`)) return;

        const safeId = typeof escapeHTML === 'function' ? escapeHTML(cleanId) : cleanId;
        const safeClient = typeof escapeHTML === 'function' ? escapeHTML(stagedRecord.client || "Direct Operations Dispatch") : (stagedRecord.client || "Direct Operations Dispatch");
        const safeRoute = typeof escapeHTML === 'function' ? escapeHTML(stagedRecord.route || "Custom Ad-Hoc Route") : (stagedRecord.route || "Custom Ad-Hoc Route");
        const safePickup = typeof escapeHTML === 'function' ? escapeHTML(stagedRecord.pickupWindow || "Immediate Staging") : (stagedRecord.pickupWindow || "Immediate Staging");
        const safeVehicle = typeof escapeHTML === 'function' ? escapeHTML(stagedRecord.vehicleAssigned || "Fleet Asset Staged") : (stagedRecord.vehicleAssigned || "Fleet Asset Staged");

        const newRow = document.createElement("tr");
        newRow.id = `row-${safeId}`;
        newRow.style.borderBottom = "1px solid #ECEFF1";
        newRow.innerHTML = `
          <td style="padding: 14px 20px; font-weight: 700; color: #D32F2F;">#${safeId}</td>
          <td style="padding: 14px 20px;">
            <div style="font-weight: 700; color: #111827;">${safeClient}</div>
            <div style="font-size: 11px; color: #6B7280;">Staged by Operations</div>
          </td>
          <td style="padding: 14px 20px; font-weight: 600; color: #111827;">${safeRoute}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #4B5563;">${safePickup}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #111827;">
            ${safeVehicle}
          </td>
          <td style="padding: 14px 20px;">
            <span class="pill-audit pill-staged" style="background: #FFF8E1; color: #E65100; border: 1px solid #FFE082; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
              <span class="dot-staged" style="width: 6px; height: 6px; border-radius: 50%; background: #E65100; display: inline-block;"></span> Staged (Pending Admin Approval)
            </span>
          </td>
          <td style="padding: 14px 20px; font-size: 12px; font-weight: 600; color: #6B7280;">
            Awaiting Admin Gate Pass
          </td>
        `;
        tableBody.insertBefore(newRow, tableBody.firstChild);
      });
    }
  } catch (err) {
    console.warn("Could not hydrate staged dispatches:", err);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const bookingId = bookingSelect ? bookingSelect.value : "";
      const vehicleSelect = document.getElementById("dispatchVehicleSelect");
      const driverSelect = document.getElementById("dispatchDriverSelect");
      const stagingNotesEl = document.getElementById("dispatchStagingNotes");
      const notes = stagingNotesEl ? stagingNotesEl.value : "";

      if (!bookingId || !vehicleSelect || !vehicleSelect.value || !driverSelect || !driverSelect.value) {
        alert("Validation Error: Please select a target booking, a Philippine fleet vehicle, and an on-duty driver.");
        return;
      }

      const vehicleText = vehicleSelect.options[vehicleSelect.selectedIndex].text.split("(")[0].trim();
      const vehicleUnitId = vehicleSelect.value;
      const driverName = driverSelect.options[driverSelect.selectedIndex].text.split("(")[0].trim();
      const clientName = document.getElementById("summaryClientName").textContent;
      const routeName = document.getElementById("summaryRoute").textContent;
      const pickupTime = document.getElementById("summaryPickupWindow").textContent;

      let roverDB = JSON.parse(localStorage.getItem("roverDB")) || {};
      if (!roverDB.reservations) roverDB.reservations = [];

      let rawId = bookingId === "MANUAL-ADHOC" ? "RQ-" + Math.floor(1000 + Math.random() * 9000) : bookingId;
      const cleanAssignedId = rawId.replace(/^#/, "");

      let existingIndex = roverDB.reservations.findIndex(r => r.id === rawId || r.id === "#" + cleanAssignedId || (r.id && r.id.replace(/^#/, "") === cleanAssignedId));
      const stagedRecord = {
        id: cleanAssignedId,
        client: clientName,
        route: routeName,
        pickupWindow: pickupTime,
        vehicleAssigned: vehicleText + " (" + vehicleUnitId + " Staged)",
        driverAssigned: driverName,
        status: "Staged (Pending Admin Approval)",
        stagingNotes: notes,
        stagedBy: "Sigmund Malacas (Operations Manager)",
        stagedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        roverDB.reservations[existingIndex] = Object.assign({}, roverDB.reservations[existingIndex], stagedRecord);
      } else {
        roverDB.reservations.unshift(stagedRecord);
      }

      if (roverDB.fleet) {
        let v = roverDB.fleet.find(unit => unit.id === vehicleUnitId);
        if (v) v.status = "Staged for Dispatch";
      }

      localStorage.setItem("roverDB", JSON.stringify(roverDB));

      const tableBody = document.querySelector("#dispatchTableBody") || document.querySelector("tbody") || document.getElementById("ordersTableBody");
      if (tableBody) {
        const safeId = typeof escapeHTML === 'function' ? escapeHTML(cleanAssignedId) : cleanAssignedId;
        const safeClient = typeof escapeHTML === 'function' ? escapeHTML(clientName) : clientName;
        const safeRoute = typeof escapeHTML === 'function' ? escapeHTML(routeName) : routeName;
        const safePickup = typeof escapeHTML === 'function' ? escapeHTML(pickupTime) : pickupTime;
        const safeVehicleText = typeof escapeHTML === 'function' ? escapeHTML(vehicleText) : vehicleText;
        const safeVehicleUnitId = typeof escapeHTML === 'function' ? escapeHTML(vehicleUnitId) : vehicleUnitId;

        // Remove row if already present
        const existingRow = document.getElementById(`row-${safeId}`);
        if (existingRow) existingRow.remove();

        const newRow = document.createElement("tr");
        newRow.id = `row-${safeId}`;
        newRow.style.borderBottom = "1px solid #ECEFF1";
        newRow.innerHTML = `
          <td style="padding: 14px 20px; font-weight: 700; color: #D32F2F;">#${safeId}</td>
          <td style="padding: 14px 20px;">
            <div style="font-weight: 700; color: #111827;">${safeClient}</div>
            <div style="font-size: 11px; color: #6B7280;">Staged by Operations</div>
          </td>
          <td style="padding: 14px 20px; font-weight: 600; color: #111827;">${safeRoute}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #4B5563;">${safePickup}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #111827;">
            <strong>${safeVehicleText}</strong> <span style="font-size: 10px; color: #E65100;">(${safeVehicleUnitId} Staged)</span>
          </td>
          <td style="padding: 14px 20px;">
            <span class="pill-audit pill-staged" style="background: #FFF8E1; color: #E65100; border: 1px solid #FFE082; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
              <span class="dot-staged" style="width: 6px; height: 6px; border-radius: 50%; background: #E65100; display: inline-block;"></span> Staged (Pending Admin Approval)
            </span>
          </td>
          <td style="padding: 14px 20px; font-size: 12px; font-weight: 600; color: #6B7280;">
            Awaiting Admin Gate Pass
          </td>
        `;
        tableBody.insertBefore(newRow, tableBody.firstChild);
      }

      closeModal();
      alert("Dispatch for " + stagedRecord.id + " staged successfully. Queued for final Administrator confirmation and gate release.");
    });
  }
}

document.addEventListener("DOMContentLoaded", initManualDispatchModal);
