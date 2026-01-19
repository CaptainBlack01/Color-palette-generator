/**
 * ColorCap - The Ultimate Color Harmony Generator
 * Core Logic: HSL-based color harmony calculations with theme support
 * Supports: Monochromatic, Complementary, and Triadic harmonies
 * Features: Dark/Light mode, Lock colors, Save/Load, Copy to clipboard
 */

// ============================================
// Configuration & Constants
// ============================================

const CONFIG = {
  columnCount: 5,
  formats: ['HEX', 'RGBA', 'HSL'],
  harmonies: ['monochromatic', 'complementary', 'triadic'],
  toastDuration: 1800,
  storageKey: 'colorCap_savedPalettes',
  themeKey: 'colorCap_theme'
};

// ============================================
// State Management
// ============================================

const state = {
  colors: [],
  currentHarmony: '',
  selectedFormats: ['HEX', 'HEX', 'HEX', 'HEX', 'HEX'],
  lockedColors: [false, false, false, false, false],
  savedPalettes: [],
  currentView: 'generator',
  theme: 'dark'
};

// ============================================
// DOM Elements
// ============================================

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

  // Views
  generatorView: document.getElementById('generatorView'),
  savedView: document.getElementById('savedView'),
  aboutView: document.getElementById('aboutView'),
  savedPalettes: document.getElementById('savedPalettes'),
  emptyState: document.getElementById('emptyState'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  goToGenerator: document.getElementById('goToGenerator')
};

// ============================================
// Theme Management
// ============================================

/**
 * Initialize theme from localStorage or system preference
 */
function initializeTheme() {
  // Check localStorage first
  const savedTheme = localStorage.getItem(CONFIG.themeKey);

  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.theme = prefersDark ? 'dark' : 'light';
  }

  applyTheme(state.theme);
}

/**
 * Apply theme to the document
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
  DOM.html.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem(CONFIG.themeKey, theme);
}

/**
 * Toggle between dark and light themes
 */
function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

/**
 * Listen for system theme changes
 */
function watchSystemTheme() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a preference
    const savedTheme = localStorage.getItem(CONFIG.themeKey);
    if (!savedTheme) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// ============================================
// Color Conversion Utilities
// ============================================

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

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
    case 'HEX':
      return hslToHex(color.h, color.s, color.l);
    case 'RGBA':
      return hslToRgba(color.h, color.s, color.l);
    case 'HSL':
      return hslToString(color.h, color.s, color.l);
    default:
      return hslToHex(color.h, color.s, color.l);
  }
}

// ============================================
// Luminance & Accessibility (WCAG)
// ============================================

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

// ============================================
// Color Harmony Engine
// ============================================

function generateBaseColor() {
  return {
    h: Math.random() * 360,
    s: 55 + Math.random() * 35, // 55-90% saturation
    l: 42 + Math.random() * 26   // 42-68% lightness
  };
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function generateMonochromatic(baseColor) {
  const colors = [];
  const lightnessSteps = [28, 42, 55, 68, 82];
  const saturationVariation = [-8, -4, 0, 4, 8];

  for (let i = 0; i < 5; i++) {
    colors.push({
      h: baseColor.h,
      s: Math.max(25, Math.min(100, baseColor.s + saturationVariation[i])),
      l: lightnessSteps[i]
    });
  }

  return colors;
}

function generateComplementary(baseColor) {
  const complementaryHue = normalizeHue(baseColor.h + 180);

  return [
    { h: baseColor.h, s: baseColor.s, l: 38 },
    { h: baseColor.h, s: baseColor.s - 8, l: 55 },
    { h: normalizeHue(baseColor.h + 30), s: baseColor.s - 20, l: 72 },
    { h: complementaryHue, s: baseColor.s - 8, l: 55 },
    { h: complementaryHue, s: baseColor.s, l: 38 }
  ];
}

function generateTriadic(baseColor) {
  const hue1 = baseColor.h;
  const hue2 = normalizeHue(baseColor.h + 120);
  const hue3 = normalizeHue(baseColor.h + 240);

  return [
    { h: hue1, s: baseColor.s, l: 45 },
    { h: hue1, s: baseColor.s - 12, l: 65 },
    { h: hue2, s: baseColor.s, l: 52 },
    { h: hue3, s: baseColor.s, l: 52 },
    { h: hue3, s: baseColor.s - 12, l: 65 }
  ];
}

function generatePalette() {
  const baseColor = generateBaseColor();
  const harmonyIndex = Math.floor(Math.random() * CONFIG.harmonies.length);
  const harmonyType = CONFIG.harmonies[harmonyIndex];

  let newColors;

  switch (harmonyType) {
    case 'monochromatic':
      newColors = generateMonochromatic(baseColor);
      break;
    case 'complementary':
      newColors = generateComplementary(baseColor);
      break;
    case 'triadic':
      newColors = generateTriadic(baseColor);
      break;
    default:
      newColors = generateMonochromatic(baseColor);
  }

  const colors = newColors.map((color, index) => {
    if (state.lockedColors[index] && state.colors[index]) {
      return state.colors[index];
    }
    return color;
  });

  return { colors, harmonyType };
}

// ============================================
// LocalStorage - Save/Load Palettes
// ============================================

function loadSavedPalettes() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey);
    state.savedPalettes = saved ? JSON.parse(saved) : [];
  } catch (e) {
    state.savedPalettes = [];
  }
  updateSavedBadge();
}

