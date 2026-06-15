// ==========================================================================
// BESTAND: public/js/klant/setting.js
// FUNCTIONALITEIT: WACHTWOORD WIJZIGEN, NOTIFICATIES EN ACCOUNT DEACTIVATION
// ==========================================================================

const LOGGED_IN_USER_ID = localStorage.getItem('userId') || 1; // Fallback op Anisha

document.addEventListener("DOMContentLoaded", function () {
    initPasswordForm();
    initNotificationSwitches();
    initAccountDeactivation();
    initLogout();
});

// ==========================================================================
// 1. WACHTWOORD WIJZIGEN
// ==========================================================================
function initPasswordForm() {
    const passwordForm = document.getElementById("passwordForm");
    if (!passwordForm) return;

    passwordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            alert("⚠️ De nieuwe wachtwoorden komen niet overeen.");
            return;
        }

        if (newPassword.length < 8) {
            alert("⚠️ Het nieuwe wachtwoord moet minimaal 8 tekens lang zijn.");
            return;
        }

        try {
            const response = await fetch('/api/settings/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: LOGGED_IN_USER_ID,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const result = await response.json();
            if (result.success) {
                alert("🎉 Wachtwoord is succesvol bijgewerkt!");
                passwordForm.reset();
            } else {
                alert("❌ Fout: " + result.message);
            }
        } catch (error) {
            console.error("❌ Fout bij wachtwoord bijwerken:", error);
            alert("Netwerkfout bij het bijwerken van het wachtwoord.");
        }
    });
}

// ==========================================================================
// 2. NOTIFICATIEVOORKEUREN LIVE OPSLAAN
// ==========================================================================
function initNotificationSwitches() {
    const notifyEmail = document.getElementById("notifyEmail");
    const notifySMS = document.getElementById("notifySMS");

    const savePreferences = async () => {
        try {
            await fetch('/api/settings/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: LOGGED_IN_USER_ID,
                    emailNotif: notifyEmail.checked ? 1 : 0,
                    smsNotif: notifySMS.checked ? 1 : 0
                })
            });
            console.log("📡 Notificatievoorkeuren opgeslagen.");
        } catch (error) {
            console.error("❌ Fout bij opslaan voorkeuren:", error);
        }
    };

    notifyEmail?.addEventListener("change", savePreferences);
    notifySMS?.addEventListener("change", savePreferences);
}

// ==========================================================================
// 3. ACCOUNT DEACTIVEREN (DATABASE STATUS UPDATE)
// ==========================================================================
function initAccountDeactivation() {
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    if (!deleteAccountBtn) return;

    deleteAccountBtn.addEventListener("click", async function () {
        const confirmed = confirm("🚨 Weet je absoluut zeker dat je je account wilt deactiveren? Je kunt daarna niet meer inloggen.");

        if (confirmed) {
            try {
                const response = await fetch('/api/settings/deactivate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: LOGGED_IN_USER_ID })
                });

                const result = await response.json();
                if (result.success) {
                    alert("Account is succesvol gedeactiveerd. Je wordt nu uitgelogd.");
                    localStorage.removeItem('userId');
                    window.location.href = '../../auth/login.html';
                } else {
                    alert("Deactiveren mislukt: " + result.message);
                }
            } catch (error) {
                console.error("❌ Fout bij deactiveren account:", error);
            }
        }
    });
}

function initLogout() {
    const logoutLink = document.querySelector(".logout-link");
    logoutLink?.addEventListener("click", () => localStorage.removeItem('userId'));
}