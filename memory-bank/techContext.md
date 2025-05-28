# Phonetic Visualizer Technical Context

## Technologies Used

### Core Technologies

1. **HTML5**: Structure of the web application
2. **CSS3**: Styling and layout
3. **JavaScript (ES6+)**: Core programming language
4. **Canvas API**: Used for most visualizations
5. **SVG**: Used for the tree visualization
6. **ES Modules**: For code organization and modularization

### External Libraries

1. **D3.js (v7)**: Used for the tree visualization and potentially other data-driven visualizations

## Development Setup

### Local Development

The project is designed for simple local development without complex build tools:

1. **Local Server**: A basic HTTP server is included (`server.js`) to serve the application locally
2. **Browser**: Modern browser with ES6+ and ES Modules support
3. **Code Editor**: Any text editor or IDE (VSCode recommended)
4. **No Build Process**: The application runs directly in the browser without transpilation or bundling

### Running the Application

1. Start the local server:
   ```
   node server.js
   ```
2. Open a browser and navigate to:
   ```
   http://localhost:3000
   ```

### File Structure

```
phonetic_visualizer/
├── index.html              # Main HTML file
├── styles.css              # Global styles
├── server.js               # Simple HTTP server
├── docs/                   # Documentation
│   └── visualizer-system.md # System documentation
├── js/
│   ├── main.js             # Application entry point
│   ├── state.js            # State management
│   ├── utils.js            # Utility functions
│   ├── visualizer-base.js  # Base visualizer system
│   └── visualizers/        # Individual visualizers
│       ├── constellation.js
│       ├── fractal.js
│       ├── ripple.js
│       ├── spiral.js
│       ├── tree.js
│       ├── typography.js
│       └── waveform.js
└── plans/                  # Planning documents
    └── visualizer-refactoring-plan.md
```

## Technical Constraints

### Browser Compatibility

- The application targets modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- No support for legacy browsers (IE11 and below)
- Requires ES6+ features and ES Modules support

### Performance Considerations

- Canvas operations should be optimized for smooth animations
- State management should prevent memory leaks
- Animation frames should be properly canceled when switching visualizations
- Large datasets (complex words) should be handled efficiently

### Code Organization

- Each visualizer should be in its own file
- Common functionality should be abstracted to the base system
- State should be managed centrally
- Utility functions should be reusable across visualizers

## Dependencies

### Runtime Dependencies

1. **D3.js (v7)**
   - Purpose: Data visualization library
   - Usage: Tree visualization and potentially other data-driven visualizations
   - Loaded via CDN: `https://d3js.org/d3.v7.min.js`

### Development Dependencies

None. The project intentionally avoids build tools and development dependencies to keep the setup simple.

## Tool Usage Patterns

### Canvas Manipulation

Canvas-based visualizers follow a consistent pattern:

1. Get the canvas element and context
2. Set canvas dimensions based on container size
3. Clear the canvas
4. Draw the visualization
5. Set up animation loop if needed

```javascript
// Example canvas setup pattern
function setupCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  return { canvas, ctx };
}
```

### Animation Pattern

Animations follow a consistent pattern:

1. Use requestAnimationFrame for the animation loop
2. Store the animation ID in the state
3. Update the state for each frame
4. Cancel the animation when switching visualizations

```javascript
// Example animation pattern
function animate() {
  const state = getState('visualizer-name');
  
  // Update state
  updateState('visualizer-name', { frame: state.frame + 1 });
  
  // Redraw
  redrawFunction(state);
  
  // Continue animation if needed
  if (state.frame < maxFrames) {
    const animationId = requestAnimationFrame(animate);
    updateState('visualizer-name', { animationId });
  }
}
```

### Zoom and Pan Pattern

Zoom and pan functionality follows a consistent pattern:

1. Store transform values (scale, offsetX, offsetY) in the canvas dataset
2. Apply the transform before drawing
3. Trigger a redraw when transform changes

```javascript
// Example zoom/pan application
function applyTransform(ctx, canvas) {
  const scale = parseFloat(canvas.dataset.scale || 1);
  const offsetX = parseFloat(canvas.dataset.offsetX || 0);
  const offsetY = parseFloat(canvas.dataset.offsetY || 0);
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(offsetX * scale, offsetY * scale);
  ctx.scale(scale, scale);
  
  // Draw here
  
  ctx.restore();
}
```

## Technical Debt and Limitations

1. **Refactoring in Progress**: Not all visualizers have been converted to the new system yet
2. **Browser-Specific Issues**: Some canvas operations may behave differently across browsers
3. **No Automated Tests**: The project lacks automated tests for visualizers
4. **Limited Error Handling**: Error handling could be improved for edge cases
5. **Performance with Complex Words**: Performance may degrade with very long or complex words
6. **Audio Handling**: The waveform visualizer's audio handling could be improved
