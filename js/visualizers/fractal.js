/**
 * Phonetic Visualizer - Fractal Garden Visualization
 * Renders a fractal garden visualization using Canvas
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';

/**
 * Specific render function for fractal garden visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderFractalSpecific(word, canvas, ctx, layers) {
  if (!word) return;
  
  // Calculate total number of branches for animation duration
  const totalBranches = layers.reduce((sum, layer) => sum + layer.length, 0) * 2;
  
  // Define colors for different seasons
  const seasonColors = {
    spring: {
      background: "#e6f7ff",
      trunk: "#8b4513",
      leaves: ["#98fb98", "#32cd32", "#00fa9a", "#7cfc00", "#adff2f"],
      flowers: ["#ff69b4", "#ffb6c1", "#ffc0cb", "#ff1493", "#ff00ff"]
    },
    summer: {
      background: "#f0fff0",
      trunk: "#a0522d",
      leaves: ["#006400", "#008000", "#228b22", "#2e8b57", "#3cb371"],
      flowers: ["#ff4500", "#ff6347", "#ff7f50", "#ffa500", "#ffff00"]
    },
    fall: {
      background: "#fff8dc",
      trunk: "#8b4513",
      leaves: ["#ff8c00", "#ffa500", "#ff7f50", "#cd5c5c", "#b22222"],
      flowers: ["#daa520", "#b8860b", "#cd853f", "#d2691e", "#a0522d"]
    },
    winter: {
      background: "#f0f8ff",
      trunk: "#696969",
      leaves: ["#f0f8ff", "#e6e6fa", "#b0c4de", "#add8e6", "#87ceeb"],
      flowers: ["#f5f5f5", "#fffafa", "#f0ffff", "#f5fffa", "#f0fff0"]
    }
  };
  
  // Get current season or default to spring
  const season = getState('fractal').season || "spring";
  const colors = seasonColors[season];
  
  // Generate fractal branches
  const branches = generateFractalBranches(layers);
  
  // Generate ground elements based on layers
  const groundElements = generateGroundElements(layers);
  
  // Calculate ground element positions once and store them
  const groundElementsPositions = calculateGroundElementPositions(groundElements, canvas.width);
  
  // Store state for zoom/pan and animation
  updateState('fractal', {
    branches: branches,
    colors: colors,
    frame: 0,
    centerX: canvas.width / 2,
    centerY: canvas.height,
    season: season,
    groundElements: groundElements,
    groundElementsPositions: groundElementsPositions,
    totalBranches: totalBranches
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('fractal');
    
    // Update frame in state
    updateState('fractal', { frame: state.frame + 1 });
    
    // Draw using the redraw function
    redrawFractalSpecific(state, canvas, ctx);
    
    if (state.frame < totalBranches) {
      const animationId = requestAnimationFrame(animate);
      updateState('fractal', { animationId });
    }
  }
  
  animate();
}

/**
 * Generates branches for the fractal garden visualization
 * @param {Array} layers - Array of phonetic layers
 * @returns {Array} Array of branch objects
 */
