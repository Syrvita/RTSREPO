/**
 * ROVER FLEET SYSTEMS - UNIFIED DATABASE & AUTHENTICATION (js/db.js)
 * Scoped Multi-Page Architecture (MPA)
 * Fully compatible with local file:// protocol
 */

const ROVER_DB_SEED = {
    users: [
        { id: "RVR-ADM-01", email: "admin@rover.ph", password: "admin", role: "Admin", name: "Admin • Ops Manila", status: "active" },
        { id: "RVR-MGT-01", email: "smalacas@rover.ph", password: "pass", role: "Manager", name: "Sigmund Malacas", status: "active" },
        { id: "RVR-FLT-0382", email: "esantos@rover.ph", password: "pass", role: "Driver", name: "Eduardo Santos", status: "active" },
        { id: "RVR-CLT-001", email: "r.castaneda@apexlogistics.ph", password: "pass", role: "Client", name: "Rowena Mae Castaneda", status: "active" }
    ],
    fleetCapacity: 31,
    reservations: [
        {
            id: "#RQ-8821",
            client: "Rowena Mae Castaneda",
            route: "Daily Commute BGC",
            schedule: "Oct 01, 2026 - Night Shift",
            vehiclePref: "3x Corporate Shuttle (14-Seater)",
            vehicleType: "Corporate Shuttle",
            status: "Pending",
            units: 3,
            pickup: "Ortigas Center, Pasig",
            destination: "BGC Corporate Center, Taguig",
            start: "17:30 PHT",
            return: "02:00 PHT",
            notes: "Night shift logistics shuttle for Apex operations team."
        },
        {
            id: "#RQ-8819",
            client: "Eduardo Lopez",
            route: "Airport Transfer (NAIA 3)",
            schedule: "Oct 02, 2026 - Morning",
            vehiclePref: "2x Executive SUV (4-Seater)",
            vehicleType: "Executive SUV",
            status: "Pending",
            units: 2,
            pickup: "Makati CBD",
            destination: "NAIA Terminal 3",
            start: "06:00 PHT",
            return: "10:00 PHT",
            notes: "Executive partner arrival transfer."
        },
        {
            id: "#RQ-8814",
            client: "Maria Santos",
            route: "Company Outing (Tagaytay)",
            schedule: "Oct 15, 2026 - Full Day",
            vehiclePref: "4x Corporate Van (14-Seater)",
            vehicleType: "Corporate Van",
            status: "Pending",
            units: 4,
            pickup: "Alabang Town Center",
            destination: "Tagaytay Highlands",
            start: "07:00 PHT",
            return: "19:00 PHT",
            notes: "Annual corporate offsite group trip."
        }
    ]
};

window.ROVER_DB = {
    get: function() {
        try {
            const raw = localStorage.getItem("roverDB");
            if (!raw) return this.seed();
            const data = JSON.parse(raw);
            if (!data.reservations || !data.users) return this.seed();
            return data;
        } catch (e) {
            console.error("Failed to parse roverDB:", e);
            return this.seed();
        }
    },
    save: function(db) {
        localStorage.setItem("roverDB", JSON.stringify(db));
    },
    seed: function() {
        localStorage.setItem("roverDB", JSON.stringify(ROVER_DB_SEED));
        return JSON.parse(JSON.stringify(ROVER_DB_SEED));
    }
};

window.ROVER_AUTH = {
    getSession: function() {
        try {
            const raw = sessionStorage.getItem("activeSession");
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error("Failed to parse activeSession:", e);
            return null;
        }
    },
    setSession: function(user) {
        sessionStorage.setItem("activeSession", JSON.stringify(user));
    },
    clearSession: function() {
        sessionStorage.clear();
    },
    logout: function() {
        this.clearSession();
        window.location.href = "index.html";
    },
    requireRole: function(allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        const user = this.getSession();

        if (!user || !user.role || !roles.includes(user.role)) {
            window.location.href = "index.html";
            return null;
        }

        // Auto-hydrate common user metadata in DOM
        this.syncUserIdentity(user);
        this.bindLogoutButtons();
        return user;
    },
    syncUserIdentity: function(user) {
        if (!user) return;
        
        let initials = "OP";
        if (user.name) {
            const parts = user.name.split(" ").filter(p => p.length > 0 && p !== "•");
            if (parts.length > 1) {
                initials = parts[0][0] + parts[parts.length - 1][0];
            } else if (parts.length === 1) {
                initials = parts[0].substring(0, 2);
            }
        }
        initials = initials.toUpperCase();

        const nameEl = document.getElementById("userFullName");
        if (nameEl) nameEl.innerText = user.name;

        const roleEl = document.getElementById("userRoleText");
        if (roleEl) {
            if (user.role === "Admin") roleEl.innerText = "SYSTEM ADMINISTRATOR";
            else if (user.role === "Manager") roleEl.innerText = "OPERATIONS MANAGER";
            else roleEl.innerText = user.role.toUpperCase();
        }

        const avatarEl = document.getElementById("userAvatarInitials");
        if (avatarEl) {
            avatarEl.innerText = initials;
            if (user.role === "Admin") avatarEl.style.backgroundColor = "#D32F2F";
        }

        const topAvatarEl = document.getElementById("topNavAvatar");
        if (topAvatarEl) {
            topAvatarEl.innerText = initials;
            if (user.role === "Admin") topAvatarEl.style.backgroundColor = "#D32F2F";
        }

        // Client portal specific bindings
        const welcomeEl = document.getElementById("clientNameWelcomeDisplay");
        if (welcomeEl) welcomeEl.innerText = user.name;

        const sidebarClientEl = document.getElementById("clientNameSidebarDisplay");
        if (sidebarClientEl) sidebarClientEl.innerText = user.name;

        // Driver terminal specific bindings
        const driverNameEl = document.getElementById("driverName");
        if (driverNameEl) driverNameEl.innerText = user.name;
    },
    bindLogoutButtons: function() {
        const buttons = ["logoutBtn", "adminLogoutBtn", "clientLogoutBtn", "navProfileLogout"];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = "true";
                btn.addEventListener("click", () => this.logout());
            }
        });
    }
};

// Automatic initialization & login form handling on DOM load
document.addEventListener("DOMContentLoaded", () => {
    // Ensure database is seeded
    ROVER_DB.get();

    // Check for login form on index.html
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const emailInput = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
            const passInput = document.getElementById("password") ? document.getElementById("password").value.trim() : "";
            const db = ROVER_DB.get();
            const authenticatedUser = db.users.find(u => u.email === emailInput && u.password === passInput);

            if (authenticatedUser) {
                ROVER_AUTH.setSession(authenticatedUser);
                const routes = {
                    "Admin": "admin.html",
                    "Manager": "manager.html",
                    "Driver": "driver.html",
                    "Client": "client.html"
                };
                window.location.href = routes[authenticatedUser.role] || "index.html";
            } else {
                const errorDiv = document.getElementById("errorMessage");
                if (errorDiv) errorDiv.style.display = "block";
            }
        });
    }
});
