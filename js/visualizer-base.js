/**
 * Phonetic Visualizer - Base Visualizer System
 * Provides a generic architecture for creating and managing visualizers
 */

import { animateTypewriter, generatePhoneticLayers, getFinalLayerText, getCanvasTransform } from './utils.js';
import { getState, updateState, cancelAnimation, resetState, registerVisualizerState } from './state.js';

// Store all registered visualizers
const visualizers = {};

// Store visualizer templates for state management
const visualizerTemplates = {};

// Store created canvas elements for cleanup
const createdCanvases = new Set();

/**
 * Creates or gets a canvas container element
 * @param {string} containerId - ID for the container element
 * @returns {HTMLElement} The container element
 */
function createOrGetContainer(containerId) {
  let container = document.getElementById(containerId);
  
  if (!container) {
    console.log(`Creating new container with ID: ${containerId}`);
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'visualization-container';
    container.style.display = 'none';
    
    // Append to the same parent as other visualization containers
    const existingContainer = document.querySelector('.visualization-container');
    if (existingContainer && existingContainer.parentNode) {
      existingContainer.parentNode.appendChild(container);
    } else {
      // Fallback to appending after the typewriter container
      const typewriterContainer = document.getElementById('typewriterContainer');
      if (typewriterContainer) {
        typewriterContainer.parentNode.insertBefore(container, typewriterContainer.nextSibling);
      } else {
        // Last resort, append to body
        document.body.appendChild(container);
      }
    }
  }
  
  return container;
}

/**
 * Creates or gets a canvas element
 * @param {string} canvasId - ID for the canvas element
 * @param {HTMLElement} container - Container element to append the canvas to
 * @returns {HTMLCanvasElement} The canvas element
 */
function createOrGetCanvas(canvasId, container) {
  let canvas = document.getElementById(canvasId);
  
  if (!canvas) {
    console.log(`Creating new canvas with ID: ${canvasId}`);
    canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.style.display = 'none';
    container.appendChild(canvas);
    createdCanvases.add(canvasId);
  }
  
  return canvas;
}

/**
 * Creates a visualizer with standardized functionality
 * @param {Object} config - Configuration for the visualizer
 * @returns {Object} Visualizer object with render and redraw methods
 */
function createVisualizer(config) {
  const {
    name,
    displayName,
    icon, // Added icon property
    canvasId = `${name}-canvas`,
    containerId = `${name}Container`,
    renderFunction,
    redrawFunction,
    stateTemplate,
    animationConfig = {}
  } = config;
  
  // Create or get container and canvas elements
  const container = createOrGetContainer(containerId);
  const canvas = createOrGetCanvas(canvasId, container);
  
  return {
    name,
    displayName,
    icon, // Store icon property
    canvasId,
    containerId,
    
    /**
     * Gets the canvas element for this visualizer
     * @returns {HTMLCanvasElement} The canvas element
     */
    getCanvas: function() {
      return document.getElementById(canvasId);
    },
    
    /**
     * Gets the container element for this visualizer
     * @returns {HTMLElement} The container element
     */
    getContainer: function() {
      return document.getElementById(containerId);
    },
    
    /**
     * Renders the visualizer for the given word
     * @param {string} word - The word to visualize
     */
    render: function(word) {
      console.log(`Rendering ${name} visualizer for word: ${word}`);
      
      if (!word) {
        console.error(`No word provided for ${name} visualizer`);
        return;
      }
      
      // Make sure the canvas container is visible first
      const container = document.getElementById(containerId);
      if (container) {
        console.log(`Setting container ${containerId} to visible`);
        container.style.display = "block";
      } else {
        console.error(`Container element not found: ${containerId}`);
        return;
      }
      
      // Get canvas and context
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`Canvas element not found: ${canvasId}`);
        return;
      }
      
      // Set canvas display style
      canvas.style.display = "block";
      
      // Force a reflow to ensure the container is visible before getting dimensions
      void container.offsetWidth;
      
      // Set canvas dimensions based on container size
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Generate phonetic layers
      const layers = generatePhoneticLayers(word, animationConfig.layerDepth || 3);
      
      // Get the final layer for typewriter animation
      const finalText = getFinalLayerText(layers);
      
      // Calculate animation duration
      const animationDuration = animationConfig.duration || 3000;
      
      // Start typewriter animation
      animateTypewriter(finalText, animationDuration);
      
      // Cancel any existing animation
      cancelAnimation(name);
      
      // Reset state to template
      resetState(name);
      
      // Call the specific render function
      console.log(`Calling specific render function for ${name}`);
      try {
        renderFunction(word, canvas, ctx, layers);
        console.log(`Render function completed for ${name}`);
      } catch (error) {
        console.error(`Error in render function for ${name}:`, error);
      }
    },
    
    /**
     * Redraws the visualizer without recalculating
     */
    redraw: function() {
      console.log(`Redrawing ${name} visualizer`);
      
      const state = getState(name);
      if (!state) {
        console.error(`No state found for ${name} visualizer`);
        return;
      }
      
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`Canvas element not found for ${name}: ${canvasId}`);
        return;
      }
      
      // Make sure the canvas has proper dimensions
      const container = document.getElementById(containerId);
      if (container && (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight)) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
      
      const ctx = canvas.getContext("2d");
      
      // Call the specific redraw function
      console.log(`Calling specific redraw function for ${name}`);
      try {
        redrawFunction(state, canvas, ctx);
        console.log(`Redraw function completed for ${name}`);
      } catch (error) {
        console.error(`Error in redraw function for ${name}:`, error);
      }
    }
  };
}

