function toggleUserStatus(button) {
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

    updateUserCounts();
}

function deleteUser(button, userName) {
    const confirmed = confirm(
        "Weet je zeker dat je " + userName + " wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt."
    );

    if (!confirmed) {
        return;
    }

    const row = button.closest("tr");
    row.remove();

    updateUserCounts();

    alert(userName + " is succesvol verwijderd.");
}

function filterUsers() {
    const searchValue = document.getElementById("searchUser").value.toLowerCase().trim();
    const statusValue = document.getElementById("statusFilter").value;
    const rows = document.querySelectorAll("#userTable tr");

    rows.forEach(function(row) {
        const name = row.dataset.name;
        const email = row.dataset.email;
        const status = row.dataset.status;

        const matchesSearch = name.includes(searchValue) || email.includes(searchValue);
        const matchesStatus = statusValue === "all" || status === statusValue;

        if (matchesSearch && matchesStatus) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function updateUserCounts() {
    const rows = document.querySelectorAll("#userTable tr");
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

    document.getElementById("activeCount").textContent = activeCount;
    document.getElementById("blockedCount").textContent = blockedCount;
}

document.addEventListener("DOMContentLoaded", updateUserCounts);