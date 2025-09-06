// Icon setup
const iconize = () => {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        stroke: "currentColor",
        "stroke-width": 1.5,
        width: 18,
        height: 18,
      },
    });
  }
};

// Initialize Lucide icons if not already initialized
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

// API Configuration
const API_BASE = window.api_domain || "http://localhost:3000";

// Token Management - Centralized (matching login.js)
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

// ---------------- AUTH HELPERS ----------------
function makeAuthenticatedRequest(url, options = {}) {
  const token = TokenManager.getToken();

  if (!token) {
    window.location.replace('login.html');
    return Promise.reject(new Error('No authentication token'));
  }

  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  return fetch(url, authOptions);
}

async function checkAuth() {
  if (!TokenManager.hasToken()) {
    window.location.replace('login.html');
    return false;
  }

  try {
    const response = await makeAuthenticatedRequest(`${API_BASE}/api/user`);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        TokenManager.removeToken();
        window.location.replace('login.html');
        return false;
      }
      throw new Error(`Auth check failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      TokenManager.removeToken();
      window.location.replace('login.html');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    TokenManager.removeToken();
    window.location.replace('login.html');
    return false;
  }
}

function logout() {
  TokenManager.removeToken();
  window.location.replace('login.html');
}

// User dropdown functionality
document.addEventListener("DOMContentLoaded", function () {
  
  const userDropdownButton = document.getElementById("userDropdownButton");
  const userDropdown = document.getElementById("userDropdown");
  const logoutButton = document.getElementById("logoutButton");

  if (userDropdownButton && userDropdown) {
    // Toggle dropdown
    userDropdownButton.addEventListener("click", function (e) {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !userDropdownButton.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userDropdown.classList.add("hidden");
      }
    });

    // Handle logout
    if (logoutButton) {
      logoutButton.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
      });
    }
  }
});

// Utilities
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (v, cur = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(
    v
  );
const daysBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));
const addDays = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) =>
  new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const addYears = (d, n) =>
  new Date(d.getFullYear() + n, d.getMonth(), d.getDate());
const addWeeks = (d, n) => addDays(d, n * 7);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const uid = () => Math.random().toString(36).slice(2, 10);

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = TokenManager.getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Unauthorized - redirect to login
        TokenManager.removeToken();
        window.location.replace('login.html');
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Storage - now uses API instead of localStorage
let state = {
  currency: "USD",
  reminders: true,
  items: [],
};

async function load() {
  try {
    // Load subscriptions from API
    const currency = localStorage.getItem('preferredCurrency') || 'USD';
    const subscriptions = await apiRequest(`/api/dashboard?currency=${currency}`);
    
    // Transform backend data to match frontend format
    state.items = subscriptions.map(transformBackendToFrontend);
    state.currency = currency;
    state.reminders = localStorage.getItem('reminders') !== 'false';
    
    return state;
  } catch (error) {
    console.error('Failed to load subscriptions:', error);
    toast('Failed to load subscriptions');
    return state;
  }
}

function transformBackendToFrontend(backendSub) {
  return {
    id: backendSub._id,
    name: backendSub.name,
    amount: backendSub.price,
    currency: backendSub.currency,
    cycle: {
      type: mapBillingCycleToType(backendSub.billingCycle, backendSub.customCycle, backendSub.customUnit),
      interval: backendSub.customCycle || 1,
      unit: backendSub.customUnit || "months",
    },
    next: formatDateForFrontend(backendSub.renewalDate),
    payment: backendSub.paymentMethod || "Not Specified",
    category: Array.isArray(backendSub.category) && backendSub.category.length > 0 
      ? backendSub.category[0] 
      : "Uncategorized",
    status: capitalizeStatus(backendSub.status),
    notes: backendSub.Notes || "",
    color: backendSub.accentColor || "#22c55e",
    reminder: true,
  };
}

function transformFrontendToBackend(frontendSub) {
  const billingInfo = mapTypeToBillingCycle(frontendSub.cycle);
  
  return {
    name: frontendSub.name,
    price: frontendSub.amount,
    renewalDate: frontendSub.next,
    currency: frontendSub.currency,
    paymentMethod: frontendSub.payment,
    category: frontendSub.category && frontendSub.category.trim() !== "" 
      ? [frontendSub.category.trim()] 
      : ["Uncategorized"],
    status: frontendSub.status.toLowerCase(),
    accentColor: frontendSub.color,
    Notes: frontendSub.notes,
    billingCycle: billingInfo.billingCycle,
    customCycle: billingInfo.customCycle,
    customUnit: billingInfo.customUnit,
  };
}
function mapBillingCycleToType(billingCycle, customCycle, customUnit) {
  switch (billingCycle) {
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
    case 'weekly': return 'Weekly';
    case 'daily': return 'Daily';
    case 'custom': return 'Custom';
    default: return 'Monthly';
  }
}

function mapTypeToBillingCycle(cycle) {
  switch (cycle.type) {
    case 'Monthly': return { billingCycle: 'monthly', customCycle: 1, customUnit: 'months' };
    case 'Yearly': return { billingCycle: 'yearly', customCycle: 1, customUnit: 'years' };
    case 'Weekly': return { billingCycle: 'weekly', customCycle: 1, customUnit: 'weeks' };
    case 'Daily': return { billingCycle: 'daily', customCycle: 1, customUnit: 'days' };
    case 'Custom': return { 
      billingCycle: 'custom', 
      customCycle: cycle.interval || 1, 
      customUnit: cycle.unit || 'months' 
    };
    default: return { billingCycle: 'monthly', customCycle: 1, customUnit: 'months' };
  }
}

function capitalizeStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatDateForFrontend(dateString) {
  return new Date(dateString).toISOString().slice(0, 10);
}

async function save() {
  try {
    // Save preferences to localStorage
    localStorage.setItem('preferredCurrency', state.currency);
    localStorage.setItem('reminders', state.reminders);
    
    // Note: Individual subscription saves are handled in specific functions
    render();
    toast("Settings saved");
  } catch (error) {
    console.error('Failed to save settings:', error);
    toast('Failed to save settings');
  }
}

async function saveSubscription(subscription, isEdit = false) {
  try {
    const backendData = transformFrontendToBackend(subscription);
    
    if (isEdit) {
      // Update existing subscription
      await apiRequest(`/api/dashboard/${subscription.id}`, {
        method: 'PATCH',
        body: backendData,
      });
    } else {
      // Create new subscription
      const response = await apiRequest('/api/dashboard/addSub', {
        method: 'POST',
        body: backendData,
      });
      
      // Update the subscription ID with the backend-generated ID
      const existingIndex = state.items.findIndex(item => item.id === subscription.id);
      if (existingIndex !== -1) {
        state.items[existingIndex].id = response.sub._id;
      }
    }
    
    toast(isEdit ? "Subscription updated" : "Subscription added");
    await load(); // Reload data from backend
  } catch (error) {
    console.error('Failed to save subscription:', error);
    toast('Failed to save subscription');
  }
}

async function deleteSubscription(id) {
  try {
    await apiRequest(`/api/dashboard/${id}`, {
      method: 'DELETE',
    });
    
    state.items = state.items.filter(item => item.id !== id);
    toast("Subscription deleted");
    render();
  } catch (error) {
    console.error('Failed to delete subscription:', error);
    toast('Failed to delete subscription');
  }
}

// Derived data
function monthlyEquivalent(item) {
  const amt = Number(item.amount || 0);
  const {
    type,
    interval = 1,
    unit = "months",
  } = item.cycle || { type: "Monthly", interval: 1, unit: "months" };
  if (type === "Monthly") return amt;
  if (type === "Weekly") return (amt * 52) / 12;
  if (type === "Yearly") return amt / 12;
  if (type === "Daily") return amt * 30;
  if (type === "Custom") {
    if (unit === "days") return amt * (30 / (interval || 1));
    if (unit === "weeks") return (amt * (52 / 12)) / (interval || 1);
    if (unit === "months") return amt / (interval || 1);
    if (unit === "years") return amt / 12 / (interval || 1);
  }
  return amt;
}

function nextAfter(item, fromDate = new Date()) {
  try {
    let next = new Date(item.next);
    if (isNaN(next)) return null;
    const {
      type,
      interval = 1,
      unit = "months",
    } = item.cycle || { type: "Monthly", interval: 1, unit: "months" };
    let guard = 0;
    while (next < fromDate && guard < 200) {
      if (type === "Monthly") next = addMonths(next, 1);
      else if (type === "Yearly") next = addYears(next, 1);
      else if (type === "Weekly") next = addWeeks(next, 1);
      else if (type === "Daily") next = addDays(next, 1);
      else if (type === "Custom") {
        if (unit === "days") next = addDays(next, interval);
        if (unit === "weeks") next = addWeeks(next, interval);
        if (unit === "months") next = addMonths(next, interval);
        if (unit === "years") next = addYears(next, interval);
      } else next = addMonths(next, 1);
      guard++;
    }
    return next;
  } catch {
    return null;
  }
}

// UI rendering
let categoryChart, trendChart;

async function render() {
  iconize();

  // Filters and search
  const term = qs("#searchInput").value.trim().toLowerCase();
  const fCat = qs("#filterCategory").value;
  const fStatus = qs("#filterStatus").value;
  const fPay = qs("#filterPayment").value;

  // Prepare options for filters
  hydrateFilterOptions();

  // Filtered items
  let items = state.items.slice();
  if (term)
    items = items.filter(
      (x) =>
        x.name.toLowerCase().includes(term) ||
        (x.category || "").toLowerCase().includes(term)
    );
  if (fCat) items = items.filter((x) => (x.category || "") === fCat);
  if (fStatus) items = items.filter((x) => (x.status || "Active") === fStatus);
  if (fPay) items = items.filter((x) => (x.payment || "") === fPay);

  renderKPIs(items);
  renderUpcoming(items);
  renderList(items);
  renderCharts(items);
  renderSidebar(items);
  updateGlobalToggles();
}

function hydrateFilterOptions() {
  const cats = [
    ...new Set(state.items.map((i) => i.category).filter(Boolean)),
  ].sort();
  const pays = [
    ...new Set(state.items.map((i) => i.payment).filter(Boolean)),
  ].sort();
  const catSel = qs("#filterCategory");
  const paySel = qs("#filterPayment");
  const currentCat = catSel.value;
  const currentPay = paySel.value;
  catSel.innerHTML =
    '<option value="">All</option>' +
    cats.map((c) => `<option>${escapeHtml(c)}</option>`).join("");
  paySel.innerHTML =
    '<option value="">All</option>' +
    pays.map((c) => `<option>${escapeHtml(c)}</option>`).join("");
  catSel.value = currentCat || "";
  paySel.value = currentPay || "";
}
function renderKPIs(items) {
  const active = items.filter((i) => i.status === "Active");
  const monthly = active.reduce((s, i) => s + monthlyEquivalent(i), 0);
  const upcoming = countUpcoming(items, 30);
  const potentialSavings = items
    .filter((i) => i.status !== "Active")
    .reduce((s, i) => s + monthlyEquivalent(i), 0);

  qs("#kpiMonthly").textContent = fmt(monthly, state.currency);
  qs("#kpiActive").textContent = active.length;
  qs("#kpiUpcoming").textContent = upcoming.count;
  qs("#kpiSavings").textContent = fmt(potentialSavings, state.currency);

  // Fake change %
  const delta = clamp(Math.round((Math.random() * 6 - 3) * 10) / 10, -8, 8);
  const el = qs("#kpiMonthlyChange");
  el.textContent = `${delta > 0 ? "+" : ""}${delta}% vs last month`;
  el.className =
    "text-[11px] mt-2 " + (delta >= 0 ? "text-emerald-400" : "text-rose-400");
}

function renderSidebar(items) {
  const monthly = items
    .filter((i) => i.status === "Active")
    .reduce((s, i) => s + monthlyEquivalent(i), 0);
  const target = 200; // arbitrary goal
  qs("#sidebarMonthly").textContent = fmt(monthly, state.currency);
  const pct = clamp(Math.round((monthly / target) * 100), 0, 100);
  qs("#sidebarProgress").style.width = pct + "%";
}

function countUpcoming(items, withinDays = 30) {
  const now = new Date();
  const end = addDays(now, withinDays);
  const list = [];
  for (const i of items) {
    const next = nextAfter(i, now);
    if (!next) continue;
    if (next <= end) list.push({ item: i, next });
  }
  return { count: list.length, list: list.sort((a, b) => a.next - b.next) };
}

function renderUpcoming(items) {
  const skipPaused = qs("#skipPaused").classList.contains("active");
  const within = countUpcoming(items, 30).list.filter(
    (e) => !skipPaused || e.item.status === "Active"
  );
  const el = qs("#upcomingList");
  if (within.length === 0) {
    el.innerHTML = `<div class="px-3 py-10 text-center text-[13px] text-slate-400">No upcoming charges in the next 30 days.</div>`;
    return;
  }
  el.innerHTML = within
    .map(({ item, next }) => {
      const days = daysBetween(new Date(), next);
      const dot = `<span class="h-2 w-2 rounded-full" style="background:${
        item.color || "#64748b"
      }"></span>`;
      return `
            <div class="flex items-center justify-between gap-2 px-3 py-3 hover:bg-white/[0.04] transition">
              <div class="flex items-center gap-3 min-w-0">
                ${dot}
                <div class="min-w-0">
                  <div class="text-[13px] font-medium truncate">${escapeHtml(
                    item.name
                  )}</div>
                  <div class="text-[11px] text-slate-400 truncate">${escapeHtml(
                    item.category || "Uncategorized"
                  )} • ${escapeHtml(item.payment || "—")}</div>
                </div>
              </div>
              <div class="flex items-center gap-5">
                <div class="text-right">
                  <div class="text-[13px] font-medium">${fmt(
                    item.amount,
                    item.currency || state.currency
                  )}</div>
                  <div class="text-[11px] text-slate-400">${formatDate(
                    next
                  )} • in ${days}d</div>
                </div>
                <button data-id="${
                  item.id
                }" class="payNow h-9 w-9 grid place-items-center rounded-md border border-white/10 hover:border-white/20 hover:bg-white/5">
                  <i data-lucide="alarm-clock" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
    })
    .join("");
  iconize();
  qsa(".payNow", el).forEach((b) =>
    b.addEventListener("click", () => toast("Reminder scheduled"))
  );
}

function renderList(items) {
  // Apply sorting first
  const sortedItems = applySort(items);
  
  const list = qs("#subsList");
  list.innerHTML = sortedItems
    .map((i) => {
      const next = nextAfter(i);
      const statusClr =
        i.status === "Active"
          ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
          : i.status === "Paused"
          ? "text-amber-300 bg-amber-400/10 border-amber-400/20"
          : "text-slate-300 bg-slate-400/10 border-slate-400/20";
      const dot = `<span class="h-2 w-2 rounded-full" style="background:${
        i.color || "#64748b"
      }"></span>`;
      return `
            <div class="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-white/[0.03] transition items-center">
              <div class="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                ${dot}
                <div class="min-w-0">
                  <div class="text-[13px] font-medium truncate">${escapeHtml(
                    i.name
                  )}</div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] px-2 py-0.5 rounded-full border ${statusClr}">${
        i.status
      }</span>
                    <span class="text-[11px] text-slate-400 truncate">${escapeHtml(
                      i.category || "Uncategorized"
                    )}</span>
                  </div>
                </div>
              </div>
              <div class="col-span-6 sm:col-span-2">
                <div class="text-[13px] font-medium">${fmt(
                  i.amount,
                  i.currency || state.currency
                )}</div>
                <div class="text-[11px] text-slate-400">${
                  i.cycle?.type || "Monthly"
                }</div>
              </div>
              <div class="col-span-6 sm:col-span-2">
                <div class="text-[13px] font-medium">${
                  next ? formatDate(next) : "—"
                }</div>
                <div class="text-[11px] text-slate-400">${
                  next ? relative(next) : ""
                }</div>
              </div>
              <div class="hidden sm:block col-span-2">
                <div class="text-[13px] font-medium truncate">${escapeHtml(
                  i.payment || "—"
                )}</div>
                <div class="text-[11px] text-slate-400">${escapeHtml(
                  i.notes || ""
                )}</div>
              </div>
              <div class="col-span-12 sm:col-span-1 flex sm:justify-end gap-2 mt-2 sm:mt-0">
                <button data-id="${
                  i.id
                }" class="toggleBtn h-9 w-9 grid place-items-center rounded-md border border-white/10 hover:border-white/20 hover:bg-white/5" title="${
        i.status === "Active" ? "Pause" : "Resume"
      }">
                  <i data-lucide="${
                    i.status === "Active" ? "pause" : "play"
                  }" class="w-4 h-4"></i>
                </button>
                <button data-id="${
                  i.id
                }" class="editBtn h-9 w-9 grid place-items-center rounded-md border border-white/10 hover:border-white/20 hover:bg-white/5" title="Edit">
                  <i data-lucide="pen-line" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
    })
    .join("");
  iconize();

  qsa(".toggleBtn", list).forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.preventDefault();
      const id = b.getAttribute("data-id");
      const it = state.items.find((x) => x.id === id);
      if (!it) return;
      
      // Store original status in case we need to revert
      const originalStatus = it.status;
      it.status = it.status === "Active" ? "Paused" : "Active";
      
      try {
        await saveSubscription(it, true);
        toast(`Subscription ${it.status.toLowerCase()}`);
      } catch (error) {
        console.error('Failed to toggle subscription:', error);
        // Revert the status change
        it.status = originalStatus;
        toast('Failed to update subscription');
        render(); // Re-render to show reverted state
      }
    })
  );
  qsa(".editBtn", list).forEach((b) =>
    b.addEventListener("click", () => openDrawer(b.getAttribute("data-id")))
  );
}

function renderCharts(items) {
  // Category chart
  const catMap = {};
  items.forEach((i) => {
    const k = i.category || "Other";
    catMap[k] = (catMap[k] || 0) + monthlyEquivalent(i);
  });
  const labels = Object.keys(catMap);
  const values = Object.values(catMap);
  const colors = labels.map((l) => pickColor(l));

  const catCtx = qs("#categoryChart").getContext("2d");
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(catCtx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#0B0F15",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${fmt(ctx.raw, state.currency)}`,
          },
        },
      },
      cutout: "60%",
    },
  });

  // Trend chart
  const monthsBack = 11;
  const now = new Date();
  const labels2 = [];
  const data2 = [];
  for (let i = monthsBack; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels2.push(d.toLocaleString(undefined, { month: "short" }));
    // assume same monthly equivalent across months
    const monthSpend = items
      .filter((x) => x.status !== "Cancelled")
      .reduce((s, x) => s + monthlyEquivalent(x), 0);
    data2.push(Math.max(0, Math.round(monthSpend * 100) / 100));
  }
  const trCtx = qs("#trendChart").getContext("2d");
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(trCtx, {
    type: "line",
    data: {
      labels: labels2,
      datasets: [
        {
          data: data2,
          tension: 0.35,
          borderColor: "rgba(59, 130, 246, 0.9)",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          fill: true,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "rgba(255,255,255,0.6)", font: { size: 11 } },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "rgba(255,255,255,0.6)",
            font: { size: 11 },
            callback: (v) => fmt(v, state.currency),
          },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function updateGlobalToggles() {
  // reminders toggle
  const g = qs("#globalReminders");
  if (!g) return; // Safety check
  
  if (state.reminders) {
    g.classList.add("bg-emerald-400/20", "border-emerald-400/30");
    g.classList.remove("bg-white/10");
    const dot = qs(".dot", g);
    if (dot) {
      dot.style.transform = "translateX(20px)";
      dot.classList.add("bg-emerald-300");
    }
  } else {
    g.classList.remove("bg-emerald-400/20", "border-emerald-400/30");
    g.classList.add("bg-white/10");
    const dot = qs(".dot", g);
    if (dot) {
      dot.style.transform = "translateX(2px)";
      dot.classList.remove("bg-emerald-300");
    }
  }
}

function openDrawer(id = null) {
  const overlay = qs("#drawer");
  overlay.classList.remove("hidden");
  const isEdit = !!id;
  qs("#drawerTitle").textContent = isEdit
    ? "Edit Subscription"
    : "Add Subscription";
  qs("#deleteBtn").classList.toggle("hidden", !isEdit);
  fillForm(id);
  iconize();
}

function closeDrawer() {
  qs("#drawer").classList.add("hidden");
}

function fillForm(id) {
  const d = id ? state.items.find((x) => x.id === id) : null;
  qs("#subId").value = d ? d.id : "";
  qs("#subName").value = d?.name || "";
  qs("#subAmount").value = d?.amount ?? "";
  qs("#subCurrency").value = d?.currency || state.currency || "USD";
  qs("#subCycle").value = d?.cycle?.type || "Monthly";
  qs("#subInterval").value = d?.cycle?.interval || 1;
  qs("#subUnit").value = d?.cycle?.unit || "months";
  qs("#subNext").value = d?.next || new Date().toISOString().slice(0, 10);
  qs("#subPayment").value = d?.payment || "";
  qs("#subCategory").value = d?.category || "";
  qs("#subStatus").value = d?.status || "Active";
  qs("#subNotes").value = d?.notes || "";
  qs("#subColor").value = d?.color || "#22c55e";
  setToggle(qs("#subReminder"), d ? !!d.reminder : true);
  toggleCustomCycle();
}

function setToggle(btn, on) {
  if (!btn) return; // Safety check
  
  if (on) {
    btn.classList.add("bg-emerald-400/20", "border-emerald-400/30");
    btn.classList.remove("bg-white/10");
    const dot = qs(".dot", btn);
    if (dot) {
      dot.style.transform = "translateX(20px)";
      dot.classList.add("bg-emerald-300");
    }
    btn.dataset.on = "1";
  } else {
    btn.classList.remove("bg-emerald-400/20", "border-emerald-400/30");
    btn.classList.add("bg-white/10");
    const dot = qs(".dot", btn);
    if (dot) {
      dot.style.transform = "translateX(2px)";
      dot.classList.remove("bg-emerald-300");
    }
    btn.dataset.on = "0";
  }
}

function toggleCustomCycle() {
  const v = qs("#subCycle").value;
  qs("#customCycleWrap").classList.toggle("opacity-50", v !== "Custom");
  qsa("#customCycleWrap input, #customCycleWrap select").forEach(
    (el) => (el.disabled = v !== "Custom")
  );
}

function gatherForm() {
  return {
    id: qs("#subId").value || uid(),
    name: qs("#subName").value.trim(),
    amount: parseFloat(qs("#subAmount").value || "0"),
    currency: qs("#subCurrency").value,
    cycle: {
      type: qs("#subCycle").value,
      interval: parseInt(qs("#subInterval").value || "1", 10),
      unit: qs("#subUnit").value,
    },
    next: qs("#subNext").value,
    payment: qs("#subPayment").value.trim(),
    category: qs("#subCategory").value.trim(),
    status: qs("#subStatus").value,
    notes: qs("#subNotes").value.trim(),
    color: qs("#subColor").value,
    reminder: qs("#subReminder").dataset.on === "1",
  };
}

// Formatting
function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relative(d) {
  const days = daysBetween(new Date(), d instanceof Date ? d : new Date(d));
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${Math.abs(days)}d ago`;
}

function pickColor(key) {
  const palette = [
    "#60a5fa",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#a78bfa",
    "#14b8a6",
    "#f97316",
    "#eab308",
    "#38bdf8",
    "#f472b6",
  ];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9973;
  return palette[h % palette.length];
}

// Toast - Fixed to not reload page
let toastTimer;
function toast(msg) {
  const t = qs("#toast");
  if (!t) return;
  
  const messageDiv = qs("div", t);
  if (messageDiv) {
    messageDiv.textContent = msg;
  }
  
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { 
    t.classList.add("hidden");
  }, 1400);
}

// Sorting - Fixed
let currentSort = null;
function applySort(items) {
  if (!currentSort) return items;
  const sorted = items.slice();
  if (currentSort === "name")
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (currentSort === "amount") sorted.sort((a, b) => b.amount - a.amount);
  if (currentSort === "status")
    sorted.sort((a, b) => a.status.localeCompare(b.status));
  if (currentSort === "next")
    sorted.sort(
      (a, b) => (nextAfter(a) || new Date('9999-12-31')) - (nextAfter(b) || new Date('9999-12-31'))
    );
  return sorted;
}

// Theme functions - Fixed
function toggleTheme() {
  const currentTheme = state.theme || localStorage.getItem('theme') || "dark";
  state.theme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  localStorage.setItem('theme', state.theme);
}

function initThemeToggle() {
  // Initialize theme from localStorage or default to dark
  state.theme = localStorage.getItem('theme') || "dark";
  applyTheme(state.theme);
}

function applyTheme(theme) {
  const html = document.documentElement;
  const body = document.body;
  const darkIcon = qs(".dark-icon");
  const lightIcon = qs(".light-icon");

  if (theme === "light") {
    html.classList.add("light-theme");
    body.classList.add("light-theme");
    // Toggle icon visibility
    if (darkIcon) darkIcon.classList.add("hidden");
    if (lightIcon) lightIcon.classList.remove("hidden");
  } else {
    html.classList.remove("light-theme");
    body.classList.remove("light-theme");
    // Toggle icon visibility
    if (darkIcon) darkIcon.classList.remove("hidden");
    if (lightIcon) lightIcon.classList.add("hidden");
  }
}

// Events
window.addEventListener("DOMContentLoaded", async () => {
  // Check authentication first
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return; // Auth check will redirect to login
  }

  iconize();
  initThemeToggle();
  
  // Load data from backend
  await load();
  
  // Default currency
  qs("#currencySelect").value = state.currency;
  
  // Render
  render();

  // Search
  qs("#searchInput").addEventListener("input", render);

  // Filters
  qs("#filterCategory").addEventListener("change", render);
  qs("#filterStatus").addEventListener("change", render);
  qs("#filterPayment").addEventListener("change", render);
  qs("#clearFilters").addEventListener("click", () => {
    qs("#filterCategory").value = "";
    qs("#filterStatus").value = "";
    qs("#filterPayment").value = "";
    render();
  });
  qs("#skipPaused").addEventListener("click", (e) => {
    e.currentTarget.classList.toggle("active");
    e.currentTarget.classList.toggle("border-white/10");
    e.currentTarget.classList.toggle("border-emerald-400/30");
    e.currentTarget.classList.toggle("bg-emerald-400/10");
    render();
  });
  
  // Sorting - Fixed event listeners with proper toggle
  qsa(".sortBtn").forEach((b) =>
    b.addEventListener("click", (e) => {
      const sortType = e.currentTarget.dataset.sort;
      
      if (currentSort === sortType) {
        // Same button clicked - toggle direction or clear
        if (sortDirection === 'asc') {
          sortDirection = 'desc';
        } else {
          // Clear sorting
          currentSort = null;
          sortDirection = 'asc';
          qsa(".sortBtn").forEach((x) => {
            x.classList.remove("border-emerald-400/30", "bg-emerald-400/10");
            x.querySelector('.sort-indicator')?.remove();
          });
          render();
          return;
        }
      } else {
        // New button clicked
        currentSort = sortType;
        sortDirection = 'asc';
      }
      
      // Update button styles
      qsa(".sortBtn").forEach((x) => {
        x.classList.remove("border-emerald-400/30", "bg-emerald-400/10");
        x.querySelector('.sort-indicator')?.remove();
      });
      
      e.currentTarget.classList.add("border-emerald-400/30", "bg-emerald-400/10");
      
      // Add sort direction indicator
      const indicator = document.createElement('span');
      indicator.className = 'sort-indicator ml-1 text-xs';
      indicator.textContent = sortDirection === 'asc' ? '↑' : '↓';
      e.currentTarget.appendChild(indicator);
      
      render();
    })
  );

  // Add/Edit
  qs("#addBtn").addEventListener("click", () => openDrawer());
  qs("#drawerClose").addEventListener("click", closeDrawer);
  qs("#cancelBtn").addEventListener("click", closeDrawer);
  qs("#subCycle").addEventListener("change", toggleCustomCycle);
  qs("#subReminder").addEventListener("click", (e) =>
    setToggle(e.currentTarget, !(e.currentTarget.dataset.on === "1"))
  );

  qs("#subForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = gatherForm();
    if (!d.name) return;
    
    const existing = state.items.find((x) => x.id === d.id);
    if (existing) {
      Object.assign(existing, d);
      await saveSubscription(d, true);
    } else {
      state.items.unshift(d);
      await saveSubscription(d, false);
    }
    closeDrawer();
  });

  qs("#deleteBtn").addEventListener("click", async () => {
    const id = qs("#subId").value;
    if (!id) return;
    await deleteSubscription(id);
    closeDrawer();
  });

  // Bulk operations
  qs("#bulkPause").addEventListener("click", async () => {
    const updates = [];
    state.items.forEach((i) => {
      if (i.status === "Active") {
        i.status = "Paused";
        updates.push(saveSubscription(i, true));
      }
    });
    await Promise.all(updates);
    toast("All subscriptions paused");
  });
  
  qs("#bulkResume").addEventListener("click", async () => {
    const updates = [];
    state.items.forEach((i) => {
      if (i.status !== "Active") {
        i.status = "Active";
        updates.push(saveSubscription(i, true));
      }
    });
    await Promise.all(updates);
    toast("All subscriptions resumed");
  });

  // Global settings - Currency change with reload after toast
  qs("#currencySelect").addEventListener("change", async (e) => {
    state.currency = e.target.value;
    // Save currency preference locally
    localStorage.setItem('preferredCurrency', state.currency);
    // Show toast and reload after delay
    toast("Currency updated");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  });
  
  // Global reminders toggle - Fixed
  qs("#globalReminders").addEventListener("click", async (e) => {
    e.preventDefault();
    state.reminders = !state.reminders;
    localStorage.setItem('reminders', state.reminders);
    updateGlobalToggles();
    toast(`Reminders ${state.reminders ? 'enabled' : 'disabled'}`);
  });

  // Mobile drawer
  qs("#mobileNavBtn").addEventListener("click", () =>
    qs("#mobileDrawer").classList.remove("hidden")
  );
  qs("#mobileClose").addEventListener("click", () =>
    qs("#mobileDrawer").classList.add("hidden")
  );

  // Import/Export
  qs("#importBtn").addEventListener("click", () => qs("#importFile").click());
  qs("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.items) throw new Error("Invalid file");
      
      // Import subscriptions to backend
      const importPromises = data.items.map(async (item) => {
        const newItem = { ...item, id: uid() }; // Generate new ID
        state.items.unshift(newItem);
        return await saveSubscription(newItem, false);
      });
      
      await Promise.all(importPromises);
      toast("Imported successfully");
    } catch (error) {
      console.error('Import failed:', error);
      toast("Import failed");
    } finally {
      e.target.value = "";
    }
  });
  
  qs("#exportBtn").addEventListener("click", () => {
    const exportData = {
      currency: state.currency,
      reminders: state.reminders,
      items: state.items,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Theme toggle (if you have a theme toggle button)
  const themeToggle = qs("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});

function applyFiltersAndSort() {
  const term = qs("#searchInput").value.trim().toLowerCase();
  const fCat = qs("#filterCategory").value;
  const fStatus = qs("#filterStatus").value;
  const fPay = qs("#filterPayment").value;
  let items = state.items.slice();
  if (term)
    items = items.filter(
      (x) =>
        x.name.toLowerCase().includes(term) ||
        (x.category || "").toLowerCase().includes(term)
    );
  if (fCat) items = items.filter((x) => (x.category || "") === fCat);
  if (fStatus) items = items.filter((x) => (x.status || "Active") === fStatus);
  if (fPay) items = items.filter((x) => (x.payment || "") === fPay);
  items = applySort(items);
  return items;
}

// Helpers
function cycleToText(c) {
  if (!c) return "Monthly";
  if (c.type !== "Custom") return c.type;
  return `Every ${c.interval} ${c.unit}`;
}