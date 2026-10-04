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
    const auditStatusRQ1042 = document.getElementById("auditStatusRQ1042");
    if (auditStatusRQ1042) {
        auditStatusRQ1042.style.cursor = "pointer";
        auditStatusRQ1042.addEventListener("click", openConflictModal);
    }
    document.querySelectorAll(".pill-overlap, .btn-resolve-conflict").forEach(el => {
        el.style.cursor = "pointer";
        el.addEventListener("click", openConflictModal);
    });

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
            actionCell.innerHTML = `<button type="button" class="btn-view-trip-details action-link" data-booking-id="RQ-1042" style="background: none; border: none; cursor: pointer; padding: 0; font-family: inherit;">View Details</button>`;
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
  const manualDispatchBtn = document.getElementById("openManualDispatchBtn") || document.getElementById("btnManualDispatchTrigger") || Array.from(document.querySelectorAll("button")).find(el => el.textContent.includes("Manual Dispatch"));
  const modal = document.getElementById("manualDispatchModal");
  const closeBtn = document.getElementById("closeManualDispatchModalBtn");
  const cancelBtn = document.getElementById("cancelManualDispatchBtn");
  const submitBtn = document.getElementById("submitManualDispatchBtn");
  const bookingSelect = document.getElementById("dispatchTargetBooking");
  const addVehicleBtn = document.getElementById("btnAddVehicleRow");
  const vehiclesContainer = document.getElementById("dispatchVehiclesContainer");
  const vehicleCountBadge = document.getElementById("stagedVehicleCountBadge");

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

  // Dynamic Vehicle Row Management
  function updateVehicleRowIndices() {
    if (!vehiclesContainer) return;
    const rows = vehiclesContainer.querySelectorAll(".dispatch-vehicle-row");
    const count = rows.length;

    rows.forEach((row, index) => {
      const idx = index + 1;
      row.dataset.rowIndex = idx;

      const numBadge = row.querySelector(".vehicle-row-number");
      if (numBadge) numBadge.textContent = idx;

      const titleEl = row.querySelector(".vehicle-row-title");
      if (titleEl) {
        titleEl.textContent = idx === 1 ? "Primary Fleet Asset & Shift Pilot" : `Convoy Unit #${idx} & Shift Pilot`;
      }

      const removeBtn = row.querySelector(".btn-remove-vehicle-row");
      if (removeBtn) {
        removeBtn.style.display = count > 1 ? "inline-block" : "none";
      }
    });

    if (vehicleCountBadge) {
      vehicleCountBadge.textContent = count === 1 
        ? "1 Vehicle Assigned" 
        : `${count} Vehicles Assigned (Convoy)`;
    }
  }

  function createVehicleRow(index) {
    const row = document.createElement("div");
    row.className = "dispatch-vehicle-row";
    row.dataset.rowIndex = index;
    row.style.cssText = "background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 14px; position: relative;";

    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span class="vehicle-row-label" style="font-size: 11px; font-weight: 700; color: #374151; display: inline-flex; align-items: center; gap: 6px;">
          <span class="vehicle-row-number" style="width: 18px; height: 18px; border-radius: 50%; background: #D32F2F; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${index}</span>
          <span class="vehicle-row-title">Convoy Unit #${index} &amp; Shift Pilot</span>
        </span>
        <button type="button" class="btn-remove-vehicle-row" style="background: none; border: none; color: #EF4444; font-size: 11px; font-weight: 600; cursor: pointer; padding: 2px 6px;">✕ Remove Unit</button>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div>
          <label style="display: block; font-size: 10px; font-weight: 700; color: #4B5563; margin-bottom: 5px; text-transform: uppercase;">Assign Philippine Fleet Asset *</label>
          <select class="dispatch-vehicle-select" required style="width: 100%; padding: 9px 11px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; background: #FFFFFF; color: #111827;">
            <option value="">Select available van unit...</option>
            <option value="RV-URV-108" data-name="Nissan NV350 Urvan Standard" data-plate="NCR-9012" data-capacity="15">Nissan NV350 Urvan Standard (NCR-9012 • 15 Seats • Ready)</option>
            <option value="RV-VAN-112" data-name="Toyota HiAce Commuter Deluxe" data-plate="NCL-8821" data-capacity="14">Toyota HiAce Commuter Deluxe (NCL-8821 • 14 Seats • Ready)</option>
            <option value="RV-STR-204" data-name="Hyundai Grand Starex Executive" data-plate="NDB-4321" data-capacity="10">Hyundai Grand Starex Executive (NDB-4321 • 10 Seats • Ready)</option>
            <option value="RV-L30-005" data-name="Mitsubishi L300 FB Shuttle" data-plate="NAA-7741" data-capacity="16">Mitsubishi L300 FB Shuttle (NAA-7741 • 16 Seats • Ready)</option>
            <option value="RV-TRV-012" data-name="Isuzu Traviz Utility Shuttle" data-plate="NBE-3019" data-capacity="16">Isuzu Traviz Utility Shuttle (NBE-3019 • 16 Seats • Ready)</option>
          </select>
          <div style="font-size: 10px; color: #6B7280; margin-top: 3px;">Only idle Philippine-registered units with active RFID are listed.</div>
        </div>
        <div>
          <label style="display: block; font-size: 10px; font-weight: 700; color: #4B5563; margin-bottom: 5px; text-transform: uppercase;">Assign Licensed Shift Pilot *</label>
          <select class="dispatch-driver-select" required style="width: 100%; padding: 9px 11px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; background: #FFFFFF; color: #111827;">
            <option value="">Select rostered duty driver...</option>
            <option value="DRV-007" data-name="Rogelio D. Santos" data-lic="N02-14-382910">Rogelio D. Santos (Lic: N02-14-382910 • Manila Standby)</option>
            <option value="DRV-003" data-name="Danilo Ramos" data-lic="N01-18-094821">Danilo Ramos (Lic: N01-18-094821 • Rest Period Validated)</option>
            <option value="DRV-011" data-name="Arnel M. Bautista" data-lic="N03-19-102948">Arnel M. Bautista (Lic: N03-19-102948 • Rest Period Validated)</option>
            <option value="DRV-014" data-name="Ferdinand Cruz" data-lic="N01-16-994820">Ferdinand Cruz (Lic: N01-16-994820 • Shift Cleared)</option>
          </select>
          <div style="font-size: 10px; color: #6B7280; margin-top: 3px;">Enforces mandatory turnaround rest limits prior to assignment.</div>
        </div>
      </div>
    `;

    return row;
  }

  if (addVehicleBtn && vehiclesContainer) {
    addVehicleBtn.addEventListener("click", () => {
      const currentRows = vehiclesContainer.querySelectorAll(".dispatch-vehicle-row");
      const nextIndex = currentRows.length + 1;
      const newRow = createVehicleRow(nextIndex);
      vehiclesContainer.appendChild(newRow);
      updateVehicleRowIndices();
    });

    vehiclesContainer.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".btn-remove-vehicle-row");
      if (removeBtn) {
        const row = removeBtn.closest(".dispatch-vehicle-row");
        if (row) {
          row.remove();
          updateVehicleRowIndices();
        }
      }
    });
  }

  if (bookingSelect) {
    bookingSelect.addEventListener("change", function() {
      const selectedOption = this.options[this.selectedIndex];
      const client = selectedOption.getAttribute("data-client") || "—";
      const route = selectedOption.getAttribute("data-route") || "Select a reservation above";
      const time = selectedOption.getAttribute("data-time") || "—";
      const reqUnits = parseInt(selectedOption.getAttribute("data-units") || "1", 10);

      const clientEl = document.getElementById("summaryClientName");
      const routeEl = document.getElementById("summaryRoute");
      const timeEl = document.getElementById("summaryPickupWindow");

      if (clientEl) clientEl.textContent = client;
      if (routeEl) routeEl.textContent = route;
      if (timeEl) timeEl.textContent = time;

      // Auto-suggest vehicle rows if multiple units requested
      if (vehiclesContainer && reqUnits > 1) {
        const currentCount = vehiclesContainer.querySelectorAll(".dispatch-vehicle-row").length;
        for (let i = currentCount; i < reqUnits; i++) {
          const nextRow = createVehicleRow(i + 1);
          vehiclesContainer.appendChild(nextRow);
        }
        updateVehicleRowIndices();
      }
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
        
        let vehicleHtml = "";
        if (stagedRecord.units && stagedRecord.units > 1) {
          vehicleHtml = `<strong>${escapeHTML(stagedRecord.units.toString())}x Fleet Assets (Convoy)</strong> <div style="font-size: 11px; color: #E65100; margin-top: 2px;">${escapeHTML(stagedRecord.assignedVehicle || stagedRecord.vehicleAssigned || "Multi-Unit Staged")}</div>`;
        } else {
          vehicleHtml = `${escapeHTML(stagedRecord.vehicleAssigned || "Fleet Asset Staged")}`;
        }

        const newRow = document.createElement("tr");
        newRow.id = `row-${safeId}`;
        newRow.style.borderBottom = "1px solid #ECEFF1";
        newRow.innerHTML = `
          <td style="padding: 14px 20px; font-weight: 700; color: #D32F2F;"><strong style="cursor: pointer;" class="btn-view-trip-details" data-booking-id="${safeId}">#${safeId}</strong></td>
          <td style="padding: 14px 20px;">
            <div style="font-weight: 700; color: #111827;">${safeClient}</div>
            <div style="font-size: 11px; color: #6B7280;">Staged by Operations</div>
          </td>
          <td style="padding: 14px 20px; font-weight: 600; color: #111827;">${safeRoute}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #4B5563;">${safePickup}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #111827;">
            ${vehicleHtml}
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
      const stagingNotesEl = document.getElementById("dispatchStagingNotes");
      const notes = stagingNotesEl ? stagingNotesEl.value : "";

      if (!bookingId) {
        alert("Validation Error: Please select a target client reservation.");
        return;
      }

      // Collect all vehicle + driver allocations
      const vehicleRows = modal.querySelectorAll(".dispatch-vehicle-row");
      const allocations = [];
      let hasValidationError = false;

      vehicleRows.forEach((row, idx) => {
        const vSelect = row.querySelector(".dispatch-vehicle-select");
        const dSelect = row.querySelector(".dispatch-driver-select");
        const vVal = vSelect ? vSelect.value : "";
        const dVal = dSelect ? dSelect.value : "";

        if (!vVal || !dVal) {
          hasValidationError = true;
          return;
        }

        const optVehicle = vSelect.options[vSelect.selectedIndex];
        const optDriver = dSelect.options[dSelect.selectedIndex];

        const vName = optVehicle.getAttribute("data-name") || optVehicle.text.split("(")[0].trim();
        const vPlate = optVehicle.getAttribute("data-plate") || (optVehicle.text.match(/\(([A-Z]{3}-\d{4})/)?.[1] || "NCL-8821");
        const dName = optDriver.getAttribute("data-name") || optDriver.text.split("(")[0].trim();
        const dLic = optDriver.getAttribute("data-lic") || (optDriver.text.match(/Lic:\s*([A-Za-z0-9-]+)/)?.[1] || "N01-18-094821");

        allocations.push({
          unitId: vVal,
          vehicleName: vName,
          plate: vPlate,
          driverId: dVal,
          driverName: dName,
          driverLic: dLic
        });
      });

      if (allocations.length === 0 || hasValidationError) {
        alert("Validation Error: Please ensure every allocated vehicle slot has an assigned vehicle asset and duty pilot.");
        return;
      }

      // Verify no duplicate vehicles in same dispatch
      const assignedUnits = allocations.map(a => a.unitId);
      const duplicateUnit = assignedUnits.find((u, i) => assignedUnits.indexOf(u) !== i);
      if (duplicateUnit) {
        alert(`Allocation Conflict: Fleet asset [${duplicateUnit}] is assigned multiple times in this dispatch. Please select distinct vehicles.`);
        return;
      }

      // Format multi-vehicle descriptions
      const isMulti = allocations.length > 1;
      const primaryAlloc = allocations[0];
      const vehicleText = primaryAlloc.vehicleName;
      const vehicleUnitId = primaryAlloc.unitId;
      const driverName = primaryAlloc.driverName;

      const vehicleAssignedStr = isMulti
        ? `${allocations.length}x Fleet Assets: ` + allocations.map(a => `${a.vehicleName} (${a.unitId})`).join(" + ") + " (Staged)"
        : `${vehicleText} (${vehicleUnitId} Staged)`;

      const assignedVehicleStr = allocations.map(a => a.unitId).join(", ");
      const driverAssignedStr = allocations.map(a => `${a.driverName} (Lic: ${a.driverLic})`).join(", ");
      const assignedDriverStr = allocations.map(a => a.driverName).join(", ");

      const clientName = document.getElementById("summaryClientName") ? document.getElementById("summaryClientName").textContent : "Direct Operations Dispatch";
      const routeName = document.getElementById("summaryRoute") ? document.getElementById("summaryRoute").textContent : "Metro Manila Corporate Corridor";
      const pickupTime = document.getElementById("summaryPickupWindow") ? document.getElementById("summaryPickupWindow").textContent : "Immediate Staging";

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
        schedule: pickupTime,
        vehicleAssigned: vehicleAssignedStr,
        assignedVehicle: assignedVehicleStr,
        driverAssigned: driverAssignedStr,
        assignedDriver: assignedDriverStr,
        units: allocations.length,
        assignedVehicles: allocations,
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

      // Update all assigned vehicles in fleet registry
      if (roverDB.fleet) {
        allocations.forEach(a => {
          let v = roverDB.fleet.find(unit => unit.id === a.unitId || (a.plate && unit.plate === a.plate));
          if (v) {
            v.status = "Staged for Dispatch";
            v.currentTrip = `#${cleanAssignedId}`;
          }
        });
      }

      localStorage.setItem("roverDB", JSON.stringify(roverDB));

      const tableBody = document.querySelector("#dispatchTableBody") || document.querySelector("tbody") || document.getElementById("ordersTableBody");
      if (tableBody) {
        const safeId = typeof escapeHTML === 'function' ? escapeHTML(cleanAssignedId) : cleanAssignedId;
        const safeClient = typeof escapeHTML === 'function' ? escapeHTML(clientName) : clientName;
        const safeRoute = typeof escapeHTML === 'function' ? escapeHTML(routeName) : routeName;
        const safePickup = typeof escapeHTML === 'function' ? escapeHTML(pickupTime) : pickupTime;

        let displayVehicleHtml = "";
        if (isMulti) {
          displayVehicleHtml = `
            <strong>${allocations.length}x Multi-Vehicle Convoy</strong>
            <div style="font-size: 11px; color: #E65100; margin-top: 2px;">${typeof escapeHTML === 'function' ? escapeHTML(assignedVehicleStr) : assignedVehicleStr} Staged</div>
          `;
        } else {
          displayVehicleHtml = `
            <strong>${typeof escapeHTML === 'function' ? escapeHTML(vehicleText) : vehicleText}</strong> <span style="font-size: 10px; color: #E65100;">(${typeof escapeHTML === 'function' ? escapeHTML(vehicleUnitId) : vehicleUnitId} Staged)</span>
          `;
        }

        // Remove row if already present
        const existingRow = document.getElementById(`row-${safeId}`);
        if (existingRow) existingRow.remove();

        const newRow = document.createElement("tr");
        newRow.id = `row-${safeId}`;
        newRow.style.borderBottom = "1px solid #ECEFF1";
        newRow.innerHTML = `
          <td style="padding: 14px 20px; font-weight: 700; color: #D32F2F;"><strong style="cursor: pointer;" class="btn-view-trip-details" data-booking-id="${safeId}">#${safeId}</strong></td>
          <td style="padding: 14px 20px;">
            <div style="font-weight: 700; color: #111827;">${safeClient}</div>
            <div style="font-size: 11px; color: #6B7280;">Staged by Operations</div>
          </td>
          <td style="padding: 14px 20px; font-weight: 600; color: #111827;">${safeRoute}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #4B5563;">${safePickup}</td>
          <td style="padding: 14px 20px; font-size: 12px; color: #111827;">
            ${displayVehicleHtml}
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
      const unitText = isMulti ? `${allocations.length} vehicles` : "1 vehicle";
      alert(`Dispatch for #${cleanAssignedId} (${unitText}) staged successfully. Queued for Administrator confirmation and gate release.`);
    });
  }
}

