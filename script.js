/**
 * ColorCap - Professional Color Harmony Generator
 * Core Logic: HSL-based color harmony calculations
 * Supports: Monochromatic, Complementary, and Triadic harmonies
 * Features: Lock colors, format switching, copy to clipboard
 */

// ============================================
// Configuration & Constants
// ============================================

const CONFIG = {
  columnCount: 5,
  formats: ['HEX', 'RGBA', 'HSL'],
  harmonies: ['monochromatic', 'complementary', 'triadic'],
  toastDuration: 1500
};

// ============================================
// State Management
// ============================================

const state = {
  colors: [], // Array of HSL color objects
  currentHarmony: '',
  selectedFormats: ['HEX', 'HEX', 'HEX', 'HEX', 'HEX'], // Format for each column
  lockedColors: [false, false, false, false, false] // Lock state for each column
};

// ============================================
// DOM Elements
// ============================================

const DOM = {
  colorColumns: document.getElementById('colorColumns'),
  generateBtn: document.getElementById('generateBtn'),
  harmonyType: document.getElementById('harmonyType'),
  toast: document.getElementById('toast')
};

// ============================================
// Color Conversion Utilities
// ============================================

/**
 * Convert HSL to RGB values
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {object} RGB values {r, g, b}
 */
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

/**
 * Convert HSL to HEX string
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} HEX color string (e.g., "#FF5733")
 */
function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert HSL to RGBA string
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @param {number} a - Alpha (0-1)
 * @returns {string} RGBA color string (e.g., "rgba(255, 87, 51, 1)")
 */
function hslToRgba(h, s, l, a = 1) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Format HSL to string
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} HSL color string (e.g., "hsl(120, 50%, 60%)")
 */
function hslToString(h, s, l) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Get color value in specified format
 * @param {object} color - HSL color object {h, s, l}
 * @param {string} format - Format type ('HEX', 'RGBA', 'HSL')
 * @returns {string} Formatted color string
 */
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

/**
 * Calculate relative luminance of a color
 * Formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);

  const sRGB = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Determine if text should be light or dark based on background luminance
 * @param {object} color - HSL color object {h, s, l}
 * @returns {string} 'light' or 'dark'
 */
function getTextColor(color) {
  const luminance = getRelativeLuminance(color.h, color.s, color.l);
  // Using 0.179 as threshold (based on WCAG contrast ratio calculations)
  return luminance > 0.179 ? 'dark' : 'light';
}

// ============================================
// Color Harmony Engine
// ============================================

/**
 * Generate a random base color in HSL
 * @returns {object} HSL color object {h, s, l}
 */
function generateBaseColor() {
  return {
    h: Math.random() * 360,
    s: 50 + Math.random() * 40, // 50-90% saturation for vibrant colors
    l: 40 + Math.random() * 30  // 40-70% lightness for good visibility
  };
}

/**
 * Normalize hue to 0-360 range
 * @param {number} hue - Hue value
 * @returns {number} Normalized hue
 */
function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

/**
 * Generate Monochromatic harmony
 * Same hue with varying saturation and lightness
 * @param {object} baseColor - Base HSL color
 * @returns {array} Array of 5 HSL color objects
 */
function generateMonochromatic(baseColor) {
  const colors = [];
  const lightnessSteps = [25, 40, 55, 70, 85];
  const saturationVariation = [-10, -5, 0, 5, 10];

  for (let i = 0; i < 5; i++) {
    colors.push({
      h: baseColor.h,
      s: Math.max(20, Math.min(100, baseColor.s + saturationVariation[i])),
      l: lightnessSteps[i]
    });
  }

  return colors;
}

/**
 * Generate Complementary harmony
 * Base color + complementary (180° apart) with variations
 * @param {object} baseColor - Base HSL color
 * @returns {array} Array of 5 HSL color objects
 */