function generateFractalBranches(layers) {
  const branches = [];
  const trunkHeight = 200; // Height of the main trunk
  const trunkWidth = 20; // Width of the main trunk
  const branchLengthFactor = 0.8; // How much shorter each layer's branches are
  const branchWidthFactor = 0.7; // How much thinner each layer's branches are
  
  // Create the main trunk representing the word
  const trunk = {
    startX: 0,
    startY: 0,
    length: trunkHeight,
    width: trunkWidth,
    angle: -Math.PI / 2, // Straight up (in canvas, -PI/2 is up)
    char: layers[0].join(''), // The original word
    level: -1, // Special level for trunk
    parent: null,
    children: [],
    isTrunk: true
  };
  branches.push(trunk);
  
  // Track parent branches for each layer
  let parentBranches = [trunk];
  
  // Process each layer
  layers.forEach((layer, layerIndex) => {
    const newParents = [];
    
    // Calculate branch properties for this layer
    const branchLength = trunkHeight * Math.pow(branchLengthFactor, layerIndex + 1);
    const branchWidth = trunkWidth * Math.pow(branchWidthFactor, layerIndex + 1);
    
    // Distribute characters evenly among parent branches
    const charsPerParent = Math.ceil(layer.length / parentBranches.length);
    
    parentBranches.forEach((parent, parentIndex) => {
      // Get characters for this parent
      const startIdx = parentIndex * charsPerParent;
      const endIdx = Math.min(startIdx + charsPerParent, layer.length);
      const chars = layer.slice(startIdx, endIdx);
      
      if (chars.length === 0) return;
      
      // Create a balanced distribution of branches for all layers
      
      // Create an array of angles for balanced distribution
      const angles = [];
      const totalBranches = chars.length;
      
      if (parent.isTrunk && layerIndex === 0) {
        // For trunk branches, distribute them by alternating sides
        
        // Calculate angles to ensure perfect symmetry
        if (totalBranches === 1) {
          // If there's only one branch, place it straight up
          angles.push(-Math.PI / 2);
        } else {
          // Create an array to hold the angles
          const tempAngles = [];
          const totalAngleRange = Math.PI * 0.6; // Reduced to 108 degrees for more upward growth
          
          // First, calculate all angles evenly distributed across the range
          for (let i = 0; i < totalBranches; i++) {
            // Map from [0, totalBranches-1] to [-PI/2-totalAngleRange/2, -PI/2+totalAngleRange/2]
            const t = i / (totalBranches - 1); // normalized position [0, 1]
            const angle = -Math.PI / 2 - totalAngleRange / 2 + t * totalAngleRange;
            tempAngles.push(angle);
          }
          
          // Now, rearrange the angles to alternate sides (left-right-left-right)
          // This creates a pattern like "ergadn" instead of "garden"
          for (let i = 0; i < totalBranches; i++) {
            let index;
            if (i % 2 === 0) {
              // Even indices go to the right side (second half of the array)
              index = Math.floor(totalBranches / 2) + Math.floor(i / 2);
            } else {
              // Odd indices go to the left side (first half of the array)
              index = Math.floor(i / 2);
            }
            
            // Make sure index is within bounds
            index = Math.min(index, totalBranches - 1);
            
            angles.push(tempAngles[index]);
          }
        }
      } else {
        // For regular branches, distribute them symmetrically around the parent branch angle
        
        // Calculate angles to ensure perfect symmetry
        if (totalBranches === 1) {
          // If there's only one branch, continue in the same direction as parent
          angles.push(parent.angle);
        } else {
          // Create a symmetric fan of branches around the parent's angle
          // Use a smaller angle range for higher layers to create a more natural tree shape
          // Reduce the angle range significantly to make branches grow more upward
          const totalAngleRange = Math.PI * (0.6 - layerIndex * 0.15); // Decrease spread more aggressively for higher layers
          
          // Distribute branches evenly across the range
          for (let i = 0; i < totalBranches; i++) {
            // Map from [0, totalBranches-1] to [parent.angle-totalAngleRange/2, parent.angle+totalAngleRange/2]
            // This ensures perfect symmetry around the parent branch angle
            const t = i / (totalBranches - 1); // normalized position [0, 1]
            const angle = parent.angle - totalAngleRange / 2 + t * totalAngleRange;
            angles.push(angle);
          }
        }
      }
      
      // Create branches for each character with the calculated angles
      chars.forEach((char, charIndex) => {
        // Get the angle for this branch
        const angle = angles[charIndex];
        
        // Add minimal variation based on character code
        const charCode = char.charCodeAt(0);
        // Use smaller variation for higher layers to maintain balance
        const variationFactor = Math.max(0.005, 0.02 - layerIndex * 0.005);
        const angleVariation = (charCode % 10) * variationFactor - (variationFactor / 2);
        
        // Create branch
        const branch = {
          startX: 0, // Will be calculated during drawing
          startY: 0, // Will be calculated during drawing
          length: branchLength * (0.9 + Math.random() * 0.2), // Add some randomness
          width: branchWidth * (0.9 + Math.random() * 0.2),
          angle: angle + angleVariation,
          char: char,
          level: layerIndex,
          parent: parent,
          children: [],
          isBranch: true
        };
        
        parent.children.push(branch);
        branches.push(branch);
        newParents.push(branch);
      });
    });
    
    // Update parent branches for next layer
    if (newParents.length > 0) {
      parentBranches = newParents;
    }
  });
  
  return branches;
}

