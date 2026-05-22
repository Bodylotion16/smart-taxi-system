function changeStatus(newStatus, cardElement) {
    const currentStatus = document.getElementById("currentStatus");

    currentStatus.textContent = newStatus;

    const allCards = document.querySelectorAll(".status-card");

    allCards.forEach(function(card) {
        card.classList.remove("active-status");
    });

    cardElement.classList.add("active-status");

    alert("Je status is gewijzigd naar: " + newStatus);
}