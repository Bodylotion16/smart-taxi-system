function changeRideStatus(newStatus, button) {
    const statusElement = document.getElementById("rideStatus");

    statusElement.textContent = newStatus;

    const buttons = document.querySelectorAll(".driver-status-flow button");

    buttons.forEach(function(btn) {
        btn.classList.remove("selected-status");
    });

    button.classList.add("selected-status");

    if (newStatus === "Rit afgerond") {
        statusElement.classList.add("completed");
    } else {
        statusElement.classList.remove("completed");
    }
}