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

    const userId = document.getElementById("userId").value.trim();
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";

    if (!userId || !password) {
        errorMessage.textContent = "Please enter your User ID and Password.";
        return;
    }

    // Try Supabase auth, but fall back to demo mode if not registered
    try {
        if (window.supabaseClient && window.supabaseClient.auth) {
            const { data: authData, error: authError } =
                await window.supabaseClient.auth.signInWithPassword({
                    email: userId,
                    password: password
                });

            if (authError) {
                console.warn("Supabase auth did not succeed, proceeding with demo login:", authError.message);
            }
        }
    } catch (e) {
        console.warn("Supabase auth bypass for demo login:", e);
    }

    // Save login state for the existing dashboard code
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userId", userId);

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