function initTripDetailsModal() {
  const modal = document.getElementById("tripDetailsModal");
  const closeBtn = document.getElementById("closeTripDetailsModalBtn");
  const dismissBtn = document.getElementById("dismissTripDetailsModalBtn");
  const printBtn = document.getElementById("printTripManifestBtn");

  if (!modal) return;

  function closeModal() {
    modal.style.display = "none";
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (dismissBtn) dismissBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  function openTripDetailsModal(bookingId) {
    const cleanId = (bookingId || "").replace(/^#/, "");
    const db = typeof ROVER_DB !== "undefined" ? ROVER_DB.get() : JSON.parse(localStorage.getItem("roverDB")) || {};
    const reservations = db.reservations || [];
    const r = reservations.find(x => (x.id || "").replace(/^#/, "") === cleanId) || {};

    const idEl = document.getElementById("tripModalBookingId");
    const statusPillEl = document.getElementById("tripModalStatusPill");
    const clientEl = document.getElementById("tripModalClientName");
    const contactEl = document.getElementById("tripModalClientContact");
    const routeEl = document.getElementById("tripModalRoute");
    const checkpointsEl = document.getElementById("tripModalCheckpoints");
    const paxEl = document.getElementById("tripModalPax");
    const vehiclePrefEl = document.getElementById("tripModalVehiclePref");
    const scheduleEl = document.getElementById("tripModalSchedule");
    const durationEl = document.getElementById("tripModalDuration");

    const vehicleModelEl = document.getElementById("tripModalVehicleModel");
    const vehiclePlateEl = document.getElementById("tripModalVehiclePlate");
    const driverNameEl = document.getElementById("tripModalDriverName");
    const driverLicEl = document.getElementById("tripModalDriverLic");
    const driverDutyEl = document.getElementById("tripModalDriverDuty");
    const stagedByEl = document.getElementById("tripModalStagedBy");
    const confirmedByEl = document.getElementById("tripModalConfirmedBy");
    const notesEl = document.getElementById("tripModalNotes");

    if (idEl) idEl.textContent = `#${cleanId}`;
    if (statusPillEl) {
      statusPillEl.textContent = (r.status || "CONFIRMED & STAGED").toUpperCase();
    }
    if (clientEl) clientEl.textContent = r.client || "Apex Logistics Global Inc.";
    if (contactEl) contactEl.textContent = r.clientContact || "Rowena Mae Castaneda";
    if (routeEl) routeEl.textContent = r.route || (r.origin && r.destination ? `${r.origin} → ${r.destination}` : "Metro Manila Corporate Corridor");
    if (checkpointsEl) checkpointsEl.textContent = r.checkpoints || "Tollways: Skyway Stage 3 Buendia Ramp • NLEX Balintawak • Central Hub Gate";
    if (paxEl) paxEl.textContent = `${r.estimatedPax || r.pax || 14} Passengers`;
    if (vehiclePrefEl) vehiclePrefEl.textContent = `(${r.vehiclePref || r.vehicleType || "High-Roof Passenger Van"})`;
    if (scheduleEl) scheduleEl.textContent = r.schedule || r.pickupWindow || "Oct 28, 2026 • 08:00 – 18:00 PHT";
    if (durationEl) durationEl.textContent = "Est. Transit Duration: 2 hrs 15 mins (Express Route Buffer 100% Cleared)";

    const isMultiUnit = (r.units && r.units > 1) || (r.assignedVehicles && r.assignedVehicles.length > 1) || (r.assignedVehicle && r.assignedVehicle.includes(","));
    if (isMultiUnit) {
      const vList = r.assignedVehicles ? r.assignedVehicles.map(a => `${a.vehicleName} (${a.unitId})`).join(", ") : (r.vehicleAssigned || "Multi-Unit Fleet");
      const plateList = r.assignedVehicles ? r.assignedVehicles.map(a => a.plate || a.unitId).join(", ") : (r.assignedVehicle || "Multiple Units");
      if (vehicleModelEl) vehicleModelEl.textContent = `${r.units || (r.assignedVehicles ? r.assignedVehicles.length : 2)}x Fleet Assets: ${vList}`;
      if (vehiclePlateEl) vehiclePlateEl.innerHTML = `Plates: <strong>${escapeHTML(plateList)}</strong> &bull; Multi-Unit Convoy &bull; Manila Hub`;

      const dList = r.assignedVehicles ? r.assignedVehicles.map(a => a.driverName).join(", ") : (r.driverAssigned || r.assignedDriver || "Assigned Pilots");
      if (driverNameEl) driverNameEl.textContent = dList;
      if (driverLicEl) driverLicEl.innerHTML = `Licenses: <strong>Rostered Pilot Roster Cleared</strong> (Professional RC 1,2,3)`;
      if (driverDutyEl) driverDutyEl.textContent = "✓ Shift Cleared • Turnaround rest limits verified for all assigned pilots";
    } else {
      const vehicleText = r.vehicleAssigned ? r.vehicleAssigned.split("(")[0].trim() : (r.vehicleType || "Toyota HiAce Commuter Deluxe");
      const plateText = r.assignedVehicle || (r.vehicleAssigned && r.vehicleAssigned.includes("RV-") ? r.vehicleAssigned.match(/\(([^)]+)\)/)?.[1] : "NCL-8821");
      if (vehicleModelEl) vehicleModelEl.textContent = vehicleText;
      if (vehiclePlateEl) vehiclePlateEl.innerHTML = `Plate: <strong>${escapeHTML(plateText || "NCL-8821")}</strong> &bull; Capacity: ${r.estimatedPax || 14} Seats &bull; Manila Hub`;

      const driverText = r.driverAssigned ? r.driverAssigned.split("(")[0].trim() : (r.assignedDriver || "Danilo Ramos");
      if (driverNameEl) driverNameEl.textContent = driverText;
      if (driverLicEl) driverLicEl.innerHTML = `License: <strong>N01-18-094821</strong> (Professional RC 1,2,3)`;
      if (driverDutyEl) driverDutyEl.textContent = "✓ Shift Cleared • 8.5 hrs rest period audit compliant";
    }

    if (stagedByEl) stagedByEl.innerHTML = `Staged by: <strong>${escapeHTML(r.stagedBy || "Sigmund Malacas (Operations Manager)")}</strong>`;
    if (confirmedByEl) confirmedByEl.innerHTML = `Gate Clearance: <strong>${escapeHTML(r.gatePassId || "Pending Gate Release")}</strong> &bull; ${r.confirmedBy ? escapeHTML(r.confirmedBy) : "Awaiting Admin Sign-off"}`;
    if (notesEl) notesEl.textContent = r.notes || r.stagingNotes || "Operational dispatch staged under standard protocol.";

    modal.style.display = "flex";
  }

  // Delegated event listener for all .btn-view-trip-details
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".btn-view-trip-details");
    if (target) {
      e.preventDefault();
      const bookingId = target.getAttribute("data-booking-id");
      if (bookingId) {
        openTripDetailsModal(bookingId);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", initManualDispatchModal);
document.addEventListener("DOMContentLoaded", initTripDetailsModal);
