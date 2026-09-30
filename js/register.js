/**
 * ROVER FLEET SYSTEMS - REGISTRATION CONTROLLER (js/register.js)
 * Scoped Multi-Page Architecture (MPA)
 * Handles Corporate Account Registration & KYC Onboarding Submission (register.html)
 */

document.addEventListener("DOMContentLoaded", () => {
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const successStep = document.getElementById("successStep");

    const btnNextStep = document.getElementById("btnNextStep");
    const btnPrevStep = document.getElementById("btnPrevStep");
    const btnSubmitReg = document.getElementById("btnSubmitReg");
    const btnCancel = document.getElementById("btnCancel");
    const btnReturnLogin = document.getElementById("btnReturnLogin");

    // Next Step: 1 -> 2
    if (btnNextStep) {
        btnNextStep.addEventListener("click", () => {
            const companyName = document.getElementById("regCompanyName") ? document.getElementById("regCompanyName").value.trim() : "";
            const repName = document.getElementById("regRepName") ? document.getElementById("regRepName").value.trim() : "";
            const email = document.getElementById("regEmail") ? document.getElementById("regEmail").value.trim() : "";

            if (!companyName || !repName || !email) {
                alert("Please fill in company name, representative name, and corporate email before proceeding.");
                return;
            }

            if (step1 && step2) {
                step1.style.display = "none";
                step2.style.display = "block";
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    // Previous Step: 2 -> 1
    if (btnPrevStep) {
        btnPrevStep.addEventListener("click", () => {
            if (step1 && step2) {
                step2.style.display = "none";
                step1.style.display = "block";
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    // Cancel Button
    if (btnCancel) {
        btnCancel.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    // Submit Registration: 2 -> Success
    if (btnSubmitReg) {
        btnSubmitReg.addEventListener("click", () => {
            const pass = document.getElementById("regPassword") ? document.getElementById("regPassword").value : "";
            const passConfirm = document.getElementById("regPasswordConfirm") ? document.getElementById("regPasswordConfirm").value : "";
            const agreement = document.getElementById("termsCheckbox");

            if (!pass || pass.length < 6) {
                alert("Please enter a valid password (minimum 6 characters).");
                return;
            }

            if (pass !== passConfirm) {
                alert("Passwords do not match. Please verify.");
                return;
            }

            if (agreement && !agreement.checked) {
                alert("Please accept the Terms of Service and Enterprise Master Services Agreement to proceed.");
                return;
            }

            // Save to pending registrations in roverDB
            try {
                const db = ROVER_DB.get();
                if (!db.pendingRegistrations) db.pendingRegistrations = [];

                const companyName = document.getElementById("regCompanyName") ? document.getElementById("regCompanyName").value.trim() : "Corporate Client";
                const repName = document.getElementById("regRepName") ? document.getElementById("regRepName").value.trim() : "Authorized Liaison";
                const email = document.getElementById("regEmail") ? document.getElementById("regEmail").value.trim() : "client@enterprise.ph";

                db.pendingRegistrations.push({
                    referenceId: "REF-APP-" + Math.floor(100000 + Math.random() * 900000),
                    company: companyName,
                    representative: repName,
                    email: email,
                    submittedAt: new Date().toISOString()
                });
                ROVER_DB.save(db);
            } catch (e) {
                console.error("Could not register in roverDB:", e);
            }

            if (step2 && successStep) {
                step2.style.display = "none";
                successStep.style.display = "block";
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }

    // Return to Login
    if (btnReturnLogin) {
        btnReturnLogin.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    // Drag and drop mock feedback
    const dropBoxes = document.querySelectorAll(".drag-drop-box");
    dropBoxes.forEach(box => {
        box.addEventListener("click", () => {
            const currentSubtext = box.querySelector("div:last-child");
            box.classList.add("file-selected");
            if (currentSubtext) {
                currentSubtext.innerText = "File Selected: Document_Signed.pdf (1.4 MB) ✓";
                currentSubtext.style.color = "#2E7D32";
                currentSubtext.style.fontWeight = "600";
            }
        });
    });
});
