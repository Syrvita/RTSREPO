/**
 * ROVER FLEET SYSTEMS - ADMIN PORTAL CONTROLLER (js/admin-portal.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles KYC Onboarding (admin.html) & User Management / RBAC (users.html)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. RBAC Route Protection (Admin only)
    const currentUser = ROVER_AUTH.requireRole("Admin");
    if (!currentUser) return;

    // 2. KYC Onboarding & Legal Dossier Audit Controller (admin.html - PB-002)
    const kycTable = document.querySelector(".admin-portal-view .data-table");
    const legalDossierModal = document.getElementById("legalDossierModal");

    // Realistic Philippine Regulatory Document Templates (PB-002)
    const DOSSIER_TEMPLATES = {
        bir2303: `
            <div style="border: 2px solid #0D47A1; padding: 16px; background: #FFFFFF; font-family: 'Courier New', Courier, monospace; color: #1A237E; line-height: 1.4;">
                <div style="text-align: center; border-bottom: 2px solid #0D47A1; padding-bottom: 12px; margin-bottom: 14px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555;">Republic of the Philippines &bull; Department of Finance</div>
                    <div style="font-size: 16px; font-weight: 900; letter-spacing: 0.5px; color: #0D47A1; margin: 4px 0;">BUREAU OF INTERNAL REVENUE</div>
                    <div style="font-size: 13px; font-weight: 700; background: #0D47A1; color: white; display: inline-block; padding: 2px 12px; border-radius: 2px; margin-top: 4px;">BIR FORM NO. 2303 &bull; CERTIFICATE OF REGISTRATION</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 12px;">
                    <div><strong>OCN:</strong> 9RC0000889218-47B</div>
                    <div style="text-align: right;"><strong>RDO CODE:</strong> 047 - East Makati</div>
                </div>

                <div style="background: #F1F5F9; border: 1px dashed #0D47A1; padding: 10px; margin-bottom: 12px; font-size: 11.5px;">
                    <div style="margin-bottom: 4px;"><strong>TAXPAYER NAME:</strong> APEX LOGISTICS GLOBAL INC.</div>
                    <div style="margin-bottom: 4px;"><strong>TIN:</strong> <span style="font-size: 13px; font-weight: 800; color: #D32F2F;">009-881-284-000</span> (VAT REGISTERED)</div>
                    <div style="margin-bottom: 4px;"><strong>TRADE NAME:</strong> APEX LOGISTICS FLEET SERVICES</div>
                    <div><strong>REGISTERED ADDRESS:</strong> 14th Floor, High Street South Corporate Plaza, BGC, Taguig City 1634</div>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="font-weight: 700; font-size: 11px; border-bottom: 1px solid #0D47A1; padding-bottom: 2px; margin-bottom: 6px;">TAX TYPE OBLIGATIONS:</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
                        <div>✓ Corporate Income Tax (1702Q/1702)</div>
                        <div>✓ Value Added Tax (2550M/2550Q)</div>
                        <div>✓ Withholding Tax - Expanded (0619E/1601EQ)</div>
                        <div>✓ Withholding Tax - Compensation (1601C)</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 10.5px; color: #475569;">
                    <div>
                        <div><strong>DATE ISSUED:</strong> October 14, 2019</div>
                        <div><strong>REGISTRATION STATUS:</strong> TAX COMPLIANT &bull; ACTIVE</div>
                    </div>
                    <div style="text-align: right; border: 1px solid #0D47A1; padding: 4px 8px; font-weight: 700; color: #0D47A1;">
                        BIR OFFICIAL SEAL &bull; VALIDATED
                    </div>
                </div>
            </div>
        `,
        sec: `
            <div style="border: 2px solid #881337; padding: 16px; background: #FFFFFF; font-family: 'Times New Roman', Times, serif; color: #4C0519; line-height: 1.4;">
                <div style="text-align: center; border-bottom: 2px solid #881337; padding-bottom: 12px; margin-bottom: 14px;">
                    <div style="font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Republic of the Philippines</div>
                    <div style="font-size: 16px; font-weight: 900; color: #881337; margin: 4px 0;">SECURITIES AND EXCHANGE COMMISSION</div>
                    <div style="font-size: 11px;">The SEC Headquarters, 7907 Makati Avenue, Bel-Air, Makati City</div>
                    <div style="font-size: 13px; font-weight: 700; color: #9F1239; margin-top: 6px; letter-spacing: 0.5px;">CERTIFICATE OF INCORPORATION</div>
                </div>

                <div style="text-align: center; margin-bottom: 12px; font-size: 12px;">
                    <div>COMPANY REGISTRATION NO. <strong style="font-size: 14px; color: #D32F2F;">CS201958291-B</strong></div>
                </div>

                <p style="font-size: 11.5px; text-align: justify; text-indent: 2em; margin-bottom: 10px;">
                    THIS IS TO CERTIFY that the Articles of Incorporation and By-Laws of <strong>APEX LOGISTICS GLOBAL INC.</strong> were duly approved by the Commission on the 8th day of October, 2019 in accordance with the Revised Corporation Code of the Philippines (Republic Act No. 11232).
                </p>

                <div style="background: #FFF1F2; border: 1px solid #FECDD3; padding: 8px 12px; font-size: 11px; margin-bottom: 12px;">
                    <div><strong>PRIMARY PURPOSE:</strong> Land transport, enterprise fleet operations, corporate employee transit solutions, and supply chain contract logistics.</div>
                    <div style="margin-top: 4px;"><strong>AUTHORIZED CAPITAL:</strong> PHP 50,000,000.00 (Common Stock)</div>
                    <div style="margin-top: 4px;"><strong>PRINCIPAL OFFICE:</strong> Taguig City, Metro Manila, Philippines</div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 10.5px;">
                    <div>
                        <div>DOCUMENT VERIFICATION CODE: <strong>SEC-2019-ALGI-8842</strong></div>
                        <div style="color: #2E7D32; font-weight: 700;">✓ In Good Standing &bull; Annual Report Filings Up to Date</div>
                    </div>
                    <div style="text-align: center; border: 1px solid #881337; padding: 4px 8px; font-weight: 700; color: #881337;">
                        SEC SEAL OF REGISTRATION
                    </div>
                </div>
            </div>
        `,
        id: `
            <div style="border: 2px solid #15803D; padding: 16px; background: #FFFFFF; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #14532D; line-height: 1.4;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #15803D; padding-bottom: 10px; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 10px; text-transform: uppercase; color: #475569;">Republic of the Philippines &bull; National Identity Registry</div>
                        <div style="font-size: 14px; font-weight: 800; color: #15803D;">UNIFIED MULTI-PURPOSE ID (UMID)</div>
                    </div>
                    <div style="background: #DCFCE7; border: 1px solid #86EFAC; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                        GOV-VALIDATED ID
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 90px 1fr; gap: 14px; margin-bottom: 12px;">
                    <div style="width: 90px; height: 110px; background: #E2E8F0; border: 1px solid #CBD5E1; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; color: #64748B;">
                        <span style="font-size: 32px;">👤</span>
                        <span>PHOTO (RC)</span>
                    </div>
                    <div style="font-size: 11.5px; display: flex; flex-direction: column; gap: 4px;">
                        <div><strong>CRN:</strong> <span style="font-family: monospace; font-size: 12px; color: #166534;">0111-8930219-4</span></div>
                        <div><strong>NAME:</strong> <span style="font-weight: 700; color: #111827;">CASTANEDA, ROWENA MAE DELOS SANTOS</span></div>
                        <div><strong>DATE OF BIRTH:</strong> March 14, 1988</div>
                        <div><strong>NATIONALITY:</strong> Filipino</div>
                        <div><strong>CORPORATE TITLE:</strong> Operations Director &amp; Corporate Signatory</div>
                        <div><strong>ADDRESS:</strong> Unit 2402, Two Serendra, BGC, Taguig City</div>
                    </div>
                </div>

                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 8px; border-radius: 4px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>SECRETARY'S CERTIFICATE:</strong> Matched</span>
                        <span style="color: #15803D; font-weight: 700;">PhilSys Level 2 Verified ✓</span>
                    </div>
                    <div style="color: #475569; font-size: 10.5px; margin-top: 2px;">Authorized by Board Resolution No. 2024-11-ALGI to execute corporate mobility and credit agreements.</div>
                </div>
            </div>
        `
    };

    let activeEntityId = "APEX-001";
    let activeTabKey = "bir2303";

    function setDossierTab(tabKey) {
        activeTabKey = tabKey;
        const canvas = document.getElementById("docViewerCanvas");
        const sizeLabel = document.getElementById("docFileSizeLabel");
        const tabs = document.querySelectorAll(".dossier-tab");

        tabs.forEach(tab => {
            const isMatch = tab.getAttribute("data-tab") === tabKey;
            if (isMatch) {
                tab.style.background = "#FFEBEE";
                tab.style.color = "#D32F2F";
                tab.style.borderColor = "#D32F2F";
                tab.classList.add("active");
            } else {
                tab.style.background = "#F5F5F5";
                tab.style.color = "#616161";
                tab.style.borderColor = "#E0E0E0";
                tab.classList.remove("active");
            }
        });

        if (canvas) {
            canvas.innerHTML = DOSSIER_TEMPLATES[tabKey] || "<p>Document not available.</p>";
        }

        if (sizeLabel) {
            if (tabKey === "bir2303") sizeLabel.innerText = "PDF • 1.4 MB";
            else if (tabKey === "sec") sizeLabel.innerText = "PDF • 2.4 MB";
            else if (tabKey === "id") sizeLabel.innerText = "PDF • 1.8 MB";
        }
    }

    function applyClientKycStatusInUI(kycStatus, entityId = "APEX-001") {
        const apexCell = document.getElementById("apexStatusCell");
        const approveBtn = document.getElementById("approveAccountBtn");

        if (kycStatus === "Approved" || kycStatus === "Verified Tier-1") {
            const targetRow = document.querySelector(`tr[data-entity-id="${entityId}"]`);
            if (targetRow) {
                const cell = targetRow.cells[targetRow.cells.length - 1];
                if (cell) {
                    cell.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="background: #E8F5E9; color: #2E7D32; border: 1px solid #A5D6A7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">● Approved</span>
                            <span style="color: #2E7D32; font-weight: 700; font-size: 12px;">✓ Approved</span>
                        </div>
                    `;
                }
            } else if (apexCell) {
                apexCell.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: #E8F5E9; color: #2E7D32; border: 1px solid #A5D6A7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">● Approved</span>
                        <span style="color: #2E7D32; font-weight: 700; font-size: 12px;">✓ Approved</span>
                    </div>
                `;
            }
            if (approveBtn) {
                approveBtn.innerText = "✓ Approved";
                approveBtn.style.backgroundColor = "#2E7D32";
                approveBtn.style.cursor = "default";
                approveBtn.disabled = true;
            }
        } else if (kycStatus === "Action Required") {
            const targetRow = document.querySelector(`tr[data-entity-id="${entityId}"]`);
            const targetCell = targetRow ? targetRow.cells[targetRow.cells.length - 1] : apexCell;
            if (targetCell) {
                targetCell.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="status-pill status-amber" style="background: #FFF8E1; color: #B45309; border: 1px solid #FCD34D;">Conditional Resubmit</span>
                        <button class="btn-audit-dossier" data-action="audit" data-id="${entityId}" style="padding: 4px 10px; background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">Audit Dossier &rarr;</button>
                    </div>
                `;
                const newBtn = targetCell.querySelector(".btn-audit-dossier");
                if (newBtn) {
                    newBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openLegalDossier(entityId);
                    });
                }
            }
            if (approveBtn) {
                approveBtn.innerText = "Action Required";
                approveBtn.style.backgroundColor = "#B45309";
                approveBtn.style.cursor = "pointer";
                approveBtn.disabled = false;
            }
        } else if (kycStatus === "Rejected") {
            const targetRow = document.querySelector(`tr[data-entity-id="${entityId}"]`);
            const targetCell = targetRow ? targetRow.cells[targetRow.cells.length - 1] : apexCell;
            if (targetCell) {
                targetCell.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="status-pill status-red" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2;">Rejected</span>
                        <span style="color: #C62828; font-weight: 700; font-size: 11px;">✕ Blocked</span>
                    </div>
                `;
            }
            if (approveBtn) {
                approveBtn.innerText = "✕ Rejected";
                approveBtn.style.backgroundColor = "#C62828";
                approveBtn.style.cursor = "default";
                approveBtn.disabled = true;
            }
        }
    }

    function openLegalDossier(entityId) {
        if (!legalDossierModal) return;
        activeEntityId = entityId || "APEX-001";

        // Retrieve corporate client details from db
        const db = ROVER_DB.get();
        const clients = db.corporateClients || [];
        const client = clients.find(c => c.id === activeEntityId) || clients[0] || {
            name: "Apex Logistics Global Inc.",
            secReg: "CS201958291-B",
            tin: "009-881-284-000"
        };

        const titleEl = document.getElementById("dossierModalTitle");
        if (titleEl) {
            titleEl.innerText = `Legal Dossier Audit: ${client.name}`;
        }

        const decisionSelect = document.getElementById("verificationDecisionSelect");
        if (decisionSelect) {
            if (client.kycStatus === "Approved" || client.kycStatus === "Verified Tier-1") decisionSelect.value = "Approved";
            else if (client.kycStatus === "Action Required") decisionSelect.value = "Conditional";
            else if (client.kycStatus === "Rejected") decisionSelect.value = "Rejected";
            else decisionSelect.value = "Approved";
        }

        const notesInput = document.getElementById("complianceAuditNotes");
        if (notesInput && client.auditNotes) {
            notesInput.value = client.auditNotes;
        }

        // Set default tab to BIR Form 2303
        setDossierTab("bir2303");

        // Display modal
        legalDossierModal.style.display = "flex";
    }

    function closeLegalDossier() {
        if (legalDossierModal) {
            legalDossierModal.style.display = "none";
        }
    }

    // Modal lifecycle bindings
    if (legalDossierModal) {
        // Tab buttons
        const tabBtns = legalDossierModal.querySelectorAll(".dossier-tab");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const tabKey = btn.getAttribute("data-tab");
                if (tabKey) setDossierTab(tabKey);
            });
        });

        // Close button
        const closeBtn = document.getElementById("closeDossierModalBtn");
        if (closeBtn) {
            closeBtn.addEventListener("click", closeLegalDossier);
        }

        // Cancel button
        const cancelDossierBtn = document.getElementById("cancelDossierBtn");
        if (cancelDossierBtn) {
            cancelDossierBtn.addEventListener("click", closeLegalDossier);
        }

        // Backdrop click
        legalDossierModal.addEventListener("click", (e) => {
            if (e.target === legalDossierModal) {
                closeLegalDossier();
            }
        });

        // Authorize / Decision button
        const authorizeBtn = document.getElementById("authorizeDossierBtn");
        if (authorizeBtn) {
            authorizeBtn.addEventListener("click", () => {
                const decisionSelect = document.getElementById("verificationDecisionSelect");
                const notesInput = document.getElementById("complianceAuditNotes");
                const decision = decisionSelect ? decisionSelect.value : "Approved";
                const enteredNotes = notesInput ? notesInput.value.trim() : "";

                const db = ROVER_DB.get();
                if (!Array.isArray(db.corporateClients)) {
                    db.corporateClients = ROVER_DB_SEED.corporateClients;
                }

                let targetClient = db.corporateClients.find(c => c.id === activeEntityId || c.name.includes("Apex"));
                let kycStatus = "Approved";
                let bookingEligibility = "Full Access";
                let defaultNote = "Approved via Form PB-002 Legal Dossier Audit.";

                if (decision === "Approved") {
                    kycStatus = "Approved";
                    bookingEligibility = "Full Access";
                    defaultNote = "Approved via Form PB-002 Legal Dossier Audit.";
                } else if (decision === "Conditional") {
                    kycStatus = "Action Required";
                    bookingEligibility = "Restricted";
                    defaultNote = "Conditional: Pending document resubmission.";
                } else if (decision === "Rejected") {
                    kycStatus = "Rejected";
                    bookingEligibility = "Blocked";
                    defaultNote = "Deficient regulatory credentials";
                }

                const finalNotes = enteredNotes || defaultNote;

                if (targetClient) {
                    targetClient.kycStatus = kycStatus;
                    targetClient.bookingEligibility = bookingEligibility;
                    targetClient.auditNotes = finalNotes;
                    targetClient.verifiedAt = new Date().toISOString();
                    targetClient.auditedAt = new Date().toISOString();
                    targetClient.auditedBy = currentUser.name || "Admin • Ops Manila";

                    // Also sync with matching client user in users list if present
                    if (Array.isArray(db.users)) {
                        const clientUser = db.users.find(u => u.clientEntityId === targetClient.id || u.name === targetClient.name || (targetClient.email && u.email === targetClient.email));
                        if (clientUser) {
                            clientUser.kycStatus = kycStatus;
                            clientUser.bookingEligibility = bookingEligibility;
                        }
                    }
                }
                ROVER_DB.save(db);

                // Update UI Table row & Side dossier panel
                applyClientKycStatusInUI(kycStatus, activeEntityId);

                closeLegalDossier();
            });
        }

        // Reject button
        const rejectBtn = document.getElementById("rejectDossierBtn");
        if (rejectBtn) {
            rejectBtn.addEventListener("click", () => {
                const decisionSelect = document.getElementById("verificationDecisionSelect");
                if (decisionSelect) decisionSelect.value = "Rejected";
                const notesInput = document.getElementById("complianceAuditNotes");
                if (notesInput) notesInput.value = "Deficient regulatory credentials";
                const authorizeBtn = document.getElementById("authorizeDossierBtn");
                if (authorizeBtn) {
                    authorizeBtn.click();
                }
            });
        }
    }

    // Bind all table buttons and side dossier actions
    if (kycTable) {
        const rows = kycTable.querySelectorAll("tbody tr");
        const dossierTitle = document.querySelector(".dossier-panel h3");
        const dossierValues = document.querySelectorAll(".dossier-value");

        const kycData = {
            "Apex Logistics Global Inc.": {
                reg: "CS201958291-B",
                tax: "009-881-284-000",
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
            row.addEventListener("click", (e) => {
                // If clicked button inside row, let button handler execute
                if (e.target.closest(".btn-audit-dossier") || e.target.closest("[data-action='audit']")) {
                    return;
                }
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

        // Audit buttons
        const auditBtns = document.querySelectorAll(".btn-audit-dossier, [data-action='audit']");
        auditBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const entityId = btn.getAttribute("data-id") || "APEX-001";
                openLegalDossier(entityId);
            });
        });

        // Side panel Approve button opens the modal for review & authorization
        const approveAccountBtn = document.getElementById("approveAccountBtn");
        if (approveAccountBtn) {
            approveAccountBtn.addEventListener("click", (e) => {
                e.preventDefault();
                openLegalDossier(activeEntityId || "APEX-001");
            });
        }

        // Side panel Reject button
        const rejectAccountBtn = document.getElementById("rejectAccountBtn");
        if (rejectAccountBtn) {
            rejectAccountBtn.addEventListener("click", (e) => {
                e.preventDefault();
                openLegalDossier(activeEntityId || "APEX-001");
                const decisionSelect = document.getElementById("verificationDecisionSelect");
                if (decisionSelect) decisionSelect.value = "Rejected";
            });
        }

        // Check persisted KYC status on load
        const initialDb = ROVER_DB.get();
        if (Array.isArray(initialDb.corporateClients)) {
            initialDb.corporateClients.forEach(c => {
                if (c.kycStatus && c.kycStatus !== "Requires Review") {
                    applyClientKycStatusInUI(c.kycStatus, c.id || "APEX-001");
                }
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
                        <a href="javascript:void(0)" class="btn-edit-user" data-id="${escapeHTML(u.id)}" style="color: #1976D2; text-decoration: none; margin-right: 1rem; font-size: 0.875rem; font-weight: 500;">Edit</a>
                        <a href="javascript:void(0)" class="btn-toggle-status" data-id="${escapeHTML(u.id)}" style="color: ${isSuspended ? '#388E3C' : '#D32F2F'}; text-decoration: none; font-size: 0.875rem; font-weight: 500;">${isSuspended ? 'Activate' : 'Deactivate'}</a>
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
        const closeProvisionBtn = document.getElementById("closeProvisionModalBtn");
        if (closeProvisionBtn) {
            closeProvisionBtn.addEventListener("click", () => {
                if (modal) modal.style.display = "none";
            });
        }
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.style.display = "none";
            });
        }

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
