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
    version: 2,
    fleetCapacity: 31,
    fleet: [
        // 14x Toyota HiAce Commuter / Deluxe / Grandia (Passenger & Executive Van, 10–14 Seats)
        { id: "RV-VAN-101", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAA-1024", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-102", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAB-2048", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-103", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAC-3072", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-104", model: "Toyota HiAce Commuter (14 Seats)", type: "Passenger Van", capacity: 14, plate: "NVA-1234", hub: "Manila Hub", status: "Locked / In-Use", currentTrip: "#RQ-1038" },
        { id: "RV-VAN-105", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAE-5012", hub: "Clark Logistics Hub", status: "Available" },
        { id: "RV-VAN-106", model: "Toyota HiAce Commuter Deluxe", type: "Passenger Van", capacity: 14, plate: "NAF-6024", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-107", model: "Toyota HiAce Commuter Deluxe", type: "Passenger Van", capacity: 14, plate: "NAG-7036", hub: "Clark Logistics Hub", status: "Available" },
        { id: "RV-VAN-108", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAH-8048", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-109", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAJ-9060", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-110", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAK-1172", hub: "Clark Logistics Hub", status: "Available" },
        { id: "RV-VAN-111", model: "Toyota HiAce Commuter", type: "Passenger Van", capacity: 14, plate: "NAL-2284", hub: "Manila Hub", status: "Available" },
        { id: "RV-VAN-112", model: "Toyota HiAce Commuter Deluxe (14 Seats)", type: "Passenger Van", capacity: 14, plate: "NCL-8821", hub: "Manila Hub", status: "Available", scheduleBuffer: "100% Clear" },
        { id: "RV-GRA-113", model: "Toyota HiAce GL Grandia", type: "Executive Van", capacity: 12, plate: "NAM-3396", hub: "Makati Station", status: "Available" },
        { id: "RV-GRA-114", model: "Toyota HiAce Super Grandia", type: "Executive Van", capacity: 10, plate: "NAN-4408", hub: "Makati Station", status: "Available" },

        // 8x Nissan NV350 Urvan (Passenger Van, 15–18 Seats)
        { id: "RV-URV-101", model: "Nissan NV350 Urvan Standard", type: "Passenger Van", capacity: 15, plate: "NBQ-5678", hub: "Manila Hub", status: "Available" },
        { id: "RV-URV-102", model: "Nissan NV350 Urvan Standard", type: "Passenger Van", capacity: 15, plate: "NBR-6789", hub: "Manila Hub", status: "Available" },
        { id: "RV-URV-103", model: "Nissan NV350 Urvan Premium", type: "Passenger Van", capacity: 15, plate: "NBS-7890", hub: "Clark Logistics Hub", status: "Available" },
        { id: "RV-URV-104", model: "Nissan NV350 Urvan Standard", type: "Passenger Van", capacity: 15, plate: "NBT-8901", hub: "Manila Hub", status: "Available" },
        { id: "RV-URV-105", model: "Nissan NV350 Urvan Premium", type: "Passenger Van", capacity: 15, plate: "NBU-9012", hub: "Clark Logistics Hub", status: "Available" },
        { id: "RV-URV-106", model: "Nissan NV350 Urvan Standard", type: "Passenger Van", capacity: 18, plate: "NBV-0123", hub: "Manila Hub", status: "Available" },
        { id: "RV-URV-107", model: "Nissan NV350 Urvan Standard", type: "Passenger Van", capacity: 15, plate: "NBW-1235", hub: "Manila Hub", status: "Available" },
        { id: "RV-URV-108", model: "Nissan NV350 Urvan 15-Seater", type: "Passenger Van", capacity: 15, plate: "NBX-2346", hub: "Manila Hub", status: "Available" },

        // 4x Hyundai Grand Starex / Staria (Executive Shuttle, 9–10 Seats)
        { id: "RV-STR-201", model: "Hyundai Grand Starex Executive", type: "Executive Shuttle", capacity: 10, plate: "NCR-9012", hub: "Makati Station", status: "Available" },
        { id: "RV-STR-202", model: "Hyundai Staria Premium", type: "Executive Shuttle", capacity: 9, plate: "NCS-0124", hub: "Makati Station", status: "Available" },
        { id: "RV-STR-203", model: "Hyundai Grand Starex VIP", type: "Executive Shuttle", capacity: 10, plate: "NCT-1236", hub: "Clark Logistics Hub", status: "Available" },
        { id: "RV-STR-204", model: "Hyundai Grand Starex Executive", type: "Executive Shuttle", capacity: 10, plate: "NCU-2348", hub: "Makati Station", status: "Available" },

        // 3x Mitsubishi L300 FB Body (Utility Shuttle / Cargo Van, 16 Seats)
        { id: "RV-L30-301", model: "Mitsubishi L300 FB Body", type: "Utility Shuttle / Cargo Van", capacity: 16, plate: "DAE-4321", hub: "Manila Hub", status: "Assigned", currentTrip: "#RQ-1039" },
        { id: "RV-L30-302", model: "Mitsubishi L300 FB Body", type: "Utility Shuttle / Cargo Van", capacity: 16, plate: "DAF-5432", hub: "Manila Hub", status: "Assigned", currentTrip: "#RQ-1039" },
        { id: "RV-L30-303", model: "Mitsubishi L300 FB Body", type: "Utility Shuttle / Cargo Van", capacity: 16, plate: "DAG-6543", hub: "Clark Logistics Hub", status: "Available" },

        // 2x Isuzu Traviz Dual Cab / Utility (Commercial Shuttle, 16 Seats)
        { id: "RV-TRV-401", model: "Isuzu Traviz Dual Cab Utility", type: "Commercial Shuttle", capacity: 16, plate: "NDX-3821", hub: "Manila Hub", status: "Available" },
        { id: "RV-TRV-402", model: "Isuzu Traviz Dual Cab Utility", type: "Commercial Shuttle", capacity: 16, plate: "NDY-4932", hub: "Clark Logistics Hub", status: "Available" }
    ],
    drivers: [
        { id: "RVR-FLT-0382", name: "Eduardo Santos", phone: "+63 917 555 0101", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0211", name: "Marco Polo", phone: "+63 917 555 0102", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0144", name: "Ramon Magsaysay", phone: "+63 917 555 0103", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0199", name: "Danilo Reyes", phone: "+63 917 555 0104", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0233", name: "Arnel Pineda", phone: "+63 917 555 0105", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0288", name: "Noel Cabangon", phone: "+63 917 555 0106", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0312", name: "Gary Valenciano", phone: "+63 917 555 0107", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0355", name: "Ogie Alcasid", phone: "+63 917 555 0108", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0410", name: "Martin Nievera", phone: "+63 917 555 0109", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0442", name: "Ely Buendia", phone: "+63 917 555 0110", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0480", name: "Chito Miranda", phone: "+63 917 555 0111", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0515", name: "Bamboo Manalac", phone: "+63 917 555 0112", status: "On Duty", clearance: "Tier-1 Clear" },
        { id: "RVR-FLT-0530", name: "Vic Sotto", phone: "+63 917 555 0113", status: "Active Trip", clearance: "En Route" },
        { id: "RVR-FLT-0555", name: "Joey de Leon", phone: "+63 917 555 0114", status: "Active Trip", clearance: "En Route" },
        { id: "RVR-FLT-0580", name: "Tito Sotto", phone: "+63 917 555 0115", status: "Active Trip", clearance: "En Route" }
    ],
    reservations: [
        {
            id: "#RQ-1042",
            client: "Apex Logistics Global Inc.",
            clientContact: "Rowena Mae Castaneda",
            route: "Makati CBD → Clark Logistics Hub",
            schedule: "Oct 28, 2026 • 08:00 – 18:00 PHT",
            pickupWindow: "Oct 28, 2026 • 08:00 – 18:00 PHT",
            vehiclePref: "1x Toyota HiAce Commuter",
            vehicleType: "Toyota HiAce Commuter (14 Seats)",
            status: "Conflict",
            auditStatus: "Schedule Overlap",
            units: 1,
            estimatedPax: 14,
            origin: "Makati CBD (Ayala Tower 1)",
            destination: "Clark Logistics Hub Terminal 2",
            assignedVehicle: null,
            assignedDriver: null,
            notes: "High-priority corporate dispatch."
        },
        {
            id: "#RQ-1039",
            client: "San Miguel Aerocity Core",
            clientContact: "Ramon Ang",
            route: "BGC → Bulacan Airport Site",
            schedule: "Oct 28, 2026 • 09:30 – 16:00 PHT",
            pickupWindow: "Oct 28, 2026 • 09:30 – 16:00 PHT",
            vehiclePref: "2x Mitsubishi L300 FB Shuttle",
            vehicleType: "Mitsubishi L300 FB Body (16 Seats)",
            status: "Dispatched",
            auditStatus: "Dispatched",
            units: 2,
            estimatedPax: 16,
            origin: "BGC Corporate Center",
            destination: "Bulacan Airport Site",
            assignedVehicle: "RV-L30-301, RV-L30-302",
            assignedDriver: "Vic Sotto, Joey de Leon",
            notes: "Site engineering team transport."
        },
        {
            id: "#RQ-1038",
            client: "Subic FreePort Trans",
            clientContact: "Fernando Zobel",
            route: "Manila → SBMA Terminal",
            schedule: "Oct 28, 2026 • 07:30 – 13:30 PHT",
            pickupWindow: "Oct 28, 2026 • 07:30 – 13:30 PHT",
            vehiclePref: "1x Toyota HiAce Commuter",
            vehicleType: "Toyota HiAce Commuter (14 Seats)",
            status: "En Route",
            auditStatus: "En Route (Locked)",
            units: 1,
            estimatedPax: 12,
            origin: "Port of Manila Gate 4",
            destination: "SBMA Terminal 1",
            assignedVehicle: "RV-VAN-104",
            assignedDriver: "Eduardo Santos",
            notes: "Active morning corridor transit."
        },
        {
            id: "#RQ-8821",
            client: "Apex Logistics Global Inc.",
            clientContact: "Rowena Mae Castaneda",
            route: "Daily Commute BGC",
            schedule: "Oct 01, 2026 - Night Shift",
            pickupWindow: "Oct 01, 2026 • 17:30 – 02:00 PHT",
            vehiclePref: "3x Nissan NV350 Urvan",
            vehicleType: "Nissan NV350 Urvan (15 Seats)",
            status: "Pending",
            auditStatus: "Pending Review",
            units: 3,
            estimatedPax: 42,
            origin: "Ortigas Center, Pasig",
            destination: "BGC Corporate Center, Taguig",
            start: "17:30 PHT",
            return: "02:00 PHT",
            notes: "Night shift logistics shuttle for Apex operations team."
        },
        {
            id: "#RQ-8819",
            client: "Apex Logistics Global Inc.",
            clientContact: "Eduardo Lopez",
            route: "Airport Transfer (NAIA 3)",
            schedule: "Oct 02, 2026 - Morning",
            pickupWindow: "Oct 02, 2026 • 06:00 – 10:00 PHT",
            vehiclePref: "2x Hyundai Grand Starex",
            vehicleType: "Hyundai Grand Starex / Staria (10 Seats)",
            status: "Pending",
            auditStatus: "Pending Review",
            units: 2,
            estimatedPax: 18,
            origin: "Makati CBD",
            destination: "NAIA Terminal 3",
            start: "06:00 PHT",
            return: "10:00 PHT",
            notes: "Executive partner arrival transfer."
        },
        {
            id: "#RQ-8814",
            client: "Apex Logistics Global Inc.",
            clientContact: "Maria Santos",
            route: "Company Outing (Tagaytay)",
            schedule: "Oct 15, 2026 - Full Day",
            pickupWindow: "Oct 15, 2026 • 07:00 – 19:00 PHT",
            vehiclePref: "4x Toyota HiAce Commuter",
            vehicleType: "Toyota HiAce Commuter (14 Seats)",
            status: "Pending",
            auditStatus: "Pending Review",
            units: 4,
            estimatedPax: 56,
            origin: "Alabang Town Center",
            destination: "Tagaytay Highlands",
            start: "07:00 PHT",
            return: "19:00 PHT",
            notes: "Annual corporate offsite group trip."
        }
    ],
    corporateClients: [
        {
            id: "APEX-001",
            name: "Apex Logistics Global Inc.",
            industry: "Supply Chain",
            signatory: "Rowena Mae Castaneda",
            signatoryRole: "Operations Director",
            email: "r.castaneda@apexlogistics.ph",
            phone: "+63 917 555 1029",
            secReg: "CS201958291-B",
            tin: "009-881-284-000",
            address: "14th Floor, High Street South Corporate Plaza, BGC, Taguig City, NCR",
            kycStatus: "Requires Review",
            creditFacility: "Pending Allocation",
            auditNotes: "",
            score: "98/100",
            submission: "2 Hours Ago"
        },
        {
            id: "MNL-002",
            name: "Manila Freight Co.",
            industry: "Logistics",
            signatory: "Juan Dela Cruz",
            signatoryRole: "Procurement Lead",
            email: "juan@manilafreight.com",
            phone: "+63 918 555 2038",
            secReg: "CS20250918231",
            tin: "008-291-382-000",
            address: "Port Area, Manila, NCR",
            kycStatus: "Verified Tier-1",
            creditFacility: "Tier-1 Corporate (Net 30 • PHP 500,000 Credit Facility)",
            auditNotes: "Verified via BIR Manila RDO 033.",
            score: "95/100",
            submission: "4 Hours Ago"
        },
        {
            id: "PAC-003",
            name: "Pacific E-Commerce Solutions",
            industry: "E-Commerce",
            signatory: "Maria Santos",
            signatoryRole: "CEO",
            email: "msantos@pacificecom.ph",
            phone: "+63 919 555 3847",
            secReg: "CS20249182741",
            tin: "009-482-192-000",
            address: "Ortigas Center, Pasig City",
            kycStatus: "Verified Tier-1",
            creditFacility: "Tier-2 Corporate (Net 15 • PHP 250,000)",
            auditNotes: "Pre-cleared quarterly review.",
            score: "92/100",
            submission: "1 Day Ago"
        },
        {
            id: "GLB-004",
            name: "Global Tech Distributors",
            industry: "Retail",
            signatory: "Mark Anthony Reyes",
            signatoryRole: "Logistics Head",
            email: "m.reyes@globaltech.com",
            phone: "+63 920 555 4958",
            secReg: "CS20231948172",
            tin: "010-384-918-000",
            address: "Makati CBD, Makati City",
            kycStatus: "Verified Tier-1",
            creditFacility: "Tier-1 Corporate (Net 30 • PHP 500,000 Credit Facility)",
            auditNotes: "Automated SEC cross-reference match.",
            score: "96/100",
            submission: "2 Days Ago"
        },
        {
            id: "ISL-005",
            name: "Islands Cargo Transport",
            industry: "Shipping",
            signatory: "Ana Lim",
            signatoryRole: "Operations Manager",
            email: "ana.lim@islandscargo.ph",
            phone: "+63 921 555 5869",
            secReg: "CS20229481723",
            tin: "007-192-847-000",
            address: "Cebu IT Park, Cebu City",
            kycStatus: "Verified Tier-1",
            creditFacility: "Prepaid / Escrow Only",
            auditNotes: "Prepaid facility active.",
            score: "91/100",
            submission: "3 Days Ago"
        }
    ]
};

window.ROVER_DB = {
    get: function() {
        try {
            const raw = localStorage.getItem("roverDB");
            if (!raw) return this.seed();
            const data = JSON.parse(raw);
            if (!data.reservations || !data.users || !data.fleet || !data.drivers || data.version !== 2) {
                return this.seed();
            }
            // Ensure minimum 31 fleet units and 15 drivers are always available
            if (!Array.isArray(data.fleet) || data.fleet.length < 31) {
                data.fleet = ROVER_DB_SEED.fleet;
                this.save(data);
            }
            if (!Array.isArray(data.drivers) || data.drivers.length < 15) {
                data.drivers = ROVER_DB_SEED.drivers;
                this.save(data);
            }
            if (!Array.isArray(data.corporateClients) || data.corporateClients.length < 5) {
                data.corporateClients = ROVER_DB_SEED.corporateClients;
                this.save(data);
            }
            // Ensure PB-008 seed reservations are present
            if (!data.reservations.some(r => r.id === "#RQ-1042")) {
                data.reservations = [
                    ...ROVER_DB_SEED.reservations.filter(sr => !data.reservations.some(r => r.id === sr.id)),
                    ...data.reservations
                ];
                if (!data.fleet) data.fleet = ROVER_DB_SEED.fleet;
                if (!data.drivers) data.drivers = ROVER_DB_SEED.drivers;
                this.save(data);
            }
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

window.ROVER_UTILS = {
    escapeHtml: function(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
window.escapeHTML = window.ROVER_UTILS.escapeHtml;

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
            this.clearSession();
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
        if (user.role === "Admin") {
            initials = "OP";
        } else if (user.name) {
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
        const buttons = [
            "logoutBtn",
            "adminLogoutBtn",
            "managerLogoutBtn",
            "clientLogoutBtn",
            "driverLogoutBtn",
            "navProfileLogout"
        ];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = "true";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    this.logout();
                });
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
