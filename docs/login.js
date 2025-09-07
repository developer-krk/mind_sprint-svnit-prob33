// Theme Management
const api_domain = window.api_domain
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
  if (!popupEl) {
    console.error('Popup element not found');
    return;
  }
  
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

  if (!signInTab || !signUpTab || !signInForm || !signUpForm || !formTitle) {
    console.error('Required form elements not found');
    return;
  }

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

  if (!signInTab || !signUpTab || !signInForm || !signUpForm || !formTitle) {
    console.error('Required form elements not found');
    return;
  }

  signUpTab.classList.add("active");
  signInTab.classList.remove("active");
  signUpForm.classList.remove("hidden");
  signInForm.classList.add("hidden");
  formTitle.textContent = "Create Your Account";
}

// Token Management - Centralized
const TokenManager = {
  getToken() {
    return localStorage.getItem('auth_token');
  },
  
  setToken(token) {
    if (!token) {
      console.error('Attempting to set empty token');
      return false;
    }
    localStorage.setItem('auth_token', token);
    return true;
  },
  
  removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('rememberedUser'); // Clear remembered credentials too
  },
  
  hasToken() {
    const token = this.getToken();
    return token && token.length > 0;
  }
};

// Remember Me Functions
function saveRememberMe(username, password) {
  try {
    const rememberMeCheckbox = document.getElementById("rememberMe");
    if (!rememberMeCheckbox) {
      console.warn('Remember me checkbox not found');
      return;
    }

    if (rememberMeCheckbox.checked) {
      const userData = {
        username: username,
        timestamp: Date.now()
      };
      localStorage.setItem("rememberedUser", JSON.stringify(userData));
    } else {
      localStorage.removeItem("rememberedUser");
    }
  } catch (error) {
    console.error('Failed to save remember me data:', error);
  }
}

function loadRememberMe() {
  try {
    const remembered = localStorage.getItem("rememberedUser");
    if (!remembered) return false;

    const userData = JSON.parse(remembered);
    
    // Validate data structure
    if (!userData.username || !userData.password || !userData.timestamp) {
      localStorage.removeItem("rememberedUser");
      return false;
    }

    // Check if data is less than 30 days old
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - userData.timestamp >= thirtyDays) {
      localStorage.removeItem("rememberedUser");
      return false;
    }

    // Load into form
    const usernameField = document.getElementById("signin-username");
    const passwordField = document.getElementById("signin-password");
    const rememberCheckbox = document.getElementById("rememberMe");

    if (!usernameField || !passwordField || !rememberCheckbox) {
      console.warn('Login form elements not found for remember me');
      return false;
    }

    usernameField.value = userData.username;
    passwordField.value = userData.password;
    rememberCheckbox.checked = true;
    
    return true;
  } catch (error) {
    console.error('Failed to load remember me data:', error);
    localStorage.removeItem("rememberedUser");
    return false;
  }
}

// API Helper with better error handling
async function makeAuthRequest(endpoint, options = {}) {
  const url = `${api_domain}${endpoint}`;
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    credentials: 'include',
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle different HTTP status codes
      switch (response.status) {
        case 400:
          throw new Error('Invalid request data');
        case 401:
          throw new Error('Invalid credentials');
        case 403:
          throw new Error('Access forbidden');
        case 404:
          throw new Error('Service not found');
        case 409:
          throw new Error('Username already exists');
        case 429:
          throw new Error('Too many attempts, please try again later');
        case 500:
          throw new Error('Server error, please try again');
        case 503:
          throw new Error('Service temporarily unavailable');
        default:
          throw new Error(`Request failed with status ${response.status}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format');
    }

    const data = await response.json();
    
    // Validate response structure
    if (typeof data.success !== 'boolean') {
      throw new Error('Invalid response structure');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }
    throw error;
  }
}

// Form validation
function validateLoginForm(username, password) {
  const errors = [];
  
  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else if (username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
}

function validateRegistrationForm(username, password) {
  const errors = validateLoginForm(username, password);
  
  // Additional registration validations
  if (username && username.trim().length > 50) {
    errors.push('Username must be less than 50 characters');
  }

  if (password && password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // Check for basic password strength
  if (password && password.length >= 6) {
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }
  }

  return errors;
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
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
        
        const submitButton = signUpForm.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';
        
        try {
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
          }

          const username = document.getElementById("signup-username")?.value?.trim() || '';
          const password = document.getElementById("signup-password")?.value || '';

          // Validate form
          const errors = validateRegistrationForm(username, password);
          if (errors.length > 0) {
            showPopup(errors[0]);
            return;
          }

          const data = await makeAuthRequest('/api/auth/register', {
            body: JSON.stringify({ username, password })
          });

          if (data.success) {
            showPopup("Account created successfully! Please sign in.", 2000);
            setTimeout(() => {
              switchToSignIn();
              // Clear form
              const usernameField = document.getElementById("signup-username");
              const passwordField = document.getElementById("signup-password");
              if (usernameField) usernameField.value = "";
              if (passwordField) passwordField.value = "";
            }, 2000);
          } else {
            showPopup(data.msg || "Registration failed");
          }
        } catch (error) {
          console.error('Registration error:', error);
          showPopup(error.message || "Registration failed");
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        }
      });
    }

    // Sign In Form
    const signInForm = document.getElementById("signInForm");
    if (signInForm) {
      signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitButton = signInForm.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';
        
        try {
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Signing In...';
          }

          const username = document.getElementById("signin-username")?.value?.trim() || '';
          const password = document.getElementById("signin-password")?.value || '';

          // Validate form
          const errors = validateLoginForm(username, password);
          if (errors.length > 0) {
            showPopup(errors[0]);
            return;
          }

          // Save credentials if remember me is checked (before API call)
          saveRememberMe(username, password);

          const data = await makeAuthRequest('/api/auth/login', {
            body: JSON.stringify({ username, password })
          });

          if (data.success && data.token) {
            // Store token securely
            if (TokenManager.setToken(data.token)) {
              showPopup("Login successful — redirecting...", 1500);
              setTimeout(() => {
                window.location.replace("homepage.html");
              }, 1000);
            } else {
              showPopup("Login failed - invalid token received");
            }
          } else {
            showPopup(data.msg || "Invalid username or password");
            // Clear remembered credentials on failed login
            if (!data.success) {
              localStorage.removeItem("rememberedUser");
            }
          }
        } catch (error) {
          console.error('Login error:', error);
          showPopup(error.message || "Login failed");
          // Clear remembered credentials on error
          localStorage.removeItem("rememberedUser");
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        }
      });
    }

    // Google buttons (placeholder functionality)
    const googleButtons = document.querySelectorAll("#google-signin, #google-signup");
    googleButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showPopup("Google sign-in coming soon!");
      });
    });

  } catch (error) {
    console.error('Initialization error:', error);
    showPopup("Application initialization failed");
  }
});