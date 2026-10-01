/**
 * ROVER FLEET SYSTEMS - ACTIVE BOOKINGS CONTROLLER (js/active-bookings.js)
 * Form PB-005 / PB-006 / PB-017: Active Bookings & Live Dispatches Module
 * Scoped Multi-Page Architecture (MPA)
 * Fully compatible with local file:// protocol
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session Verification & RBAC (Client or Admin)
    const activeUser = ROVER_AUTH.requireRole(["Client", "Admin"]);
    if (!activeUser) return;

    // 2. Active Bookings Dataset
    // Grounded in database with fallback data matching PB-005/006/017 live missions
    const defaultActiveTrips = [
        {
            id: "RQ-1038",
            vehicle: "Toyota HiAce Commuter (1 Unit)",
            vehicleTag: "RV-VAN-112 • High Roof",
            driver: "Eduardo Santos",
            driverTag: "ID: RVR-FLT-0382 • Tier-1 Clear",
            corridor: "Port of Manila → SBMA Terminal 1",
            corridorSub: "Via NLEX & SCTEX Corridor",
            schedule: "Oct 28, 2026 • 07:30 – 13:30 PHT",
            status: "In Transit (Live)",
            category: "in-transit",
            passengers: 12,
            actionType: "track"
        },
        {
            id: "RQ-1039",
            vehicle: "2x Mitsubishi L300 FB (Utility Shuttle)",
            vehicleTag: "RV-L30-301, RV-L30-302",
            driver: "Vic Sotto, Joey de Leon",
            driverTag: "ID: RVR-FLT-0530, 0555",
            corridor: "BGC Corporate → Bulacan Airport Site",
            corridorSub: "Via Skyway Stage 3 Corridor",
            schedule: "Oct 28, 2026 • 09:30 – 16:00 PHT",
            status: "In Transit (Live)",
            category: "in-transit",
            passengers: 8,
            actionType: "track"
        },
        {
            id: "RQ-8821",
            vehicle: "Nissan NV350 Urvan (3 Units)",
            vehicleTag: "RV-URV-101, RV-URV-102, RV-URV-103",
            driver: "Marco Polo & Standby Crew",
            driverTag: "ID: RVR-FLT-0211 • Staged Hub Bay 4",
            corridor: "Ortigas Center → BGC Corporate Center",
            corridorSub: "C5 Logistics Corridor Shift Shuttle",
            schedule: "Oct 01, 2026 • 17:30 – 02:00 PHT",
            status: "Confirmed & Staged",
            category: "staged",
            passengers: 26,
            actionType: "manifest"
        },
        {
            id: "RQ-1042",
            vehicle: "Toyota HiAce Commuter (1 Unit)",
            vehicleTag: "RV-VAN-104 (PB-008 Overlap Blocked)",
            driver: "Marco Polo",
            driverTag: "ID: RVR-FLT-0211 • Manila Hub",
            corridor: "Makati CBD → Clark Logistics Hub",
            corridorSub: "NLEX Express Corridor",
            schedule: "Oct 28, 2026 • 08:00 – 18:00 PHT",
            status: "Boarding Call Staged",
            category: "staged",
            passengers: 14,
            actionType: "manifest"
        }
    ];

    let currentFilter = "all";
    const tbody = document.getElementById("activeBookingsTableBody");
    const searchInput = document.getElementById("activeBookingsSearchInput");
    const paginationInfo = document.getElementById("activePaginationInfo");

    // 3. Render Data Table
    function renderActiveTable() {
        if (!tbody) return;

        // Check if database has updated state for RQ-1042 or RQ-1038
        const db = ROVER_DB.get();
        const reservations = db.reservations || [];

        const tripData = defaultActiveTrips.map(trip => {
            const normalizedId = trip.id.startsWith("#") ? trip.id : "#" + trip.id;
            const match = reservations.find(r => r.id === trip.id || r.id === normalizedId);
            if (match) {
                if (match.status === "Cancelled") {
                    return null; // Don't show cancelled trips in active dispatches
                }
                if (match.assignedVehicle) {
                    trip.vehicleTag = `${match.assignedVehicle} • Clear Buffer`;
                }
                if (match.assignedDriver) {
                    trip.driver = match.assignedDriver;
                }
            }
            return trip;
        }).filter(Boolean);

        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const filtered = tripData.filter(item => {
            const matchesQuery = !query ||
                item.id.toLowerCase().includes(query) ||
                item.vehicle.toLowerCase().includes(query) ||
                item.driver.toLowerCase().includes(query) ||
                item.corridor.toLowerCase().includes(query) ||
                item.status.toLowerCase().includes(query);

            if (!matchesQuery) return false;

            if (currentFilter === "all") return true;
            if (currentFilter === "in-transit") return item.category === "in-transit";
            if (currentFilter === "staged") return item.category === "staged";

            return true;
        });

        tbody.innerHTML = "";

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #78909C; padding: 2.5rem;">
                        No active fleet manifests match the current filter or search criteria.
                    </td>
                </tr>
            `;
            if (paginationInfo) paginationInfo.innerText = "Showing 0 of 0 active trips";
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement("tr");

            const isInTransit = item.status.includes("In Transit");
            const isStaged = item.status.includes("Confirmed & Staged");

            const statusPill = isInTransit ?
                `<span class="status-pill pill-in-transit"><span class="pulse-dot"></span> In Transit (Live)</span>` :
                isStaged ?
                `<span class="status-pill pill-staged">&#10004; Confirmed &amp; Staged</span>` :
                `<span class="status-pill pill-boarding">&#9201; Boarding Call Staged</span>`;

            const actionLink = item.actionType === "track" ?
                `<a href="reservation-details.html?id=${escapeHTML(item.id)}" class="btn-table-action">
                    Track Trip &rarr;
                </a>` :
                `<a href="reservation-details.html?id=${escapeHTML(item.id)}" class="btn-table-action">
                    View Manifest &rarr;
                </a>`;

            tr.innerHTML = `
                <td>
                    <a href="reservation-details.html?id=${escapeHTML(item.id)}" style="font-weight: 700; color: #1565C0; text-decoration: none;">
                        #${escapeHTML(item.id)}
                    </a>
                </td>
                <td>
                    <div style="font-weight: 600; color: #212121;">${escapeHTML(item.vehicle)}</div>
                    <div style="font-size: 11px; color: #757575;">${escapeHTML(item.vehicleTag)}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: #212121;">${escapeHTML(item.driver)}</div>
                    <div style="font-size: 11px; color: #757575;">${escapeHTML(item.driverTag)}</div>
                </td>
                <td>
                    <div style="font-weight: 500; color: #212121;">${escapeHTML(item.corridor)}</div>
                    <div style="font-size: 11px; color: #757575;">${escapeHTML(item.corridorSub)}</div>
                </td>
                <td>
                    <div style="font-size: 12.5px; color: #37474F; font-weight: 600;">${escapeHTML(item.schedule)}</div>
                </td>
                <td>
                    ${statusPill}
                </td>
                <td>
                    ${actionLink}
                </td>
            `;

            tbody.appendChild(tr);
        });

        if (paginationInfo) {
            paginationInfo.innerText = `Showing 1 to ${filtered.length} of ${filtered.length} active trips`;
        }

        // Update Header Manifest badge count
        const countBadge = document.getElementById("headerManifestBadge");
        if (countBadge) {
            countBadge.innerText = `● ${filtered.length} Active Manifest${filtered.length === 1 ? '' : 's'}`;
        }
    }

    // 4. Tab Filters
    const tabAll = document.getElementById("tabAllActive");
    const tabTransit = document.getElementById("tabInTransit");
    const tabStaged = document.getElementById("tabStaged");

    function setActiveTab(activeBtn, filter) {
        [tabAll, tabTransit, tabStaged].forEach(btn => {
            if (btn) btn.classList.remove("active");
        });
        if (activeBtn) activeBtn.classList.add("active");
        currentFilter = filter;
        renderActiveTable();
    }

    if (tabAll) tabAll.addEventListener("click", () => setActiveTab(tabAll, "all"));
    if (tabTransit) tabTransit.addEventListener("click", () => setActiveTab(tabTransit, "in-transit"));
    if (tabStaged) tabStaged.addEventListener("click", () => setActiveTab(tabStaged, "staged"));

    // 5. Search Filter
    if (searchInput) {
        searchInput.addEventListener("input", renderActiveTable);
    }

    // 6. Refresh Telemetry Simulation
    const refreshBtn = document.getElementById("refreshTelemetryBtn");
    const refreshIcon = document.getElementById("refreshIconSvg");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            if (refreshIcon) {
                refreshIcon.style.transition = "transform 0.8s ease-in-out";
                refreshIcon.style.transform = "rotate(360deg)";
                setTimeout(() => {
                    refreshIcon.style.transition = "none";
                    refreshIcon.style.transform = "rotate(0deg)";
                }, 800);
            }

            // Simulate micro-position shift on the progress bar
            const progressBar = document.getElementById("telemetryProgressBar");
            const markerCurrent = document.getElementById("telemetryMarkerCurrent");
            const speedPill = document.getElementById("telemetrySpeedPill");

            if (progressBar && markerCurrent && speedPill) {
                const randomPct = 58 + Math.floor(Math.random() * 5);
                const randomSpeed = 82 + Math.floor(Math.random() * 6);
                progressBar.style.width = `${randomPct}%`;
                markerCurrent.style.left = `${randomPct}%`;
                speedPill.style.left = `${randomPct}%`;
                speedPill.innerHTML = `Current &bull; ${randomSpeed} km/h at NLEX Bocaue Toll Plaza`;
            }

            renderActiveTable();
        });
    }

    // 7. Call Driver Staging Desk Interaction
    const callDeskBtn = document.getElementById("callDriverDeskBtn");
    if (callDeskBtn) {
        callDeskBtn.addEventListener("click", () => {
            alert(
                "ROVER ENTERPRISE STAGING DESK\n\n" +
                "Connecting to Manila Hub Staging Desk for Unit RV-VAN-112.\n" +
                "Duty Driver: Eduardo Santos (Clearance: Tier-1 Verified)\n" +
                "Direct Dispatch Link: +63 2 8888 7683 (Bay 4 Staging)"
            );
        });
    }

    // Initial render
    renderActiveTable();
});
