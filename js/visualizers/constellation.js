/**
 * Phonetic Visualizer - Constellation Visualization
 * Renders a constellation-style visualization using Canvas
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState, cancelAnimation } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';

/**
 * Specific render function for constellation visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderConstellationSpecific(word, canvas, ctx, layers) {
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const colors = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#ff8c00", "#00cec9", "#ff33cc"];
  
  // Generate stars (points) for each character
  const stars = [];
  const connections = [];
  
  // Create a mapping to track which constellation each character belongs to
  const constellationMap = {};
  let constellationCounter = 0;
  
  // First, assign constellation IDs to the first layer (original word)
  layers[0].forEach((char, charIndex) => {
    constellationMap[`0-${charIndex}`] = constellationCounter++;
  });
  
  // Create a star for each character in each layer
  const layerStars = layers.map(() => []);
  
  // Function to check if a position overlaps with existing stars
  function checkOverlap(x, y, existingStars, minDistance = 40) {
    for (const star of existingStars) {
      const distance = Math.sqrt(Math.pow(x - star.x, 2) + Math.pow(y - star.y, 2));
      if (distance < minDistance) {
        return true; // Overlap detected
      }
    }
    return false; // No overlap
  }
  
  // Function to find a non-overlapping position
  function findNonOverlappingPosition(layerIndex, existingStars, padding) {
    const maxAttempts = 50; // Maximum attempts to find a non-overlapping position
    let attempts = 0;
    let x, y;
    
    do {
      if (layerIndex === 0) {
        // First layer: more central positions but still random
        x = centerX + (Math.random() - 0.5) * (canvas.width - padding * 2) * 0.6;
        y = centerY + (Math.random() - 0.5) * (canvas.height - padding * 2) * 0.6;
      } else {
        // Other layers: more spread out
        x = padding + Math.random() * (canvas.width - padding * 2);
        y = padding + Math.random() * (canvas.height - padding * 2);
      }
      
      attempts++;
      
      // If we've tried too many times, gradually reduce the minimum distance requirement
      if (attempts > maxAttempts / 2) {
        const reducedDistance = 40 * (1 - (attempts - maxAttempts / 2) / (maxAttempts / 2));
        if (!checkOverlap(x, y, existingStars, Math.max(20, reducedDistance))) {
          break;
        }
      }
    } while (checkOverlap(x, y, existingStars) && attempts < maxAttempts);
    
    return { x, y };
  }
  
  layers.forEach((layer, layerIndex) => {
    layer.forEach((char, charIndex) => {
      // Use random positions across the viewable area
      // Add some padding from the edges
      const padding = 80;
      
      // Generate non-overlapping positions
      const { x, y } = findNonOverlappingPosition(layerIndex, stars, padding);
      
      // Determine which constellation this character belongs to
      let constellationId;
      
      if (layerIndex === 0) {
        // First layer characters define their own constellations
        constellationId = constellationMap[`0-${charIndex}`];
      } else {
        // For deeper layers, we need to determine which character in the previous layer
        // this character derives from
        const prevLayerLength = layers[layerIndex - 1].length;
        const prevLayerCharIndex = Math.floor(charIndex / (layer.length / prevLayerLength));
        
        // Get the constellation ID from the parent character
        constellationId = constellationMap[`${layerIndex-1}-${prevLayerCharIndex}`];
        
        // Store this character's constellation ID for potential next layer
        constellationMap[`${layerIndex}-${charIndex}`] = constellationId;
      }
      
      // Create star object
      const star = {
        x,
        y,
        char,
        layerIndex,
        charIndex,
        size: Math.max(2, 4 + (3 - layerIndex) * 2.5), // Larger stars for first layer, ensure minimum size
        brightness: 0.6 + Math.random() * 0.4, // Random initial brightness
        twinkleSpeed: 0.0005 + Math.random() * 0.001, // Slow but visible twinkle speed
        twinkleOffset: Math.random() * Math.PI * 2, // Random twinkle phase
        constellation: constellationId, // Track which constellation this star belongs to
        isOriginal: layerIndex === 0 // Flag to identify original letters
      };
      
      stars.push(star);
      layerStars[layerIndex].push(star);
    });
    
  });
  
  // Create connections between stars in the same layer and same constellation
  layers.forEach((layer, layerIndex) => {
    const layerStarsArray = layerStars[layerIndex];
    
    // Group stars by constellation
    const constellationGroups = {};
    layerStarsArray.forEach(star => {
      if (!constellationGroups[star.constellation]) {
        constellationGroups[star.constellation] = [];
      }
      constellationGroups[star.constellation].push(star);
    });
    
    // Create connections within each constellation group
    Object.values(constellationGroups).forEach(group => {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          const nextIndex = (i + 1) % group.length;
          connections.push({
            from: group[i],
            to: group[nextIndex],
            layerIndex,
            constellation: group[i].constellation
          });
        }
      }
    });
    
    // If not the first layer, create connections to the previous layer
    if (layerIndex > 0 && layerIndex < layers.length) {
      const prevLayerStars = stars.filter(s => s.layerIndex === layerIndex - 1);
      
      layerStarsArray.forEach(star => {
        // Find the closest star in the previous layer that belongs to the same constellation
        let closestStar = null;
        let minDistance = Infinity;
        
        // Filter previous layer stars to only include those from the same constellation
        const sameConstellationPrevStars = prevLayerStars.filter(
          prevStar => prevStar.constellation === star.constellation
        );
        
        sameConstellationPrevStars.forEach(prevStar => {
          const distance = Math.sqrt(
            Math.pow(star.x - prevStar.x, 2) + 
            Math.pow(star.y - prevStar.y, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestStar = prevStar;
          }
        });
        
        if (closestStar) {
          connections.push({
            from: star,
            to: closestStar,
            layerIndex: star.layerIndex,
            isInterLayer: true,
            constellation: star.constellation
          });
        }
      });
    }
  });
  
  // Store state for zoom/pan and animation
  updateState('constellation', {
    stars,
    connections,
    colors,
    centerX,
    centerY,
    twinkleSpeed: 0.05,
    frame: 0,
    animationStartTime: Date.now(),
    hoveredConstellation: null // Track which constellation is being hovered
  });
  
  // Cancel any existing animation
  cancelAnimation('constellation');
  
  // Add mouse move event listener for hover effect
  canvas.addEventListener('mousemove', handleMouseMove);
  
  // Add mouse leave event listener to reset hover state
  canvas.addEventListener('mouseleave', () => {
    updateState('constellation', { hoveredConstellation: null });
  });
  
  /**
   * Handle mouse move events to detect hovering over stars
   * @param {MouseEvent} event - The mouse move event
   */
  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    
    // Get raw mouse position relative to canvas
    const rawMouseX = event.clientX - rect.left;
    const rawMouseY = event.clientY - rect.top;
    
    // Get current transform
    const transform = getCanvasTransform(canvas.id);
    const scale = transform.scale || 1;
    const offsetX = transform.offsetX || 0;
    const offsetY = transform.offsetY || 0;
    
    // Convert mouse position to the untransformed coordinate space (world space)
    // The correct inverse transform based on how the canvas transform is applied:
    // 1. First translate by offsetX, offsetY
    // 2. Then scale by scale
    // So the inverse is:
    // 1. Divide by scale
    // 2. Subtract offsetX/scale (because offsetX is in screen space, not world space)
    const canvasX = (rawMouseX / scale) - (offsetX / scale);
    const canvasY = (rawMouseY / scale) - (offsetY / scale);
    
    // Check if mouse is over any star
    let hoveredStar = null;
    const hoverRadius = 20; // Larger hover area for better usability
    
    for (const star of stars) {
      // Stars are stored in untransformed coordinates, so we can compare directly
      const distance = Math.sqrt(
        Math.pow(canvasX - star.x, 2) + 
        Math.pow(canvasY - star.y, 2)
      );
      
      if (distance <= hoverRadius) {
        hoveredStar = star;
        break;
      }
    }
    
    // Update hovered constellation
    if (hoveredStar) {
      updateState('constellation', { hoveredConstellation: hoveredStar.constellation });
    } else {
      updateState('constellation', { hoveredConstellation: null });
    }
  }
  
  // Start animation
  function animate() {
    // Calculate time-based animation
    const state = getState('constellation');
    const elapsedTime = Date.now() - state.animationStartTime;
    
    updateState('constellation', { 
      frame: state.frame + 1,
      elapsedTime
    });
    
    // Draw using the redraw function
    redrawConstellationSpecific(getState('constellation'), canvas, ctx);
    
    // Continue animation
    const animationId = requestAnimationFrame(animate);
    updateState('constellation', { animationId });
  }
  
  animate();
}

