// ---------- THEME TOGGLE ----------
let state = { theme: localStorage.getItem("tms_theme") || "dark" };

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  localStorage.setItem("tms_theme", state.theme);
  lucide.createIcons(); // refresh icons after toggle
}

function initThemeToggle() {
  if (!state.theme) state.theme = "dark";
  applyTheme(state.theme);
  lucide.createIcons(); // render icons on load
}

function applyTheme(theme) {
  const html = document.documentElement;
  const darkIcon = document.querySelector(".dark-icon");
  const lightIcon = document.querySelector(".light-icon");

  if (theme === "light") {
    html.classList.add("light-theme");
    darkIcon?.classList.add("hidden");
    lightIcon?.classList.remove("hidden");
  } else {
    html.classList.remove("light-theme");
    darkIcon?.classList.remove("hidden");
    lightIcon?.classList.add("hidden");
  }
}

// ---------- LOGIN / SIGNUP ----------
document.addEventListener("DOMContentLoaded", () => {
  const signInTab = document.getElementById("signInTab");
  const signUpTab = document.getElementById("signUpTab");
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const formTitle = document.getElementById("formTitle");
  const popupEl = document.getElementById("popup");

  // Toast
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

  // Tabs
  function switchToSignIn() {
    signInTab.classList.add("active");
    signUpTab.classList.remove("active");
    signInForm.classList.remove("hidden");
    signUpForm.classList.add("hidden");
    formTitle.textContent = "Welcome Back 👋";
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

  // Sign Up
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;

    if (!username || !password) {
      showPopup("Please fill username & password");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.msg == "success") {
        showPopup("Account created! Please sign in.", 1500);
        setTimeout(() => switchToSignIn(), 1500);
      } else {
        showPopup(data.message || "Registration failed");
      }
    } catch (err) {
      showPopup("Error connecting to server");
      console.error(err);
    }
  });

  // Sign In
  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signin-username").value.trim();
    const password = document.getElementById("signin-password").value;

    if (!username || !password) {
      showPopup("Please enter username & password");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.msg == "success") {
        showPopup("Login successful — redirecting...", 1200);
        setTimeout(() => (window.location.href = "/index.html"), 1000);
      } else {
        showPopup(data.msg || "Invalid username or password");
      }
    } catch (err) {
      showPopup("Error connecting to server");
      console.error(err);
    }
  });

  // Google buttons
  document.querySelectorAll("#google-signin, #google-signup").forEach((b) => {
    b.addEventListener("click", () => {
      showPopup("Google sign-in not configured yet.");
    });
  });

  // Init theme + icons
  initThemeToggle();
});
