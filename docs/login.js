// Theme Management
let state = { 
  theme: localStorage.getItem("subs_theme") || "dark" 
};

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  localStorage.setItem("subs_theme", state.theme);
}

function initThemeToggle() {
  applyTheme(state.theme);
}

function applyTheme(theme) {
  const html = document.documentElement;
  const body = document.body;
  const darkIcon = document.querySelector(".dark-icon");
  const lightIcon = document.querySelector(".light-icon");

  if (theme === "light") {
    html.classList.add("light-theme");
    body.classList.add("light-theme");
    if (darkIcon) darkIcon.classList.add("hidden");
    if (lightIcon) lightIcon.classList.remove("hidden");
  } else {
    html.classList.remove("light-theme");
    body.classList.remove("light-theme");
    if (darkIcon) darkIcon.classList.remove("hidden");
    if (lightIcon) lightIcon.classList.add("hidden");
  }
}

// Password Toggle Function
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const container = field.closest('.password-container');
  const eyeIcon = container.querySelector('.eye-icon');
  const eyeOffIcon = container.querySelector('.eye-off-icon');
  
  if (field.type === 'password') {
    field.type = 'text';
    eyeIcon.classList.add('hidden');
    eyeOffIcon.classList.remove('hidden');
  } else {
    field.type = 'password';
    eyeIcon.classList.remove('hidden');
    eyeOffIcon.classList.add('hidden');
  }
}

// Toast Function
let popupTimeout = null;

function showPopup(message, duration = 3000) {
  const popupEl = document.getElementById("popup");
  clearTimeout(popupTimeout);
  
  popupEl.textContent = message;
  popupEl.classList.add("show");
  popupEl.classList.remove("hidden");
  
  popupTimeout = setTimeout(() => {
    popupEl.classList.remove("show");
    popupEl.classList.add("hidden");
  }, duration);
}

// Tab Management
function switchToSignIn() {
  const signInTab = document.getElementById("signInTab");
  const signUpTab = document.getElementById("signUpTab");
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const formTitle = document.getElementById("formTitle");

  signInTab.classList.add("active");
  signUpTab.classList.remove("active");
  signInForm.classList.remove("hidden");
  signUpForm.classList.add("hidden");
  formTitle.textContent = "Welcome Back 👋";
}

function switchToSignUp() {
  const signInTab = document.getElementById("signInTab");
  const signUpTab = document.getElementById("signUpTab");
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const formTitle = document.getElementById("formTitle");

  signUpTab.classList.add("active");
  signInTab.classList.remove("active");
  signUpForm.classList.remove("hidden");
  signInForm.classList.add("hidden");
  formTitle.textContent = "Create Your Account";
}

// Remember Me Functions
function saveRememberMe(username, password) {
  if (document.getElementById("rememberMe").checked) {
    localStorage.setItem("rememberedUser", JSON.stringify({
      username: username,
      password: password,
      timestamp: Date.now()
    }));
  } else {
    localStorage.removeItem("rememberedUser");
  }
}

function loadRememberMe() {
  const remembered = localStorage.getItem("rememberedUser");
  if (remembered) {
    try {
      const userData = JSON.parse(remembered);
      // Check if data is less than 30 days old
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - userData.timestamp < thirtyDays) {
        document.getElementById("signin-username").value = userData.username;
        document.getElementById("signin-password").value = userData.password;
        document.getElementById("rememberMe").checked = true;
        return true;
      } else {
        // Remove expired data
        localStorage.removeItem("rememberedUser");
      }
    } catch (e) {
      localStorage.removeItem("rememberedUser");
    }
  }
  return false;
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  initThemeToggle();
  
  // Load remembered credentials
  loadRememberMe();

  // Theme toggle button
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Tab buttons
  const signInTab = document.getElementById("signInTab");
  const signUpTab = document.getElementById("signUpTab");
  
  if (signInTab) signInTab.addEventListener("click", switchToSignIn);
  if (signUpTab) signUpTab.addEventListener("click", switchToSignUp);

  // Sign Up Form
  const signUpForm = document.getElementById("signUpForm");
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signup-username").value.trim();
      const password = document.getElementById("signup-password").value;

      if (!username || !password) {
        showPopup("Please fill in all fields");
        return;
      }

      try {
        const res = await fetch(`${api_domain}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.msg == "success") {
          showPopup("Account created! Please sign in.", 2000);
          setTimeout(() => switchToSignIn(), 2000);
          // Clear form
          document.getElementById("signup-username").value = "";
          document.getElementById("signup-password").value = "";
        } else {
          showPopup(data.msg || "Registration failed");
        }
      } catch (err) {
        showPopup("Error connecting to server");
        console.error(err);
      }
    });
  }

  // Sign In Form
  const signInForm = document.getElementById("signInForm");
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signin-username").value.trim();
      const password = document.getElementById("signin-password").value;

      if (!username || !password) {
        showPopup("Please enter username and password");
        return;
      }

      // Save credentials if remember me is checked
      saveRememberMe(username, password);

      try {
        const res = await fetch(`${api_domain}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.msg == "success") {
          showPopup("Login successful — redirecting...", 1500);
          setTimeout(() => {
            // Redirect to home page
            window.location.href = "homepage.html";
          }, 1000);
        } else {
          showPopup(data.msg || "Invalid username or password");
        }
      } catch (err) {
        showPopup("Error connecting to server");
        console.error(err);
      }
    });
  }

  // Google buttons
  const googleButtons = document.querySelectorAll("#google-signin, #google-signup");
  googleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showPopup("Google sign-in coming soon!");
    });
  });
});