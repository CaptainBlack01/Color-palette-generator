// --- Configuration ---
const CONFIG = {
  columnCount: 5,
  formats: ['HEX', 'RGBA', 'HSL'],
  harmonies: ['monochromatic', 'complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic'],
  toastDuration: 1800,
  storageKey: 'colorCap_savedPalettes',
  themeKey: 'colorCap_theme',
  usersKey: 'colorCap_users',
  currentUserKey: 'colorCap_currentUser',
  passwordSalt: 'ColorCap_2026_SecureApp'
};

// --- State ---
const state = {
  colors: [],
  currentHarmony: '',
  selectedHarmony: 'random',
  selectedFormats: ['HEX', 'HEX', 'HEX', 'HEX', 'HEX'],
  lockedColors: [false, false, false, false, false],
  savedPalettes: [],
  currentView: 'generator',
  theme: 'dark',
  currentUser: null,
  mobileMenuOpen: false,
  harmonyDropdownOpen: false
};

// --- Elements ---

const DOM = {
  html: document.documentElement,
  colorColumns: document.getElementById('colorColumns'),
  generateBtn: document.getElementById('generateBtn'),
  saveBtn: document.getElementById('saveBtn'),
  harmonyType: document.getElementById('harmonyType'),
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toastText'),
  themeToggle: document.getElementById('themeToggle'),

  // Navigation
  navGenerator: document.getElementById('navGenerator'),
  navSaved: document.getElementById('navSaved'),
  navAbout: document.getElementById('navAbout'),
  savedBadge: document.getElementById('savedBadge'),
  savedBadgeMobile: document.getElementById('savedBadgeMobile'),

  // Mobile
  mobileMenuToggle: document.getElementById('mobileMenuToggle'),
  mobileNav: document.getElementById('mobileNav'),

  // Views
  generatorView: document.getElementById('generatorView'),
  savedView: document.getElementById('savedView'),
  aboutView: document.getElementById('aboutView'),
  savedPalettes: document.getElementById('savedPalettes'),
  emptyState: document.getElementById('emptyState'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  goToGenerator: document.getElementById('goToGenerator'),

  // Auth
  authButtons: document.getElementById('authButtons'),
  userProfile: document.getElementById('userProfile'),
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  userEmail: document.getElementById('userEmail'),
  loginBtn: document.getElementById('loginBtn'),
  signupBtn: document.getElementById('signupBtn'),
  logoutBtn: document.getElementById('logoutBtn'),

  // Modal
  authModal: document.getElementById('authModal'),
  modalClose: document.getElementById('modalClose'),
  loginForm: document.getElementById('loginForm'),
  signupForm: document.getElementById('signupForm'),
  switchToSignup: document.getElementById('switchToSignup'),
  switchToLogin: document.getElementById('switchToLogin'),

  // Form inputs
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  loginError: document.getElementById('loginError'),
  loginSubmit: document.getElementById('loginSubmit'),
  signupName: document.getElementById('signupName'),
  signupEmail: document.getElementById('signupEmail'),
  signupPassword: document.getElementById('signupPassword'),
  signupError: document.getElementById('signupError'),
  signupSubmit: document.getElementById('signupSubmit'),

  // Harmony Selector
  harmonySelector: document.getElementById('harmonySelector'),
  harmonyDropdown: document.getElementById('harmonyDropdown'),

  // Transitions
  themeFlash: document.getElementById('themeFlash')
};

// --- Theme ---

function initializeTheme() {
  const savedTheme = localStorage.getItem(CONFIG.themeKey);

  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.theme = prefersDark ? 'dark' : 'light';
  }

  applyTheme(state.theme);
}

