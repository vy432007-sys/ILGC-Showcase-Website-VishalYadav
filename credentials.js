
const role = localStorage.getItem("selectedRole");

const roleTitle = document.getElementById("roleTitle");
const roleDescription = document.getElementById("roleDescription");
const errorMessage = document.getElementById("errorMessage");

const demoAccounts = {
    student: {
        email: "student@demo.com",
        password: "student123",
        dashboard: "student-dashboard.html"
    },

    faculty: {
        email: "faculty@demo.com",
        password: "faculty123",
        dashboard: "faculty-dashboard.html"
    },

    ilgc: {
        email: "mentor@demo.com",
        password: "mentor123",
        dashboard: "ilgc-dashboard.html"
    }
};

// Display the correct login heading
const roleDetails = {
    student: ["Student Demo Login", "Access the student dashboard"],
    faculty: ["Faculty Demo Login", "Access the faculty dashboard"],
    ilgc: ["Mentor Demo Login", "Access the mentor dashboard"]
};

if (!roleDetails[role]) {
    window.location.href = "login.html";
} else {
    roleTitle.textContent = roleDetails[role][0];
    roleDescription.textContent = roleDetails[role][1];
}

function togglePassword() {
    const password = document.getElementById("password");
    const button = document.querySelector(".show-password");

    if (password.type === "password") {
        password.type = "text";
        button.textContent = "Hide";
    } else {
        password.type = "password";
        button.textContent = "Show";
    }
}

// LOCAL DEMO LOGIN
function loginUser(event) {
    event.preventDefault();

    const userId = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value;

    errorMessage.textContent = "";

    const account = demoAccounts[role];

    if (!account) {
        errorMessage.textContent = "Invalid role.";
        return;
    }

    if (
        userId.toLowerCase() !== account.email ||
        password !== account.password
    ) {
        errorMessage.textContent =
            "Invalid demo email or password.";
        return;
    }

    // Save local demo login state
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userId", account.email);
    localStorage.setItem("selectedRole", role);
    localStorage.setItem("demoMode", "true");

    // Open the selected dashboard
    window.location.href = account.dashboard;
}
