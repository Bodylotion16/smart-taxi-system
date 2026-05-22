// Logout functionaliteit
document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "../login.html";
});

// Formulier afhandeling: Persoonlijke Gegevens
document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Je profielgegevens zijn succesvol bijgewerkt!");
});

// Oogje functionaliteit: Wachtwoord tonen / verbergen
document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", function () {
        // Zoek de invoerinput die direct naast (binnen dezelfde wrapper) dit oogje staat
        const passwordInput = this.previousElementSibling;
        
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            this.textContent = "🙈"; // Verander oogje naar aapje/gesloten oog als het zichtbaar is
        } else {
            passwordInput.type = "password";
            this.textContent = "👁️"; // Weer terug naar normaal oogje
        }
    });
});

// Formulier afhandeling: Wachtwoord Wijzigen + Bevestigingscontrole
document.getElementById("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Controleer of de twee nieuwe wachtwoorden gelijk zijn
    if (newPassword !== confirmPassword) {
        alert("Fout: Het nieuwe wachtwoord en de bevestiging komen niet overeen!");
        return; // Stop de uitvoering van de rest van de code
    }

    // Als de controle slaagt:
    alert("Je nieuwe wachtwoord is succesvol opgeslagen!");

    // Maak de wachtwoordvelden en oogjes weer leeg/standaard
    document.getElementById("passwordForm").reset();
    document.querySelectorAll(".toggle-password").forEach(el => el.textContent = "👁️");
});