function savePalettesToStorage() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.savedPalettes));
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
  DOM.savedBadge.textContent = state.savedPalettes.length;
}

// ============================================
// View Management
// ============================================

function showView(viewName) {
  state.currentView = viewName;

  DOM.generatorView.classList.add('hidden');
  DOM.savedView.classList.add('hidden');
  DOM.aboutView.classList.add('hidden');

  DOM.navGenerator.classList.remove('active');
  DOM.navSaved.classList.remove('active');
  DOM.navAbout.classList.remove('active');

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

  const html = state.savedPalettes.map(palette => `
        <div class="saved-palette-card" data-id="${palette.id}">
            <div class="saved-palette-preview">
                ${palette.colors.map(color => `
                    <div class="color-swatch" style="background-color: ${hslToHex(color.h, color.s, color.l)}"></div>
                `).join('')}
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

  DOM.savedPalettes.innerHTML = html;
}

// ============================================
// UI Rendering
// ============================================

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
                <button class="lock-btn${isLocked ? ' locked' : ''}" data-index="${index}" title="Lock this color">
                    ${isLocked ? '🔒' : '🔓'}
                </button>
                <button class="copy-btn" data-index="${index}" title="Copy to clipboard">
                    📋
                </button>
            </div>
        </div>
    `;
}

function initializeColumns() {
  let columnsHTML = '';
  for (let i = 0; i < CONFIG.columnCount; i++) {
    columnsHTML += createColumnHTML(i);
  }
  DOM.colorColumns.innerHTML = columnsHTML;
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

// ============================================
// Event Handlers
// ============================================

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

  container.querySelectorAll('.dropdown-item').forEach(el => {
    el.classList.remove('active');
  });
  item.classList.add('active');

  container.querySelector('.current-format').textContent = format;
  container.classList.remove('open');

  if (state.colors.length > 0) {
    updateColumnDisplay(index);
  }

  event.stopPropagation();
}

function handleCopy(event) {
  const btn = event.target.closest('.copy-btn');
  if (!btn) return;

  const index = parseInt(btn.dataset.index);

  if (state.colors.length === 0) return;

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
  }).catch(err => {
    console.error('Failed to copy:', err);
  });

  event.stopPropagation();
}

function handleOutsideClick(event) {
  if (!event.target.closest('.dropdown-container')) {
    document.querySelectorAll('.dropdown-container.open').forEach(el => {
      el.classList.remove('open');
    });
  }
}

function showToast(message = 'Copied!') {
  DOM.toastText.textContent = message;
  DOM.toast.classList.add('show');

  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, CONFIG.toastDuration);
}

// ============================================
// Event Delegation Setup
// ============================================

function setupEventListeners() {
  // Theme toggle
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Generate button
  DOM.generateBtn.addEventListener('click', handleGenerate);

  // Save button
  DOM.saveBtn.addEventListener('click', saveCurrentPalette);

  // Navigation
  DOM.navGenerator.addEventListener('click', () => showView('generator'));
  DOM.navSaved.addEventListener('click', () => showView('saved'));
  DOM.navAbout.addEventListener('click', () => showView('about'));

  // Go to generator from empty state
  if (DOM.goToGenerator) {
    DOM.goToGenerator.addEventListener('click', () => showView('generator'));
  }

  // Clear all button
  DOM.clearAllBtn.addEventListener('click', clearAllPalettes);

  // Event delegation for color columns
  DOM.colorColumns.addEventListener('click', (event) => {
    if (event.target.closest('.lock-btn')) {
      handleLockToggle(event);
      return;
    }

    if (event.target.closest('.dropdown-btn')) {
      handleDropdownToggle(event);
      return;
    }

    if (event.target.closest('.dropdown-item')) {
      handleFormatSelect(event);
      return;
    }

    if (event.target.closest('.copy-btn')) {
      handleCopy(event);
      return;
    }
  });

  // Event delegation for saved palettes
  DOM.savedPalettes.addEventListener('click', (event) => {
    const loadBtn = event.target.closest('.load-btn');
    const deleteBtn = event.target.closest('.delete-btn');

    if (loadBtn) {
      loadPalette(parseInt(loadBtn.dataset.id));
      return;
    }

    if (deleteBtn) {
      deletePalette(parseInt(deleteBtn.dataset.id));
      return;
    }
  });

  // Close dropdowns on outside click
  document.addEventListener('click', handleOutsideClick);

  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Space to generate (only in generator view)
    if (event.code === 'Space' && !event.target.closest('button, input, textarea')) {
      event.preventDefault();
      if (state.currentView === 'generator') {
        handleGenerate();
      }
    }

    // T to toggle theme
    if (event.code === 'KeyT' && !event.target.closest('input, textarea')) {
      toggleTheme();
    }
  });
}

// ============================================
// Initialization
// ============================================

function init() {
  initializeTheme();
  watchSystemTheme();
  initializeColumns();
  loadSavedPalettes();
  setupEventListeners();
  handleGenerate();
}

document.addEventListener('DOMContentLoaded', init);
