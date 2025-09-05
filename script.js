document.addEventListener("DOMContentLoaded", () => {
    
    const signInTab = document.getElementById("signInTab");
    const signUpTab = document.getElementById("signUpTab");
    const signInForm = document.getElementById("signInForm");
    const signUpForm = document.getElementById("signUpForm");
    const formTitle = document.getElementById("formTitle");
    const themeToggle = document.getElementById("themeToggle");
    const popupEl = document.getElementById("popup");

// popup
    let popupTimeout = null;
    function showPopup(message, miliSecond = 3000) {
        clearTimeout(popupTimeout);
        popupEl.textContent = message;
        popupEl.classList.add("show");
        popupEl.classList.remove("hidden");
        popupTimeout = setTimeout(() => {
            popupEl.classList.remove("show");
            popupEl.classList.add("hidden");
        }, miliSecond);
    }



// theme toggle
    const savedTheme = localStorage.getItem("tms_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.checked = true;
    }
    themeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark");
        const theme = document.body.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("tms_theme", theme);
    });

// switch forms
    function switchToSignIn() {
        signInTab.classList.add("active");
        signUpTab.classList.remove("active");
        signInForm.classList.remove("hidden");
        signUpForm.classList.add("hidden");
        formTitle.textContent = "Sign in to Track My Subs";
    }
    function switchToSignUp() {
        signUpTab.classList.add("active");
        signInTab.classList.remove("active");
        signUpForm.classList.remove("hidden");
        signInForm.classList.add("hidden");
        formTitle.textContent = "Create your account";
    }
    signInTab.addEventListener("click", switchToSignIn);
    signUpTab.addEventListener("click", switchToSignUp);

// sign up action
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("signup-username").value.trim();
        const password = document.getElementById("signup-password").value;

        if (!username || !password) {
            showPopup("Please fill username & password");
            return;
        }

        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                
                setTimeout(() => (window.location.href = "login.html"), 1000);
            } else {
                showPopup(data.message || "Registration failed");
            }
        } catch (err) {
            showPopup("Error connecting to server");
            console.error(err);
        }
    });
// sign in action
    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("signin-username").value.trim();
        const password = document.getElementById("signin-password").value;

        if (!username || !password) {
            showPopup("Please enter username & password");
            return;
        }

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                showPopup("Login successful — redirecting...", 1200);
                setTimeout(() => (window.location.href = "index.html"), 1000);
            } else {
                showPopup(data.message || "Invalid username or password");
            }
        } catch (err) {
            showPopup("Error connecting to server");
            console.error(err);
        }
    });

//google
    const googleBtns = document.querySelectorAll("#google-signin, #google-signup");
    googleBtns.forEach((b) => {
        b.addEventListener("click", () => {
            showPopup("Google sign-in not configured yet.");
        });
    });
});
