/**
 * Phonetic Visualizer - Main Application
 * Handles UI interactions and visualization selection
 */

import { clearVisuals } from './utils.js';
import { getVisualizer, initializeVisualizerUI, getAllVisualizers, getAllCanvasIds } from './visualizer-base.js';

// Import visualizers to register them with the system
import './visualizers/spiral.js';
import './visualizers/typography.js';
import './visualizers/ripple.js';
import './visualizers/example.js'; // Example visualizer using dynamic canvas creation
// The following imports will be updated as we refactor each visualizer
import { renderTree } from './visualizers/tree.js';
import { renderWaveform, toggleWaveformAudio, cleanupWaveformResources } from './visualizers/waveform.js';
import { renderConstellation } from './visualizers/constellation.js';
import { renderFractal } from './visualizers/fractal.js';

// Log available visualizers for debugging
console.log('Main.js loaded, checking available visualizers...');
setTimeout(() => {
  console.log('Available visualizers after initialization:', 
    Object.keys(getAllVisualizers ? getAllVisualizers() : {})
  );
}, 100);

/**
 * Initializes the application
 */
function initApp() {
  // Initialize the visualizer UI
  initializeVisualizerUI();
  
  // Add event listener for visualization selection change
  document.getElementById("visualizationSelect").addEventListener("change", renderSelectedVisualization);

  // Add event listener for word input
  document.getElementById("wordInput").addEventListener("input", function(e) {
    const word = e.target.value.trim();
    const currentVisualization = document.getElementById("visualizationSelect").value;
    
    if (word.length > 0) {
      renderSelectedVisualization();
    }
  });

  // Add event listener for waveform canvas click
  document.getElementById("waveform").addEventListener("click", function(event) {
    if (document.getElementById("waveformContainer").style.display === "block") {
      // The click handler is already set up in the waveform module
    }
  });

  // Initialize the page with a default visualization if there's a word in the input
  const word = document.getElementById("wordInput").value.trim();
  if (word.length > 0) {
    // Set default visualization to tree if none selected
    if (!document.getElementById("visualizationSelect").value || 
        document.getElementById("visualizationSelect").value === "") {
      document.getElementById("visualizationSelect").value = "tree";
    }
    renderSelectedVisualization();
  }

  // Setup canvas zoom/pan functionality
  setupCanvasZoomPan();
}

/**
 * Renders the currently selected visualization
 */
function renderSelectedVisualization() {
  const choice = document.getElementById("visualizationSelect").value;
  const word = document.getElementById("wordInput").value.trim();
  
  if (!word) {
    return;
  }
  
  // If no visualization is selected, default to tree
  if (!choice || choice === "") {
    document.getElementById("visualizationSelect").value = "tree";
    document.getElementById("treeContainer").style.display = "block";
    renderTree(word);
    return;
  }
  
  // Clean up any existing visualizations, especially important for waveform
  clearVisuals();
  
  // Explicitly clean up waveform resources to prevent memory leaks and system lockup
  cleanupWaveformResources();
  
  // Hide all visualization containers first
  document.querySelectorAll(".visualization-container").forEach(container => {
    container.style.display = "none";
  });
  
  // Make sure the word input is enabled when switching visualizations
  document.getElementById("wordInput").disabled = false;
  
  // Try to use the new visualizer system first
  const visualizer = getVisualizer(choice);
  console.log(`Attempting to render visualizer: ${choice}`, visualizer);
  if (visualizer) {
    console.log(`Using new system for ${choice}`);
    visualizer.render(word);
    return;
  } else {
    console.log(`Visualizer ${choice} not found in new system, falling back to old system`);
  }
  
  // Fall back to the old system for visualizers that haven't been refactored yet
  switch (choice) {
    case "tree":
      document.getElementById("treeContainer").style.display = "block";
      renderTree(word);
      break;
    case "waveform":
      document.getElementById("waveformContainer").style.display = "block";
      renderWaveform(word);
      break;
    case "fractal":
      document.getElementById("fractalContainer").style.display = "block";
      renderFractal(word);
      break;
    case "constellation":
      document.getElementById("constellationContainer").style.display = "block";
      renderConstellation(word);
      break;
    default:
      // Default to tree if unknown visualization type
      document.getElementById("treeContainer").style.display = "block";
      renderTree(word);
  }
}

/**
 * Sets up zoom and pan functionality for canvas visualizations
 */