function generateComplementary(baseColor) {
  const complementaryHue = normalizeHue(baseColor.h + 180);

  return [
    { h: baseColor.h, s: baseColor.s, l: 35 },
    { h: baseColor.h, s: baseColor.s - 10, l: 55 },
    { h: baseColor.h, s: baseColor.s - 20, l: 75 }, // Neutral bridge
    { h: complementaryHue, s: baseColor.s - 10, l: 55 },
    { h: complementaryHue, s: baseColor.s, l: 35 }
  ];
}

/**
 * Generate Triadic harmony
 * Three colors 120° apart with two accent variations
 * @param {object} baseColor - Base HSL color
 * @returns {array} Array of 5 HSL color objects
 */
function generateTriadic(baseColor) {
  const hue1 = baseColor.h;
  const hue2 = normalizeHue(baseColor.h + 120);
  const hue3 = normalizeHue(baseColor.h + 240);

  return [
    { h: hue1, s: baseColor.s, l: 45 },
    { h: hue1, s: baseColor.s - 15, l: 65 },
    { h: hue2, s: baseColor.s, l: 50 },
    { h: hue3, s: baseColor.s, l: 50 },
    { h: hue3, s: baseColor.s - 15, l: 65 }
  ];
}

/**
 * Generate color palette based on random harmony type
 * Respects locked colors - only updates unlocked positions
 * @returns {object} Object containing colors array and harmony type
 */
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

  // Merge with locked colors
  const colors = newColors.map((color, index) => {
    if (state.lockedColors[index] && state.colors[index]) {
      return state.colors[index]; // Keep locked color
    }
    return color;
  });

  return { colors, harmonyType };
}

// ============================================
// UI Rendering
// ============================================

