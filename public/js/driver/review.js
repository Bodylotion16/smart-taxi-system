const reviews = [
    {
        date: "20 mei 2026",
        customer: "Anisha",
        rating: 5,
        comment: "Chauffeur was op tijd en vriendelijk."
    },
    {
        date: "19 mei 2026",
        customer: "Simran",
        rating: 4,
        comment: "Goede rit, maar kleine vertraging."
    },
    {
        date: "18 mei 2026",
        customer: "Aman",
        rating: 5,
        comment: "Veilige en comfortabele rit."
    }
];

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

function loadReviewSummary() {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / totalReviews).toFixed(1);
    const lastRating = createStars(reviews[0].rating);

    document.getElementById("averageRating").textContent = averageRating;
    document.getElementById("totalReviews").textContent = totalReviews;
    document.getElementById("lastRating").textContent = lastRating;
}

document.addEventListener("DOMContentLoaded", loadReviewSummary);