/**
 * Specific redraw function for fractal garden visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawFractalSpecific(state, canvas, ctx) {
  if (!state.branches) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render fractal");
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
  
  // Set background color based on season
  ctx.fillStyle = state.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform - position the tree at the bottom center of the canvas
  ctx.save();
  ctx.translate(canvas.width / 2 + offsetX, canvas.height - 50 + offsetY);
  ctx.scale(scale, scale);
  
  // Draw decorative ground
  drawGround(ctx, canvas.width, state.colors);
  
  // Sort branches by level to draw trunk first, then branches by level
  const sortedBranches = [...state.branches].sort((a, b) => {
    // Trunk always first
    if (a.isTrunk) return -1;
    if (b.isTrunk) return 1;
    // Then sort by level
    return a.level - b.level;
  });
  
  // Draw branches up to current frame
  const frame = state.frame;
  let branchesDrawn = 0;
  
  for (const branch of sortedBranches) {
    if (branchesDrawn >= frame) break;
    
    // Calculate start position
    if (branch.parent) {
      const parent = branch.parent;
      // For canvas, positive Y is down
      const endX = parent.startX + Math.cos(parent.angle) * parent.length;
      const endY = parent.startY + Math.sin(parent.angle) * parent.length; // Positive to grow upward in canvas coordinates
      branch.startX = endX;
      branch.startY = endY;
    }
    
    // Calculate end position
    const endX = branch.startX + Math.cos(branch.angle) * branch.length;
    const endY = branch.startY + Math.sin(branch.angle) * branch.length; // Positive to grow upward in canvas coordinates
    
    // Draw branch with gradient for more natural look
    if (branch.isTrunk) {
      // Draw trunk with wood texture
      drawTrunk(ctx, branch.startX, branch.startY, endX, endY, branch.width, state.colors.trunk);
    } else {
      // Draw branch
      drawBranch(ctx, branch.startX, branch.startY, endX, endY, branch.width, state.colors.trunk);
    }
    
    // Draw leaves or flowers at the end of branches with no children
    if (branch.children.length === 0) {
      // Determine if this should be a leaf or flower based on character code
      const isFlower = branch.char.charCodeAt(0) % 3 === 0;
      const colorArray = isFlower ? state.colors.flowers : state.colors.leaves;
      const color = colorArray[branch.char.charCodeAt(0) % colorArray.length];
      
      if (isFlower) {
        drawFlower(ctx, endX, endY, branch.width * 2, color, state.colors);
      } else {
        drawLeaf(ctx, endX, endY, branch.width * 3, branch.angle, color);
      }
      
      // Draw the character inside the leaf/flower for a nice touch
      ctx.font = `${Math.max(10, branch.width * 1.2)}px Arial`;
      ctx.fillStyle = isFlower ? "#000" : "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(branch.char, endX, endY);
    }
    
    // For the trunk, add the word along it
    if (branch.isTrunk) {
      const word = branch.char;
      if (word && word.length > 0) {
        ctx.save();
        // Position text in the middle of the trunk
        ctx.translate(branch.startX, branch.startY - branch.length * 0.5);
        ctx.rotate(-Math.PI/2); // Rotate to align with trunk
        ctx.font = `bold ${branch.width * 0.8}px Arial`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeText(word, 0, 0); // Add outline for better visibility
        ctx.fillText(word, 0, 0);
        ctx.restore();
      }
    }
    
    branchesDrawn++;
  }
  
  ctx.restore();
}

/**
 * Generates ground elements based on phonetic layers
 * @param {Array} layers - Array of phonetic layers
 * @returns {Object} Object containing ground elements for each layer
 */
function generateGroundElements(layers) {
  const groundElements = {
    grass: [],
    flowers: [],
    stones: []
  };
  
  // Get current season or default to spring
  const season = getState('fractal').season || "spring";
  const seasonColors = {
    spring: {
      background: "#e6f7ff",
      trunk: "#8b4513",
      leaves: ["#98fb98", "#32cd32", "#00fa9a", "#7cfc00", "#adff2f"],
      flowers: ["#ff69b4", "#ffb6c1", "#ffc0cb", "#ff1493", "#ff00ff"]
    },
    summer: {
      background: "#f0fff0",
      trunk: "#a0522d",
      leaves: ["#006400", "#008000", "#228b22", "#2e8b57", "#3cb371"],
      flowers: ["#ff4500", "#ff6347", "#ff7f50", "#ffa500", "#ffff00"]
    },
    fall: {
      background: "#fff8dc",
      trunk: "#8b4513",
      leaves: ["#ff8c00", "#ffa500", "#ff7f50", "#cd5c5c", "#b22222"],
      flowers: ["#daa520", "#b8860b", "#cd853f", "#d2691e", "#a0522d"]
    },
    winter: {
      background: "#f0f8ff",
      trunk: "#696969",
      leaves: ["#f0f8ff", "#e6e6fa", "#b0c4de", "#add8e6", "#87ceeb"],
      flowers: ["#f5f5f5", "#fffafa", "#f0ffff", "#f5fffa", "#f0fff0"]
    }
  };
  const colors = seasonColors[season];
  
  // Generate grass elements from the final layer (most letters)
  if (layers[layers.length - 1]) {
    layers[layers.length - 1].forEach((char, index) => {
      groundElements.grass.push({
        char: char,
        index: index,
        size: char.charCodeAt(0) % 5 + 20, // Smallest size for grass
        color: colors.leaves[Math.floor(Math.random() * colors.leaves.length)] // Pre-assign color
      });
    });
  }
  
  // Generate flower elements from the middle layer
  const middleLayerIndex = Math.max(0, layers.length - 2);
  if (layers[middleLayerIndex]) {
    layers[middleLayerIndex].forEach((char, index) => {
      // Pre-calculate petal count to ensure it doesn't change when redrawing
      const petalCount = (char.charCodeAt(0) % 3) + 5; // 5-7 petals
      
      groundElements.flowers.push({
        char: char,
        index: index,
        size: char.charCodeAt(0) % 5 + 25, // Smaller size for flowers
        style: Math.floor(Math.random() * 3), // 0: daisy, 1: tulip, 2: simple
        petalCount: petalCount, // Store petal count in state
        petalColor: colors.flowers[Math.floor(Math.random() * colors.flowers.length)], // Pre-assign petal color
        centerColor: colors.flowers[Math.floor(Math.random() * colors.flowers.length)] // Pre-assign center color
      });
    });
  }
  
  // Generate stone elements from the first layer (fewest letters)
  if (layers[0]) {
    layers[0].forEach((char, index) => {
      // Generate a random gray color for the stone
      const grayValue = 100 + Math.floor(Math.random() * 100);
      const stoneColor = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
      
      groundElements.stones.push({
        char: char,
        index: index,
        size: char.charCodeAt(0) % 10 + 65, // Much larger size for stones
        shape: Math.floor(Math.random() * 4), // 0-3: more variety
        color: stoneColor, // Pre-assign stone color
        zIndex: Math.floor(Math.random() * 3) // Random z-index (0-2) for depth
      });
    });
  }
  
  return groundElements;
}

