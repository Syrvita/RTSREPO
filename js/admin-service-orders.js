/**
 * ROVER FLEET SYSTEMS - EXECUTIVE DISPATCH CONFIRMATION CONTROLLER (js/admin-service-orders.js)
 * Form PB-017 / Admin Service Orders Module
 * Scoped Multi-Page Architecture (MPA)
 * Fully compatible with local file:// protocol
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Admin only)
    const currentUser = window.ROVER_AUTH ? ROVER_AUTH.requireRole("Admin") : null;
    if (window.ROVER_AUTH && !currentUser) return;

    // DOM Elements - Modals
    const gatePassModal = document.getElementById("gatePassModal");
    const closeGatePassModalBtn = document.getElementById("closeGatePassModalBtn");
    const rejectGatePassBtn = document.getElementById("rejectGatePassBtn");
    const confirmGatePassBtn = document.getElementById("confirmGatePassBtn");

    const adminManualDispatchModal = document.getElementById("adminManualDispatchModal");
    const openAdminManualDispatchBtn = document.getElementById("openAdminManualDispatchBtn");
    const closeAdminManualModalBtn = document.getElementById("closeAdminManualModalBtn");
    const cancelAdminManualBtn = document.getElementById("cancelAdminManualBtn");
    const submitAdminManualBtn = document.getElementById("submitAdminManualBtn");
    const adminManualDispatchForm = document.getElementById("adminManualDispatchForm");

    // Modal Form Elements
    const adminTargetBooking = document.getElementById("adminTargetBooking");
    const adminSummaryClient = document.getElementById("adminSummaryClient");
    const adminSummaryRoute = document.getElementById("adminSummaryRoute");
    const adminSummaryPax = document.getElementById("adminSummaryPax");
    const adminVehicleSelect = document.getElementById("adminVehicleSelect");
    const adminDriverSelect = document.getElementById("adminDriverSelect");
    const adminInstantGateRelease = document.getElementById("adminInstantGateRelease");
    const adminDispatchNotes = document.getElementById("adminDispatchNotes");

    // Table & Metrics
    const tableBody = document.getElementById("adminDispatchTableBody");
    const searchInput = document.getElementById("adminOrderSearchInput");
    const filterAllBtn = document.getElementById("adminFilterAllBtn");
    const filterStagedBtn = document.getElementById("adminFilterStagedBtn");
    const filterDispatchedBtn = document.getElementById("adminFilterDispatchedBtn");
    const filterOverrideBtn = document.getElementById("adminFilterOverrideBtn");
    const metricAwaitingGate = document.getElementById("metricAwaitingGate");
    const metricConfirmedDispatched = document.getElementById("metricConfirmedDispatched");

    let currentFilter = "all";
    let activeGatePassTargetId = "RQ-8821";

    // 2. Gate Pass Modal Routines
    function openGatePassModal(bookingId) {
        if (!gatePassModal) return;
        activeGatePassTargetId = (bookingId || "").replace(/^#/, "");

        const db = ROVER_DB.get();
        const res = (db.reservations || []).find(r => (r.id || "").replace(/^#/, "") === activeGatePassTargetId);

        // Populate Modal Fields
        const idSpan = document.getElementById("gatePassBookingId");
        if (idSpan) idSpan.textContent = `#${activeGatePassTargetId}`;

        const genPassId = document.getElementById("generatedGatePassId");
        const cleanNum = activeGatePassTargetId.replace(/^RQ-/, "");
        const gatePassNum = res && res.gatePassId ? res.gatePassId : `GP-2026-${cleanNum}`;
        if (genPassId) genPassId.textContent = gatePassNum;

        // Vehicle & Driver info
        const vehicleEl = document.getElementById("gatePassVehicleModel");
        const plateEl = document.getElementById("gatePassPlate");
        const driverEl = document.getElementById("gatePassDriverName");
        const licEl = document.getElementById("gatePassDriverLic");

        const isMultiGate = (res && res.units > 1) || (res && res.assignedVehicles && res.assignedVehicles.length > 1) || (res && res.assignedVehicle && res.assignedVehicle.includes(","));
        if (isMultiGate) {
            const vList = res.assignedVehicles ? res.assignedVehicles.map(v => v.vehicleName).join(", ") : (res.vehicleAssigned || "Multi-Unit Fleet");
            const pList = res.assignedVehicles ? res.assignedVehicles.map(v => v.plate || v.unitId).join(", ") : (res.assignedVehicle || "Multi-Unit");
            if (vehicleEl) vehicleEl.textContent = `${res.units || 2}x Convoy Units: ${vList}`;
            if (plateEl) plateEl.textContent = pList;

            const dList = res.assignedVehicles ? res.assignedVehicles.map(v => v.driverName).join(", ") : (res.driverAssigned || res.assignedDriver || "Assigned Pilots");
            const lList = res.assignedVehicles ? res.assignedVehicles.map(v => v.driverLic || "Cleared").join(", ") : "Multi-Pilot Cleared";
            if (driverEl) driverEl.textContent = dList;
            if (licEl) licEl.textContent = lList;
        } else if (res && res.vehicleAssigned) {
            if (vehicleEl) vehicleEl.textContent = res.vehicleAssigned.split("(")[0].trim() || "Toyota HiAce Commuter Deluxe";
            if (plateEl) {
                const match = res.vehicleAssigned.match(/\(([^)]+)\)/);
                plateEl.textContent = match ? match[1] : "NCL-8821";
            }
            if (res.driverAssigned) {
                if (driverEl) driverEl.textContent = res.driverAssigned.split("(")[0].trim() || "Danilo Ramos";
                if (licEl) {
                    const match = res.driverAssigned.match(/Lic:\s*([A-Za-z0-9-]+)/);
                    licEl.textContent = match ? match[1] : "N01-18-094821";
                }
            }
        } else if (activeGatePassTargetId === "RQ-8819") {
            if (vehicleEl) vehicleEl.textContent = "Nissan NV350 Urvan Standard";
            if (plateEl) plateEl.textContent = "NCR-9012";
            if (driverEl) driverEl.textContent = "Rogelio D. Santos";
            if (licEl) licEl.textContent = "N02-14-382910";
        } else if (activeGatePassTargetId === "RQ-1038") {
            if (vehicleEl) vehicleEl.textContent = "Toyota HiAce Commuter (RV-VAN-104)";
            if (plateEl) plateEl.textContent = "NCQ-5104";
            if (driverEl) driverEl.textContent = "Eduardo Santos";
            if (licEl) licEl.textContent = "N01-18-028471";
        } else {
            if (vehicleEl) vehicleEl.textContent = "Toyota HiAce Commuter Deluxe";
            if (plateEl) plateEl.textContent = "NCL-8821";
            if (driverEl) driverEl.textContent = "Danilo Ramos";
            if (licEl) licEl.textContent = "N01-18-094821";
        }

        // Directives
        const directivesEl = document.getElementById("gatePassDirectives");
        if (directivesEl) {
            directivesEl.value = (res && (res.directives || res.notes))
                ? `Authorized for express transit. Gate clearance validated by System Administrator. Corridor instructions: ${res.directives || res.notes}`
                : "Authorized for express transit. Gate clearance validated by System Administrator. RFID expedited lane clear.";
        }

        // Adaptive Title & Controls
        const isAlreadyReleased = (res && (res.status === "Confirmed & Dispatched" || res.status === "In Transit (Live)" || res.status === "Dispatched" || !!res.gatePassId)) || activeGatePassTargetId === "RQ-1038";
        const headingTextEl = document.getElementById("gatePassModalHeadingText");
        const subtitleEl = document.getElementById("gatePassModalSubtitle");
        const statusPillEl = document.getElementById("gatePassModalStatusPill");

        if (isAlreadyReleased) {
            if (headingTextEl) headingTextEl.textContent = "Official Released Gate Pass:";
            if (subtitleEl) subtitleEl.textContent = "Official enterprise departure clearance validated and active on LTFRB/tollway corridors.";
            if (statusPillEl) {
                statusPillEl.textContent = `✓ ACTIVE GATE PASS (${gatePassNum})`;
                statusPillEl.style.background = "#E8F5E9";
                statusPillEl.style.color = "#2E7D32";
                statusPillEl.style.borderColor = "#C8E6C9";
            }
            if (confirmGatePassBtn) {
                confirmGatePassBtn.innerHTML = "🖨️ Print Official Gate Pass";
                confirmGatePassBtn.dataset.mode = "print";
            }
            if (rejectGatePassBtn) {
                rejectGatePassBtn.textContent = "Revoke Gate Pass";
            }
        } else {
            if (headingTextEl) headingTextEl.textContent = "Executive Gate Pass Authorization:";
            if (subtitleEl) subtitleEl.textContent = "Inspect staging compliance and authorize official fleet departure gate release.";
            if (statusPillEl) {
                statusPillEl.textContent = "AWAITING GATE CLEARANCE";
                statusPillEl.style.background = "#FFF8E1";
                statusPillEl.style.color = "#E65100";
                statusPillEl.style.borderColor = "#FFE082";
            }
            if (confirmGatePassBtn) {
                confirmGatePassBtn.innerHTML = "Authorize Gate Pass &amp; Release Shuttle &rarr;";
                confirmGatePassBtn.dataset.mode = "authorize";
            }
            if (rejectGatePassBtn) {
                rejectGatePassBtn.textContent = "Revoke / Send Back to Operations";
            }
        }

        gatePassModal.style.display = "flex";
    }

    function closeGatePassModal() {
        if (gatePassModal) gatePassModal.style.display = "none";
    }

    if (closeGatePassModalBtn) {
        closeGatePassModalBtn.addEventListener("click", closeGatePassModal);
    }

    if (gatePassModal) {
        gatePassModal.addEventListener("click", (e) => {
            if (e.target === gatePassModal) closeGatePassModal();
        });
    }

    if (rejectGatePassBtn) {
        rejectGatePassBtn.addEventListener("click", () => {
            const db = ROVER_DB.get();
            const res = (db.reservations || []).find(r => (r.id || "").replace(/^#/, "") === activeGatePassTargetId);
            if (res) {
                res.status = "Pending Assignment / Conflict Block";
                res.auditStatus = "Revoked by Admin";
                ROVER_DB.save(db);
            }
            closeGatePassModal();
            alert(`Staging for #${activeGatePassTargetId} revoked and sent back to Operations Manager for reassignment.`);
            refreshTableRowState(activeGatePassTargetId, "revoked");
            updateMetrics();
        });
    }

    if (confirmGatePassBtn) {
        confirmGatePassBtn.addEventListener("click", () => {
            if (confirmGatePassBtn.dataset.mode === "print") {
                window.print();
                return;
            }

            const exitPoint = document.getElementById("gatePassExitPoint")?.value || "Skyway Stage 3 Buendia Ramp";
            const directives = document.getElementById("gatePassDirectives")?.value || "Authorized for express transit. Gate clearance validated by System Administrator.";
            const cleanNum = activeGatePassTargetId.replace(/^RQ-/, "");
            const gatePassId = `GP-2026-${cleanNum}`;

            // 1. Mutate ROVER_DB in localStorage
            const db = ROVER_DB.get();
            if (!db.reservations) db.reservations = [];
            let res = db.reservations.find(r => (r.id || "").replace(/^#/, "") === activeGatePassTargetId);

            if (res) {
                res.status = "Confirmed & Dispatched";
                res.auditStatus = "Confirmed & Dispatched";
                res.gatePassId = gatePassId;
                res.exitPoint = exitPoint;
                res.directives = directives;
                res.confirmedBy = "Admin • Ops Manila";
                res.confirmedAt = new Date().toISOString();
            } else {
                // If not yet in reservations DB, insert complete record
                const row = document.getElementById(`row-${activeGatePassTargetId}`);
                const clientName = row ? row.cells[1]?.querySelector("div")?.textContent?.trim() : "Corporate Client";
                const routeName = row ? row.cells[3]?.textContent?.trim() : "Metro Manila Corridor";
                const scheduleTime = row ? row.cells[4]?.textContent?.trim() : "Immediate Dispatch";

                res = {
                    id: activeGatePassTargetId,
                    client: clientName || "Apex Logistics Global Inc.",
                    route: routeName || "Metro Manila Hub → BGC Corporate Center",
                    pickupWindow: scheduleTime || "Immediate Departure",
                    schedule: scheduleTime,
                    vehicleAssigned: "Toyota HiAce Commuter Deluxe (NCL-8821)",
                    driverAssigned: "Danilo Ramos (Lic: N01-18-094821)",
                    status: "Confirmed & Dispatched",
                    auditStatus: "Confirmed & Dispatched",
                    gatePassId: gatePassId,
                    exitPoint: exitPoint,
                    directives: directives,
                    confirmedBy: "Admin • Ops Manila",
                    confirmedAt: new Date().toISOString()
                };
                db.reservations.unshift(res);
            }

            // Update assigned fleet vehicle status
            if (db.fleet) {
                const assignedUnitId = res.assignedVehicle || "RV-VAN-112";
                const v = db.fleet.find(unit => unit.id === assignedUnitId || (res.vehicleAssigned && res.vehicleAssigned.includes(unit.plate)));
                if (v) {
                    v.status = "Dispatched / Active Trip";
                    v.currentTrip = `#${activeGatePassTargetId}`;
                }
            }

            ROVER_DB.save(db);

            // 2. Update Table Row in DOM
            refreshTableRowState(activeGatePassTargetId, "confirmed", gatePassId);

            // 3. Update Metrics
            updateMetrics();

            // 4. Close Modal & Alert
            closeGatePassModal();
            alert(`Official Gate Pass ${gatePassId} authorized and issued. Asset dispatched under executive clearance.`);
        });
    }

    // 3. Executive Manual Dispatch Modal Routines
    function openAdminManualModal() {
        if (!adminManualDispatchModal) return;
        adminManualDispatchModal.style.display = "flex";
    }

    function closeAdminManualModal() {
        if (!adminManualDispatchModal) return;
        adminManualDispatchModal.style.display = "none";
    }

    const btnAddAdminVehicleRow = document.getElementById("btnAddAdminVehicleRow");
    const adminVehiclesContainer = document.getElementById("adminVehiclesContainer");
    const adminVehicleCountBadge = document.getElementById("adminVehicleCountBadge");

    function updateAdminVehicleRowIndices() {
        if (!adminVehiclesContainer) return;
        const rows = adminVehiclesContainer.querySelectorAll(".admin-vehicle-row");
        const count = rows.length;

        rows.forEach((row, index) => {
            const idx = index + 1;
            row.dataset.rowIndex = idx;

            const numBadge = row.querySelector(".vehicle-row-number");
            if (numBadge) numBadge.textContent = idx;

            const titleEl = row.querySelector(".vehicle-row-title");
            if (titleEl) {
                titleEl.textContent = idx === 1 ? "Primary Fleet Unit & Shift Pilot" : `Convoy Unit #${idx} & Shift Pilot`;
            }

            const removeBtn = row.querySelector(".btn-remove-admin-vehicle");
            if (removeBtn) {
                removeBtn.style.display = count > 1 ? "inline-block" : "none";
            }
        });

        if (adminVehicleCountBadge) {
            adminVehicleCountBadge.textContent = count === 1 
                ? "1 Vehicle Assigned" 
                : `${count} Vehicles Assigned (Convoy)`;
        }
    }

    function createAdminVehicleRow(index) {
        const row = document.createElement("div");
        row.className = "admin-vehicle-row";
        row.dataset.rowIndex = index;
        row.style.cssText = "background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 14px; position: relative;";

        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span class="vehicle-row-label" style="font-size: 11px; font-weight: 700; color: #374151; display: inline-flex; align-items: center; gap: 6px;">
                    <span class="vehicle-row-number" style="width: 18px; height: 18px; border-radius: 50%; background: #D32F2F; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${index}</span>
                    <span class="vehicle-row-title">Convoy Unit #${index} &amp; Shift Pilot</span>
                </span>
                <button type="button" class="btn-remove-admin-vehicle" style="background: none; border: none; color: #EF4444; font-size: 11px; font-weight: 600; cursor: pointer; padding: 2px 6px;">✕ Remove Unit</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                    <label style="display: block; font-size: 10px; font-weight: 700; color: #4B5563; margin-bottom: 5px; text-transform: uppercase;">Direct Philippine Fleet Asset Allocation *</label>
                    <select class="admin-vehicle-select" required style="width: 100%; padding: 9px 11px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; background: #FFFFFF; color: #111827;">
                        <option value="">Select available van unit...</option>
                        <option value="RV-URV-108" data-name="Nissan NV350 Urvan Standard" data-plate="NCR-9012">Nissan NV350 Urvan Standard (NCR-9012 • 15 Seats • Ready)</option>
                        <option value="RV-VAN-112" data-name="Toyota HiAce Commuter Deluxe" data-plate="NCL-8821">Toyota HiAce Commuter Deluxe (NCL-8821 • 14 Seats • Ready)</option>
                        <option value="RV-STR-204" data-name="Hyundai Grand Starex Executive" data-plate="NDB-4321">Hyundai Grand Starex Executive (NDB-4321 • 10 Seats • Ready)</option>
                        <option value="RV-L30-005" data-name="Mitsubishi L300 FB Shuttle" data-plate="NAA-7741">Mitsubishi L300 FB Shuttle (NAA-7741 • 16 Seats • Ready)</option>
                        <option value="RV-TRV-012" data-name="Isuzu Traviz Utility Shuttle" data-plate="NBE-3019">Isuzu Traviz Utility Shuttle (NBE-3019 • 16 Seats • Ready)</option>
                    </select>
                    <div style="font-size: 10px; color: #6B7280; margin-top: 3px;">Verified RFID tollway pass &amp; comprehensive insurance active.</div>
                </div>
                <div>
                    <label style="display: block; font-size: 10px; font-weight: 700; color: #4B5563; margin-bottom: 5px; text-transform: uppercase;">Assign Rostered Duty Pilot *</label>
                    <select class="admin-driver-select" required style="width: 100%; padding: 9px 11px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; background: #FFFFFF; color: #111827;">
                        <option value="">Select rostered duty driver...</option>
                        <option value="DRV-007" data-name="Rogelio D. Santos" data-lic="N02-14-382910">Rogelio D. Santos (Lic: N02-14-382910 • Manila Standby)</option>
                        <option value="DRV-003" data-name="Danilo Ramos" data-lic="N01-18-094821">Danilo Ramos (Lic: N01-18-094821 • Shift Cleared)</option>
                        <option value="DRV-011" data-name="Arnel M. Bautista" data-lic="N03-19-102948">Arnel M. Bautista (Lic: N03-19-102948 • Shift Cleared)</option>
                        <option value="DRV-014" data-name="Ferdinand Cruz" data-lic="N01-16-994820">Ferdinand Cruz (Lic: N01-16-994820 • Ready)</option>
                    </select>
                    <div style="font-size: 10px; color: #6B7280; margin-top: 3px;">Rest period cleared under DOLE/LTFRB regulations.</div>
                </div>
            </div>
        `;

        return row;
    }

    if (btnAddAdminVehicleRow && adminVehiclesContainer) {
        btnAddAdminVehicleRow.addEventListener("click", () => {
            const currentRows = adminVehiclesContainer.querySelectorAll(".admin-vehicle-row");
            const nextIndex = currentRows.length + 1;
            const newRow = createAdminVehicleRow(nextIndex);
            adminVehiclesContainer.appendChild(newRow);
            updateAdminVehicleRowIndices();
        });

        adminVehiclesContainer.addEventListener("click", (e) => {
            const removeBtn = e.target.closest(".btn-remove-admin-vehicle");
            if (removeBtn) {
                const row = removeBtn.closest(".admin-vehicle-row");
                if (row) {
                    row.remove();
                    updateAdminVehicleRowIndices();
                }
            }
        });
    }

    if (openAdminManualDispatchBtn) {
        openAdminManualDispatchBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAdminManualModal();
        });
    }

    if (closeAdminManualModalBtn) {
        closeAdminManualModalBtn.addEventListener("click", closeAdminManualModal);
    }

    if (cancelAdminManualBtn) {
        cancelAdminManualBtn.addEventListener("click", closeAdminManualModal);
    }

    if (adminManualDispatchModal) {
        adminManualDispatchModal.addEventListener("click", (e) => {
            if (e.target === adminManualDispatchModal) closeAdminManualModal();
        });
    }

    if (adminTargetBooking) {
        adminTargetBooking.addEventListener("change", function() {
            const opt = this.options[this.selectedIndex];
            if (!this.value) {
                if (adminSummaryClient) adminSummaryClient.textContent = "—";
                if (adminSummaryRoute) adminSummaryRoute.textContent = "Select a booking above";
                if (adminSummaryPax) adminSummaryPax.textContent = "—";
                return;
            }

            const client = opt.getAttribute("data-client") || "—";
            const route = opt.getAttribute("data-route") || "Express Corridor";
            const pax = opt.getAttribute("data-pax") || "—";

            if (adminSummaryClient) adminSummaryClient.textContent = client;
            if (adminSummaryRoute) adminSummaryRoute.textContent = route;
            if (adminSummaryPax) adminSummaryPax.textContent = `${pax} Passengers`;
        });
    }

    if (submitAdminManualBtn) {
        submitAdminManualBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const targetVal = adminTargetBooking ? adminTargetBooking.value : "";
            if (!targetVal) {
                alert("Validation Error: Please select a target booking.");
                return;
            }

            // Extract all allocated vehicle + pilot rows
            const vehicleRows = adminManualDispatchModal.querySelectorAll(".admin-vehicle-row");
            const allocations = [];
            let hasValidationError = false;

            vehicleRows.forEach((row, idx) => {
                const vSelect = row.querySelector(".admin-vehicle-select");
                const dSelect = row.querySelector(".admin-driver-select");
                const vVal = vSelect ? vSelect.value : "";
                const dVal = dSelect ? dSelect.value : "";

                if (!vVal || !dVal) {
                    hasValidationError = true;
                    return;
                }

                const optV = vSelect.options[vSelect.selectedIndex];
                const optD = dSelect.options[dSelect.selectedIndex];

                const vName = optV.getAttribute("data-name") || optV.text.split("(")[0].trim();
                const vPlate = optV.getAttribute("data-plate") || (optV.text.match(/\(([A-Z]{3}-\d{4})/)?.[1] || "NCL-8821");
                const dName = optD.getAttribute("data-name") || optD.text.split("(")[0].trim();
                const dLic = optD.getAttribute("data-lic") || (optD.text.match(/Lic:\s*([A-Za-z0-9-]+)/)?.[1] || "N01-18-094821");

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
                alert("Validation Error: Please ensure every allocated vehicle slot has an assigned vehicle asset and rostered pilot.");
                return;
            }

            // Check duplicate vehicles
            const assignedUnits = allocations.map(a => a.unitId);
            const duplicateUnit = assignedUnits.find((u, i) => assignedUnits.indexOf(u) !== i);
            if (duplicateUnit) {
                alert(`Allocation Conflict: Fleet asset [${duplicateUnit}] is assigned multiple times in this dispatch. Please select distinct vehicles.`);
                return;
            }

            const optBooking = adminTargetBooking.options[adminTargetBooking.selectedIndex];
            const clientName = optBooking.getAttribute("data-client") || "Executive Corporate Delegation";
            const routeName = optBooking.getAttribute("data-route") || "Express Diplomatic / Corporate Corridor";
            const pickupWindow = optBooking.getAttribute("data-time") || "Oct 30, 2026 • Immediate Direct Release";
            const paxCount = optBooking.getAttribute("data-pax") || "14";

            const isMulti = allocations.length > 1;
            const primaryAlloc = allocations[0];
            const assignedVehicleStr = allocations.map(a => a.unitId).join(", ");
            const vehicleAssignedStr = isMulti
                ? `${allocations.length}x Fleet Assets: ` + allocations.map(a => `${a.vehicleName} (${a.plate})`).join(" + ")
                : `${primaryAlloc.vehicleName} (${primaryAlloc.plate})`;

            const driverAssignedStr = isMulti
                ? allocations.map(a => `${a.driverName} (Lic: ${a.driverLic})`).join(", ")
                : `${primaryAlloc.driverName} (Lic: ${primaryAlloc.driverLic})`;
            const assignedDriverStr = allocations.map(a => a.driverName).join(", ");

            const isInstantGate = adminInstantGateRelease ? adminInstantGateRelease.checked : true;
            const directivesNotes = adminDispatchNotes ? adminDispatchNotes.value : "Direct executive clearance granted. Proceed immediately via Skyway Stage 3 / NLEX corridor.";

            const cleanId = targetVal === "ADHOC-OVERRIDE" 
                ? "RQ-" + Math.floor(1000 + Math.random() * 9000) 
                : targetVal.replace(/^#/, "");

            const cleanNum = cleanId.replace(/^RQ-/, "");
            const gatePassId = `GP-2026-${cleanNum}`;

            // Mutate Database
            const db = ROVER_DB.get();
            if (!db.reservations) db.reservations = [];

            const existingIdx = db.reservations.findIndex(r => (r.id || "").replace(/^#/, "") === cleanId);
            const newRecord = {
                id: cleanId,
                client: clientName,
                route: routeName,
                pickupWindow: pickupWindow,
                schedule: pickupWindow,
                vehicleAssigned: vehicleAssignedStr,
                assignedVehicle: assignedVehicleStr,
                vehicleType: primaryAlloc.vehicleName,
                driverAssigned: driverAssignedStr,
                assignedDriver: assignedDriverStr,
                units: allocations.length,
                assignedVehicles: allocations,
                status: isInstantGate ? "Confirmed & Dispatched" : "Staged (Pending Admin Approval)",
                auditStatus: isInstantGate ? "Confirmed & Dispatched" : "Staged",
                gatePassId: isInstantGate ? gatePassId : null,
                dispatchType: "Executive Override",
                confirmedBy: isInstantGate ? "Admin • Ops Manila" : null,
                confirmedAt: isInstantGate ? new Date().toISOString() : null,
                notes: directivesNotes,
                pax: paxCount
            };

            if (existingIdx >= 0) {
                db.reservations[existingIdx] = Object.assign({}, db.reservations[existingIdx], newRecord);
            } else {
                db.reservations.unshift(newRecord);
            }

            // Update all vehicle status in fleet
            if (db.fleet) {
                allocations.forEach(a => {
                    const fleetUnit = db.fleet.find(u => u.id === a.unitId || u.plate === a.plate);
                    if (fleetUnit) {
                        fleetUnit.status = isInstantGate ? "Dispatched / Active Trip" : "Staged for Dispatch";
                        fleetUnit.currentTrip = `#${cleanId}`;
                    }
                });
            }

            ROVER_DB.save(db);

            // Prepend new row in DOM
            prependAdminTableRow(newRecord);

            // Update Metrics
            updateMetrics();

            // Close Modal & Reset
            closeAdminManualModal();
            if (adminManualDispatchForm) adminManualDispatchForm.reset();
            if (adminSummaryClient) adminSummaryClient.textContent = "—";
            if (adminSummaryRoute) adminSummaryRoute.textContent = "Select a booking above";
            if (adminSummaryPax) adminSummaryPax.textContent = "—";

            const unitText = isMulti ? `${allocations.length} vehicles` : "1 vehicle";
            alert(`Executive Direct Dispatch executed for #${cleanId} (${unitText}). Official Gate Pass ${gatePassId} issued.`);
        });
    }

    // 4. DOM Update Helpers
    function refreshTableRowState(bookingId, newState, gatePassId = "") {
        const row = document.getElementById(`row-${bookingId}`);
        if (!row) return;

        if (newState === "confirmed") {
            row.dataset.status = "dispatched";
            const passNum = gatePassId || `GP-2026-${bookingId.replace(/^RQ-/, "")}`;
            
            // Staging status cell (column 6)
            if (row.cells[5]) {
                row.cells[5].innerHTML = `
                    <span class="pill-audit pill-confirmed" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #A5D6A7; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        <span class="dot-dispatched" style="width: 6px; height: 6px; border-radius: 50%; background: #2E7D32; display: inline-block;"></span> &#10004; Confirmed &amp; Released (${escapeHTML(passNum)})
                    </span>
                `;
            }

            // Actions cell (column 7)
            if (row.cells[6]) {
                row.cells[6].innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <a href="javascript:void(0)" class="action-link btn-view-gate-pass" data-id="${escapeHTML(bookingId)}" style="color: #4B5563; font-weight: 600; font-size: 12px; text-decoration: none;">View Gate Pass</a>
                        <button type="button" class="btn-view-trip-details action-link" data-booking-id="${escapeHTML(bookingId)}" style="background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; color: #1565C0; font-weight: 600; font-size: 12px;">Manifest &rarr;</button>
                    </div>
                `;
                const viewBtn = row.cells[6].querySelector(".btn-view-gate-pass");
                if (viewBtn) {
                    viewBtn.addEventListener("click", () => openGatePassModal(bookingId));
                }
                const detailsBtn = row.cells[6].querySelector(".btn-view-trip-details");
                if (detailsBtn) {
                    detailsBtn.addEventListener("click", () => openTripDetailsModal(bookingId));
                }
            }
        } else if (newState === "revoked") {
            row.dataset.status = "revoked";
            if (row.cells[5]) {
                row.cells[5].innerHTML = `
                    <span class="pill-audit pill-overlap" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
                        <span style="font-size: 8px;">&#9679;</span> Staging Revoked &bull; Pending Reassignment
                    </span>
                `;
            }
            if (row.cells[6]) {
                row.cells[6].innerHTML = `
                    <span style="font-size: 12px; color: #9E9E9E; font-weight: 500;">Sent to Operations</span>
                `;
            }
        }
    }

    function prependAdminTableRow(record) {
        if (!tableBody) return;
        const cleanId = (record.id || "").replace(/^#/, "");
        const safeId = escapeHTML(cleanId);
        const safeClient = escapeHTML(record.client || "Executive Corporate Delegation");
        const safeRoute = escapeHTML(record.route || "Express Corridor");
        const safePickup = escapeHTML(record.pickupWindow || "Immediate Departure");
        const safeVehicle = escapeHTML(record.vehicleAssigned || "Toyota HiAce Commuter Deluxe");
        const safeDriver = escapeHTML(record.driverAssigned || "Danilo Ramos");
        const isDispatched = record.status === "Confirmed & Dispatched";
        const gatePassNum = record.gatePassId || `GP-2026-${cleanId.replace(/^RQ-/, "")}`;

        // Remove if already present in DOM
        const existingRow = document.getElementById(`row-${safeId}`);
        if (existingRow) existingRow.remove();

        const tr = document.createElement("tr");
        tr.id = `row-${safeId}`;
        tr.style.borderBottom = "1px solid #ECEFF1";
        tr.dataset.status = isDispatched ? "dispatched" : "staged";
        tr.dataset.override = "true";

        const statusPillHtml = isDispatched ? `
            <span class="pill-audit pill-confirmed" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #A5D6A7; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <span class="dot-dispatched" style="width: 6px; height: 6px; border-radius: 50%; background: #2E7D32; display: inline-block;"></span> &#10004; Confirmed &amp; Released (${escapeHTML(gatePassNum)})
            </span>
        ` : `
            <span class="pill-audit pill-staged" style="background: #FFF8E1; color: #E65100; border: 1px solid #FFE082; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
                <span class="dot-staged" style="width: 6px; height: 6px; border-radius: 50%; background: #E65100; display: inline-block;"></span> Staged (Pending Admin Approval)
            </span>
        `;

        const actionHtml = isDispatched ? `
            <div style="display: flex; align-items: center; gap: 10px;">
                <a href="javascript:void(0)" class="action-link btn-view-gate-pass" data-id="${safeId}" style="color: #4B5563; font-weight: 600; font-size: 12px; text-decoration: none;">View Gate Pass</a>
                <button type="button" class="btn-view-trip-details action-link" data-booking-id="${safeId}" style="background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; color: #1565C0; font-weight: 600; font-size: 12px;">Manifest &rarr;</button>
            </div>
        ` : `
            <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="btn-authorize-gate" data-id="${safeId}" style="background: #D32F2F; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.15s;">
                    Authorize &amp; Issue Gate Pass &rarr;
                </button>
                <button type="button" class="btn-view-trip-details" data-booking-id="${safeId}" style="background: none; border: 1px solid #CBD5E1; color: #475569; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
                    Details
                </button>
            </div>
        `;

        tr.innerHTML = `
            <td style="padding: 14px 20px; font-weight: 700; color: #D32F2F;"><a href="javascript:void(0)" class="btn-view-trip-details" data-booking-id="${safeId}" style="color: #D32F2F; text-decoration: none; cursor: pointer;">#${safeId}</a></td>
            <td style="padding: 14px 20px;">
                <div style="font-weight: 700; color: #111827;">${safeClient}</div>
                <div style="font-size: 11px; color: #D32F2F; font-weight: 600;">Executive Direct Override</div>
            </td>
            <td style="padding: 14px 20px;">
                <div style="font-size: 13px; font-weight: 600; color: #111827;">${safeVehicle}</div>
                <div style="font-size: 11px; color: #15803D;">Driver: ${safeDriver}</div>
            </td>
            <td style="padding: 14px 20px; font-weight: 500; color: #111827;">${safeRoute}</td>
            <td style="padding: 14px 20px; font-size: 12px; color: #475569;">${safePickup}</td>
            <td style="padding: 14px 20px;">
                ${statusPillHtml}
            </td>
            <td style="padding: 14px 20px;">
                ${actionHtml}
            </td>
        `;

        tableBody.insertBefore(tr, tableBody.firstChild);

        // Bind events
        const authBtn = tr.querySelector(".btn-authorize-gate");
        if (authBtn) {
            authBtn.addEventListener("click", () => openGatePassModal(safeId));
        }

        const viewBtn = tr.querySelector(".btn-view-gate-pass");
        if (viewBtn) {
            viewBtn.addEventListener("click", () => openGatePassModal(safeId));
        }
    }

    function updateMetrics() {
        if (!tableBody) return;
        const rows = Array.from(tableBody.querySelectorAll("tr"));
        let stagedCount = 0;
        let dispatchedCount = 0;

        rows.forEach(r => {
            const stat = r.dataset.status;
            if (stat === "staged" || r.querySelector(".pill-staged")) {
                stagedCount++;
            } else if (stat === "dispatched" || r.querySelector(".pill-confirmed")) {
                dispatchedCount++;
            }
        });

        if (metricAwaitingGate) {
            metricAwaitingGate.textContent = `${stagedCount} Staged`;
        }
        if (metricConfirmedDispatched) {
            metricConfirmedDispatched.textContent = `${dispatchedCount + 13} Shuttles`;
        }
    }

    // 5. Search and Filters
    function applyTableFilter() {
        if (!tableBody) return;
        const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const rows = tableBody.querySelectorAll("tr");

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            const matchesQuery = !q || text.includes(q);

            const isStaged = row.dataset.status === "staged" || !!row.querySelector(".pill-staged");
            const isDispatched = row.dataset.status === "dispatched" || !!row.querySelector(".pill-confirmed");
            const isOverride = row.dataset.override === "true" || text.includes("override");

            let matchesFilter = true;
            if (currentFilter === "staged") {
                matchesFilter = isStaged;
            } else if (currentFilter === "dispatched") {
                matchesFilter = isDispatched;
            } else if (currentFilter === "override") {
                matchesFilter = isOverride;
            }

            row.style.display = (matchesQuery && matchesFilter) ? "" : "none";
        });
    }

    function setActiveFilterButton(activeBtn) {
        [filterAllBtn, filterStagedBtn, filterDispatchedBtn, filterOverrideBtn].forEach(btn => {
            if (!btn) return;
            if (btn === activeBtn) {
                btn.style.background = "#111827";
                btn.style.color = "#FFFFFF";
                btn.style.borderColor = "#D1D5DB";
                btn.classList.add("active");
            } else {
                btn.style.background = "#FFFFFF";
                btn.style.color = "#475569";
                btn.style.borderColor = "#E2E8F0";
                btn.classList.remove("active");
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", applyTableFilter);
    }

    if (filterAllBtn) {
        filterAllBtn.addEventListener("click", () => {
            currentFilter = "all";
            setActiveFilterButton(filterAllBtn);
            applyTableFilter();
        });
    }

    if (filterStagedBtn) {
        filterStagedBtn.addEventListener("click", () => {
            currentFilter = "staged";
            setActiveFilterButton(filterStagedBtn);
            applyTableFilter();
        });
    }

    if (filterDispatchedBtn) {
        filterDispatchedBtn.addEventListener("click", () => {
            currentFilter = "dispatched";
            setActiveFilterButton(filterDispatchedBtn);
            applyTableFilter();
        });
    }

    if (filterOverrideBtn) {
        filterOverrideBtn.addEventListener("click", () => {
            currentFilter = "override";
            setActiveFilterButton(filterOverrideBtn);
            applyTableFilter();
        });
    }

    // 6. Bind Existing Gate Pass Buttons & Initial Hydration
    function initExistingButtons() {
        const authButtons = document.querySelectorAll(".btn-authorize-gate");
        authButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id") || "RQ-8821";
                openGatePassModal(id);
            });
        });

        const viewButtons = document.querySelectorAll(".btn-view-gate-pass");
        viewButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id") || "RQ-1038";
                openGatePassModal(id);
            });
        });
    }

    function hydrateFromDatabase() {
        try {
            const db = ROVER_DB.get();
            const reservations = db.reservations || [];

            // Check if seeded rows in HTML have updated status in DB
            reservations.forEach(r => {
                const cleanId = (r.id || "").replace(/^#/, "");
                const row = document.getElementById(`row-${cleanId}`);
                if (row) {
                    if (r.status === "Confirmed & Dispatched" || r.gatePassId) {
                        refreshTableRowState(cleanId, "confirmed", r.gatePassId);
                    } else if (r.status === "Staged (Pending Admin Approval)") {
                        row.dataset.status = "staged";
                    }
                } else if (r.status === "Confirmed & Dispatched" || r.status === "Staged (Pending Admin Approval)" || r.dispatchType === "Executive Override") {
                    // Prepend new row if staged or confirmed by override
                    prependAdminTableRow(r);
                }
            });

            updateMetrics();
        } catch (err) {
            console.warn("Could not hydrate admin dispatch table:", err);
        }
    }

    // 7. Trip Operational Details Modal Logic (#tripDetailsModal)
    const tripDetailsModal = document.getElementById("tripDetailsModal");
    const closeTripDetailsModalBtn = document.getElementById("closeTripDetailsModalBtn");
    const dismissTripDetailsModalBtn = document.getElementById("dismissTripDetailsModalBtn");
    const printTripManifestBtn = document.getElementById("printTripManifestBtn");

    function closeTripModal() {
        if (tripDetailsModal) tripDetailsModal.style.display = "none";
    }

    if (closeTripDetailsModalBtn) closeTripDetailsModalBtn.addEventListener("click", closeTripModal);
    if (dismissTripDetailsModalBtn) dismissTripDetailsModalBtn.addEventListener("click", closeTripModal);

    if (tripDetailsModal) {
        tripDetailsModal.addEventListener("click", (e) => {
            if (e.target === tripDetailsModal) closeTripModal();
        });
    }

    if (printTripManifestBtn) {
        printTripManifestBtn.addEventListener("click", () => {
            window.print();
        });
    }

    function openTripDetailsModal(bookingId) {
        if (!tripDetailsModal) return;
        const cleanId = (bookingId || "").replace(/^#/, "");
        const db = ROVER_DB.get();
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
            statusPillEl.textContent = (r.status || "CONFIRMED & DISPATCHED").toUpperCase();
        }
        if (clientEl) clientEl.textContent = r.client || "Apex Logistics Global Inc.";
        if (contactEl) contactEl.textContent = r.clientContact || "Rowena Mae Castaneda";
        if (routeEl) routeEl.textContent = r.route || (r.origin && r.destination ? `${r.origin} → ${r.destination}` : "Metro Manila Corporate Corridor");
        if (checkpointsEl) checkpointsEl.textContent = r.checkpoints || "Tollways: Skyway Stage 3 Buendia Ramp • NLEX Balintawak • Central Hub Gate";
        if (paxEl) paxEl.textContent = `${r.estimatedPax || r.pax || 14} Passengers`;
        if (vehiclePrefEl) vehiclePrefEl.textContent = `(${r.vehiclePref || r.vehicleType || "High-Roof Passenger Van"})`;
        if (scheduleEl) scheduleEl.textContent = r.schedule || r.pickupWindow || "Oct 28, 2026 • 21:00 – 02:00 PHT";
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
        const gatePassNum = r.gatePassId || `GP-2026-${cleanId.replace(/^RQ-/, "")}`;
        if (confirmedByEl) confirmedByEl.innerHTML = `Gate Clearance: <strong>${escapeHTML(gatePassNum)}</strong> &bull; ${r.confirmedBy ? escapeHTML(r.confirmedBy) : "Admin • Ops Manila"}`;
        if (notesEl) notesEl.textContent = r.directives || r.notes || r.stagingNotes || "Authorized express transit. Direct compliance verified under LTFRB standards.";

        tripDetailsModal.style.display = "flex";
    }

    // Delegated event listeners for table action buttons
    document.addEventListener("click", (e) => {
        const tripTarget = e.target.closest(".btn-view-trip-details");
        if (tripTarget) {
            e.preventDefault();
            const bookingId = tripTarget.getAttribute("data-booking-id");
            if (bookingId) {
                openTripDetailsModal(bookingId);
            }
            return;
        }

        const gateViewTarget = e.target.closest(".btn-view-gate-pass");
        if (gateViewTarget) {
            e.preventDefault();
            const bookingId = gateViewTarget.getAttribute("data-id") || gateViewTarget.getAttribute("data-booking-id");
            if (bookingId) {
                openGatePassModal(bookingId);
            }
            return;
        }

        const gateAuthTarget = e.target.closest(".btn-authorize-gate");
        if (gateAuthTarget) {
            e.preventDefault();
            const bookingId = gateAuthTarget.getAttribute("data-id") || gateAuthTarget.getAttribute("data-booking-id");
            if (bookingId) {
                openGatePassModal(bookingId);
            }
            return;
        }
    });

    initExistingButtons();
    hydrateFromDatabase();
});
