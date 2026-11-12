function getDashboardUrl(role) {
    if (role === "faculty") return "faculty-dashboard.html";
    if (role === "ilgc") return "ilgc-dashboard.html";
    return "student-dashboard.html";
}

function selectRole(role) {
    localStorage.setItem("selectedRole", role);
    window.location.href = "credentials.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const logoEl = document.querySelector(".logo");
    if (logoEl) {
        logoEl.style.cursor = "pointer";
        logoEl.addEventListener("click", () => {
            if (localStorage.getItem("loggedIn") === "true") {
                window.location.href = getDashboardUrl(localStorage.getItem("selectedRole"));
            } else {
                window.location.href = "index.html";
            }
        });
    }
});
