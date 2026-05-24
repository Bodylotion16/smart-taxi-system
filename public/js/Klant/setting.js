document.addEventListener("DOMContentLoaded", function () {
    const passwordForm = document.getElementById("passwordForm");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    if (passwordForm) {
        passwordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (newPassword !== confirmPassword) {
                alert("De nieuwe wachtwoorden komen niet overeen.");
                return;
            }

            alert("Wachtwoord is bijgewerkt.");
            passwordForm.reset();
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", function () {
            const confirmed = confirm("Weet je zeker dat je je account wilt deactiveren?");

            if (confirmed) {
                alert("Account is gedeactiveerd.");
            }
        });
    }
});