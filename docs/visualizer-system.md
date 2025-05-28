# Phonetic Visualizer System Documentation

## Overview

The Phonetic Visualizer project has been refactored to use a generic visualizer architecture that simplifies adding new visualizers and maintaining existing ones. This document explains how the system works and provides guidance on creating new visualizers.

## Architecture

The visualizer system consists of several key components:

1. **Base Visualizer Factory** (`js/visualizer-base.js`): Creates visualizer objects with standardized functionality.
2. **State Management** (`js/state.js`): Manages state for all visualizers.
3. **Visualizer Registration System**: Allows visualizers to register themselves with the system.
4. **Dynamic UI Generation**: Automatically updates the UI based on registered visualizers.
5. **Individual Visualizers** (`js/visualizers/*.js`): Implement specific visualization logic.

## How It Works

### Registration Process

1. Each visualizer registers itself with the system using the `registerVisualizer` function.
2. The registration includes a state template, render function, redraw function, and configuration options.
3. The system automatically adds the visualizer to the UI dropdown.

### Rendering Process

1. When a visualizer is selected, the system calls its `render` method with the input word.
2. The base visualizer handles common setup (canvas, phonetic layers, typewriter animation).
3. The specific render function is called to implement the visualization logic.
4. Animation frames are managed through the state system.

### State Management

1. Each visualizer has a state template that defines its initial state.
2. The state is reset when a new visualization is rendered.
3. State updates are handled through the `updateState` function.
4. Animation frames are tracked in the state.

## Adding a New Visualizer

Creating a new visualizer is straightforward with the generic system. Here's a step-by-step guide:

### 1. Create a New Visualizer File

Create a new file in the `js/visualizers` directory, e.g., `js/visualizers/my-visualizer.js`.

### 2. Import Required Dependencies

```javascript
/**
 * Phonetic Visualizer - My Visualizer
 * Description of what your visualizer does
 */

import { getCanvasTransform } from '../utils.js';
import { getState, updateState } from '../state.js';
import { registerVisualizer, getVisualizer } from '../visualizer-base.js';
```

### 3. Implement the Specific Render and Redraw Functions

```javascript
/**
 * Specific render function for your visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers
 */
function renderMyVisualizerSpecific(word, canvas, ctx, layers) {
  // Calculate canvas center (canvas dimensions are already set by the base system)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Your visualization logic here
  
  // Store state for animation
  updateState('my-visualizer', {
    // Your state properties
    frame: 0,
    centerX,
    centerY
  });
  
  // Start animation
  function animate() {
    // Get current state
    const state = getState('my-visualizer');
    
    // Update frame in state
    updateState('my-visualizer', { frame: state.frame + 1 });
    
    // Draw using the redraw function
    redrawMyVisualizerSpecific(state, canvas, ctx);
    
    // Continue animation if needed
    const maxFrames = 120; // Define your max frames
    if (state.frame < maxFrames) {
      const animationId = requestAnimationFrame(animate);
      updateState('my-visualizer', { animationId });
    }
  }
  
  animate();
}

/**
 * Specific redraw function for your visualization
 * @param {Object} state - The current state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawMyVisualizerSpecific(state, canvas, ctx) {
  // Ensure canvas is properly sized
  if (canvas.width === 0 || canvas.height === 0) {
    console.error("Canvas has zero dimensions, cannot render visualization");
    return;
  }
  
  // Get transform for zoom/pan
  const transform = getCanvasTransform("my-visualizer");
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;
  
  // Clear canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform for zoom/pan
  ctx.save();
  ctx.translate(offsetX * scale, offsetY * scale);
  ctx.scale(scale, scale);
  
  // Your drawing logic here
  
  ctx.restore();
}
```

### 4. Register the Visualizer

```javascript
// Register the visualizer with the system
registerVisualizer('my-visualizer', {
  displayName: 'My Awesome Visualizer',
  canvasId: 'my-visualizer',
  containerId: 'myVisualizerContainer',
  renderFunction: renderMyVisualizerSpecific,
  redrawFunction: redrawMyVisualizerSpecific,
  stateTemplate: {
    // Define initial state properties
    frame: 0,
    colors: null,
    centerX: 0,
    centerY: 0,
    animationId: null
  },
  animationConfig: {
    duration: 3000,
    layerDepth: 3
  }
});

// Export the specific functions for potential reuse
export { renderMyVisualizerSpecific, redrawMyVisualizerSpecific };
```

### 4. Add HTML Elements

Add a container and canvas element to `index.html`:

```html
<div class="visualization-container" id="myVisualizerContainer">
  <canvas id="my-visualizer"></canvas>
</div>
```

### 5. Import the Visualizer in main.js

```javascript
// Import visualizers to register them with the system
import './visualizers/my-visualizer.js';
```

### 6. Update Zoom/Pan Support

Add your canvas ID to the list in the `setupCanvasZoomPan` function in `main.js`:

```javascript
function setupCanvasZoomPan() {
  const canvasIds = ["spiral", "ripple", "fractal", "constellation", "waveform", "typography", "my-visualizer"];
  // ...
}
```

### 7. Update the triggerRedraw Function

Add a case for your visualizer in the `triggerRedraw` function in `main.js`:

```javascript
function triggerRedraw(canvasId) {
  // ...
  case "my-visualizer":
    import('./visualizers/my-visualizer.js').then(module => {
      const visualizer = getVisualizer('my-visualizer');
      if (visualizer) {
        visualizer.redraw();
      }
    });
    break;
  // ...
}
```

### 8. Update clearVisuals Function

Add your canvas to the `clearVisuals` function in `utils.js`:

```javascript
function clearVisuals() {
  // ...
  document.getElementById("my-visualizer").style.display = "none";
  // ...
}
```

## Best Practices

1. **State Management**: Store all visualization state in the state object, not in local variables.
2. **Animation**: Use requestAnimationFrame for smooth animations.
3. **Zoom/Pan**: Support zoom and pan by applying transforms based on the canvas dataset.
4. **Cleanup**: Properly clean up resources when a visualization is no longer displayed.
5. **Phonetic Layers**: Use the provided phonetic layer generation for consistent behavior.
6. **Typewriter Animation**: Use the animateTypewriter function for consistent text display.

## Example: Typography Visualizer

The Typography visualizer (`js/visualizers/typography.js`) provides a complete example of implementing a visualizer using the generic system. It demonstrates:

1. Proper state management
2. Animation with easing functions
3. Character-based visualization
4. Zoom/pan support
5. Registration with the system

## Troubleshooting

If your visualizer is not appearing in the dropdown:
- Check that it's properly registered with `registerVisualizer`
- Verify that it's imported in `main.js`
- Check the browser console for errors

If your visualizer is not rendering:
- Check that the canvas and container IDs match what's in the HTML
- Verify that the state is being properly updated
- Check that the animation loop is running
- Ensure the container is visible before attempting to set canvas dimensions
- Check that the canvas has non-zero dimensions before rendering
- Verify that transform values (scale, offsetX, offsetY) have proper fallbacks

If zoom and pan functionality is not working:
- Make sure you're using the correct canvas ID in `getCanvasTransform` calls
- Reset the transform matrix before clearing the canvas: `ctx.setTransform(1, 0, 0, 1, 0, 0)`
- Apply transforms in the correct order: first translate, then scale:
  ```javascript
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  // Draw here
  ctx.restore();
  ```

### Common Issues and Solutions

#### Canvas Not Rendering Despite Logs Showing It Should

This can happen if the canvas dimensions are set before the container is fully visible in the DOM. The solution is:
1. Make the container visible first
2. Force a reflow to ensure the container is fully visible
3. Set canvas dimensions based on container size
4. Then proceed with rendering

#### NaN Values in Transforms

If you see "NaN" errors in the console related to transforms, check that:
1. The getCanvasTransform function is handling cases where dataset properties might not be set
2. You're providing fallbacks for transform values in your redraw function
3. You're checking for zero-dimension canvases before attempting to render

## Dynamic Canvas Creation

The system now supports dynamic canvas creation, which automatically creates canvas elements for new visualizers. This eliminates the need to manually add HTML elements, update setupCanvasZoomPan, and modify triggerRedraw.

### Smooth Zoom and Pan

The system includes enhanced zoom and pan functionality:

1. **Smooth Zoom Animation**: Zooming is animated smoothly rather than jumping instantly to the new scale.
2. **Mouse-Centered Zoom**: The zoom is centered on the mouse cursor position, providing a more intuitive experience.
3. **Responsive Panning**: Panning has a direct 1:1 mapping for more intuitive movement.

These enhancements make the visualizations more interactive and user-friendly.

### How Dynamic Canvas Creation Works

1. When a visualizer is registered, if no canvasId or containerId is specified, default IDs are generated based on the visualizer name.
2. The system automatically creates the necessary container and canvas elements in the DOM.
3. Zoom and pan functionality is automatically set up for all canvases.
4. The triggerRedraw function dynamically finds the appropriate visualizer for a canvas.

### Benefits

- Eliminates the need to manually add HTML elements
- Ensures consistent canvas IDs are used throughout the code
- Provides standardized templates for redraw functions with proper transform handling
- Helps prevent pan/zoom issues in future visualizer refactorings
- Reduces manual steps and potential for human error

### Example Usage

To create a visualizer with dynamic canvas creation, simply omit the canvasId and containerId properties when registering:

```javascript
registerVisualizer('my-visualizer', {
  displayName: 'My Visualizer',
  renderFunction: renderMyVisualizerSpecific,
  redrawFunction: redrawMyVisualizerSpecific,
  stateTemplate: {
    // State properties
  },
  animationConfig: {
    duration: 3000,
    layerDepth: 3
  }
});
```

The system will automatically create:
- A container with ID 'my-visualizerContainer'
- A canvas with ID 'my-visualizer-canvas'

You can also specify custom IDs if needed:

```javascript
registerVisualizer('my-visualizer', {
  displayName: 'My Visualizer',
  canvasId: 'custom-canvas-id',
  containerId: 'custom-container-id',
  // Other properties
});
```

## Future Improvements

Planned improvements to the visualizer system:

1. **Plugin System**: Allow visualizers to be loaded as plugins.
2. **Presets**: Support saving and loading visualization presets.
3. **Responsive Design**: Better support for different screen sizes.
4. **Performance Optimization**: Optimize rendering for complex visualizations.