function setupCanvasZoomPan() {
  // Get all canvas IDs from registered visualizers
  const canvasIds = getAllCanvasIds();
  console.log("Setting up zoom/pan for canvases:", canvasIds);
  
  canvasIds.forEach(canvasId => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let lastX, lastY;
    const minScale = 0.2;
    const maxScale = 5;
    
    // Add smooth zoom animation variables
    let targetScale = scale;
    let zoomAnimationId = null;
    
    // Function to perform smooth zoom animation
    function animateZoom() {
      // Calculate step based on difference between current and target scale
      const diff = targetScale - scale;
      const step = diff * 0.1; // 10% of the remaining difference each frame
      
      if (Math.abs(diff) < 0.001) {
        // Close enough, set to target and stop animation
        scale = targetScale;
        zoomAnimationId = null;
      } else {
        // Update scale with step
        scale += step;
        
        // Request next animation frame
        zoomAnimationId = requestAnimationFrame(animateZoom);
      }
      
      // Store transform values
      canvas.dataset.scale = scale;
      
      // Trigger redraw
      triggerRedraw(canvasId);
    }
    
    // Add mouse wheel zoom functionality with centered zooming
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      
      // Get mouse position relative to canvas
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Calculate mouse position in canvas space (before zoom)
      const canvasX = (mouseX - offsetX) / scale;
      const canvasY = (mouseY - offsetY) / scale;
      
      // Calculate zoom factor
      const zoomIntensity = 0.1;
      const delta = event.deltaY < 0 ? zoomIntensity : -zoomIntensity;
      
      // Calculate target scale
      targetScale = Math.max(minScale, Math.min(maxScale, scale * (1 + delta)));
      
      // Calculate new offsets to keep the point under the mouse fixed
      offsetX = mouseX - canvasX * targetScale;
      offsetY = mouseY - canvasY * targetScale;
      
      // Store offset values
      canvas.dataset.offsetX = offsetX;
      canvas.dataset.offsetY = offsetY;
      
      // Cancel any existing animation
      if (zoomAnimationId) {
        cancelAnimationFrame(zoomAnimationId);
      }
      
      // Start smooth zoom animation
      zoomAnimationId = requestAnimationFrame(animateZoom);
    });
    
    // Mouse events for panning
    canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    
    canvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        // Direct 1:1 mapping for more intuitive panning
        offsetX += (e.clientX - lastX);
        offsetY += (e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
        
        canvas.dataset.scale = scale;
        canvas.dataset.offsetX = offsetX;
        canvas.dataset.offsetY = offsetY;
        
        // Trigger redraw based on canvas type
        triggerRedraw(canvasId);
      }
    });
    
    canvas.addEventListener("mouseup", () => {
      isDragging = false;
    });
    
    canvas.addEventListener("mouseleave", () => {
      isDragging = false;
    });
  });
}

/**
 * Triggers a redraw for the specified canvas type
 * @param {string} canvasId - ID of the canvas to redraw
 */
function triggerRedraw(canvasId) {
  console.log(`Triggering redraw for canvas: ${canvasId}`);
  
  // Get the current selected visualizer
  const currentViz = document.getElementById("visualizationSelect").value;
  
  // Find which visualizer uses this canvas
  const visualizers = getAllVisualizers();
  let visualizerToRedraw = null;
  
  // First try the current selected visualizer if it matches the canvas
  if (currentViz && visualizers[currentViz] && visualizers[currentViz].canvasId === canvasId) {
    visualizerToRedraw = visualizers[currentViz];
  } else {
    // Otherwise find any visualizer that uses this canvas
    for (const [name, visualizer] of Object.entries(visualizers)) {
      if (visualizer.canvasId === canvasId) {
        visualizerToRedraw = visualizer;
        break;
      }
    }
  }
  
  if (visualizerToRedraw) {
    console.log(`Found visualizer ${visualizerToRedraw.name} for canvas ${canvasId}, redrawing`);
    visualizerToRedraw.redraw();
    return;
  }
  
  // Fallback to legacy redraw methods for non-refactored visualizers
  console.log(`No visualizer found for canvas ${canvasId}, trying legacy methods`);
  
  // Import redraw functions dynamically to avoid circular dependencies
  switch (canvasId) {
    case "waveform":
      import('./visualizers/waveform.js').then(module => {
        if (module.redrawWaveform) module.redrawWaveform();
      }).catch(error => {
        console.error(`Error importing waveform module:`, error);
      });
      break;
    case "constellation":
      import('./visualizers/constellation.js').then(module => {
        if (module.redrawConstellation) module.redrawConstellation();
      }).catch(error => {
        console.error(`Error importing constellation module:`, error);
      });
      break;
    case "fractal":
      import('./visualizers/fractal.js').then(module => {
        if (module.redrawFractal) module.redrawFractal();
      }).catch(error => {
        console.error(`Error importing fractal module:`, error);
      });
      break;
    default:
      console.warn(`No legacy redraw method found for canvas: ${canvasId}`);
  }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp);

export { renderSelectedVisualization };
