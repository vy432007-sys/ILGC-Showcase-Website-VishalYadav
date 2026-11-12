const role = localStorage.getItem("selectedRole");

const roleTitle = document.getElementById("roleTitle");
const roleDescription = document.getElementById("roleDescription");

if (role === "faculty") {
    roleTitle.textContent = "ILGC Faculty Login";
    roleDescription.textContent = "Login to access your ILGC faculty dashboard";
}
else if (role === "ilgc") {
    roleTitle.textContent = "Mentor Login";
    roleDescription.textContent = "Login to access the Mentor management portal";
}
else if (role === "student") {
    roleTitle.textContent = "Student Login";
    roleDescription.textContent = "Login to access your student dashboard";
}
else {
    window.location.href = "login.html";
}

const logoEl = document.querySelector(".logo");
if (logoEl) {
    logoEl.style.cursor = "pointer";
    logoEl.addEventListener("click", () => {
        if (localStorage.getItem("loggedIn") === "true") {
            const currentRole = localStorage.getItem("selectedRole");
            if (currentRole === "faculty") window.location.href = "faculty-dashboard.html";
            else if (currentRole === "ilgc") window.location.href = "ilgc-dashboard.html";
            else window.location.href = "student-dashboard.html";
        } else {
            window.location.href = "index.html";
        }
    });
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

async function loginUser(event) {
    event.preventDefault();

    let userId = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";

    // Default if left empty
    if (!userId) {
        if (role === "faculty") {
            userId = "anil.roy@plaksha.edu.in";
        } else if (role === "ilgc") {
            userId = "malini.balakrishnan@plaksha.edu.in";
        } else {
            userId = "param.sharma.ug25@plaksha.edu.in";
        }
    }

    // Resolve user email if matching or custom
    if (window.resolveUserEmail) {
        userId = window.resolveUserEmail(userId, role);
    }

    // Password is bypassed: whatever was typed is accepted!
    // Sign in through our Supabase client
    if (window.supabaseClient && window.supabaseClient.auth) {
        await window.supabaseClient.auth.signInWithPassword({
            email: userId,
            password: password || "demo"
        });
    }

    // Save login state for dashboards
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userId", userId);
    localStorage.setItem("selectedRole", role);

    // Go to the appropriate dashboard
    if (role === "faculty") {
        window.location.href = "faculty-dashboard.html";
    }
    else if (role === "ilgc") {
        window.location.href = "ilgc-dashboard.html";
    }
    else if (role === "student") {
        window.location.href = "student-dashboard.html";
    }
}
