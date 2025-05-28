/**
 * Phonetic Visualizer - State Management
 * Manages the state for all visualizations
 */

// Global state object for all visualizations
const visualizationState = {
  spiral: {
    points: null,
    frame: 0,
    colors: null,
    animationId: null
  },
  ripple: {
    layers: null,
    frame: 0,
    colors: null,
    animationId: null,
    centerX: 0,
    centerY: 0,
    ringSpacing: 60,
    currentViz: null
  },
  fractal: {
    branches: null,
    frame: 0,
    colors: null,
    animationId: null,
    centerX: 0,
    centerY: 0,
    season: "spring" // spring, summer, fall, winter
  },
  constellation: {
    stars: null,
    connections: null,
    frame: 0,
    colors: null,
    animationId: null,
    centerX: 0,
    centerY: 0,
    twinkleSpeed: 0.05
  },
  waveform: {
    frequencies: null,
    waveData: null,
    frame: 0,
    colors: null,
    animationId: null,
    audioContext: null,
    audioNodes: null,
    isPlaying: false
  }
};

// Store templates for each visualizer's state
const visualizerTemplates = {};

/**
 * Registers a state template for a visualizer
 * @param {string} visualizerName - Name of the visualizer
 * @param {Object} stateTemplate - Template for the visualizer's state
 */
function registerVisualizerState(visualizerName, stateTemplate) {
  // Store the template
  visualizerTemplates[visualizerName] = stateTemplate;
  
  // Initialize the state if it doesn't exist
  if (!visualizationState[visualizerName]) {
    visualizationState[visualizerName] = { ...stateTemplate };
  }
}

/**
 * Cancels any running animations for a specific visualization
 * @param {string} visualizationType - Type of visualization (spiral, ripple, etc.)
 */
function cancelAnimation(visualizationType) {
  if (visualizationState[visualizationType] && 
      visualizationState[visualizationType].animationId) {
    cancelAnimationFrame(visualizationState[visualizationType].animationId);
    visualizationState[visualizationType].animationId = null;
  }
}

/**
 * Resets the state for a specific visualization
 * @param {string} visualizationType - Type of visualization (spiral, ripple, etc.)
 */
function resetState(visualizationType) {
  // Handle special case for waveform (audio cleanup)
  if (visualizationType === 'waveform' && 
      visualizationState.waveform && 
      visualizationState.waveform.audioNodes) {
    // Clean up audio nodes for waveform visualization
    visualizationState.waveform.audioNodes.forEach(node => {
      try {
        // Stop any audio source nodes
        if (node.stop) {
          node.stop(0);
        }
        node.disconnect();
      } catch (e) {
        // Node might already be disconnected or stopped
      }
    });
    
    // Cancel any ongoing animation
    cancelAnimation('waveform');
    
    // Preserve the audio context but reset everything else
    const audioContext = visualizationState.waveform.audioContext;
    
    // Use template if available, otherwise use default waveform state
    if (visualizerTemplates[visualizationType]) {
      visualizationState[visualizationType] = { 
        ...visualizerTemplates[visualizationType],
        audioContext: audioContext, // Keep audio context
        audioNodes: [],
        soundBuffers: [],
        isPlaying: false,
        dataArray: null,
        bufferLength: null,
        analyzer: null
      };
    } else {
      visualizationState.waveform = {
        frequencies: null,
        waveData: null,
        frame: 0,
        colors: null,
        animationId: null,
        audioContext: audioContext, // Keep audio context
        audioNodes: [],
        soundBuffers: [],
        isPlaying: false,
        dataArray: null,
        bufferLength: null,
        analyzer: null
      };
    }
    return;
  }
  
  // For other visualizers, use the template if available
  if (visualizerTemplates[visualizationType]) {
    visualizationState[visualizationType] = { ...visualizerTemplates[visualizationType] };
  } else {
    // Fallback to existing reset logic for backward compatibility
    switch (visualizationType) {
      case 'spiral':
        visualizationState.spiral = {
          points: null,
          frame: 0,
          colors: null,
          animationId: null
        };
        break;
      case 'ripple':
        visualizationState.ripple = {
          layers: null,
          frame: 0,
          colors: null,
          animationId: null,
          centerX: 0,
          centerY: 0,
          ringSpacing: 60,
          currentViz: null
        };
        break;
      case 'fractal':
        visualizationState.fractal = {
          branches: null,
          frame: 0,
          colors: null,
          animationId: null,
          centerX: 0,
          centerY: 0,
          season: "spring"
        };
        break;
      case 'constellation':
        visualizationState.constellation = {
          stars: null,
          connections: null,
          frame: 0,
          colors: null,
          animationId: null,
          centerX: 0,
          centerY: 0,
          twinkleSpeed: 0.05
        };
        break;
    }
  }
}

/**
 * Gets the current state for a specific visualization
 * @param {string} visualizationType - Type of visualization (spiral, ripple, etc.)
 * @returns {Object} Current state for the visualization
 */
function getState(visualizationType) {
  return visualizationState[visualizationType];
}

/**
 * Updates the state for a specific visualization
 * @param {string} visualizationType - Type of visualization (spiral, ripple, etc.)
 * @param {Object} newState - New state to merge with existing state
 */
function updateState(visualizationType, newState) {
  if (visualizationState[visualizationType]) {
    visualizationState[visualizationType] = {
      ...visualizationState[visualizationType],
      ...newState
    };
  }
}

// Export state management functions
export {
  visualizationState,
  visualizerTemplates,
  registerVisualizerState,
  cancelAnimation,
  resetState,
  getState,
  updateState
};
