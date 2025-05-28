/**
 * Phonetic Visualizer - Spiral Visualization
 * Renders a spiral path visualization using Canvas
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';

/**
 * Generates points for the spiral visualization
 * @param {Array} layers - Array of phonetic layers
 * @returns {Array} Array of points with x, y, char, and level properties
 */
function generateSpiralPoints(layers) {
  // Calculate total characters for spacing
  const totalChars = layers.reduce((sum, layer) => sum + layer.length, 0);
  
  // Constants for spiral generation
  const baseRadius = 40;  // Increased starting radius to prevent central overlapping
  const growthRate = 2.5; // How quickly the spiral expands
  const angleIncrement = 0.35; // Increased angle increment to space letters further apart
  const letterSize = 20; // Approximate size of letters for collision detection
  
  // Array to store all points
  const allPoints = [];
  
  // Process each layer
  return layers.flatMap((layer, depth) => {
    // Process each character in the layer
    return layer.map((char, i) => {
      // Calculate the absolute index in the entire sequence
      const index = i + layers.slice(0, depth).reduce((a, l) => a + l.length, 0);
      
      // Calculate initial angle and radius using consistent formulas
      let angle = angleIncrement * index;
      let radius = baseRadius + growthRate * index;
      
      // Create the point
      const point = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        char,
        level: depth
      };
      
      // Add to all points array
      allPoints.push(point);
      
      return point;
    });
  });
}

/**
 * Specific render function for spiral visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderSpiralSpecific(word, canvas, ctx, layers) {
  // Calculate total number of points for animation duration
  const totalPoints = layers.reduce((sum, layer) => sum + layer.length, 0);
  
  // Generate spiral points
  const spiralPoints = generateSpiralPoints(layers);
  
  // Define colors for different layers
  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8c00", "#00cec9", "#ff33cc"];
  
  // Store state for zoom/pan
  updateState('spiral', {
    points: spiralPoints,
    colors: colors,
    frame: 0
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('spiral');
    
    // Update frame in state
    updateState('spiral', { frame: state.frame + 1 });
    
    // Draw using the redraw function
    redrawSpiralSpecific(state, canvas, ctx);
    
    if (state.frame < spiralPoints.length) {
      const animationId = requestAnimationFrame(animate);
      updateState('spiral', { animationId });
    }
  }
  
  animate();
}

/**
 * Specific redraw function for spiral visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawSpiralSpecific(state, canvas, ctx) {
  if (!state.points) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render spiral");
    return;
  }
  
  const transform = getCanvasTransform("spiral");
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const cx = canvas.width / 2 + offsetX;
  const cy = canvas.height / 2 + offsetY;
  
  ctx.save();
  ctx.scale(scale, scale);
  
  const points = state.points;
  const colors = state.colors;
  const frame = state.frame;
  
  for (let i = 0; i <= frame && i < points.length; i++) {
    const p = points[i];
    if (!p.char || typeof p.char !== 'string') continue;
    ctx.fillStyle = colors[p.level % colors.length];
    ctx.font = "20px monospace";
    ctx.fillText(p.char, cx + p.x, cy + p.y);
  }
  
  ctx.restore();
}

// Register the spiral visualizer with the system
registerVisualizer('spiral', {
  displayName: 'Spiral Path',
  canvasId: 'spiral',
  containerId: 'spiralContainer',
  renderFunction: renderSpiralSpecific,
  redrawFunction: redrawSpiralSpecific,
  stateTemplate: {
    points: null,
    frame: 0,
    colors: null,
    animationId: null
  },
  animationConfig: {
    duration: 3000,
    layerDepth: 3
  }
});

// For backward compatibility
function renderSpiral(word) {
  const visualizer = getVisualizer('spiral');
  if (visualizer) {
    visualizer.render(word);
  }
}

function redrawSpiral() {
  const visualizer = getVisualizer('spiral');
  if (visualizer) {
    visualizer.redraw();
  }
}

// Export for backward compatibility
export { renderSpiral, redrawSpiral };

// Export the specific functions for potential reuse
export { renderSpiralSpecific, redrawSpiralSpecific, generateSpiralPoints };
