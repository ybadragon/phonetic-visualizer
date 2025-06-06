/**
 * Phonetic Visualizer - Main Application
 * Handles UI interactions and visualization selection
 */

import { clearVisuals } from './utils.js';
import { getVisualizer, initializeVisualizerUI, getAllVisualizers, getAllCanvasIds } from './visualizer-base.js';

// Import visualizers to register them with the system
// Note: Icons are added directly in the visualizer files now.
import './visualizers/tree.js'; 
import './visualizers/spiral.js';
import './visualizers/ripple.js';
import './visualizers/fractal.js';
import './visualizers/waveform.js';
import './visualizers/constellation.js'; // Ensure constellation is also imported for registration
import './visualizers/futuristic.js';
import { stopWaveformVisualization } from './visualizers/waveform.js'; // Specific stop function
// renderConstellation is not needed here as constellation.js will handle its own registration

// Log available visualizers for debugging
let previouslySelectedVisualizerName = null; // Track previously active visualizer

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
    // const currentVisualization = document.getElementById("visualizationSelect").value; // Not strictly needed here
    
    if (word.length > 0) {
      renderSelectedVisualization();
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
  const choice = document.getElementById("visualizationSelect").value; // This is the new choice
  const word = document.getElementById("wordInput").value.trim();

  // Stop waveform audio if it was the previously active visualizer and is now being switched away from
  if (previouslySelectedVisualizerName === 'waveform' && previouslySelectedVisualizerName !== choice) {
    if (typeof stopWaveformVisualization === 'function') {
      console.log("Stopping previous waveform visualization.");
      stopWaveformVisualization();
    } else {
      console.warn("stopWaveformVisualization function not available to stop previous waveform.");
    }
  }
  
  if (!word) {
    return;
  }
  
  // If no visualization is selected, default to tree
  if (!choice || choice === "") {
    document.getElementById("visualizationSelect").value = "tree";
    // Use the visualizer system to render the tree
    const treeVisualizer = getVisualizer('tree');
    if (treeVisualizer) {
      treeVisualizer.render(word);
    } else {
      console.error("Tree visualizer not found");
    }
    return;
  }
  
  // Clean up any existing visualizations
  clearVisuals();
  
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
    previouslySelectedVisualizerName = choice; // Update before returning
    return;
  } else {
    console.log(`Visualizer ${choice} not found in new system, falling back to old system`);
  }
  
  // Fall back to the old system for visualizers that haven't been refactored yet
  switch (choice) {
    case "constellation":
      document.getElementById("constellationContainer").style.display = "block";
      renderConstellation(word);
      break;
    default:
      // Default to a registered visualizer if unknown visualization type
      // This case should ideally not be hit if 'choice' is a valid registered visualizer
      console.warn(`Visualizer ${choice} not handled by new system and not in old switch. Attempting default.`);
      const defaultVisualizer = getVisualizer('tree'); // Or some other sensible default
      if (defaultVisualizer) {
        defaultVisualizer.render(word);
      } else {
        console.error(`No default visualizer found for unknown type: ${choice}`);
      }
  }
  previouslySelectedVisualizerName = choice; // Update after rendering, ensuring it's always set
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
    let targetOffsetX = offsetX;
    let targetOffsetY = offsetY;
    let zoomAnimationId = null;
    
    // Function to perform smooth zoom animation
    function animateZoom() {
      // Calculate steps based on difference between current and target values
      const scaleDiff = targetScale - scale;
      const offsetXDiff = targetOffsetX - offsetX;
      const offsetYDiff = targetOffsetY - offsetY;
      
      // Use easing for smoother animation (10% of remaining difference)
      const scaleStep = scaleDiff * 0.1;
      const offsetXStep = offsetXDiff * 0.1;
      const offsetYStep = offsetYDiff * 0.1;
      
      // Check if we're close enough to stop the animation
      if (Math.abs(scaleDiff) < 0.001 && 
          Math.abs(offsetXDiff) < 0.1 && 
          Math.abs(offsetYDiff) < 0.1) {
        // Close enough, set to target values and stop animation
        scale = targetScale;
        offsetX = targetOffsetX;
        offsetY = targetOffsetY;
        zoomAnimationId = null;
      } else {
        // Update values with steps
        scale += scaleStep;
        offsetX += offsetXStep;
        offsetY += offsetYStep;
        
        // Request next animation frame
        zoomAnimationId = requestAnimationFrame(animateZoom);
      }
      
      // Store transform values
      canvas.dataset.scale = scale;
      canvas.dataset.offsetX = offsetX;
      canvas.dataset.offsetY = offsetY;
      
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
      
      // Calculate zoom factor
      const zoomIntensity = 0.1;
      const delta = event.deltaY < 0 ? zoomIntensity : -zoomIntensity;
      
      // Calculate target scale
      targetScale = Math.max(minScale, Math.min(maxScale, scale * (1 + delta)));
      
      // Calculate mouse position in world space (before zoom)
      const worldX = (mouseX - offsetX) / scale;
      const worldY = (mouseY - offsetY) / scale;
      
      // Calculate new target offsets to keep the point under the mouse fixed
      targetOffsetX = mouseX - worldX * targetScale;
      targetOffsetY = mouseY - worldY * targetScale;
      
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
        
        // Update target values to match current offsets to prevent snapping back
        targetOffsetX = offsetX;
        targetOffsetY = offsetY;
        
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
