# Phonetic Visualizer System Patterns

## System Architecture

The Phonetic Visualizer project follows a modular frontend architecture with clear separation of concerns. The system is built entirely on the client side using vanilla JavaScript with ES modules.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│  (HTML/CSS, Input Controls, Visualization Containers)    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                     Main Application                     │
│      (Event Handling, Visualization Selection)           │
└─┬─────────────────────────┬───────────────────────────┬─┘
  │                         │                           │
┌─▼─────────────┐   ┌───────▼───────┐   ┌───────────────▼─┐
│ Visualizer    │   │ State         │   │ Utility         │
│ Base System   │   │ Management    │   │ Functions       │
└─┬─────────────┘   └───────────────┘   └─────────────────┘
  │
┌─▼─────────────────────────────────────────────────────┐
│                Individual Visualizers                  │
│  (Spiral, Tree, Ripple, Fractal, Constellation, etc.) │
└─────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Generic Visualizer Architecture

The project has been refactored to use a generic visualizer architecture that simplifies adding new visualizers and maintaining existing ones. This decision was made to:

- Reduce code duplication across visualizers
- Standardize the implementation pattern
- Simplify the process of adding new visualizers
- Improve maintainability

### 2. ES Modules

The project uses ES modules for code organization, which provides:

- Clear dependency management
- Encapsulation of visualizer implementations
- Ability to dynamically import modules when needed
- Better code organization and maintainability

### 3. Canvas-Based Rendering

Most visualizations use the HTML Canvas API for rendering, which:

- Provides better performance for complex animations
- Allows for pixel-level control of visualizations
- Supports the zoom and pan functionality
- Enables complex visual effects

### 4. Centralized State Management

A centralized state management system is used to:

- Track the state of each visualization
- Manage animation frames
- Handle state resets when switching visualizations
- Provide a consistent interface for state updates

### 5. Registration System

A registration system for visualizers allows:

- Dynamic UI generation based on available visualizers
- Standardized interface for all visualizers
- Simplified process for adding new visualizers
- Reduced need to modify multiple files when adding visualizers

## Component Relationships

### Visualizer Base System

The base visualizer system (`visualizer-base.js`) is the core of the architecture and provides:

1. **Visualizer Factory**: Creates visualizer objects with standardized functionality
2. **Registration System**: Allows visualizers to register themselves
3. **Common Functionality**: Handles canvas setup, phonetic layer generation, and animation

### State Management

The state management system (`state.js`) provides:

1. **State Templates**: Define the initial state for each visualizer
2. **State Updates**: Provide a consistent interface for updating state
3. **State Reset**: Handle cleanup and reset when switching visualizers
4. **Animation Frame Tracking**: Manage requestAnimationFrame IDs

### Main Application

The main application (`main.js`) handles:

1. **UI Initialization**: Set up event listeners and initialize the UI
2. **Visualization Selection**: Handle selection changes and render the chosen visualization
3. **Canvas Zoom/Pan**: Set up zoom and pan functionality for canvas visualizations
4. **Dynamic Imports**: Import visualizer modules as needed

### Individual Visualizers

Each visualizer (`js/visualizers/*.js`) implements:

1. **Specific Render Function**: Implement the unique visualization logic
2. **Specific Redraw Function**: Handle redrawing for zoom/pan and animation
3. **Registration**: Register with the base system
4. **State Definition**: Define the state template for the visualizer

## Critical Implementation Paths

### Visualization Rendering Process

1. User selects a visualization and enters a word
2. Main application calls the selected visualizer's render method
3. Base visualizer handles common setup (canvas, phonetic layers, typewriter)
4. Specific render function implements the visualization logic
5. Animation frames are managed through the state system

### Registration Process

1. Each visualizer imports the registration function
2. Visualizer defines its specific render and redraw functions
3. Visualizer registers with the system, providing its configuration
4. System adds the visualizer to the available options
5. UI is updated to include the new visualizer

### Zoom and Pan Implementation

1. Main application sets up event listeners for mouse wheel and mouse movement
2. When zoom or pan occurs, transform values are stored in the canvas dataset
3. A redraw is triggered based on the canvas type
4. The specific redraw function applies the transform before rendering

## Design Patterns in Use

### Factory Pattern

The visualizer base system uses a factory pattern to create standardized visualizer objects with consistent interfaces.

### Module Pattern

ES modules are used to encapsulate functionality and manage dependencies.

### Observer Pattern

Event listeners are used to observe user interactions and trigger appropriate responses.

### Template Method Pattern

The base visualizer defines the template for rendering, while specific visualizers implement the unique aspects.

### Strategy Pattern

Different visualization strategies can be selected and swapped at runtime.
