// Logout functionaliteit 
document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "../login.html";
});

// Formulier afhandeling voor het toevoegen van een nieuwe favoriet
document.getElementById("addFavoriteForm").addEventListener("submit", (e) => {
    e.preventDefault(); 

    const name = document.getElementById("locName").value;
    const address = document.getElementById("locAddress").value;

    alert(`Locatie "${name}" succesvol opgeslagen!`);

    document.getElementById("addFavoriteForm").reset();
});