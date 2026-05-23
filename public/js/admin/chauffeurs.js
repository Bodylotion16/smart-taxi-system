function toggleDriverStatus(button) {
    const row = button.closest("tr");
    const statusBadge = row.querySelector(".status");

    if (row.dataset.status === "active") {
        row.dataset.status = "blocked";

        statusBadge.textContent = "Geblokkeerd";
        statusBadge.classList.remove("active");
        statusBadge.classList.add("blocked");

        button.textContent = "Deblokkeren";
        button.classList.remove("btn-warning");
        button.classList.add("btn-success");
    } else {
        row.dataset.status = "active";

        statusBadge.textContent = "Actief";
        statusBadge.classList.remove("blocked");
        statusBadge.classList.add("active");

        button.textContent = "Blokkeren";
        button.classList.remove("btn-success");
        button.classList.add("btn-warning");
    }

    updateDriverCounts();
}

function deleteDriver(button, driverName) {
    const confirmed = confirm(
        "Weet je zeker dat je " + driverName + " wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt."
    );

    if (!confirmed) {
        return;
    }

    const row = button.closest("tr");
    row.remove();

    updateDriverCounts();

    alert(driverName + " is succesvol verwijderd.");
}

function filterDrivers() {
    const searchValue = document.getElementById("searchDriver").value.toLowerCase().trim();
    const statusValue = document.getElementById("driverStatusFilter").value;
    const rows = document.querySelectorAll("#driverTable tr");

    rows.forEach(function(row) {
        const name = row.dataset.name || "";
        const plate = row.dataset.plate || "";
        const status = row.dataset.status || "";

        const matchesSearch = searchValue === "" || name.includes(searchValue) || plate.includes(searchValue);
        const matchesStatus = statusValue === "all" || status === statusValue;

        row.style.display = matchesSearch && matchesStatus ? "table-row" : "none";
    });
}

function updateDriverCounts() {
    const rows = document.querySelectorAll("#driverTable tr");
    let activeCount = 0;
    let blockedCount = 0;

    rows.forEach(function(row) {
        if (row.dataset.status === "active") {
            activeCount++;
        }

        if (row.dataset.status === "blocked") {
            blockedCount++;
        }
    });

    document.getElementById("totalDrivers").textContent = rows.length;
    document.getElementById("activeDrivers").textContent = activeCount;
    document.getElementById("blockedDrivers").textContent = blockedCount;
}

document.addEventListener("DOMContentLoaded", updateDriverCounts);