/**
 * Calculates and stores positions for all ground elements
 * @param {Object} groundElements - Object containing ground elements
 * @param {number} canvasWidth - Width of the canvas
 * @returns {Array} Array of positioned ground elements
 */
function calculateGroundElementPositions(groundElements, canvasWidth) {
  if (!groundElements) return [];
  
  const allGroundElements = [];
  
  // Calculate spacing for ground elements - much narrower to keep elements very close to the tree
  const totalWidth = canvasWidth * 0.5; // Much narrower width to keep elements very close to tree
  const centerOffset = 0; // Center the elements around the tree
  
  // Add stones with their positions
  if (groundElements.stones && groundElements.stones.length > 0) {
    const stoneSpacing = totalWidth / (groundElements.stones.length + 1);
    groundElements.stones.forEach((stone, index) => {
      const x = -totalWidth/2 + centerOffset + (index + 1) * stoneSpacing;
      // Add some randomness to x position for more natural look
      const randomX = x + (Math.random() - 0.5) * stoneSpacing * 0.5;
      
      allGroundElements.push({
        type: 'stone',
        element: stone,
        x: randomX,
        y: 0,
        zIndex: stone.zIndex || Math.floor(Math.random() * 3), // Use stored zIndex or generate random one
        randomOffset: (Math.random() - 0.5) * stone.size * 0.2, // Store random offset for stone drawing
        randomSize: stone.size * (0.8 + Math.random() * 0.4) // Store random size for stone drawing
      });
    });
  }
  
  // Add flowers with their positions
  if (groundElements.flowers && groundElements.flowers.length > 0) {
    const flowerSpacing = totalWidth / (groundElements.flowers.length + 1);
    groundElements.flowers.forEach((flower, index) => {
      const x = -totalWidth/2 + centerOffset + (index + 1) * flowerSpacing;
      // Add some randomness to x position for more natural look
      const randomX = x + (Math.random() - 0.5) * flowerSpacing * 0.4;
      
      allGroundElements.push({
        type: 'flower',
        element: flower,
        x: randomX,
        y: 0,
        zIndex: Math.floor(Math.random() * 3) // Random z-index (0-2)
      });
    });
  }
  
  // Add grass with their positions
  if (groundElements.grass && groundElements.grass.length > 0) {
    const grassSpacing = totalWidth / (groundElements.grass.length + 1);
    groundElements.grass.forEach((grass, index) => {
      const x = -totalWidth/2 + centerOffset + (index + 1) * grassSpacing;
      // Add some randomness to x position for more natural look
      const randomX = x + (Math.random() - 0.5) * grassSpacing * 0.3;
      
      // Pre-calculate grass blade positions and properties
      const blades = [];
      const bladeCount = 3 + Math.floor(Math.random() * 3); // 3-5 blades
      const clusterWidth = 8;
      
      for (let i = 0; i < bladeCount; i++) {
        const bladeX = (Math.random() * clusterWidth - clusterWidth/2);
        const bladeHeight = grass.size + Math.random() * 5;
        const bladeWidth = 1 + Math.random();
        const controlX = (Math.random() * 4 - 2);
        const controlY = -bladeHeight * 0.6;
        const endX = (Math.random() * 3 - 1.5);
        
        blades.push({
          bladeX,
          bladeHeight,
          bladeWidth,
          controlX,
          controlY,
          endX
        });
      }
      
      allGroundElements.push({
        type: 'grass',
        element: grass,
        x: randomX,
        y: 0,
        zIndex: Math.floor(Math.random() * 3), // Random z-index (0-2)
        blades: blades // Store pre-calculated blade properties
      });
    });
  }
  
  // Sort elements by z-index to create depth effect
  allGroundElements.sort((a, b) => a.zIndex - b.zIndex);
  
  return allGroundElements;
}

