function changeRideStatus(newStatus) {
    const statusElement = document.getElementById("rideStatus");

    statusElement.textContent = newStatus;

    alert("Ritstatus gewijzigd naar: " + newStatus);
}