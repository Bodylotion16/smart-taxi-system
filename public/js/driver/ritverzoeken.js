function acceptRide(customerName) {
    alert("Rit van " + customerName + " is geaccepteerd.");
}

function declineRide(customerName) {
    alert("Rit van " + customerName + " is geweigerd.");
}
function acceptRide(statusId) {
    const statusElement = document.getElementById(statusId);

    statusElement.textContent = "Geaccepteerd";
    statusElement.style.color = "#4ade80";
    statusElement.style.borderColor = "#4ade80";
    statusElement.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
}

function declineRide(statusId) {
    const statusElement = document.getElementById(statusId);

    statusElement.textContent = "Geweigerd";
    statusElement.style.color = "#f87171";
    statusElement.style.borderColor = "#f87171";
    statusElement.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
}