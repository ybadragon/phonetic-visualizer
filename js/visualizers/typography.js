/**
 * Phonetic Visualizer - Typography Visualization
 * Renders a typography-style visualization using Canvas
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';

/**
 * Specific render function for typography visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderTypographySpecific(word, canvas, ctx, layers) {
  // Calculate canvas center
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Define colors for different layers
  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8c00", "#00cec9", "#ff33cc"];
  
  // Create character data for animation
  const characters = [];
  
  // Process each layer
  layers.forEach((layer, layerIndex) => {
    layer.forEach((char, charIndex) => {
      // Calculate position based on layer and character index
      const x = centerX + (charIndex - layer.length / 2) * 40;
      const y = centerY + layerIndex * 60 - (layers.length * 30) / 2;
      
      // Add character data
      characters.push({
        char,
        x,
        y,
        targetX: x,
        targetY: y,
        currentX: centerX,
        currentY: centerY,
        color: colors[layerIndex % colors.length],
        size: 24 - layerIndex * 2,
        rotation: Math.random() * 360,
        targetRotation: 0,
        opacity: 0,
        delay: charIndex * 3 + layerIndex * 10,
        layer: layerIndex
      });
    });
  });
  
  // Store state for animation
  updateState('typography', {
    characters,
    frame: 0,
    colors,
    centerX,
    centerY,
    maxFrames: 120
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('typography');
    
    // Update frame in state
    updateState('typography', { frame: state.frame + 1 });
    
    // Draw using the redraw function
    redrawTypographySpecific(state, canvas, ctx);
    
    if (state.frame < state.maxFrames + characters.length) {
      const animationId = requestAnimationFrame(animate);
      updateState('typography', { animationId });
    }
  }
  
  animate();
}

/**
 * Specific redraw function for typography visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawTypographySpecific(state, canvas, ctx) {
  if (!state.characters) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render typography");
    return;
  }
  
  const transform = getCanvasTransform("typography");
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(offsetX * scale, offsetY * scale);
  ctx.scale(scale, scale);
  
  const characters = state.characters;
  const frame = state.frame;
  
  // Draw each character with animation
  characters.forEach((char, index) => {
    // Skip if not yet time to show this character
    if (frame < char.delay) return;
    
    // Calculate animation progress (0 to 1)
    const progress = Math.min(1, (frame - char.delay) / 60);
    
    // Apply easing function for smooth animation
    const easedProgress = easeOutElastic(progress);
    
    // Update character position and properties
    char.currentX = char.currentX + (char.targetX - char.currentX) * easedProgress;
    char.currentY = char.currentY + (char.targetY - char.currentY) * easedProgress;
    char.rotation = char.rotation + (char.targetRotation - char.rotation) * easedProgress;
    char.opacity = progress;
    
    // Draw character
    ctx.save();
    ctx.translate(char.currentX, char.currentY);
    ctx.rotate(char.rotation * Math.PI / 180);
    ctx.font = `bold ${char.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw shadow for depth
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillText(char.char, 2, 2);
    
    // Draw character with color
    ctx.fillStyle = char.color + Math.floor(char.opacity * 255).toString(16).padStart(2, '0');
    ctx.fillText(char.char, 0, 0);
    
    ctx.restore();
  });
  
  ctx.restore();
}

/**
 * Elastic easing function for smooth animation
 * @param {number} x - Progress from 0 to 1
 * @returns {number} Eased value
 */
function easeOutElastic(x) {
  const c4 = (2 * Math.PI) / 3;
  
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

// Register the typography visualizer with the system
registerVisualizer('typography', {
  displayName: 'Typography Animation',
  canvasId: 'typography',
  containerId: 'typographyContainer',
  renderFunction: renderTypographySpecific,
  redrawFunction: redrawTypographySpecific,
  stateTemplate: {
    characters: null,
    frame: 0,
    colors: null,
    centerX: 0,
    centerY: 0,
    maxFrames: 120,
    animationId: null
  },
  animationConfig: {
    duration: 4000,
    layerDepth: 3
  }
});

// Export the specific functions for potential reuse
export { renderTypographySpecific, redrawTypographySpecific };