function applyTheme(theme) {
  DOM.html.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem(CONFIG.themeKey, theme);
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';

  // Add transition class
  DOM.html.classList.add('theme-transition');

  // Trigger flash effect
  if (DOM.themeFlash) {
    DOM.themeFlash.classList.remove('active');
    void DOM.themeFlash.offsetWidth; // Trigger reflow
    DOM.themeFlash.classList.add('active');
  }

  // Change theme
  applyTheme(newTheme);

  // Remove transition class after animation ends (600ms matching CSS)
  setTimeout(() => {
    DOM.html.classList.remove('theme-transition');
  }, 600);
}

function watchSystemTheme() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem(CONFIG.themeKey);
    if (!savedTheme) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// --- Auth ---

function getUsers() {
  try {
    const users = localStorage.getItem(CONFIG.usersKey);
    return users ? JSON.parse(users) : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(CONFIG.usersKey, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const user = localStorage.getItem(CONFIG.currentUserKey);
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CONFIG.currentUserKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(CONFIG.currentUserKey);
  }
  state.currentUser = user;
  updateAuthUI();
}

// Security: Input sanitization to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 255); // Limit length
}

// Security: Simple hash function for client-side password storage
// Note: In production, use bcrypt on server-side
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + CONFIG.passwordSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Security: Password strength validation
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  return { valid: true };
}

async function signup(name, email, password) {
  // Sanitize inputs
  name = sanitizeInput(name);
  email = sanitizeInput(email);

  if (!name || !email || !password) {
    return { success: false, message: 'Please fill all fields' };
  }

  if (name.length < 2 || name.length > 50) {
    return { success: false, message: 'Name must be 2-50 characters' };
  }

  if (!isValidEmail(email)) {
    return { success: false, message: 'Invalid email format' };
  }

  // Validate password strength
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return { success: false, message: passwordCheck.message };
  }

  const users = getUsers();

  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Email already registered' };
  }

  // Hash password before storing
  const hashedPassword = await hashPassword(password);

  const newUser = {
    id: Date.now(),
    name: name,
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = newUser;
  setCurrentUser(userWithoutPassword);

  return { success: true };
}

async function login(email, password) {
  // Sanitize email input
  email = sanitizeInput(email);

  if (!email || !password) {
    return { success: false, message: 'Please fill all fields' };
  }

  const users = getUsers();
  const hashedPassword = await hashPassword(password);

  const user = users.find(u =>
    u.email.toLowerCase() === email.toLowerCase() &&
    u.password === hashedPassword
  );

  if (!user) {
    return { success: false, message: 'Invalid email or password' };
  }

  const { password: _, ...userWithoutPassword } = user;
  setCurrentUser(userWithoutPassword);

  return { success: true };
}

