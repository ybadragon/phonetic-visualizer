/**
 * Phonetic Visualizer - Tree Visualization
 * Renders a recursive tree visualization using Canvas
 */

import { phoneticMap } from '../utils.js';
import { getState, updateState, cancelAnimation } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';
import { getCanvasTransform } from '../utils.js';

/**
 * Specific render function for tree visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderTreeSpecific(word, canvas, ctx, layers) {
  if (!word) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Build tree data structure
  const treeData = buildTreeData(word);
  
  // Calculate tree layout
  const nodes = [];
  const links = [];
  
  // Layout parameters
  const horizontalSpacing = width * 0.8; // Total horizontal space for the tree
  const leftMargin = width * 0.1; // Left margin (10% of width)
  const maxDepth = 3; // Maximum depth of the tree
  
  // Calculate positions for each node
  layoutTree(treeData, nodes, links, leftMargin, horizontalSpacing, height, maxDepth);
  
  // Store state for animation and redraw
  updateState('tree', {
    word,
    nodes,
    links,
    width,
    height,
    animationStartTime: Date.now(),
    animationProgress: 0,
    linkAnimations: links.map(() => ({ progress: 0 })),
    nodeAnimations: nodes.map(() => ({ opacity: 0 }))
  });
  
  // Cancel any existing animation
  cancelAnimation('tree');
  
  // Start animation
  function animate() {
    const state = getState('tree');
    const elapsedTime = Date.now() - state.animationStartTime;
    const animationDuration = 2000; // 2 seconds for the entire animation
    
    // Calculate overall animation progress
    const progress = Math.min(1, elapsedTime / animationDuration);
    
    // Update link animations
    const linkAnimations = state.linkAnimations.map((anim, i) => {
      // Stagger the link animations
      const linkDelay = i * 50; // 50ms delay between each link
      const linkProgress = Math.max(0, Math.min(1, (elapsedTime - linkDelay) / 500)); // 500ms per link
      return { progress: linkProgress };
    });
    
    // Update node animations
    const nodeAnimations = state.nodeAnimations.map((anim, i) => {
      // Stagger the node animations
      const nodeDelay = i * 50 + 200; // 50ms delay between each node, starting 200ms after links
      const nodeOpacity = Math.max(0, Math.min(1, (elapsedTime - nodeDelay) / 300)); // 300ms per node
      return { opacity: nodeOpacity };
    });
    
    // Update state
    updateState('tree', {
      animationProgress: progress,
      linkAnimations,
      nodeAnimations
    });
    
    // Redraw
    redrawTreeSpecific(getState('tree'), canvas, ctx);
    
    // Continue animation if not complete
    if (progress < 1 || linkAnimations.some(anim => anim.progress < 1) || nodeAnimations.some(anim => anim.opacity < 1)) {
      const animationId = requestAnimationFrame(animate);
      updateState('tree', { animationId });
    }
  }
  
  // Start animation
  animate();
}

/**
 * Specific redraw function for tree visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawTreeSpecific(state, canvas, ctx) {
  if (!state || !state.nodes || !state.links) return;
  
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render tree");
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
  
  // Draw background
  ctx.fillStyle = "#1a1a2e"; // Dark blue background similar to the original
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform for zoom/pan
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  
  // Draw links
  state.links.forEach((link, i) => {
    const animation = state.linkAnimations[i];
    const progress = animation.progress || 0;
    
    if (progress > 0) {
      // Draw link with animation
      ctx.beginPath();
      
      // Calculate the bezier curve control points
      const startX = link.source.x;
      const startY = link.source.y;
      const endX = link.target.x;
      const endY = link.target.y;
      
      // Control point is halfway between source and target horizontally
      const controlX = startX + (endX - startX) / 2;
      
      // Draw the path
      ctx.moveTo(startX, startY);
      
      // Use quadratic curve for horizontal tree layout
      ctx.bezierCurveTo(
        controlX, startY, // First control point
        controlX, endY,   // Second control point
        endX, endY        // End point
      );
      
      // Style the path
      ctx.strokeStyle = "#fff";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      
      // Apply dash animation
      if (progress < 1) {
        const totalLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) * 2; // Approximate length
        const dashLength = totalLength;
        const dashOffset = totalLength * (1 - progress);
        
        ctx.setLineDash([dashLength, dashLength]);
        ctx.lineDashOffset = dashOffset;
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
  });
  
  // Draw nodes
  state.nodes.forEach((node, i) => {
    const animation = state.nodeAnimations[i];
    const opacity = animation.opacity || 0;
    
    if (opacity > 0) {
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = opacity;
      ctx.fill();
      
      // Draw node text
      ctx.font = "14px monospace";
      ctx.fillStyle = "#ff6b6b"; // Red color similar to the original
      ctx.textAlign = node.children ? "end" : "start";
      ctx.textBaseline = "middle";
      
      // Position text to the left or right of the node based on whether it has children
      const textX = node.x + (node.children ? -8 : 8);
      ctx.fillText(node.name, textX, node.y);
      
      ctx.globalAlpha = 1;
    }
  });
  
  ctx.restore();
}

/**
 * Builds a hierarchical tree data structure from a word
 * @param {string} word - The word to build a tree from
 * @returns {Object} Tree data structure
 */
