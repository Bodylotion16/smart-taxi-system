// Logout functionaliteit
document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "../login.html";
});

// Luisteren naar klikken op de 'Opnieuw' knop
document.getElementById("historyTableBody").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-small")) {
        const row = e.target.closest("tr");
        
        // Haal de tekst uit de tweede kolom (bijv. "Paramaribo Centrum → Zorg en Hoop")
        const routeText = row.cells[1].textContent; 
        
        // Splits de route op het pijltje '→'
        const locations = routeText.split("→");
        
        if (locations.length === 2) {
            const vanLocatie = locations[0].trim();
            const naarLocatie = locations[1].trim();
            
            // Sla de locaties tijdelijk op in het geheugen van de browser
            sessionStorage.setItem("rebookVan", vanLocatie);
            sessionStorage.setItem("rebookNaar", naarLocatie);
            
            // Stuur de klant direct door naar de boekingspagina
            window.location.href = "book-ride.html";
        }
    }
});