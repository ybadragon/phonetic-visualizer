/**
 * Phonetic Visualizer - Tree Visualization
 * Renders a recursive tree visualization using D3.js
 */

import { animateTypewriter, phoneticMap } from '../utils.js';

/**
 * Renders a tree visualization for the given word
 * @param {string} word - The word to visualize
 */
function renderTree(word) {
  if (!word) return;
  
  // Clear the SVG
  const svg = d3.select("#tree");
  svg.style("display", "block").selectAll("*").remove();
  
  // Make sure the SVG container is visible
  document.getElementById("treeContainer").style.display = "block";
  
  // Get SVG dimensions
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;
  
  // Build tree data
  const treeData = buildTree(word);
  
  // Get the final layer for typewriter animation
  const finalText = collectLeaves(word);
  
  // Estimate animation duration based on tree complexity
  const estimatedNodes = word.length * 4; // Rough estimate of total nodes
  const animationDuration = estimatedNodes * 100;
  
  // Start typewriter animation
  animateTypewriter(finalText, animationDuration);
  
  // Create the tree layout
  const root = d3.hierarchy(treeData);
  const treeLayout = d3.tree().size([height, width - 160]);
  treeLayout(root);
  
  // Add the links
  const g = svg.append("g").attr("transform", "translate(80,0)");
  const linkPath = d3.linkHorizontal()
    .x(d => d.y)
    .y(d => d.x);
  
  g.selectAll(".link")
    .data(root.links())
    .join("path")
    .attr("class", "link")
    .attr("d", linkPath)
    .style("stroke", "#fff")
    .style("stroke-opacity", 0.5)
    .style("stroke-width", 1.5)
    .style("fill", "none")
    .style("stroke-dasharray", function() {
      const length = this.getTotalLength();
      return length + "," + length;
    })
    .style("stroke-dashoffset", function() {
      return this.getTotalLength();
    })
    .transition()
    .duration(1000)
    .delay((d, i) => i * 100)
    .style("stroke-dashoffset", 0);
  
  // Add the nodes
  const node = g.selectAll(".node")
    .data(root.descendants())
    .join("g")
    .attr("class", "node")
    .style("opacity", 0)
    .attr("transform", d => `translate(${d.y},${d.x})`);
  
  node.append("circle").attr("r", 4);
  node.append("text")
    .attr("dy", 3)
    .attr("x", d => d.children ? -8 : 8)
    .style("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name);
  
  node.transition()
    .delay((d, i) => i * 100)
    .duration(500)
    .style("opacity", 1);
  
  // Setup zoom and pan for the tree
  setupTreeZoomPan();
}

/**
 * Builds a hierarchical tree structure from a word
 * @param {string} word - The word to build a tree from
 * @param {number} depth - Maximum depth of the tree
 * @returns {Object} Tree data structure
 */
function buildTree(word, depth = 3) {
  function recurse(word, level) {
    if (level >= depth) return { name: word };
    return {
      name: word,
      children: word.split('').map(char =>
        recurse(phoneticMap[char.toLowerCase()] || char, level + 1)
      )
    };
  }
  return recurse(word, 0);
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

/**
 * Sets up zoom and pan functionality for the tree visualization
 */
function setupTreeZoomPan() {
  const svg = d3.select("#tree");
  const g = svg.select("g");
  
  // Create a zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.2, 5])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
  
  // Apply the zoom behavior to the SVG
  svg.call(zoom);
  
  // Initialize with a slight offset for better visibility
  svg.call(zoom.transform, d3.zoomIdentity.translate(80, 0));
}

export { renderTree };