function buildTreeData(word) {
  function recurse(word, level = 0, maxDepth = 3) {
    if (level >= maxDepth) return { name: word };
    
    return {
      name: word,
      children: word.split('').map(char => 
        recurse(phoneticMap[char.toLowerCase()] || char, level + 1, maxDepth)
      )
    };
  }
  
  return recurse(word);
}

/**
 * Calculates the layout for the tree
 * @param {Object} rootNode - The root node of the tree
 * @param {Array} nodes - Array to store all nodes
 * @param {Array} links - Array to store all links
 * @param {number} leftMargin - Left margin for the tree
 * @param {number} horizontalSpacing - Total horizontal space for the tree
 * @param {number} height - Height of the canvas
 * @param {number} maxDepth - Maximum depth of the tree
 */
function layoutTree(rootNode, nodes, links, leftMargin, horizontalSpacing, height, maxDepth) {
  // Create a more structured tree representation with proper parent-child tracking
  const processedTree = processTree(rootNode, maxDepth);
  
  // Calculate horizontal positions based on depth
  const depthToX = {};
  for (let depth = 0; depth <= maxDepth; depth++) {
    depthToX[depth] = leftMargin + (depth / maxDepth) * horizontalSpacing;
  }
  
  // Get all nodes by depth for easier processing
  const nodesByDepth = {};
  for (let depth = 0; depth <= maxDepth; depth++) {
    nodesByDepth[depth] = [];
  }
  
  // First pass: collect all nodes by depth
  function collectNodesByDepth(node, depth = 0) {
    nodesByDepth[depth].push(node);
    
    if (node.children && depth < maxDepth) {
      node.children.forEach(child => collectNodesByDepth(child, depth + 1));
    }
  }
  
  collectNodesByDepth(processedTree);
  
  // Count total leaf nodes to calculate vertical spacing
  const leafNodes = nodesByDepth[maxDepth];
  const verticalSpacing = height / (leafNodes.length + 1);
  
  // Second pass: position leaf nodes evenly
  leafNodes.forEach((node, index) => {
    node.y = (index + 1) * verticalSpacing;
  });
  
  // Third pass: position internal nodes based on their children
  // Start from the second-to-last level and work up to the root
  for (let depth = maxDepth - 1; depth >= 0; depth--) {
    nodesByDepth[depth].forEach(node => {
      if (node.children && node.children.length > 0) {
        // Position node at the average y-coordinate of its children
        const childrenY = node.children.map(child => child.y);
        node.y = childrenY.reduce((sum, y) => sum + y, 0) / childrenY.length;
      }
    });
  }
  
  // Fourth pass: create node objects and links
  function createNodesAndLinks(node, parent = null) {
    const nodeObj = {
      name: node.name,
      x: depthToX[node.depth],
      y: node.y,
      depth: node.depth,
      children: !!node.children && node.children.length > 0,
      isLeaf: !node.children || node.children.length === 0 || node.depth === maxDepth
    };
    
    nodes.push(nodeObj);
    
    if (parent) {
      links.push({
        source: {
          name: parent.name,
          x: depthToX[parent.depth],
          y: parent.y
        },
        target: nodeObj
      });
    }
    
    if (node.children && node.depth < maxDepth) {
      node.children.forEach(child => createNodesAndLinks(child, node));
    }
  }
  
  createNodesAndLinks(processedTree);
}

/**
 * Processes the tree to create a more structured representation
 * @param {Object} node - The current node
 * @param {number} maxDepth - Maximum depth of the tree
 * @param {number} depth - Current depth
 * @returns {Object} Processed tree node
 */
function processTree(node, maxDepth, depth = 0) {
  const result = {
    name: node.name,
    depth,
    children: [],
    isLeaf: !node.children || node.children.length === 0 || depth >= maxDepth
  };
  
  if (!result.isLeaf && node.children) {
    result.children = node.children.map(child => 
      processTree(child, maxDepth, depth + 1)
    );
  }
  
  return result;
}

/**
 * Collects all leaf node text from the tree
 * @param {string} word - The root word
 * @param {number} maxDepth - Maximum depth to traverse
 * @returns {string} Concatenated leaf node text
 */
function collectLeaves(word, maxDepth = 3) {
  let finalText = "";
  
  function traverse(word, level = 0) {
    if (level >= maxDepth) {
      finalText += word;
      return;
    }
    word.split('').forEach(char => {
      traverse(phoneticMap[char.toLowerCase()] || char, level + 1);
    });
  }
  
  traverse(word);
  return finalText;
}

// Register the tree visualizer with the system
registerVisualizer('tree', {
  displayName: 'Tree Structure',
  renderFunction: renderTreeSpecific,
  redrawFunction: redrawTreeSpecific,
  stateTemplate: {
    word: null,
    nodes: null,
    links: null,
    width: 0,
    height: 0,
    animationStartTime: 0,
    animationProgress: 0,
    linkAnimations: [],
    nodeAnimations: [],
    animationId: null
  },
  animationConfig: {
    duration: 3000,
    layerDepth: 3
  }
});

// For backward compatibility
function renderTree(word) {
  const visualizer = getVisualizer('tree');
  if (visualizer) {
    visualizer.render(word);
  }
}

// Export for backward compatibility and potential reuse
export { renderTree, renderTreeSpecific, redrawTreeSpecific, buildTreeData, collectLeaves };