/**
 * Draws a natural-looking ground with grass, flowers, and stones based on phonetic layers
 */
function drawGround(ctx, canvasWidth, colors) {
  const state = getState('fractal');
  if (!state.branches || !state.groundElements) return;
  
  const groundHeight = 40;
  
  // Draw soil
  ctx.fillStyle = "#5d4037";
  ctx.fillRect(-canvasWidth, 0, canvasWidth * 2, groundHeight);
  
  // Use pre-calculated ground element positions if available, otherwise calculate them
  const allGroundElements = state.groundElementsPositions || calculateGroundElementPositions(state.groundElements, canvasWidth);
  
  // Draw all elements in z-index order using the stored positions
  allGroundElements.forEach(item => {
    if (item.type === 'stone') {
      drawStone(ctx, item.x, item.y, item.element.size, colors, item.element.shape, item.element, item.randomOffset, item.randomSize);
    } else if (item.type === 'flower') {
      drawGroundFlower(ctx, item.x, item.y, item.element.size, colors, item.element.style, item.element);
    } else if (item.type === 'grass') {
      drawGrassBlades(ctx, item.x, item.y, item.element.size, colors, item.element, item.blades);
    }
  });
  
  // Draw soil AFTER all ground elements so it's always on top
  // This ensures rocks and other elements don't appear to go through the ground
  ctx.fillStyle = "#5d4037";
  ctx.fillRect(-canvasWidth, 0, canvasWidth * 2, groundHeight);
}

/**
 * Draws grass blades at a specific position
 */
function drawGrassBlades(ctx, x, y, height, colors, grass, preCalculatedBlades) {
  // Use the pre-assigned color from the grass element if available
  const grassColor = grass && grass.color ? grass.color : colors.leaves[Math.floor(Math.random() * colors.leaves.length)];
  ctx.fillStyle = grassColor;
  
  // Use pre-calculated blades if available, otherwise generate new ones
  if (preCalculatedBlades && preCalculatedBlades.length > 0) {
    // Draw using pre-calculated blade properties
    for (const blade of preCalculatedBlades) {
      ctx.beginPath();
      ctx.moveTo(x + blade.bladeX, y);
      ctx.quadraticCurveTo(
        x + blade.bladeX + blade.controlX, 
        y + blade.controlY, 
        x + blade.bladeX + blade.endX, 
        y - blade.bladeHeight
      );
      ctx.lineWidth = blade.bladeWidth;
      ctx.strokeStyle = grassColor;
      ctx.stroke();
    }
  } else {
    // Draw a cluster of grass blades with new random values
    const bladeCount = 3 + Math.floor(Math.random() * 3); // 3-5 blades
    const clusterWidth = 8;
    
    for (let i = 0; i < bladeCount; i++) {
      const bladeX = x + (Math.random() * clusterWidth - clusterWidth/2);
      const bladeHeight = height + Math.random() * 5;
      const bladeWidth = 1 + Math.random();
      
      // Draw a blade of grass (curved line)
      ctx.beginPath();
      ctx.moveTo(bladeX, y);
      
      // Add a slight curve to the grass blade
      const controlX = bladeX + (Math.random() * 4 - 2);
      const controlY = y - bladeHeight * 0.6;
      
      ctx.quadraticCurveTo(controlX, controlY, bladeX + (Math.random() * 3 - 1.5), y - bladeHeight);
      ctx.lineWidth = bladeWidth;
      ctx.strokeStyle = grassColor;
      ctx.stroke();
    }
  }
}

/**
 * Draws a flower on the ground at a specific position
 */
