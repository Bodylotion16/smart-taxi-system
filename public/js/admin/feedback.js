const feedbackItems = {
    "FB-001": {
        id: "FB-001",
        customer: "Simran",
        driver: "Rohit",
        ride: "RT-1043",
        rating: 5,
        message: "De chauffeur was op tijd, reed veilig en was vriendelijk."
    },
    "FB-002": {
        id: "FB-002",
        customer: "Anisha",
        driver: "Aman",
        ride: "RT-1041",
        rating: 4,
        message: "Goede rit, maar de chauffeur kwam een paar minuten later aan."
    },
    "FB-003": {
        id: "FB-003",
        customer: "Aman",
        driver: "Vyaas",
        ride: "RT-1042",
        rating: 3,
        message: "De rit was normaal, maar de communicatie kon beter."
    },
    "FB-004": {
        id: "FB-004",
        customer: "Jayden",
        driver: "Rohit",
        ride: "RT-1039",
        rating: 5,
        message: "Comfortabele rit en nette service."
    }
};

function createStars(rating) {
    let stars = "";

    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += "★";
        } else {
            stars += "☆";
        }
    }

    return stars;
}

function showFeedback(id) {
    const feedback = feedbackItems[id];

    document.getElementById("feedbackId").textContent = feedback.id;
    document.getElementById("feedbackCustomer").textContent = feedback.customer;
    document.getElementById("feedbackDriver").textContent = feedback.driver;
    document.getElementById("feedbackRide").textContent = feedback.ride;
    document.getElementById("feedbackRating").textContent = createStars(feedback.rating);
    document.getElementById("feedbackMessage").textContent = feedback.message;
}

function filterFeedback() {
    const searchValue = document.getElementById("searchFeedback").value.toLowerCase().trim();
    const cards = document.querySelectorAll(".feedback-card");

    cards.forEach(function(card) {
        const customer = card.dataset.customer || "";
        const driver = card.dataset.driver || "";

        if (
            searchValue === "" ||
            customer.includes(searchValue) ||
            driver.includes(searchValue)
        ) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}