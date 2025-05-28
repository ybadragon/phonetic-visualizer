/**
 * Phonetic Visualizer - Futuristic Visualizer
 * Displays phonetic components with a futuristic, geometric aesthetic.
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';

// --- Configuration for the futuristic visualizer ---
const CONFIG = {
    backgroundColor: '#0a0f1f', // Dark blue/purple
    layerColors: [
        '#00ffff', // Cyan
        '#ff00ff', // Magenta
        '#39ff14', // Lime Green
        '#007bff', // Electric Blue
    ],
    defaultShapeColor: '#00ffff', // Fallback if layerColors is exhausted or not used
    defaultGlowColor: '#00ffff',   // Fallback
    lineWidth: 2,
    shapeRadius: 50,            // Base radius for shapes
    radiusIncrement: 30,        // How much radius increases per layer
    pulseSpeed: 0.05,
    maxPulseOffset: 10,
    rotationSpeed: 0.005,
};

/**
 * Specific render function for the futuristic visualization.
 * @param {string} word - The word to visualize.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {Array} layers - The phonetic layers.
 */
function renderFuturisticSpecific(word, canvas, ctx, layers) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initial state for the visualizer
    updateState('futuristic', {
        frame: 0,
        layers: layers,
        centerX: centerX,
        centerY: centerY,
        pulseOffset: 0,
        rotation: 0,
        animationId: null,
    });

    // Start the animation loop
    animateFuturistic();
}

/**
 * Specific redraw function for the futuristic visualization.
 * @param {Object} state - The current state of the visualizer.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 */
function redrawFuturisticSpecific(state, canvas, ctx) {
    if (canvas.width === 0 || canvas.height === 0) {
        console.error("Futuristic: Canvas has zero dimensions, cannot render.");
        return;
    }

    const transform = getCanvasTransform('futuristic-canvas'); // Use visualizer name for transform
    const scale = transform.scale || 1;
    const offsetX = transform.offsetX || 0;
    const offsetY = transform.offsetY || 0;

    // Clear canvas with background color
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom/pan transform
    ctx.save();
    ctx.translate(offsetX * scale, offsetY * scale); // Pan first
    ctx.scale(scale, scale);                         // Then scale

    const { layers, centerX, centerY, pulseOffset, rotation } = state;

    layers.forEach((layer, layerIndex) => { // layer is an array of characters e.g. ['e','x','a','m','p','l','e']
        const radius = CONFIG.shapeRadius + layerIndex * CONFIG.radiusIncrement + pulseOffset;
        // numSegments is based on the length of the character array for the current layer
        const numSegments = (layer && layer.length > 2) ? layer.length : 3;

        ctx.beginPath();
        for (let i = 0; i < numSegments; i++) {
            const angle = (i / numSegments) * Math.PI * 2 + rotation;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        const currentColor = CONFIG.layerColors[layerIndex % CONFIG.layerColors.length] || CONFIG.defaultShapeColor;
        const currentGlowColor = CONFIG.layerColors[layerIndex % CONFIG.layerColors.length] || CONFIG.defaultGlowColor;

        // Glowing effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentGlowColor;

        ctx.strokeStyle = currentColor;
        ctx.lineWidth = CONFIG.lineWidth;
        ctx.stroke();

        // Reset shadow for other elements if any (though not strictly needed here)
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Optionally, draw phonemes as text or smaller shapes
        if (layer && layer.length > 0) {
            // Iterate over the characters in the layer array
            layer.forEach((phonemeSymbol, phonemeIndex) => { // phonemeSymbol is the character e.g. 'e'
                const phonemeAngle = (phonemeIndex / numSegments) * Math.PI * 2 + rotation + (Math.PI / numSegments); // Offset to be between vertices
                const textRadius = radius - 15; // Place text inside the shape
                const textX = centerX + textRadius * Math.cos(phonemeAngle);
                const textY = centerY + textRadius * Math.sin(phonemeAngle);
            
                ctx.fillStyle = currentColor; // Use current layer's color for text
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(phonemeSymbol, textX, textY); // Use phonemeSymbol directly
            });
        }
    });

    ctx.restore();
}

/**
 * Animation loop for the futuristic visualizer.
 */
function animateFuturistic() {
    const state = getState('futuristic');
    if (!state) return; // Stop if state is cleared

    const newPulseOffset = Math.sin(state.frame * CONFIG.pulseSpeed) * CONFIG.maxPulseOffset;
    const newRotation = state.rotation + CONFIG.rotationSpeed;

    updateState('futuristic', {
        frame: state.frame + 1,
        pulseOffset: newPulseOffset,
        rotation: newRotation,
    });

    // Get the canvas and context (assuming they are accessible or passed if needed)
    // For dynamic canvas, visualizer-base should handle providing these.
    // We rely on the redraw function being called by the base system after state update.
    const visualizer = getVisualizer('futuristic'); // visualizer-base.js function
    if (visualizer) {
         // The base visualizer's redraw will call our redrawFuturisticSpecific
        visualizer.redraw();
    }


    // Continue animation
    // The base system might handle the requestAnimationFrame loop if integrated that way.
    // For now, let's assume this visualizer manages its own loop if not stopped.
    // The animationId should be stored to allow cancellation.
    const animationId = requestAnimationFrame(animateFuturistic);
    updateState('futuristic', { animationId });
}

// Register the visualizer with the system
registerVisualizer('futuristic', {
    displayName: 'Futuristic Glyphs',
    icon: '💠', // Diamond with a Dot
    // canvasId and containerId will be auto-generated if omitted
    renderFunction: renderFuturisticSpecific,
    redrawFunction: redrawFuturisticSpecific,
    stateTemplate: {
        frame: 0,
        layers: [],
        centerX: 0,
        centerY: 0,
        pulseOffset: 0,
        rotation: 0,
        animationId: null, // To store the requestAnimationFrame ID for cancellation
    },
    animationConfig: { // Example, might not be used by this specific implementation directly
        duration: 5000, // Total animation duration (example)
        layerDepth: 3   // Max layers to animate (example)
    }
});

// Export the specific functions for potential reuse or direct calling if needed
export { renderFuturisticSpecific, redrawFuturisticSpecific };