function drawGroundFlower(ctx, x, y, size, colors, flowerStyle, flower) {
  // Use pre-assigned colors from the flower element if available, otherwise choose random colors
  const petalColor = flower && flower.petalColor ? flower.petalColor : colors.flowers[Math.floor(Math.random() * colors.flowers.length)];
  const centerColor = flower && flower.centerColor ? flower.centerColor : colors.flowers[Math.floor(Math.random() * colors.flowers.length)];
  
  // Draw stem
  const stemHeight = size * 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - stemHeight);
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.leaves[0];
  ctx.stroke();
  
  // Draw flower at the top of the stem
  ctx.save();
  ctx.translate(x, y - stemHeight);
  
  // Use provided flower style or choose randomly (0: daisy, 1: tulip, 2: simple)
  if (flowerStyle === undefined) {
    flowerStyle = Math.floor(Math.random() * 3);
  }
  
  if (flowerStyle === 0) {
    // Daisy style
    // Use pre-assigned petal count from the flower element if available
    const petalCount = flower && flower.petalCount ? flower.petalCount : 5 + Math.floor(Math.random() * 3);
    const petalLength = size * 0.7;
    
    // Draw petals
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * size * 0.5, 
        Math.sin(angle) * size * 0.5, 
        petalLength * 0.5, 
        petalLength * 0.25, 
        angle, 
        0, 
        Math.PI * 2
      );
      ctx.fillStyle = petalColor;
      ctx.fill();
    }
    
    // Draw center
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = centerColor;
    ctx.fill();
  } 
  else if (flowerStyle === 1) {
    // Tulip style
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, 0);
    ctx.bezierCurveTo(
      -size * 0.5, -size * 1.2,
      size * 0.5, -size * 1.2,
      size * 0.5, 0
    );
    ctx.bezierCurveTo(
      size * 0.5, size * 0.3,
      -size * 0.5, size * 0.3,
      -size * 0.5, 0
    );
    ctx.fillStyle = petalColor;
    ctx.fill();
    
    // Add some detail
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, 0);
    ctx.bezierCurveTo(
      -size * 0.3, -size * 0.8,
      size * 0.3, -size * 0.8,
      size * 0.3, 0
    );
    ctx.strokeStyle = shadeColor(petalColor, -30);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  } 
  else {
    // Simple flower
    // Use pre-assigned petal count from the flower element if available
    const petalCount = flower && flower.petalCount ? flower.petalCount : 4 + Math.floor(Math.random() * 3);
    
    // Draw petals
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * size * 0.5, 
        Math.sin(angle) * size * 0.5, 
        size * 0.4, 
        0, 
        Math.PI * 2
      );
      ctx.fillStyle = petalColor;
      ctx.fill();
    }
    
    // Draw center
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = centerColor;
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draws a natural-looking stone at a specific position
 */
