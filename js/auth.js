const API_BASE = "api";

document.addEventListener("DOMContentLoaded", () => {
    const registered = new URLSearchParams(window.location.search).get("registered");
    if (registered === "1") {
        showMessage("formMessage", "Account created. Log in with your username and password.", "success");
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", onLogin);
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", onRegister);
    }

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", onLogout);
        renderDashboard();
    }
});

async function onLogin(event) {
    console.log("onLogin called")

    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    clearMessage("formMessage");

    const username = form.username.value.trim();
    const password = form.password.value;

    if (!username || !password) {
        showMessage("formMessage", "Username and password are required.", "danger");
        return;
    }

    console.log(username, password);

    // if (!isUsername(username)) {
    //     showMessage("formMessage", "Enter a valid username.", "danger");
    //     return;
    // }

    setBusy(submitButton, true);

    try {
        const result = await postJson("login", {
            Username: username,
            Password: password,
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("formMessage", result.payload.message || "Login failed.", "danger");
            return;
        }

        sessionStorage.setItem("contactManagerUser", JSON.stringify(result.payload.data || {}));
        window.location.href = "dashboard.html";
    } catch (error) {
        showMessage("formMessage", "Could not reach the login service.", "danger");
    } finally {
        setBusy(submitButton, false);
    }
}

async function onRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    clearMessage("formMessage");

    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const username = form.username.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!firstName || !lastName || !username || !password) {
        showMessage("formMessage", "First name, last name, username, and password are required.", "danger");
        return;
    }

    // if (!isUsername(username)) {
    //     showMessage("formMessage", "Enter a valid username.", "danger");
    //     return;
    // }

    if (password !== confirmPassword) {
        showMessage("formMessage", "Passwords do not match.", "danger");
        return;
    }

    setBusy(submitButton, true);

    try {
        const result = await postJson("register", {
            FirstName: firstName,
            LastName: lastName,
            Username: username,
            Password: password,
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("formMessage", result.payload.message || "Registration failed.", "danger");
            return;
        }

        window.location.href = "index.html?registered=1";
    } catch (error) {
        showMessage("formMessage", "Could not reach the registration service.", "danger");
    } finally {
        setBusy(submitButton, false);
    }
}

async function onLogout() {
    const button = document.getElementById("logoutButton");
    setBusy(button, true);

    try {
        await postJson("logout", {});
    } catch (error) {
        // Still leave the page if the server is unreachable. The local greeting is not the session.
    }

    sessionStorage.removeItem("contactManagerUser");
    window.location.href = "index.html";
}

function renderDashboard() {
    const greeting = document.getElementById("userGreeting");
    const raw = sessionStorage.getItem("contactManagerUser");
    if (!raw || !greeting) {
        return;
    }

    const loginLink = document.getElementById("loginLink");
    if (loginLink) {
        loginLink.remove();
    }

    try {
        const user = JSON.parse(raw);
        const name = [user.FirstName, user.LastName].filter(Boolean).join(" ");
        greeting.textContent = name ? `Signed in as ${name}` : "Signed in";
    } catch (error) {
        greeting.textContent = "Signed in";
    }
}

async function postJson(path, body) {
    const response = await fetch(`${API_BASE}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    });

    let payload;
    try {
        payload = await response.json();
    } catch (error) {
        payload = { status: "error", message: "Unexpected server response." };
    }

    return { ok: response.ok, payload };
}

// function isUsername(value) {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
// }

function showMessage(id, message, kind) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = `alert alert-${kind}`;
    element.classList.remove("d-none");
}

function clearMessage(id) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }

    element.textContent = "";
    element.className = "alert d-none";
}

function setBusy(button, busy) {
    if (!button) {
        return;
    }

    button.disabled = busy;
}
