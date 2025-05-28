/**
 * Phonetic Visualizer - Example Visualizer
 * Demonstrates the dynamic canvas creation system
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer } from '../visualizer-base.js';

/**
 * Specific render function for example visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderExampleSpecific(word, canvas, ctx, layers) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8c00", "#00cec9", "#ff33cc"];
  
  // Store state for animation and zoom/pan
  updateState('example', {
    layers: layers,
    colors: colors,
    centerX: centerX,
    centerY: centerY,
    frame: 0,
    word: word,
    animationStartTime: Date.now()
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('example');
    
    // Update frame in state
    updateState('example', { 
      frame: state.frame + 1,
      elapsedTime: Date.now() - state.animationStartTime
    });
    
    // Draw using the redraw function
    redrawExampleSpecific(state, canvas, ctx);
    
    // Continue animation
    const animationId = requestAnimationFrame(animate);
    updateState('example', { animationId });
  }
  
  animate();
}

/**
 * Specific redraw function for example visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawExampleSpecific(state, canvas, ctx) {
  if (!state.layers) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render example");
    return;
  }
  
  // Get transform for zoom/pan
  const transform = getCanvasTransform(canvas.id);
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  // Clear canvas with transform reset
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform for zoom/pan - correctly apply scale and offset
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const layers = state.layers;
  const colors = state.colors;
  const frame = state.frame;
  const elapsedTime = state.elapsedTime || 0;
  const word = state.word || "";
  
  // Animation parameters
  const animationPeriod = 5000; // 5 seconds for a full animation cycle
  const animationPhase = (elapsedTime % animationPeriod) / animationPeriod; // 0 to 1
  
  // No title or subtitle - removed for smoother animation
  
  // No background - transparent
  
  // Draw each layer with different visualization
  layers.forEach((layer, depth) => {
    if (!layer.length) return;
    
    const color = colors[depth % colors.length];
    const radius = 100 + depth * 50;
    const angleStep = (2 * Math.PI) / layer.length;
    
    // Draw connecting lines
    ctx.strokeStyle = `${color}88`; // Semi-transparent
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    layer.forEach((char, i) => {
      const angle = i * angleStep + animationPhase * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.stroke();
    
    // Draw characters
    ctx.fillStyle = color;
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    layer.forEach((char, i) => {
      const angle = i * angleStep + animationPhase * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Draw character outline (no background)
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw character
      ctx.fillStyle = color;
      ctx.fillText(char, x, y);
    });
  });
  
  // Draw center point (outline only)
  ctx.beginPath();
  ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw animated rings
  const numRings = 3;
  for (let i = 0; i < numRings; i++) {
    const ringPhase = (animationPhase + i / numRings) % 1;
    const ringRadius = 30 + ringPhase * 100;
    const ringOpacity = 1 - ringPhase;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(51, 51, 51, ${ringOpacity * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  // No instructions text - removed as per user feedback
  
  ctx.restore();
}

// Register the example visualizer with the system
// Note: We don't specify canvasId or containerId - they will be created dynamically
registerVisualizer('example', {
  displayName: 'Dynamic Canvas Example',
  renderFunction: renderExampleSpecific,
  redrawFunction: redrawExampleSpecific,
  stateTemplate: {
    layers: null,
    frame: 0,
    colors: null,
    centerX: 0,
    centerY: 0,
    word: "",
    animationStartTime: 0,
    elapsedTime: 0,
    animationId: null
  },
  animationConfig: {
    duration: 5000,
    layerDepth: 3
  }
});

// Export the specific functions for potential reuse
export { renderExampleSpecific, redrawExampleSpecific };
