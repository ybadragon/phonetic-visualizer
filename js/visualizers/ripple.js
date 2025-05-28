/**
 * Phonetic Visualizer - Ripple Visualizations
 * Renders various ripple-style visualizations using Canvas
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';

/**
 * Specific render function for ripple1 visualization (Radial Expansion)
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderRipple1Specific(word, canvas, ctx, layers) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const ringSpacing = 60;
  const colors = d3.schemeCategory10;
  
  // Store state for animation and zoom/pan
  updateState('ripple1', {
    layers: layers,
    colors: colors,
    centerX: centerX,
    centerY: centerY,
    ringSpacing: ringSpacing,
    frame: 0
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('ripple1');
    
    // Update frame in state
    updateState('ripple1', { frame: state.frame + 1 });
    
    // Draw using the redraw function
    redrawRipple1Specific(state, canvas, ctx);
    
    if (state.frame < 200) {
      const animationId = requestAnimationFrame(animate);
      updateState('ripple1', { animationId });
    }
  }
  
  animate();
}

/**
 * Specific redraw function for ripple1 visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawRipple1Specific(state, canvas, ctx) {
  if (!state.layers) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render ripple1");
    return;
  }
  
  const transform = getCanvasTransform("ripple");
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // For ripple1 visualization
  const adjustedCenterX = canvas.width / 2;
  const adjustedCenterY = canvas.height / 2;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  const layers = state.layers;
  const colors = state.colors;
  const frame = state.frame;
  const ringSpacing = state.ringSpacing;
  
  function easeOutBounce(x) {
    const n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    else if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    else if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    else return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
  
  const baseRevealInterval = 15;
  const baseFadeDuration = 20;
  
  layers.forEach((layer, depth) => {
    if (!layer.length) return;
    const revealFrame = depth * baseRevealInterval;
    const fadeDuration = baseFadeDuration + depth * 5;
    if (frame < revealFrame) return;
    
    const progress = Math.min(1, (frame - revealFrame) / fadeDuration);
    const easedProgress = easeOutBounce(progress * 0.95);
    const baseRadius = ringSpacing * (depth + 1);
    const prevRadius = ringSpacing * depth;
    const animatedRadius = prevRadius + (baseRadius - prevRadius) * easedProgress;
    
    const maxDensity = 0.12; // max radians per char (~1 char per 8 deg)
    const angleStep = Math.max((2 * Math.PI) / layer.length, maxDensity);
    // Start at top (0 degrees)
    const startAngle = -Math.PI / 2; // This is already at top (0 degrees in standard position)
    
    ctx.save();
    const baseFontSize = 24;
    const fontSize = Math.min(baseFontSize, (2 * Math.PI * animatedRadius) / (layer.length * 1.2));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Faded debug ring at final radius
    ctx.beginPath();
    ctx.arc(adjustedCenterX, adjustedCenterY, baseRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = colors[depth % colors.length];
    ctx.globalAlpha = 0.05;
    ctx.stroke();
    
    ctx.fillStyle = colors[depth % colors.length];
    ctx.globalAlpha = progress;
    
    layer.forEach((char, i) => {
      const angle = startAngle + i * angleStep;
      const x = adjustedCenterX + Math.cos(angle) * animatedRadius;
      const y = adjustedCenterY + Math.sin(angle) * animatedRadius;
      ctx.fillText(char, x, y);
    });
    ctx.restore();
  });
  
  ctx.restore();
}

/**
 * Specific render function for ripple2 visualization (Concentric Waves)
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderRipple2Specific(word, canvas, ctx, layers) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const ringSpacing = 60;
  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8c00", "#00cec9", "#ff33cc"];
  
  // Store state for animation and zoom/pan
  updateState('ripple2', {
    layers: layers,
    colors: colors,
    centerX: centerX,
    centerY: centerY,
    ringSpacing: ringSpacing,
    frame: 0,
    animationStartTime: Date.now()
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('ripple2');
    
    // Update frame in state
    updateState('ripple2', { 
      frame: state.frame + 1,
      elapsedTime: Date.now() - state.animationStartTime
    });
    
    // Draw using the redraw function
    redrawRipple2Specific(state, canvas, ctx);
    
    // Continue animation
    const animationId = requestAnimationFrame(animate);
    updateState('ripple2', { animationId });
  }
  
  animate();
}

/**
 * Specific redraw function for ripple2 visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawRipple2Specific(state, canvas, ctx) {
  if (!state.layers) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render ripple2");
    return;
  }
  
  const transform = getCanvasTransform("ripple");
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform
  const adjustedCenterX = canvas.width / 2;
  const adjustedCenterY = canvas.height / 2;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  const layers = state.layers;
  const colors = state.colors;
  const ringSpacing = state.ringSpacing;
  const elapsedTime = state.elapsedTime || 0;
  
  // Animation parameters
  const pulsePeriod = 5000; // 5 seconds for a full pulse cycle
  const pulsePhase = (elapsedTime % pulsePeriod) / pulsePeriod; // 0 to 1
  const breathingFactor = Math.sin(pulsePhase * Math.PI * 2) * 0.15 + 1; // 0.85 to 1.15
  
  // Draw each layer as a wavy circle
  layers.forEach((layer, depth) => {
    if (!layer.length) return;
    
    const baseRadius = ringSpacing * (depth + 1) * breathingFactor;
    const waveAmplitude = 5 + depth * 3; // Increase amplitude with depth
    const waveFrequency = 6; // Number of waves around the circle
    const wavePhaseOffset = depth * 0.5; // Offset each layer's wave phase
    
    // Draw glow effect
    ctx.save();
    const glowColor = colors[depth % colors.length];
    const gradient = ctx.createRadialGradient(
      adjustedCenterX, adjustedCenterY, baseRadius - waveAmplitude - 5,
      adjustedCenterX, adjustedCenterY, baseRadius + waveAmplitude + 5
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, `${glowColor}33`); // 20% opacity
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.beginPath();
    
    // Draw wavy circle path
    for (let i = 0; i <= 360; i++) {
      // Adjust angle to start at top (0 degrees) instead of right (90 degrees)
      const angle = ((i - 90) * Math.PI) / 180;
      const waveOffset = Math.sin(angle * waveFrequency + pulsePhase * Math.PI * 2 + wavePhaseOffset) * waveAmplitude;
      const radius = baseRadius + waveOffset;
      const x = adjustedCenterX + Math.cos(angle) * radius;
      const y = adjustedCenterY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Draw characters along the wavy path
    ctx.save();
    ctx.fillStyle = colors[depth % colors.length];
    ctx.font = "18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const angleStep = (2 * Math.PI) / layer.length;
    
    layer.forEach((char, i) => {
      // Adjust angle to start at top (0 degrees) instead of right (90 degrees)
      const angle = i * angleStep - Math.PI/2;
      const waveOffset = Math.sin(angle * waveFrequency + pulsePhase * Math.PI * 2 + wavePhaseOffset) * waveAmplitude;
      const radius = baseRadius + waveOffset;
      const x = adjustedCenterX + Math.cos(angle) * radius;
      const y = adjustedCenterY + Math.sin(angle) * radius;
      
      // Rotate text to follow the circle
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI/2);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
    
    ctx.restore();
  });
  
  ctx.restore();
}

/**
 * Specific render function for ripple3 visualization (Animated Pulse)
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderRipple3Specific(word, canvas, ctx, layers) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const ringSpacing = 60;
  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8c00", "#00cec9", "#ff33cc"];
  
  // Store state for animation and zoom/pan
  updateState('ripple3', {
    layers: layers,
    colors: colors,
    centerX: centerX,
    centerY: centerY,
    ringSpacing: ringSpacing,
    frame: 0,
    animationStartTime: Date.now()
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('ripple3');
    
    // Update frame in state
    updateState('ripple3', { 
      frame: state.frame + 1,
      elapsedTime: Date.now() - state.animationStartTime
    });
    
    // Draw using the redraw function
    redrawRipple3Specific(state, canvas, ctx);
    
    // Continue animation
    const animationId = requestAnimationFrame(animate);
    updateState('ripple3', { animationId });
  }
  
  animate();
}

/**
 * Specific redraw function for ripple3 visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawRipple3Specific(state, canvas, ctx) {
  if (!state.layers) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render ripple3");
    return;
  }
  
  const transform = getCanvasTransform("ripple");
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform
  const adjustedCenterX = canvas.width / 2;
  const adjustedCenterY = canvas.height / 2;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  const layers = state.layers;
  const colors = state.colors;
  const ringSpacing = state.ringSpacing;
  const elapsedTime = state.elapsedTime || 0;
  
  // Animation parameters
  const animationPeriod = 8000; // 8 seconds for a full animation cycle
  const animationPhase = (elapsedTime % animationPeriod) / animationPeriod; // 0 to 1
  
  // Draw each layer with animated pulse effect
  layers.forEach((layer, depth) => {
    if (!layer.length) return;
    
    // Calculate pulse effect
    const pulseOffset = depth * 0.1; // Offset pulse timing for each layer
    const pulsePhase = (animationPhase + pulseOffset) % 1;
    
    // Pulse size effect (grows and shrinks)
    const pulseSize = Math.sin(pulsePhase * Math.PI * 2) * 0.3 + 1; // 0.7 to 1.3
    
    // Pulse opacity effect (fades in and out)
    const pulseOpacity = Math.sin(pulsePhase * Math.PI * 2) * 0.4 + 0.6; // 0.2 to 1.0
    
    // Base radius for this layer
    const baseRadius = ringSpacing * (depth + 1) * pulseSize;
    
    // Draw pulsing ring
    ctx.save();
    ctx.globalAlpha = pulseOpacity;
    ctx.strokeStyle = colors[depth % colors.length];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(adjustedCenterX, adjustedCenterY, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw glow effect
    const glowColor = colors[depth % colors.length];
    const gradient = ctx.createRadialGradient(
      adjustedCenterX, adjustedCenterY, baseRadius - 10,
      adjustedCenterX, adjustedCenterY, baseRadius + 10
    );
    gradient.addColorStop(0, `${glowColor}00`); // 0% opacity
    gradient.addColorStop(0.5, `${glowColor}33`); // 20% opacity
    gradient.addColorStop(1, `${glowColor}00`); // 0% opacity
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(adjustedCenterX, adjustedCenterY, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    
    // Calculate character positions
    const angleStep = (2 * Math.PI) / layer.length;
    
    // Draw characters with animated movement
    ctx.save();
    ctx.fillStyle = colors[depth % colors.length];
    ctx.font = "18px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    layer.forEach((char, i) => {
      // Calculate angle with slight rotation over time
      const rotationSpeed = 0.05 * (depth + 1); // Faster rotation for outer layers
      const rotationOffset = elapsedTime * 0.0001 * rotationSpeed;
      const angle = i * angleStep + rotationOffset;
      
      // Add wobble effect
      const wobbleFrequency = 3 + depth; // More wobble for outer layers
      const wobbleAmount = 5 + depth * 2; // Larger wobble for outer layers
      const wobbleOffset = Math.sin(angle * wobbleFrequency + animationPhase * Math.PI * 4) * wobbleAmount;
      
      // Calculate position with pulse and wobble
      const radius = baseRadius + wobbleOffset;
      const x = adjustedCenterX + Math.cos(angle) * radius;
      const y = adjustedCenterY + Math.sin(angle) * radius;
      
      // Draw character with pulsing size
      const charSize = 14 + Math.sin(pulsePhase * Math.PI * 2) * 4; // 10 to 18px
      ctx.font = `${charSize}px monospace`;
      
      // Add slight rotation to each character
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI/2); // Rotate to face outward
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
    
    ctx.restore();
  });
  
  // Draw central pulse effect
  const centralPulseSize = 20 + Math.sin(animationPhase * Math.PI * 4) * 10;
  const centralPulseOpacity = Math.sin(animationPhase * Math.PI * 4) * 0.4 + 0.6;
  
  ctx.save();
  ctx.globalAlpha = centralPulseOpacity;
  const centralGradient = ctx.createRadialGradient(
    adjustedCenterX, adjustedCenterY, 0,
    adjustedCenterX, adjustedCenterY, centralPulseSize
  );
  centralGradient.addColorStop(0, "#ffffff");
  centralGradient.addColorStop(1, "#ffffff00");
  
  ctx.fillStyle = centralGradient;
  ctx.beginPath();
  ctx.arc(adjustedCenterX, adjustedCenterY, centralPulseSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Draw expanding rings from center
  const numRings = 3;
  for (let i = 0; i < numRings; i++) {
    const ringPhase = (animationPhase + i / numRings) % 1;
    const ringRadius = ringPhase * ringSpacing * layers.length;
    const ringOpacity = 1 - ringPhase; // Fade out as it expands
    
    ctx.save();
    ctx.globalAlpha = ringOpacity * 0.3;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(adjustedCenterX, adjustedCenterY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  
  ctx.restore();
}

// Register the ripple visualizers with the system
registerVisualizer('ripple1', {
  displayName: 'Radial Expansion',
  icon: '💧', // Added icon
  canvasId: 'ripple',
  containerId: 'rippleContainer',
  renderFunction: renderRipple1Specific,
  redrawFunction: redrawRipple1Specific,
  stateTemplate: {
    layers: null,
    frame: 0,
    colors: null,
    centerX: 0,
    centerY: 0,
    ringSpacing: 60,
    animationId: null
  },
  animationConfig: {
    duration: 3330,
    layerDepth: 3
  }
});

registerVisualizer('ripple2', {
  displayName: 'Concentric Waves',
  icon: '🌊', // Added icon
  canvasId: 'ripple',
  containerId: 'rippleContainer',
  renderFunction: renderRipple2Specific,
  redrawFunction: redrawRipple2Specific,
  stateTemplate: {
    layers: null,
    frame: 0,
    colors: null,
    centerX: 0,
    centerY: 0,
    ringSpacing: 60,
    animationStartTime: 0,
    elapsedTime: 0,
    animationId: null
  },
  animationConfig: {
    duration: 5000,
    layerDepth: 3
  }
});

// For backward compatibility
function renderRipple1(word) {
  const visualizer = getVisualizer('ripple1');
  if (visualizer) {
    visualizer.render(word);
  }
}

function renderRipple2(word) {
  const visualizer = getVisualizer('ripple2');
  if (visualizer) {
    visualizer.render(word);
  }
}

function redrawRipple1() {
  const visualizer = getVisualizer('ripple1');
  if (visualizer) {
    visualizer.redraw();
  }
}

function redrawRipple2() {
  const visualizer = getVisualizer('ripple2');
  if (visualizer) {
    visualizer.redraw();
  }
}

// Export for backward compatibility
export { 
  renderRipple1, 
  renderRipple2, 
  redrawRipple1, 
  redrawRipple2 
};

// Export the specific functions for potential reuse
export { 
  renderRipple1Specific, 
  renderRipple2Specific, 
  redrawRipple1Specific,
  redrawRipple2Specific
};
