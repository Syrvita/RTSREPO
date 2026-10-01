/**
 * ROVER FLEET SYSTEMS - ADMIN PORTAL CONTROLLER (js/admin-portal.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles KYC Onboarding (admin.html) & User Management / RBAC (users.html)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Admin only)
    const currentUser = ROVER_AUTH.requireRole("Admin");
    if (!currentUser) return;

    // 2. KYC Onboarding Dossier Inspection (admin.html)
    const kycTable = document.querySelector(".admin-portal-view .data-table");
    if (kycTable && document.querySelector(".dossier-panel")) {
        const rows = kycTable.querySelectorAll("tbody tr");
        const dossierTitle = document.querySelector(".dossier-panel h3");
        const dossierValues = document.querySelectorAll(".dossier-value");

        const kycData = {
            "Apex Logistics Global Inc.": {
                reg: "CS20261948572",
                tax: "004-839-293-000",
                hq: "BGC, Taguig City, NCR"
            },
            "Manila Freight Co.": {
                reg: "CS20250918231",
                tax: "008-291-382-000",
                hq: "Port Area, Manila, NCR"
            },
            "Pacific E-Commerce Solutions": {
                reg: "CS20249182741",
                tax: "009-482-192-000",
                hq: "Ortigas Center, Pasig City"
            },
            "Global Tech Distributors": {
                reg: "CS20231948172",
                tax: "010-384-918-000",
                hq: "Makati CBD, Makati City"
            },
            "Islands Cargo Transport": {
                reg: "CS20229481723",
                tax: "007-192-847-000",
                hq: "Cebu IT Park, Cebu City"
            }
        };

        rows.forEach(row => {
            row.style.cursor = "pointer";
            row.addEventListener("click", () => {
                rows.forEach(r => r.classList.remove("active-row"));
                row.classList.add("active-row");

                const companyName = row.querySelector("td strong") ? row.querySelector("td strong").innerText.trim() : "";
                if (companyName && kycData[companyName]) {
                    if (dossierTitle) dossierTitle.innerText = companyName;
                    if (dossierValues.length >= 3) {
                        dossierValues[0].innerText = kycData[companyName].reg;
                        dossierValues[1].innerText = kycData[companyName].tax;
                        dossierValues[2].innerText = kycData[companyName].hq;
                    }
                }
            });
        });

        const approveBtn = document.querySelector(".btn-primary-approve");
        if (approveBtn) {
            approveBtn.addEventListener("click", () => {
                const originalText = approveBtn.innerText;
                approveBtn.innerText = "Approved ✓";
                approveBtn.style.backgroundColor = "#2E7D32";
                setTimeout(() => {
                    approveBtn.innerText = originalText;
                    approveBtn.style.backgroundColor = "";
                }, 1200);
            });
        }

        const rejectBtn = document.querySelector(".btn-ghost-reject");
        if (rejectBtn) {
            rejectBtn.addEventListener("click", () => {
                const originalText = rejectBtn.innerText;
                rejectBtn.innerText = "Rejected ✕";
                rejectBtn.style.color = "#D32F2F";
                setTimeout(() => {
                    rejectBtn.innerText = originalText;
                    rejectBtn.style.color = "";
                }, 1200);
            });
        }
    }

    // 3. System Access & User Provisioning (users.html)
    const userTableBody = document.getElementById("userTableBody");
    if (userTableBody) {
        let editingUserId = null;
        let roleFilter = "All";

        function renderUserTable() {
            const db = ROVER_DB.get();
            const users = db.users || [];

            let activeCount = 0;
            let suspendedCount = 0;

            users.forEach(u => {
                if (u.status === "suspended") suspendedCount++;
                else activeCount++;
            });

            const metricTotal = document.getElementById("totalUsersMetric");
            const metricActive = document.getElementById("activeUsersMetric");
            const metricSuspended = document.getElementById("suspendedUsersMetric");
            const paginationEl = document.getElementById("tablePagination");

            if (metricTotal) metricTotal.innerText = users.length;
            if (metricActive) metricActive.innerText = activeCount;
            if (metricSuspended) metricSuspended.innerText = suspendedCount;
            if (paginationEl) paginationEl.innerText = `Showing 1 to ${users.length} of ${users.length} user accounts (Personnel Cap Enforced)`;

            const searchInput = document.querySelector(".admin-portal-view .table-toolbar input");
            const q = searchInput ? searchInput.value.toLowerCase().trim() : "";

            const filtered = users.filter(u => {
                const matchesRole = roleFilter === "All" || u.role.toLowerCase() === roleFilter.toLowerCase();
                const matchesSearch = !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q));
                return matchesRole && matchesSearch;
            });

            userTableBody.innerHTML = "";
            filtered.forEach(u => {
                const tr = document.createElement("tr");

                let roleColor = "#9E9E9E";
                let roleBg = "#F5F5F5";
                if (u.role === "Admin") { roleColor = "#D32F2F"; roleBg = "#FCECEB"; }
                else if (u.role === "Manager") { roleColor = "#1976D2"; roleBg = "#E3F2FD"; }
                else if (u.role === "Driver") { roleColor = "#388E3C"; roleBg = "#E8F5E9"; }
                else if (u.role === "Client") { roleColor = "#F57C00"; roleBg = "#FFF3E0"; }

                const isSuspended = u.status === "suspended";
                const statusHtml = isSuspended ? 
                    `<span style="color: #D32F2F; display: flex; align-items: center; gap: 0.5rem; font-weight: 500; font-size: 0.875rem;"><span style="width: 8px; height: 8px; background: #F44336; border-radius: 50%; display: inline-block;"></span> Suspended</span>` :
                    `<span style="color: #388E3C; display: flex; align-items: center; gap: 0.5rem; font-weight: 500; font-size: 0.875rem;"><span style="width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; display: inline-block;"></span> Active</span>`;

                tr.innerHTML = `
                    <td><strong>${escapeHTML(u.name)}</strong></td>
                    <td>${escapeHTML(u.email)}</td>
                    <td><span style="background: ${roleBg}; color: ${roleColor}; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">${escapeHTML(u.role)}</span></td>
                    <td>${statusHtml}</td>
                    <td>
                        <a href="#" class="btn-edit-user" data-id="${escapeHTML(u.id)}" style="color: #1976D2; text-decoration: none; margin-right: 1rem; font-size: 0.875rem; font-weight: 500;">Edit</a>
                        <a href="#" class="btn-toggle-status" data-id="${escapeHTML(u.id)}" style="color: ${isSuspended ? '#388E3C' : '#D32F2F'}; text-decoration: none; font-size: 0.875rem; font-weight: 500;">${isSuspended ? 'Activate' : 'Deactivate'}</a>
                    </td>
                `;
                userTableBody.appendChild(tr);
            });

            // Bind action handlers
            userTableBody.querySelectorAll(".btn-edit-user").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    editUser(btn.getAttribute("data-id"));
                });
            });

            userTableBody.querySelectorAll(".btn-toggle-status").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    toggleUserStatus(btn.getAttribute("data-id"));
                });
            });
        }

        // Status mutation
        function toggleUserStatus(id) {
            const db = ROVER_DB.get();
            const user = db.users.find(u => u.id === id);
            if (user) {
                user.status = user.status === "suspended" ? "active" : "suspended";
                ROVER_DB.save(db);
                renderUserTable();
            }
        }

        // Modal Management
        const modal = document.getElementById("provisionModal");
        const openBtn = document.getElementById("openProvisionBtn");
        const cancelBtn = document.getElementById("cancelProvisionBtn");
        const saveBtn = document.getElementById("saveAccountBtn");
        const modalTitle = document.querySelector("#provisionModal h3");
        const modalError = document.getElementById("modalError");

        function openModal() {
            editingUserId = null;
            if (modalTitle) modalTitle.innerText = "Provision New User";
            if (modalError) modalError.style.display = "none";
            document.getElementById("newUserName").value = "";
            document.getElementById("newUserEmail").value = "";
            document.getElementById("newUserPass").value = "";
            if (modal) modal.style.display = "flex";
        }

        function editUser(id) {
            const db = ROVER_DB.get();
            const user = db.users.find(u => u.id === id);
            if (!user) return;

            editingUserId = id;
            if (modalTitle) modalTitle.innerText = "Edit User Account";
            if (modalError) modalError.style.display = "none";

            document.getElementById("newUserName").value = user.name || "";
            document.getElementById("newUserEmail").value = user.email || "";
            document.getElementById("newUserPass").value = user.password || "";
            document.getElementById("newUserRole").value = user.role || "Driver";

            if (modal) modal.style.display = "flex";
        }

        if (openBtn) openBtn.addEventListener("click", openModal);
        if (cancelBtn) cancelBtn.addEventListener("click", () => {
            if (modal) modal.style.display = "none";
        });

        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                const db = ROVER_DB.get();
                if (modalError) modalError.style.display = "none";

                const newName = document.getElementById("newUserName").value.trim();
                const newEmail = document.getElementById("newUserEmail").value.trim();
                const newPass = document.getElementById("newUserPass").value.trim();
                const newRole = document.getElementById("newUserRole").value;

                if (!newName || !newEmail || !newPass) {
                    if (modalError) {
                        modalError.innerText = "Please fill in all fields.";
                        modalError.style.display = "block";
                    }
                    return;
                }

                // Enforce personnel capacity limits
                const counts = { "Admin": 0, "Manager": 0, "Driver": 0, "Client": 0 };
                db.users.forEach(u => {
                    if (editingUserId && u.id === editingUserId) return;
                    if (counts[u.role] !== undefined) counts[u.role]++;
                });

                if (newRole === "Admin" && counts["Admin"] >= 3) {
                    if (modalError) {
                        modalError.innerText = "Creation blocked: Max limit of 3 Admins reached.";
                        modalError.style.display = "block";
                    }
                    return;
                }
                if (newRole === "Manager" && counts["Manager"] >= 3) {
                    if (modalError) {
                        modalError.innerText = "Creation blocked: Max limit of 3 Managers reached.";
                        modalError.style.display = "block";
                    }
                    return;
                }
                if (newRole === "Driver" && counts["Driver"] >= 15) {
                    if (modalError) {
                        modalError.innerText = "Creation blocked: Max limit of 15 Drivers reached.";
                        modalError.style.display = "block";
                    }
                    return;
                }

                if (editingUserId) {
                    const idx = db.users.findIndex(u => u.id === editingUserId);
                    if (idx > -1) {
                        db.users[idx].name = newName;
                        db.users[idx].email = newEmail;
                        db.users[idx].password = newPass;
                        db.users[idx].role = newRole;
                    }
                } else {
                    const newId = `RVR-${newRole.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
                    db.users.push({
                        id: newId,
                        email: newEmail,
                        password: newPass,
                        role: newRole,
                        name: newName,
                        status: "active"
                    });
                }

                ROVER_DB.save(db);

                saveBtn.innerText = "Saved ✓";
                saveBtn.style.backgroundColor = "#2E7D32";

                setTimeout(() => {
                    if (modal) modal.style.display = "none";
                    saveBtn.innerText = "Save Account";
                    saveBtn.style.backgroundColor = "";
                    renderUserTable();
                }, 600);
            });
        }

        // Toolbar Role Filters
        const filterBtns = document.querySelectorAll(".admin-portal-view .toolbar-actions .btn-ghost");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const text = btn.innerText.replace("All Roles", "All").replace("Managers", "Manager").replace("Drivers", "Driver").replace("Admins", "Admin").trim();
                roleFilter = text;
                filterBtns.forEach(b => b.style.backgroundColor = "");
                btn.style.backgroundColor = "#EEEEEE";
                renderUserTable();
            });
        });

        // Search Input Filter
        const searchInput = document.querySelector(".admin-portal-view .table-toolbar input");
        if (searchInput) searchInput.addEventListener("input", renderUserTable);

        // Initial Render
        renderUserTable();
    }
});
