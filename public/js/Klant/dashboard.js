// Wacht tot de pagina geladen is en voeg de event listener toe aan de logout-knop
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            // Verandert de locatie naar de loginpagina buiten de klant-map
            window.location.href = "../login.html"; 
        });
    }
});