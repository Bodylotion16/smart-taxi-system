// BESTAND: public/js/driver/reviews.js

function createStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? "★" : "☆";
    }
    return stars;
}

async function laadReviewsLive() {
    const tbody = document.getElementById("reviewsTable");
    if (!tbody) return;

    try {
        console.log("🔄 Live reviews opvragen...");
        const response = await fetch('/api/driver/reviews');
        const data = await response.json();

        if (!data.success || !data.reviews || data.reviews.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888; padding: 20px;">Geen beoordelingen gevonden.</td></tr>`;
            document.getElementById("averageRating").textContent = "0.0";
            document.getElementById("totalReviews").textContent = "0";
            document.getElementById("lastRating").textContent = "-";
            return;
        }

        const reviews = data.reviews;
        tbody.innerHTML = "";

        let totalRating = 0;

        reviews.forEach(review => {
            totalRating += review.rating;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${review.date}</td>
                <td>${review.customer}</td>
                <td><span style="color: #f1c40f;">${createStars(review.rating)}</span></td>
                <td>${review.comment || 'Geen opmerking achtergelaten.'}</td>
            `;
            tbody.appendChild(tr);
        });

        // Bereken statistieken live
        const totalReviews = reviews.length;
        const averageRating = (totalRating / totalReviews).toFixed(1);
        const lastRatingStars = createStars(reviews[0].rating);

        document.getElementById("averageRating").textContent = averageRating;
        document.getElementById("totalReviews").textContent = totalReviews;
        document.getElementById("lastRating").textContent = lastRatingStars;

    } catch (err) {
        console.error("❌ Fout bij laden reviews:", err);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Fout bij laden van reviews.</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", laadReviewsLive);