function drawStone(ctx, x, y, size, colors, stoneShape, stone, randomOffset, randomSize) {
  // Use pre-assigned color from the stone element if available, otherwise choose a random gray color
  const stoneColor = stone && stone.color ? stone.color : `rgb(${100 + Math.floor(Math.random() * 100)}, ${100 + Math.floor(Math.random() * 100)}, ${100 + Math.floor(Math.random() * 100)})`;
  
  // Draw the stone
  ctx.save();
  ctx.translate(x, y);
  
  // Use provided stone shape or choose randomly (0-3 for more variety)
  if (stoneShape === undefined) {
    stoneShape = Math.floor(Math.random() * 4);
  }
  
  // Use provided random values or generate new ones
  if (randomOffset === undefined) {
    randomOffset = (Math.random() - 0.5) * size * 0.2;
  }
  if (randomSize === undefined) {
    randomSize = size * (0.8 + Math.random() * 0.4);
  }
  
  // Store these values in the stone object to ensure consistency
  if (stone) {
    stone._cachedShape = stoneShape;
    stone._cachedOffset = randomOffset;
    stone._cachedSize = randomSize;
  }
  
  // Use cached values if available
  stoneShape = stone && stone._cachedShape !== undefined ? stone._cachedShape : stoneShape;
  randomOffset = stone && stone._cachedOffset !== undefined ? stone._cachedOffset : randomOffset;
  randomSize = stone && stone._cachedSize !== undefined ? stone._cachedSize : randomSize;
  
  if (stoneShape === 0) {
    // Rounded boulder
    ctx.beginPath();
    ctx.ellipse(randomOffset, -randomSize * 0.4, randomSize * 0.5, randomSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = stoneColor;
    ctx.fill();
    
    // Add some texture/highlight
    ctx.beginPath();
    ctx.ellipse(randomOffset - randomSize * 0.15, -randomSize * 0.5, randomSize * 0.15, randomSize * 0.1, Math.PI * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.fill();
  } 
  else if (stoneShape === 1) {
    // Flat rock
    ctx.beginPath();
    ctx.ellipse(randomOffset, -randomSize * 0.25, randomSize * 0.6, randomSize * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = stoneColor;
    ctx.fill();
    
    // Add a second smaller rock on top for variety - use cached value for consistency
    const hasSecondRock = stone && stone._hasSecondRock !== undefined ? 
                          stone._hasSecondRock : 
                          Math.random() > 0.5;
    
    // Store this decision
    if (stone && stone._hasSecondRock === undefined) {
      stone._hasSecondRock = hasSecondRock;
    }
    
    if (hasSecondRock) {
      ctx.beginPath();
      ctx.ellipse(
        randomOffset + randomSize * 0.1, 
        -randomSize * 0.4, 
        randomSize * 0.3, 
        randomSize * 0.15, 
        Math.PI * 0.1, 
        0, 
        Math.PI * 2
      );
      ctx.fillStyle = shadeColor(stoneColor, 15); // Slightly lighter
      ctx.fill();
    }
  }
  else if (stoneShape === 2) {
    // Angular rock
    ctx.beginPath();
    ctx.moveTo(randomOffset - randomSize * 0.4, -randomSize * 0.1);
    ctx.lineTo(randomOffset - randomSize * 0.2, -randomSize * 0.5);
    ctx.lineTo(randomOffset + randomSize * 0.3, -randomSize * 0.45);
    ctx.lineTo(randomOffset + randomSize * 0.4, -randomSize * 0.2);
    ctx.lineTo(randomOffset + randomSize * 0.1, -randomSize * 0.05);
    ctx.closePath();
    ctx.fillStyle = stoneColor;
    ctx.fill();
    
    // Add some texture/edges
    ctx.beginPath();
    ctx.moveTo(randomOffset - randomSize * 0.2, -randomSize * 0.5);
    ctx.lineTo(randomOffset + randomSize * 0.3, -randomSize * 0.45);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
    ctx.stroke();
  }
  else {
    // Small rock cluster
    // Use cached cluster size or generate a new one
    const clusterSize = stone && stone._clusterSize !== undefined ? 
                        stone._clusterSize : 
                        3 + Math.floor(Math.random() * 3); // 3-5 small rocks
    
    // Store cluster size for consistency
    if (stone && stone._clusterSize === undefined) {
      stone._clusterSize = clusterSize;
      stone._clusterRocks = [];
      
      // Parse the stone color to ensure it's in the right format
      let baseColor;
      if (stoneColor.startsWith('#')) {
        baseColor = stoneColor;
      } else if (stoneColor.startsWith('rgb')) {
        // Extract RGB values from rgb(r, g, b) format
        const rgbMatch = stoneColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          baseColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } else {
          // Fallback to a safe gray color
          baseColor = '#808080';
        }
      } else {
        // Fallback to a safe gray color
        baseColor = '#808080';
      }
      
      // Pre-calculate and store all rock properties
      for (let i = 0; i < clusterSize; i++) {
        const rockX = randomOffset + (Math.random() - 0.5) * randomSize * 0.8;
        const rockY = -randomSize * 0.3 * Math.random();
        const rockSize = randomSize * 0.2 + Math.random() * randomSize * 0.2;
        const rockAngle = Math.random() * Math.PI;
        const colorVariation = Math.floor(Math.random() * 20) - 10; // Smaller range
        
        let rockColor;
        try {
          rockColor = shadeColor(baseColor, colorVariation);
        } catch (e) {
          // If shadeColor fails, use the original stone color
          rockColor = stoneColor;
        }
        
        stone._clusterRocks.push({
          x: rockX,
          y: rockY,
          size: rockSize,
          angle: rockAngle,
          color: rockColor
        });
      }
    }
    
    // Draw using cached rock properties
    if (stone && stone._clusterRocks) {
      for (const rock of stone._clusterRocks) {
        ctx.beginPath();
        ctx.ellipse(
          rock.x, 
          rock.y, 
          rock.size, 
          rock.size * 0.7, 
          rock.angle, 
          0, 
          Math.PI * 2
        );
        
        ctx.fillStyle = rock.color;
        ctx.fill();
      }
    }
  }
  
  ctx.restore();
}

/**
 * Draws a trunk with wood texture
 */
function drawTrunk(ctx, startX, startY, endX, endY, width, color) {
  // For the trunk, we want a tapered shape that's wider at the bottom
  const trunkLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const angle = Math.atan2(endY - startY, endX - startX);
  const perpAngle = angle + Math.PI/2;
  
  // Create a path for the trunk with tapered shape
  ctx.beginPath();
  
  // Bottom of trunk (wider)
  const bottomWidth = width * 1.5;
  ctx.moveTo(startX - Math.cos(perpAngle) * bottomWidth/2, startY - Math.sin(perpAngle) * bottomWidth/2);
  ctx.lineTo(startX + Math.cos(perpAngle) * bottomWidth/2, startY + Math.sin(perpAngle) * bottomWidth/2);
  
  // Top of trunk (narrower)
  const topWidth = width * 0.8;
  ctx.lineTo(endX + Math.cos(perpAngle) * topWidth/2, endY + Math.sin(perpAngle) * topWidth/2);
  ctx.lineTo(endX - Math.cos(perpAngle) * topWidth/2, endY - Math.sin(perpAngle) * topWidth/2);
  
  // Close the path
  ctx.closePath();
  
  // Create gradient for trunk
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, "#a0522d");
  gradient.addColorStop(1, color);
  
  // Fill trunk with gradient
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add some texture lines for bark
  ctx.strokeStyle = "#6d4c41";
  ctx.lineWidth = 1;
  
  for (let i = 0; i < trunkLength; i += width * 0.3) {
    const t = i / trunkLength;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    const lineWidth = bottomWidth * (1 - t) + topWidth * t; // Interpolate width
    const lineLength = lineWidth * 0.8;
    
    // Add some randomness to the texture lines
    const offset = (Math.random() - 0.5) * width * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(perpAngle) * lineLength/2 + offset, 
               y - Math.sin(perpAngle) * lineLength/2 + offset);
    ctx.lineTo(x + Math.cos(perpAngle) * lineLength/2 + offset, 
               y + Math.sin(perpAngle) * lineLength/2 + offset);
    ctx.stroke();
  }
}