function logout() {
  setCurrentUser(null);
  showToast('Logged out successfully');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function updateAuthUI() {
  if (state.currentUser) {
    DOM.authButtons.classList.add('hidden');
    DOM.userProfile.classList.remove('hidden');

    const initials = state.currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    DOM.userAvatar.textContent = initials;
    DOM.userName.textContent = state.currentUser.name;
    DOM.userEmail.textContent = state.currentUser.email;
  } else {
    DOM.authButtons.classList.remove('hidden');
    DOM.userProfile.classList.add('hidden');
  }
}

function initializeAuth() {
  state.currentUser = getCurrentUser();
  updateAuthUI();
}

// --- Modals ---

function openModal(formType = 'login') {
  DOM.authModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (formType === 'login') {
    DOM.loginForm.classList.remove('hidden');
    DOM.signupForm.classList.add('hidden');
    DOM.loginEmail.focus();
  } else {
    DOM.loginForm.classList.add('hidden');
    DOM.signupForm.classList.remove('hidden');
    DOM.signupName.focus();
  }

  clearFormErrors();
}

function closeModal() {
  DOM.authModal.classList.add('hidden');
  document.body.style.overflow = '';
  clearFormInputs();
  clearFormErrors();
}

function clearFormInputs() {
  DOM.loginEmail.value = '';
  DOM.loginPassword.value = '';
  DOM.signupName.value = '';
  DOM.signupEmail.value = '';
  DOM.signupPassword.value = '';
}

function clearFormErrors() {
  DOM.loginError.classList.add('hidden');
  DOM.signupError.classList.add('hidden');
}

function showFormError(type, message) {
  if (type === 'login') {
    DOM.loginError.textContent = message;
    DOM.loginError.classList.remove('hidden');
  } else {
    DOM.signupError.textContent = message;
    DOM.signupError.classList.remove('hidden');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const result = await login(DOM.loginEmail.value, DOM.loginPassword.value);

  if (result.success) {
    closeModal();
    showToast(`Welcome back, ${state.currentUser.name}! 👋`);
  } else {
    showFormError('login', result.message);
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const result = await signup(
    DOM.signupName.value,
    DOM.signupEmail.value,
    DOM.signupPassword.value
  );

  if (result.success) {
    closeModal();
    showToast(`Welcome, ${state.currentUser.name}! 🎉`);
  } else {
    showFormError('signup', result.message);
  }
}

// --- Mobile ---

function toggleMobileMenu() {
  state.mobileMenuOpen = !state.mobileMenuOpen;
  DOM.mobileMenuToggle.classList.toggle('active', state.mobileMenuOpen);
  DOM.mobileNav.classList.toggle('hidden', !state.mobileMenuOpen);
}

function closeMobileMenu() {
  state.mobileMenuOpen = false;
  DOM.mobileMenuToggle.classList.remove('active');
  DOM.mobileNav.classList.add('hidden');
}

// --- Utils ---

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToRgba(h, s, l, a = 1) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hslToString(h, s, l) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function getColorValue(color, format) {
  switch (format) {
    case 'HEX': return hslToHex(color.h, color.s, color.l);
    case 'RGBA': return hslToRgba(color.h, color.s, color.l);
    case 'HSL': return hslToString(color.h, color.s, color.l);
    default: return hslToHex(color.h, color.s, color.l);
  }
}

// --- Accessibility ---

function getRelativeLuminance(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  const sRGB = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function getTextColor(color) {
  const luminance = getRelativeLuminance(color.h, color.s, color.l);
  return luminance > 0.179 ? 'dark' : 'light';
}

// --- Harmony ---

function generateBaseColor() {
  return {
    h: Math.random() * 360,
    s: 55 + Math.random() * 35,
    l: 42 + Math.random() * 26
  };
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function generateMonochromatic(baseColor) {
  const lightnessSteps = [28, 42, 55, 68, 82];
  const saturationVariation = [-8, -4, 0, 4, 8];
  return lightnessSteps.map((l, i) => ({
    h: baseColor.h,
    s: Math.max(25, Math.min(100, baseColor.s + saturationVariation[i])),
    l: l
  }));
}

function generateComplementary(baseColor) {
  const comp = normalizeHue(baseColor.h + 180);
  return [
    { h: baseColor.h, s: baseColor.s, l: 38 },
    { h: baseColor.h, s: baseColor.s - 8, l: 55 },
    { h: normalizeHue(baseColor.h + 30), s: baseColor.s - 20, l: 72 },
    { h: comp, s: baseColor.s - 8, l: 55 },
    { h: comp, s: baseColor.s, l: 38 }
  ];
}

function generateTriadic(baseColor) {
  const h1 = baseColor.h;
  const h2 = normalizeHue(baseColor.h + 120);
  const h3 = normalizeHue(baseColor.h + 240);
  return [
    { h: h1, s: baseColor.s, l: 45 },
    { h: h1, s: baseColor.s - 12, l: 65 },
    { h: h2, s: baseColor.s, l: 52 },
    { h: h3, s: baseColor.s, l: 52 },
    { h: h3, s: baseColor.s - 12, l: 65 }
  ];
}

function generateAnalogous(baseColor) {
  const h1 = normalizeHue(baseColor.h - 30);
  const h2 = normalizeHue(baseColor.h - 15);
  const h3 = baseColor.h;
  const h4 = normalizeHue(baseColor.h + 15);
  const h5 = normalizeHue(baseColor.h + 30);
  return [
    { h: h1, s: baseColor.s - 5, l: 40 },
    { h: h2, s: baseColor.s, l: 50 },
    { h: h3, s: baseColor.s + 5, l: 55 },
    { h: h4, s: baseColor.s, l: 50 },
    { h: h5, s: baseColor.s - 5, l: 60 }
  ];
}

function generateSplitComplementary(baseColor) {
  const comp1 = normalizeHue(baseColor.h + 150);
  const comp2 = normalizeHue(baseColor.h + 210);
  return [
    { h: baseColor.h, s: baseColor.s, l: 40 },
    { h: baseColor.h, s: baseColor.s - 10, l: 60 },
    { h: comp1, s: baseColor.s, l: 50 },
    { h: comp2, s: baseColor.s, l: 50 },
    { h: comp2, s: baseColor.s - 10, l: 65 }
  ];
}

function generateTetradic(baseColor) {
  const h1 = baseColor.h;
  const h2 = normalizeHue(baseColor.h + 90);
  const h3 = normalizeHue(baseColor.h + 180);
  const h4 = normalizeHue(baseColor.h + 270);
  return [
    { h: h1, s: baseColor.s, l: 45 },
    { h: h2, s: baseColor.s - 8, l: 55 },
    { h: h2, s: baseColor.s - 15, l: 70 },
    { h: h3, s: baseColor.s, l: 50 },
    { h: h4, s: baseColor.s - 8, l: 55 }
  ];
}

function generatePalette() {
  const baseColor = generateBaseColor();

  // Determine which harmony to use
  let harmonyType;
  if (state.selectedHarmony === 'random') {
    const harmonyIndex = Math.floor(Math.random() * CONFIG.harmonies.length);
    harmonyType = CONFIG.harmonies[harmonyIndex];
  } else {
    harmonyType = state.selectedHarmony;
  }

  let newColors;
  switch (harmonyType) {
    case 'monochromatic': newColors = generateMonochromatic(baseColor); break;
    case 'complementary': newColors = generateComplementary(baseColor); break;
    case 'analogous': newColors = generateAnalogous(baseColor); break;
    case 'triadic': newColors = generateTriadic(baseColor); break;
    case 'split-complementary': newColors = generateSplitComplementary(baseColor); break;
    case 'tetradic': newColors = generateTetradic(baseColor); break;
    default: newColors = generateMonochromatic(baseColor);
  }

  const colors = newColors.map((color, i) =>
    (state.lockedColors[i] && state.colors[i]) ? state.colors[i] : color
  );

  return { colors, harmonyType };
}

// --- Storage ---

function getStorageKey() {
  const userId = state.currentUser ? state.currentUser.id : 'guest';
  return `${CONFIG.storageKey}_${userId}`;
}

function loadSavedPalettes() {
  try {
    const saved = localStorage.getItem(getStorageKey());
    state.savedPalettes = saved ? JSON.parse(saved) : [];
  } catch (e) {
    state.savedPalettes = [];
  }
  updateSavedBadge();
}

function savePalettesToStorage() {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(state.savedPalettes));
  } catch (e) {
    console.error('Failed to save palettes:', e);
  }
}

function saveCurrentPalette() {
  if (state.colors.length === 0) return;

  const palette = {
    id: Date.now(),
    colors: [...state.colors],
    harmony: state.currentHarmony,
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  };

  state.savedPalettes.unshift(palette);
  savePalettesToStorage();
  updateSavedBadge();
  showToast('Palette saved! ✨');
}

function deletePalette(id) {
  state.savedPalettes = state.savedPalettes.filter(p => p.id !== id);
  savePalettesToStorage();
  updateSavedBadge();
  renderSavedPalettes();
}

function loadPalette(id) {
  const palette = state.savedPalettes.find(p => p.id === id);
  if (palette) {
    state.colors = [...palette.colors];
    state.currentHarmony = palette.harmony;
    state.lockedColors = [false, false, false, false, false];
    showView('generator');
    updateAllColumns();
    updateHarmonyIndicator(palette.harmony);
    showToast('Palette loaded! 🎨');
  }
}

function clearAllPalettes() {
  if (state.savedPalettes.length === 0) return;
  state.savedPalettes = [];
  savePalettesToStorage();
  updateSavedBadge();
  renderSavedPalettes();
  showToast('All palettes cleared');
}

function updateSavedBadge() {
  const count = state.savedPalettes.length;
  DOM.savedBadge.textContent = count;
  if (DOM.savedBadgeMobile) {
    DOM.savedBadgeMobile.textContent = count;
  }
}

// --- Views ---

function showView(viewName) {
  state.currentView = viewName;
  closeMobileMenu();

  DOM.generatorView.classList.add('hidden');
  DOM.savedView.classList.add('hidden');
  DOM.aboutView.classList.add('hidden');

  DOM.navGenerator.classList.remove('active');
  DOM.navSaved.classList.remove('active');
  DOM.navAbout.classList.remove('active');

  // Update mobile nav
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  switch (viewName) {
    case 'generator':
      DOM.generatorView.classList.remove('hidden');
      DOM.navGenerator.classList.add('active');
      break;
    case 'saved':
      DOM.savedView.classList.remove('hidden');
      DOM.navSaved.classList.add('active');
      renderSavedPalettes();
      break;
    case 'about':
      DOM.aboutView.classList.remove('hidden');
      DOM.navAbout.classList.add('active');
      break;
  }
}

function renderSavedPalettes() {
  if (state.savedPalettes.length === 0) {
    DOM.savedPalettes.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');
    return;
  }

  DOM.emptyState.classList.add('hidden');
  DOM.savedPalettes.innerHTML = state.savedPalettes.map(palette => `
        <div class="saved-palette-card" data-id="${palette.id}">
            <div class="saved-palette-preview">
                ${palette.colors.map(c =>
    `<div class="color-swatch" style="background-color:${hslToHex(c.h, c.s, c.l)}"></div>`
  ).join('')}
            </div>
            <div class="saved-palette-info">
                <div class="saved-palette-meta">
                    <span class="saved-palette-harmony">${palette.harmony}</span>
                    <span class="saved-palette-date">${palette.date}</span>
                </div>
                <div class="saved-palette-actions">
                    <button class="load-btn" data-id="${palette.id}">Load</button>
                    <button class="delete-btn" data-id="${palette.id}">✕</button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- Rendering ---

function createColumnHTML(index) {
  const isLocked = state.lockedColors[index];
  return `
        <div class="color-column${isLocked ? ' locked' : ''}" data-index="${index}">
            <span class="color-value" data-index="${index}">──────</span>
            <div class="dropdown-container" data-index="${index}">
                <button class="dropdown-btn" data-index="${index}">
                    <span class="current-format">HEX</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-item active" data-format="HEX">HEX</div>
                    <div class="dropdown-item" data-format="RGBA">RGBA</div>
                    <div class="dropdown-item" data-format="HSL">HSL</div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="lock-btn${isLocked ? ' locked' : ''}" data-index="${index}" title="Lock">
                    ${isLocked ? '🔒' : '🔓'}
                </button>
                <button class="copy-btn" data-index="${index}" title="Copy">📋</button>
            </div>
        </div>
    `;
}

function initializeColumns() {
  DOM.colorColumns.innerHTML = Array.from({ length: CONFIG.columnCount }, (_, i) =>
    createColumnHTML(i)
  ).join('');
}

function updateColumnDisplay(index) {
  const column = document.querySelector(`.color-column[data-index="${index}"]`);
  const colorValue = column.querySelector('.color-value');
  const color = state.colors[index];
  const format = state.selectedFormats[index];

  column.style.backgroundColor = hslToHex(color.h, color.s, color.l);
  colorValue.textContent = getColorValue(color, format);

  const textColorClass = getTextColor(color);
  column.classList.remove('text-light', 'text-dark');
  column.classList.add(`text-${textColorClass}`);
}

function updateAllColumns() {
  for (let i = 0; i < CONFIG.columnCount; i++) {
    updateColumnDisplay(i);
  }
}

function updateHarmonyIndicator(harmonyType) {
  DOM.harmonyType.textContent = harmonyType;
}

function updateLockButton(index) {
  const column = document.querySelector(`.color-column[data-index="${index}"]`);
  const lockBtn = column.querySelector('.lock-btn');
  const isLocked = state.lockedColors[index];

  lockBtn.classList.toggle('locked', isLocked);
  lockBtn.textContent = isLocked ? '🔒' : '🔓';
  column.classList.toggle('locked', isLocked);
}

// --- Handlers ---

function handleGenerate() {
  const { colors, harmonyType } = generatePalette();
  state.colors = colors;
  state.currentHarmony = harmonyType;
  updateAllColumns();
  updateHarmonyIndicator(harmonyType);
}

function handleLockToggle(event) {
  const btn = event.target.closest('.lock-btn');
  if (!btn) return;

  const index = parseInt(btn.dataset.index);
  state.lockedColors[index] = !state.lockedColors[index];
  updateLockButton(index);
  event.stopPropagation();
}

function handleDropdownToggle(event) {
  const btn = event.target.closest('.dropdown-btn');
  if (!btn) return;

  const container = btn.closest('.dropdown-container');
  document.querySelectorAll('.dropdown-container.open').forEach(el => {
    if (el !== container) el.classList.remove('open');
  });
  container.classList.toggle('open');
  event.stopPropagation();
}

function handleFormatSelect(event) {
  const item = event.target.closest('.dropdown-item');
  if (!item) return;

  const container = item.closest('.dropdown-container');
  const index = parseInt(container.dataset.index);
  const format = item.dataset.format;

  state.selectedFormats[index] = format;

  container.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
  item.classList.add('active');
  container.querySelector('.current-format').textContent = format;
  container.classList.remove('open');

  if (state.colors.length > 0) updateColumnDisplay(index);
  event.stopPropagation();
}

function handleCopy(event) {
  const btn = event.target.closest('.copy-btn');
  if (!btn || state.colors.length === 0) return;

  const index = parseInt(btn.dataset.index);
  const color = state.colors[index];
  const format = state.selectedFormats[index];
  const value = getColorValue(color, format);

  navigator.clipboard.writeText(value).then(() => {
    btn.classList.add('copied');
    btn.textContent = '✓';
    showToast('Copied to clipboard!');

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = '📋';
    }, CONFIG.toastDuration);
  }).catch(console.error);

  event.stopPropagation();
}

function handleOutsideClick(event) {
  if (!event.target.closest('.dropdown-container')) {
    document.querySelectorAll('.dropdown-container.open').forEach(el => el.classList.remove('open'));
  }
  // Close harmony dropdown
  if (!event.target.closest('.harmony-selector')) {
    state.harmonyDropdownOpen = false;
    DOM.harmonySelector?.classList.remove('open');
  }
}

function showToast(message = 'Copied!') {
  DOM.toastText.textContent = message;
  DOM.toast.classList.add('show');
  setTimeout(() => DOM.toast.classList.remove('show'), CONFIG.toastDuration);
}

// --- Listeners ---

function setupEventListeners() {
  // Theme
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Generate & Save
  DOM.generateBtn.addEventListener('click', handleGenerate);
  DOM.saveBtn.addEventListener('click', saveCurrentPalette);

  // Navigation
  DOM.navGenerator.addEventListener('click', () => showView('generator'));
  DOM.navSaved.addEventListener('click', () => showView('saved'));
  DOM.navAbout.addEventListener('click', () => showView('about'));

  // Mobile menu
  DOM.mobileMenuToggle.addEventListener('click', toggleMobileMenu);

  // Mobile navigation
  DOM.mobileNav.addEventListener('click', (e) => {
    const link = e.target.closest('.mobile-nav-link');
    if (link) showView(link.dataset.view);
  });

  // Go to generator
  if (DOM.goToGenerator) {
    DOM.goToGenerator.addEventListener('click', () => showView('generator'));
  }

  // Clear all
  DOM.clearAllBtn.addEventListener('click', clearAllPalettes);

  // Harmony selector
  DOM.harmonySelector.addEventListener('click', (e) => {
    e.stopPropagation();
    state.harmonyDropdownOpen = !state.harmonyDropdownOpen;
    DOM.harmonySelector.classList.toggle('open', state.harmonyDropdownOpen);
  });

  DOM.harmonyDropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.harmony-option');
    if (option) {
      const harmony = option.dataset.harmony;
      state.selectedHarmony = harmony;

      // Update UI
      DOM.harmonyDropdown.querySelectorAll('.harmony-option').forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // Update display text
      const displayText = harmony === 'random' ? 'Random' : harmony.charAt(0).toUpperCase() + harmony.slice(1).replace('-', ' ');
      DOM.harmonyType.textContent = displayText;

      // Close dropdown
      state.harmonyDropdownOpen = false;
      DOM.harmonySelector.classList.remove('open');

      // Generate new palette with selected harmony
      handleGenerate();

      showToast(`Harmony: ${displayText}`);
    }
  });

  // Auth buttons
  DOM.loginBtn.addEventListener('click', () => openModal('login'));
  DOM.signupBtn.addEventListener('click', () => openModal('signup'));
  DOM.logoutBtn.addEventListener('click', logout);

  // Modal
  DOM.modalClose.addEventListener('click', closeModal);
  DOM.authModal.addEventListener('click', (e) => {
    if (e.target === DOM.authModal) closeModal();
  });
  DOM.switchToSignup.addEventListener('click', () => openModal('signup'));
  DOM.switchToLogin.addEventListener('click', () => openModal('login'));

  // Form submissions
  DOM.loginSubmit.addEventListener('click', handleLoginSubmit);
  DOM.signupSubmit.addEventListener('click', handleSignupSubmit);

  // Enter key on forms
  DOM.loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLoginSubmit(e);
  });
  DOM.signupPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignupSubmit(e);
  });

  // Color columns
  DOM.colorColumns.addEventListener('click', (event) => {
    if (event.target.closest('.lock-btn')) return handleLockToggle(event);
    if (event.target.closest('.dropdown-btn')) return handleDropdownToggle(event);
    if (event.target.closest('.dropdown-item')) return handleFormatSelect(event);
    if (event.target.closest('.copy-btn')) return handleCopy(event);
  });

  // Saved palettes
  DOM.savedPalettes.addEventListener('click', (event) => {
    const loadBtn = event.target.closest('.load-btn');
    const deleteBtn = event.target.closest('.delete-btn');
    if (loadBtn) loadPalette(parseInt(loadBtn.dataset.id));
    if (deleteBtn) deletePalette(parseInt(deleteBtn.dataset.id));
  });

  // Outside click
  document.addEventListener('click', handleOutsideClick);

  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Escape to close modal
    if (event.key === 'Escape' && !DOM.authModal.classList.contains('hidden')) {
      closeModal();
      return;
    }

    // Space to generate
    if (event.code === 'Space' && !event.target.closest('button, input, textarea')) {
      event.preventDefault();
      if (state.currentView === 'generator') handleGenerate();
    }

    // T to toggle theme
    if (event.code === 'KeyT' && !event.target.closest('input, textarea')) {
      toggleTheme();
    }
  });
}

// --- Init ---

function init() {
  initializeTheme();
  watchSystemTheme();
  initializeAuth();
  initializeColumns();
  loadSavedPalettes();
  setupEventListeners();
  handleGenerate();
}

document.addEventListener('DOMContentLoaded', init);
