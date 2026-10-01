/**
 * ROVER FLEET SYSTEMS - DRIVER TERMINAL CONTROLLER (js/driver.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles Driver Terminal & Real-Time Mission Telemetry (driver.html)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Driver only)
    const currentUser = ROVER_AUTH.requireRole("Driver");
    if (!currentUser) return;

    // 2. Hydrate Driver Profile Name & Avatar
    const driverNameEl = document.getElementById("driverName");
    if (driverNameEl && currentUser.name) {
        driverNameEl.innerText = currentUser.name;
    }

    const driverAvatarEl = document.getElementById("driverAvatarInitials");
    if (driverAvatarEl && currentUser.name) {
        const parts = currentUser.name.split(" ");
        const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].substring(0, 2);
        driverAvatarEl.innerText = initials.toUpperCase();
    }

    // 3. Online / Offline Status Toggle
    const statusBtn = document.getElementById("driverStatusToggleBtn");
    const statusIndicator = document.getElementById("driverStatusIndicator");
    const statusText = document.getElementById("driverStatusText");

    if (statusBtn) {
        statusBtn.addEventListener("click", () => {
            if (statusBtn.classList.contains("offline")) {
                statusBtn.classList.remove("offline");
                statusBtn.innerText = "ONLINE";
                if (statusIndicator) statusIndicator.style.background = "#1976D2";
                if (statusText) statusText.innerText = "Available for Dispatch";
            } else {
                statusBtn.classList.add("offline");
                statusBtn.innerText = "OFFLINE";
                if (statusIndicator) statusIndicator.style.background = "#9E9E9E";
                if (statusText) statusText.innerText = "Driver Off-Duty / Rest";
            }
        });
    }

    // 4. Tab Navigation Interaction
    const tabs = document.querySelectorAll(".driver-nav-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            if (tab.id === "driverLogoutBtn" || tab.id === "navProfileLogout") {
                // Logout is handled via ROVER_AUTH.bindLogoutButtons
                return;
            }
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
        });
    });

    // 5. Profile Tab Logout Fallback
    const profileLogout = document.getElementById("driverLogoutBtn") || document.getElementById("navProfileLogout");
    if (profileLogout) {
        profileLogout.addEventListener("click", () => {
            const confirmLogout = confirm("Confirm log out from Driver Terminal?");
            if (confirmLogout) {
                ROVER_AUTH.logout();
            }
        });
    }
});