/**
 * Draws a branch with natural curve
 */
function drawBranch(ctx, startX, startY, endX, endY, width, color) {
  // Create gradient for branch
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#a0522d");
  
  // Calculate control point for the curve
  // We want branches to curve slightly upward
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx);
  
  // Add a slight upward bias to the curve
  const perpAngle = angle - Math.PI/2;
  const curveAmount = width * 0.8;
  
  // Use let instead of const so we can modify these values
  let controlX = startX + dx * 0.5;
  let controlY = startY + dy * 0.5 - width; // Curve upward
  
  // Add some randomness
  controlX += (Math.random() - 0.5) * width * 0.5;
  controlY += (Math.random() - 0.5) * width * 0.5;
  
  // Draw branch with curve
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

/**
 * Draws a leaf shape
 */
function drawLeaf(ctx, x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI/4); // Rotate to align with branch plus offset
  
  // Create gradient for leaf
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, shadeColor(color, -20)); // Darker at edges
  
  // Draw leaf shape
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(
    size * 0.5, -size * 0.5,
    size, -size * 0.25,
    size, 0
  );
  ctx.bezierCurveTo(
    size, size * 0.25,
    size * 0.5, size * 0.5,
    0, 0
  );
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw leaf vein
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.8, 0);
  ctx.strokeStyle = shadeColor(color, -30);
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draws a flower shape
 */
function drawFlower(ctx, x, y, size, color, colors) {
  const petalCount = 5;
  const innerRadius = size * 0.3;
  
  // Draw petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petalX = x + Math.cos(angle) * size * 0.7;
    const petalY = y + Math.sin(angle) * size * 0.7;
    
    ctx.beginPath();
    ctx.arc(petalX, petalY, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  // Draw flower center
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = colors.flowers[(colors.flowers.indexOf(color) + 1) % colors.flowers.length];
  ctx.fill();
  
  // Add some detail to center
  ctx.beginPath();
  ctx.arc(x, y, innerRadius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff9c4";
  ctx.fill();
}

/**
 * Utility function to shade a color (positive amt = lighter, negative = darker)
 */
function shadeColor(color, amt) {
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Changes the season for the fractal garden
 * @param {string} season - Season to change to (spring, summer, fall, winter)
 */
function changeSeason(season) {
  if (!["spring", "summer", "fall", "winter"].includes(season)) {
    season = "spring";
  }
  
  updateState('fractal', { season });
  
  // Get the visualizer and trigger a redraw
  const visualizer = getVisualizer('fractal');
  if (visualizer) {
    visualizer.redraw();
  }
}

// Register the fractal visualizer with the system
registerVisualizer('fractal', {
  displayName: 'Fractal Garden',
  icon: '🌸', // Updated icon to Cherry Blossom
  renderFunction: renderFractalSpecific,
  redrawFunction: redrawFractalSpecific,
  stateTemplate: {
    branches: null,
    colors: null,
    frame: 0,
    centerX: 0,
    centerY: 0,
    season: "spring",
    groundElements: null,
    groundElementsPositions: null,
    totalBranches: 0,
    animationId: null
  },
  animationConfig: {
    duration: 3000,
    layerDepth: 3
  }
});

// Export the specific functions for potential reuse and backward compatibility
export { renderFractalSpecific, redrawFractalSpecific, changeSeason };

// For backward compatibility
export function renderFractal(word) {
  const visualizer = getVisualizer('fractal');
  if (visualizer) {
    visualizer.render(word);
  }
}

export function redrawFractal() {
  const visualizer = getVisualizer('fractal');
  if (visualizer) {
    visualizer.redraw();
  }
}