/**
 * Create HTML for a single color column
 * @param {number} index - Column index
 * @returns {string} HTML string
 */
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
                    ⧉
                </button>
            </div>
        </div>
    `;
}

/**
 * Initialize color columns in the DOM
 */
function initializeColumns() {
  let columnsHTML = '';
  for (let i = 0; i < CONFIG.columnCount; i++) {
    columnsHTML += createColumnHTML(i);
  }
  DOM.colorColumns.innerHTML = columnsHTML;
}

/**
 * Update the display of a single column
 * @param {number} index - Column index
 */
function updateColumnDisplay(index) {
  const column = document.querySelector(`.color-column[data-index="${index}"]`);
  const colorValue = column.querySelector('.color-value');
  const color = state.colors[index];
  const format = state.selectedFormats[index];

  // Update background color
  column.style.backgroundColor = hslToHex(color.h, color.s, color.l);

  // Update color value text
  colorValue.textContent = getColorValue(color, format);

  // Update text color based on luminance (WCAG)
  const textColorClass = getTextColor(color);
  column.classList.remove('text-light', 'text-dark');
  column.classList.add(`text-${textColorClass}`);
}

/**
 * Update all columns display
 */
function updateAllColumns() {
  for (let i = 0; i < CONFIG.columnCount; i++) {
    updateColumnDisplay(i);
  }
}

/**
 * Update harmony indicator
 * @param {string} harmonyType - Type of harmony
 */
function updateHarmonyIndicator(harmonyType) {
  DOM.harmonyType.textContent = harmonyType;
  DOM.harmonyType.style.animation = 'none';
  DOM.harmonyType.offsetHeight; // Trigger reflow
  DOM.harmonyType.style.animation = 'pulse 0.5s ease';
}

/**
 * Update lock button visual state
 * @param {number} index - Column index
 */
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

/**
 * Handle generate button click
 */
function handleGenerate() {
  const { colors, harmonyType } = generatePalette();
  state.colors = colors;
  state.currentHarmony = harmonyType;

  updateAllColumns();
  updateHarmonyIndicator(harmonyType);
}

/**
 * Handle lock button click
 * @param {Event} event - Click event
 */
function handleLockToggle(event) {
  const btn = event.target.closest('.lock-btn');
  if (!btn) return;

  const index = parseInt(btn.dataset.index);

  // Toggle lock state
  state.lockedColors[index] = !state.lockedColors[index];

  // Update button visual
  updateLockButton(index);

  event.stopPropagation();
}

/**
 * Handle dropdown toggle
 * @param {Event} event - Click event
 */
function handleDropdownToggle(event) {
  const btn = event.target.closest('.dropdown-btn');
  if (!btn) return;

  const container = btn.closest('.dropdown-container');

  // Close all other dropdowns
  document.querySelectorAll('.dropdown-container.open').forEach(el => {
    if (el !== container) el.classList.remove('open');
  });

  container.classList.toggle('open');
  event.stopPropagation();
}

/**
 * Handle format selection from dropdown
 * @param {Event} event - Click event
 */
function handleFormatSelect(event) {
  const item = event.target.closest('.dropdown-item');
  if (!item) return;

  const container = item.closest('.dropdown-container');
  const index = parseInt(container.dataset.index);
  const format = item.dataset.format;

  // Update state
  state.selectedFormats[index] = format;

  // Update UI
  container.querySelectorAll('.dropdown-item').forEach(el => {
    el.classList.remove('active');
  });
  item.classList.add('active');

  container.querySelector('.current-format').textContent = format;
  container.classList.remove('open');

  // Update color value display
  if (state.colors.length > 0) {
    updateColumnDisplay(index);
  }

  event.stopPropagation();
}

/**
 * Handle copy button click
 * @param {Event} event - Click event
 */
function handleCopy(event) {
  const btn = event.target.closest('.copy-btn');
  if (!btn) return;

  const index = parseInt(btn.dataset.index);

  if (state.colors.length === 0) return;

  const color = state.colors[index];
  const format = state.selectedFormats[index];
  const value = getColorValue(color, format);

  // Copy to clipboard
  navigator.clipboard.writeText(value).then(() => {
    // Show visual feedback on button
    btn.classList.add('copied');
    btn.textContent = '✓';

    // Show toast
    showToast();

    // Reset button after delay
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = '⧉';
    }, CONFIG.toastDuration);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });

  event.stopPropagation();
}

/**
 * Close dropdowns when clicking outside
 * @param {Event} event - Click event
 */
function handleOutsideClick(event) {
  if (!event.target.closest('.dropdown-container')) {
    document.querySelectorAll('.dropdown-container.open').forEach(el => {
      el.classList.remove('open');
    });
  }
}

/**
 * Show toast notification
 */
function showToast() {
  DOM.toast.classList.add('show');

  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, CONFIG.toastDuration);
}

// ============================================
// Event Delegation Setup
// ============================================

function setupEventListeners() {
  // Generate button
  DOM.generateBtn.addEventListener('click', handleGenerate);

  // Event delegation for color columns container
  DOM.colorColumns.addEventListener('click', (event) => {
    // Handle lock button clicks
    if (event.target.closest('.lock-btn')) {
      handleLockToggle(event);
      return;
    }

    // Handle dropdown button clicks
    if (event.target.closest('.dropdown-btn')) {
      handleDropdownToggle(event);
      return;
    }

    // Handle format selection
    if (event.target.closest('.dropdown-item')) {
      handleFormatSelect(event);
      return;
    }

    // Handle copy button clicks
    if (event.target.closest('.copy-btn')) {
      handleCopy(event);
      return;
    }
  });

  // Close dropdowns on outside click
  document.addEventListener('click', handleOutsideClick);

  // Keyboard shortcut: Press 'Space' to generate
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !event.target.closest('button, input, textarea')) {
      event.preventDefault();
      handleGenerate();
    }
  });
}

// ============================================
// Initialization
// ============================================

function init() {
  initializeColumns();
  setupEventListeners();

  // Generate initial palette
  handleGenerate();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
