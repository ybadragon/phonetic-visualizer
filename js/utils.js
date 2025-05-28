/**
 * Phonetic Visualizer - Utility Functions
 * Contains shared functionality and data used across visualizations
 */

import { createdCanvases } from './visualizer-base.js';

// Phonetic mapping for English alphabet
const phoneticMap = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "ef",
  g: "jee", h: "aych", i: "eye", j: "jay", k: "kay", l: "el",
  m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "ar",
  s: "ess", t: "tee", u: "you", v: "vee", w: "doubleyou",
  x: "ex", y: "why", z: "zee"
};

/**
 * Converts an array of characters to their phonetic spellings
 * @param {Array} chars - Array of characters to convert
 * @returns {Array} Array of characters from the phonetic spelling
 */
function spellOutArray(chars) {
  return chars.flatMap(c => {
    const mapped = phoneticMap[c.toLowerCase?.()] || c;
    return typeof mapped === 'string' ? mapped.split('') : c.split('');
  });
}

// Store the current typewriter animation timeout ID
let typewriterTimeoutId = null;

/**
 * Animates a typewriter effect for the given text
 * @param {string} text - Text to animate
 * @param {number} duration - Duration of the animation in milliseconds
 */
function animateTypewriter(text, duration) {
  // Cancel any ongoing typewriter animation
  if (typewriterTimeoutId !== null) {
    clearTimeout(typewriterTimeoutId);
    typewriterTimeoutId = null;
  }
  
  const typewriterElement = document.getElementById("typewriterText");
  typewriterElement.textContent = "";
  
  if (!text) return;
  
  // Dynamic text scaling based on text length
  const container = document.getElementById("typewriterContainer");
  const containerWidth = container.clientWidth - 150; // Account for controls
  const defaultFontSize = 1.5; // em
  
  // Calculate a font size that will fit the text
  const testSpan = document.createElement("span");
  testSpan.style.fontFamily = "monospace";
  testSpan.style.fontSize = defaultFontSize + "em";
  testSpan.style.visibility = "hidden";
  testSpan.style.whiteSpace = "nowrap";
  testSpan.textContent = text;
  document.body.appendChild(testSpan);
  
  const textWidth = testSpan.offsetWidth;
  document.body.removeChild(testSpan);
  
  // Calculate scaling factor
  let scaleFactor = 1;
  if (textWidth > containerWidth) {
    scaleFactor = Math.max(0.5, containerWidth / textWidth);
  }
  
  // Apply the calculated font size
  typewriterElement.style.fontSize = (defaultFontSize * scaleFactor) + "em";
  
  const totalChars = text.length;
  const charTime = duration / totalChars;
  let currentChar = 0;
  
  function typeNextChar() {
    if (currentChar < totalChars) {
      typewriterElement.textContent += text[currentChar];
      currentChar++;
      typewriterTimeoutId = setTimeout(typeNextChar, charTime);
    } else {
      // Animation complete, clear the timeout ID
      typewriterTimeoutId = null;
    }
  }
  
  // Start the animation
  typeNextChar();
}

/**
 * Clears all visualizations from the display
 */
function clearVisuals() {
  // Clear static canvases (for backward compatibility)
  const staticCanvases = ["spiral", "ripple", "fractal", "constellation", "waveform", "typography"];
  staticCanvases.forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      canvas.style.display = "none";
    }
  });
  
  // Clear dynamically created canvases
  createdCanvases.forEach(canvasId => {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      canvas.style.display = "none";
    }
  });
  
  // Clear typewriter text
  document.getElementById("typewriterText").textContent = "";
  
  // Cancel any ongoing typewriter animation
  if (typewriterTimeoutId !== null) {
    clearTimeout(typewriterTimeoutId);
    typewriterTimeoutId = null;
  }
  
  // Hide all visualization containers
  document.querySelectorAll(".visualization-container").forEach(container => {
    container.style.display = "none";
  });
  
  // Stop waveform audio if it's playing
  // Using dynamic import to avoid circular dependencies
  import('./visualizers/waveform.js').then(module => {
    if (module.cleanupWaveformResources) {
      module.cleanupWaveformResources();
    } else if (module.stopWaveformAudio) {
      // Fallback to the old method if cleanupWaveformResources is not available
      module.stopWaveformAudio();
    }
  }).catch(err => {
    console.error("Error cleaning up waveform resources:", err);
  });
}

/**
 * Gets the current transform for a canvas element
 * @param {string} canvasId - ID of the canvas element
 * @returns {Object} Object containing scale, offsetX, and offsetY
 */
function getCanvasTransform(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas element not found for ID: ${canvasId}, returning default transform`);
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }
  
  // Parse values with fallbacks for each property
  const scale = canvas.dataset.scale ? parseFloat(canvas.dataset.scale) : 1;
  const offsetX = canvas.dataset.offsetX ? parseFloat(canvas.dataset.offsetX) : 0;
  const offsetY = canvas.dataset.offsetY ? parseFloat(canvas.dataset.offsetY) : 0;
  
  // Handle NaN values
  return {
    scale: isNaN(scale) ? 1 : scale,
    offsetX: isNaN(offsetX) ? 0 : offsetX,
    offsetY: isNaN(offsetY) ? 0 : offsetY
  };
}

/**
 * Generates phonetic layers from a word
 * @param {string} word - The input word
 * @param {number} maxLayers - Maximum number of layers to generate
 * @returns {Array} Array of layers, where each layer is an array of characters
 */
function generatePhoneticLayers(word, maxLayers = 3) {
  const layers = [word.split('')];
  for (let i = 1; i <= maxLayers; i++) {
    const nextLayer = spellOutArray(layers[i - 1]);
    if (!nextLayer.length) break;
    layers.push(nextLayer);
  }
  return layers;
}

/**
 * Gets the final text from all phonetic layers
 * @param {Array} layers - Array of phonetic layers
 * @returns {string} Concatenated text from the final layer
 */
function getFinalLayerText(layers) {
  if (!layers || !layers.length) return "";
  const finalLayer = layers[layers.length - 1];
  return finalLayer.join('');
}

// Export utilities for use in other modules
export {
  phoneticMap,
  spellOutArray,
  animateTypewriter,
  clearVisuals,
  getCanvasTransform,
  generatePhoneticLayers,
  getFinalLayerText
};