/**
 * Registers a visualizer with the system
 * @param {string} name - Unique identifier for the visualizer
 * @param {Object} options - Configuration options for the visualizer
 */
function registerVisualizer(name, options) {
  console.log(`Registering visualizer: ${name}`, options);
  
  // Create the visualizer
  visualizers[name] = createVisualizer({
    name,
    ...options
  });
  
  // Register state template
  registerVisualizerState(name, options.stateTemplate);
  
  // Store template for resets
  visualizerTemplates[name] = options.stateTemplate;
  
  console.log(`Registered visualizers:`, Object.keys(visualizers));
}

/**
 * Gets a registered visualizer by name
 * @param {string} name - Name of the visualizer to get
 * @returns {Object|null} The visualizer object or null if not found
 */
function getVisualizer(name) {
  return visualizers[name] || null;
}

/**
 * Gets all registered visualizers
 * @returns {Object} Object containing all registered visualizers
 */
function getAllVisualizers() {
  return visualizers;
}

/**
 * Gets all canvas IDs for registered visualizers
 * @returns {Array} Array of canvas IDs
 */
function getAllCanvasIds() {
  return Object.values(visualizers).map(visualizer => visualizer.canvasId);
}

/**
 * Initializes the visualizer UI based on registered visualizers
 */
function initializeVisualizerUI() {
  console.log('Initializing visualizer UI with registered visualizers:', Object.keys(visualizers));
  
  const select = document.getElementById("visualizationSelect");
  
  // Clear existing options
  select.innerHTML = '<option value="" disabled selected hidden>🔍 Select Visualization</option>';
  
  // Add options for each registered visualizer
  Object.entries(visualizers).forEach(([key, visualizer]) => {
    console.log(`Adding option for visualizer: ${key}`, visualizer);
    const option = document.createElement('option');
    option.value = key;
    
    let iconHTML = '';
    if (visualizer.icon) {
      // Wrap icon in a span for consistent styling and alignment, add a space after if icon exists
      iconHTML = `<span class="viz-icon">${visualizer.icon}</span> `;
    }
    
    // Use innerHTML to correctly render the icon span, then append the display name as text
    option.innerHTML = `${iconHTML}${visualizer.displayName}`;
    select.appendChild(option);
  });
}

/**
 * Gets the state template for a visualizer
 * @param {string} name - Name of the visualizer
 * @returns {Object|null} The state template or null if not found
 */
function getVisualizerTemplate(name) {
  return visualizerTemplates[name] || null;
}

// Export the visualizer system
export {
  createVisualizer,
  registerVisualizer,
  getVisualizer,
  getAllVisualizers,
  getAllCanvasIds,
  initializeVisualizerUI,
  getVisualizerTemplate,
  createdCanvases
};