/**
 * Specific redraw function for constellation visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawConstellationSpecific(state, canvas, ctx) {
  if (!state || !state.stars) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render constellation");
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
  
  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0f0c29");
  gradient.addColorStop(0.5, "#302b63");
  gradient.addColorStop(1, "#24243e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform for zoom/pan
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  const stars = state.stars;
  const connections = state.connections;
  const colors = state.colors;
  const elapsedTime = state.elapsedTime || 0;
  
  // Get the hovered constellation
  const hoveredConstellation = state.hoveredConstellation;
  
  // Draw connections first (behind stars)
  ctx.lineWidth = 1;
  connections.forEach(connection => {
    const { from, to, layerIndex, isInterLayer } = connection;
    
    // Check if this connection should be highlighted or dimmed
    const isHighlighted = hoveredConstellation !== null && 
                          (from.constellation === hoveredConstellation || 
                           to.constellation === hoveredConstellation);
    
    // Calculate opacity based on animation and hover state
    let opacity = 0.2;
    
    if (hoveredConstellation !== null) {
      // If hovering, dim non-highlighted connections and brighten highlighted ones
      if (isHighlighted) {
        // Highlighted connections are brighter
        opacity = 0.8;
        ctx.lineWidth = 2; // Thicker lines for highlighted connections
      } else {
        // Non-highlighted connections are very dim
        opacity = 0.05;
      }
    } else {
      // Normal state (no hover)
      if (isInterLayer) {
        // Inter-layer connections are fainter
        opacity = 0.1;
      } else {
        // Animate opacity for intra-layer connections
        const pulseFrequency = 0.0005; // Slower pulse
        opacity = 0.1 + 0.2 * Math.sin(elapsedTime * pulseFrequency + layerIndex);
      }
    }
    
    // Draw connection line
    if (isHighlighted) {
      // Use color for highlighted connections based on constellation
      ctx.strokeStyle = colors[from.constellation % colors.length] + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    } else {
      // Use white for non-highlighted connections
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    // Reset line width
    ctx.lineWidth = 1;
  });
  
  // Draw stars
  stars.forEach(star => {
    const { x, y, char, layerIndex, size, brightness, twinkleSpeed, twinkleOffset, constellation, isOriginal } = star;
    
    // Check if this star should be highlighted or dimmed
    const isHighlighted = hoveredConstellation !== null && constellation === hoveredConstellation;
    
    // Calculate twinkle effect
    const twinkleFactor = 0.7 + 0.3 * Math.sin(elapsedTime * twinkleSpeed + twinkleOffset);
    
    // Adjust brightness based on hover state
    let currentBrightness;
    let glowMultiplier = 1;
    
    if (hoveredConstellation !== null) {
      if (isHighlighted) {
        // Highlighted stars are brighter and have larger glow
        currentBrightness = brightness * 1.2;
        glowMultiplier = 1.5;
      } else {
        // Non-highlighted stars are dimmer
        currentBrightness = brightness * 0.4;
        glowMultiplier = 0.5;
      }
    } else {
      // Normal state (no hover)
      currentBrightness = brightness * twinkleFactor;
    }
    
    // Draw star glow
    const glowSize = size * 3 * twinkleFactor * glowMultiplier;
    const glowGradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, glowSize
    );
    const color = colors[constellation % colors.length];
    
    // Adjust glow opacity based on hover state
    if (isHighlighted) {
      glowGradient.addColorStop(0, color + 'ff'); // Full opacity
      glowGradient.addColorStop(0.5, color + '99'); // 60% opacity
      glowGradient.addColorStop(1, color + '33'); // 20% opacity
    } else {
      glowGradient.addColorStop(0, color + (hoveredConstellation !== null ? 'aa' : 'ff')); // Reduced opacity if not highlighted
      glowGradient.addColorStop(0.5, color + (hoveredConstellation !== null ? '44' : '66')); // Reduced opacity if not highlighted
      glowGradient.addColorStop(1, color + '00'); // 0% opacity
    }
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw star
    ctx.fillStyle = isHighlighted ? '#ffffff' : (hoveredConstellation !== null ? '#aaaaaa' : '#ffffff');
    ctx.beginPath();
    ctx.arc(x, y, size * currentBrightness, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a ring around original stars to make them stand out
    if (isOriginal) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      
      // Add a second outer ring for emphasis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw character with improved visibility
    // First draw a dark background circle for better contrast
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw character with larger font and white color
    ctx.fillStyle = isHighlighted ? '#ffffff' : (hoveredConstellation !== null ? '#aaaaaa' : '#ffffff');
    ctx.font = `bold ${Math.max(12, 18 - layerIndex * 2)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add a subtle text shadow for better visibility
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillText(char, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  });
  
  // Draw static background stars
  // Generate fixed positions for background stars if not already generated
  if (!state.backgroundStars) {
    const numBackgroundStars = 150;
    const backgroundStars = [];
    
    for (let i = 0; i < numBackgroundStars; i++) {
      backgroundStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.4, // Random brightness
        twinkleSpeed: 0.0000005 + Math.random() * 0.0000008, // Extremely slow twinkle
        twinkleOffset: Math.random() * Math.PI * 2 // Random phase
      });
    }
    
    // Store the background stars in state
    updateState('constellation', { backgroundStars });
  }
  
  // Draw the background stars (fixed positions with very subtle twinkle)
  ctx.fillStyle = '#ffffff';
  
  if (state.backgroundStars) {
    state.backgroundStars.forEach(star => {
      // Extremely subtle twinkle effect (almost static)
      const twinkleFactor = 0.8 + 0.2 * Math.sin(elapsedTime * star.twinkleSpeed + star.twinkleOffset);
      
      ctx.globalAlpha = star.brightness * twinkleFactor;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Register the constellation visualizer with the system
registerVisualizer('constellation', {
  displayName: 'Constellation',
  renderFunction: renderConstellationSpecific,
  redrawFunction: redrawConstellationSpecific,
  stateTemplate: {
    stars: null,
    connections: null,
    colors: null,
    centerX: 0,
    centerY: 0,
    twinkleSpeed: 0.05,
    frame: 0,
    animationStartTime: 0,
    elapsedTime: 0,
    hoveredConstellation: null,
    backgroundStars: null,
    animationId: null
  },
  animationConfig: {
    duration: 6000,
    layerDepth: 3
  }
});

// For backward compatibility
function renderConstellation(word) {
  const visualizer = getVisualizer('constellation');
  if (visualizer) {
    visualizer.render(word);
  }
}

function redrawConstellation() {
  const visualizer = getVisualizer('constellation');
  if (visualizer) {
    visualizer.redraw();
  }
}

// Export for backward compatibility
export { renderConstellation, redrawConstellation };

// Export the specific functions for potential reuse
export { renderConstellationSpecific, redrawConstellationSpecific };
