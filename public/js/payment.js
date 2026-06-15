const urlParams = new URLSearchParams(window.location.search);

const bookingId = urlParams.get("booking_id") || "BK-001";
const amount = urlParams.get("amount") || "0.00";
const method = urlParams.get("method") || "cash";

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("amountDisplay").innerText = parseFloat(amount).toFixed(2);
    document.getElementById("bookingIdDisplay").innerText = "#" + bookingId;
    document.getElementById("methodDisplay").innerText = formatPaymentMethod(method);
    document.getElementById("dateDisplay").innerText = new Date().toLocaleDateString("nl-SR");

    const successMessage = document.getElementById("successMessage");
    if (successMessage) {
        successMessage.style.display = "none";
    }
});

function formatPaymentMethod(paymentMethod) {
    if (paymentMethod === "cash") {
        return "Contant";
    }

    if (paymentMethod === "card") {
        return "Bankpas";
    }

    if (paymentMethod === "online") {
        return "Online betaling";
    }

    return "Contant";
}

function verwerkBetaling() {
    const btn = document.getElementById("payButton");
    const successMsg = document.getElementById("successMessage");
    const badge = document.getElementById("paymentStatus");

    btn.innerText = "Verwerken...";
    btn.disabled = true;

    setTimeout(function () {
        btn.style.display = "none";

        successMsg.style.display = "block";

        badge.innerText = "Betaald";
        badge.style.background = "rgba(34, 197, 94, 0.15)";
        badge.style.color = "#4ade80";
        badge.style.borderColor = "#4ade80";

        setTimeout(function () {
            window.location.href = "../Klant/dashboard.html";
        }, 2000);

    }, 900);
}