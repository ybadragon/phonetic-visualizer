# Phonetic Visualizer Active Context

## Current Work Focus

The project is currently focused on completing the refactoring of the visualizer system to use the new generic architecture. This refactoring aims to simplify the addition of new visualizers and improve the maintainability of the codebase.

### Active Refactoring Status

Based on the refactoring plan, the following progress has been made:

- ✅ Phase 1: Create Base Architecture
  - Created `visualizer-base.js` with the base visualizer factory
  - Implemented the visualizer registration system
  - Created generic state management functions
  - Added dynamic UI generation for visualizer selection

- ✅ Phase 2: Refactor State Management
  - Updated state.js to use generic state templates
  - Implemented generic state reset function
  - Created a unified animation cancellation system
  - Added state registration mechanism

- ✅ Phase 3: Convert Existing Visualizers
  - ✅ Refactored spiral visualizer to use the new system
  - ✅ Added typography visualizer as an example of the new system (now removed)
  - ✅ Refactored ripple visualizers to use the new system (Animated Pulse removed)
  - ✅ Refactored constellation visualizer to use the new system
  - ✅ Refactored fractal visualizer to use the new system
  - ✅ Refactored tree visualizer to use the new system
  - ✅ Waveform visualizer refactored
  - ❌ Atom visualizer (removed) - Abandoned due to persistent data handling issues.

- ✅ Phase 4: Update Main Application
  - ✅ Updated main.js to use the registration system
  - ✅ Refactored renderSelectedVisualization function
  - ✅ Updated event listeners to work with the new system
  - ✅ Implemented dynamic canvas/container creation

- 🔄 Phase 5: Testing and Documentation
  - ✅ Tested existing refactored visualizers
  - ✅ Created documentation for adding new visualizers
  - ✅ Added example of creating a new visualizer (typography, now removed)
  - ✅ Updated comments throughout the codebase

## Recent Changes

1. **Waveform Audio Cleanup Fix**: Resolved an issue where Waveform visualizer audio continued playing after switching to another visualizer. Implemented an explicit stop function in `waveform.js` and called it from `main.js` when changing visualizers to ensure proper audio and UI state cleanup.
2. **Waveform Visualizer Refactoring**: Successfully refactored the Waveform visualizer to use the generic architecture and dynamic canvas creation system. This included integrating its audio playback (ding sounds, reverb), interactive controls (play/pause, dual trigger), and specific animation logic with the new system, while ensuring proper state management and resource cleanup.
3. **Ripple Visualizer Refactoring**: Refactored ripple visualizers (Radial Expansion, Concentric Waves) to use the new generic architecture. Animated Pulse was removed. Fixed pan and zoom functionality by correctly applying canvas transforms.
4. **Generic Visualizer Architecture**: Implemented a base visualizer system that standardizes the creation and management of visualizers.
5. **Registration System**: Created a system for visualizers to register themselves with the main application, reducing the need to modify multiple files when adding new visualizers.
6. **Typography Visualizer (Removed)**: The typography visualizer, previously an example, has been removed.
7. **Example Visualizer (Removed)**: The "Dynamic Canvas Example" visualizer has been removed.
8. **Documentation**: Created comprehensive documentation in `docs/visualizer-system.md` explaining how the system works and how to create new visualizers.
9. **State Management Improvements**: Refactored the state management system to use templates and provide a more consistent interface for state updates.

## Recent Changes

1. **Tree Visualizer Fixes**: Fixed several issues with the Tree visualizer:
   - Renamed the visualizer from "Tree Structure" to "Recursive Tree" in the dropdown
   - Made the tree visualizer appear first in the list of visualizers by reordering imports
   - Fixed a rendering issue where the tree visualizer wasn't properly rendering when initially selected
   - Updated the code to use the visualizer system properly when no visualization is explicitly selected

2. **Tree Visualizer Refactoring**: Successfully refactored the Tree visualizer to use the generic architecture and dynamic canvas creation system. This refactoring:
   - Converts the tree visualizer from SVG/D3.js to Canvas-based rendering
   - Implements a sophisticated multi-pass tree layout algorithm without D3.js dependency
   - Ensures proper node positioning and prevents line crossings
   - Integrates with the dynamic canvas creation system
   - Implements smooth zoom and pan functionality
   - Maintains the same visual style and appearance as the original
   - Preserves backward compatibility with the existing code
   - Properly handles state management for the visualization

2. **Constellation Visualizer Refactoring**: Successfully refactored the Constellation visualizer to use both the generic architecture and dynamic canvas creation system. Fixed a critical hover detection issue with pan and zoom by correctly implementing the inverse transform calculation.

3. **Dynamic Canvas Creation**: Implemented a system that automatically creates canvas elements for new visualizers, eliminating the need to manually add HTML elements and update related functions. This feature:
   - Ensures consistent canvas IDs are used throughout the code
   - Provides a standardized template for redraw functions with proper transform handling
   - Reduces manual steps and potential for human error
   - Centralizes transform application logic
   - Simplifies the process of adding new visualizers

4. **Smooth Zoom and Pan**: Enhanced the zoom and pan functionality with:
   - Smooth zoom animation that gradually transitions between zoom levels
   - Mouse-centered zooming that keeps the point under the cursor fixed
   - Responsive panning with direct 1:1 mapping for more intuitive movement

5. **Example Visualizer (Removed)**: The example visualizer demonstrating dynamic canvas creation has been removed.

6. **Updated Documentation**: Enhanced the documentation in `docs/visualizer-system.md` to explain the dynamic canvas creation feature.

## Recent Changes

1. **Atom Visualizer (Removed)**:
    - Attempted to create an "Atom" visualizer.
    - Encountered persistent issues with displaying phoneme text correctly on particles and with typewriter animation, specific to this visualizer.
    - Despite multiple attempts to debug data handling within `atom.js` and assuming correct data from `visualizer-base.js` (as other visualizers work), the issues remained.
    - The visualizer has been removed from the project.

2. **Futuristic Glyphs Enhancements**:
    - Added a new visualizer called "Futuristic Glyphs" (`futuristic.js`). This visualizer displays phonetic components using concentric, glowing geometric shapes with pulsing and rotating animations, adhering to the generic visualizer architecture and dynamic canvas creation.
    - Updated "Futuristic Glyphs" to use a different color for each concentric layer, cycling through a predefined palette (cyan, magenta, lime green, electric blue) to improve layer differentiation.
    - Added an icon (💠) for "Futuristic Glyphs" in the selection dropdown.
    - Fixed bugs related to canvas ID for transformations, layer depth, and data structure handling for phoneme counts.
2. **Fractal Visualizer Refactoring**: Successfully refactored the Fractal visualizer to use the generic architecture and dynamic canvas creation system. This refactoring:
   - Integrates the Fractal Garden visualizer with the generic visualizer system
   - Maintains all existing functionality including the seasonal changes and detailed ground elements
   - Properly implements zoom and pan functionality with correct transform handling
   - Preserves the animation system for growing branches
   - Ensures backward compatibility with existing code
   - Properly handles state management for the visualization

## Next Steps

The following tasks are prioritized for upcoming work:

1. ✅ **All Visualizers Refactored**: All visualizers have been updated to use both the generic architecture and dynamic canvas creation system in a single pass.
   - ✅ Constellation visualizer
   - ✅ Fractal visualizer
   - ✅ Tree visualizer
   - ✅ Waveform visualizer
   
   This combined approach has:
   - Reduce the number of times each file needs to be modified
   - Ensure complete modernization in a single pass
   - Prevent potential inconsistencies between partially refactored visualizers
   - Simplify testing as each visualizer is fully updated before moving to the next
   
   Each visualizer will benefit from:
   - Automatic canvas creation
   - Standardized zoom and pan functionality
   - Consistent transform handling
   - Simplified code structure

3. **Improve Error Handling**: Add better error handling for edge cases, particularly for canvas operations and animation frames.

4. **Performance Optimization**: Review and optimize canvas operations for better performance, especially for complex visualizations.

5. **Browser Compatibility Testing**: Test the application across different browsers to ensure consistent behavior.

## Active Decisions and Considerations

### 1. Visualizer Refactoring Approach

**Decision**: Refactor one visualizer at a time using a combined approach that implements both the generic architecture and dynamic canvas creation in a single pass, while maintaining backward compatibility.

**Rationale**: This approach reduces redundant work, creates more consistency across the codebase, and simplifies testing while still allowing for incremental improvements. It also provides opportunities to refine the generic system based on lessons learned from each refactoring.

### 2. State Management Strategy

**Decision**: Use a centralized state management system with templates for each visualizer.

**Rationale**: This approach provides a consistent interface for state updates and makes it easier to reset state when switching visualizers. It also helps prevent memory leaks by ensuring animation frames are properly canceled.

### 3. Canvas vs. SVG for Visualizations

**Decision**: Use Canvas for all visualizations to ensure consistency and take advantage of the dynamic canvas creation system.

**Rationale**: Canvas provides better performance for complex animations and pixel-level control. The tree visualization, which was previously SVG-based, has been converted to use Canvas to ensure consistency with the rest of the system and to take advantage of the smooth zoom and pan functionality.

### 4. Zoom and Pan Implementation

**Decision**: Implement zoom and pan functionality at the canvas level rather than using CSS transforms.

**Rationale**: Canvas-level transforms provide more precise control and better performance, especially for complex visualizations. They also allow for consistent behavior across different visualizers.

## Important Patterns and Preferences

### Visualization Development

- Maintain consistent spacing between characters to prevent overlapping
- Implement smooth animations with appropriate timing
- Use fixed rotation values instead of random ones to prevent flickering
- Add appropriate comments to explain visualization algorithms
- For smooth zoom animations, avoid large filled areas or gradients that are computationally intensive to redraw
- Prefer outlines and simple shapes for better performance during zoom operations

### Testing Approach

- ALWAYS allow the user to manually test changes rather than automatically launching test environments
- NEVER automatically open browsers for testing - let the user decide when to test
- When changes are made to visualizers, wait for the user to initiate testing
- Provide clear instructions on how to test changes if requested, but don't execute those steps automatically
- When the user provides feedback about visual issues, prioritize fixing those specific concerns

### Code Organization

- Keep visualizer implementations in separate files in the js/visualizers directory
- Maintain clean separation between state management, utilities, and visualization rendering
- When adding or removing visualizers, update all relevant files

## Learnings and Project Insights

1. **Generic Architecture Benefits**: The move to a generic architecture has significantly reduced code duplication and made it easier to add new visualizers.

2. **State Management Challenges**: Managing state for animations and visualizations requires careful attention to prevent memory leaks and ensure proper cleanup.

3. **Canvas Performance Considerations**: Canvas operations can be performance-intensive, especially for complex visualizations with many elements.

4. **Browser Differences**: Canvas behavior can vary slightly between browsers, requiring careful testing and fallbacks.

5. **Modular Design Advantages**: The modular design with ES modules has improved code organization and made dependencies more explicit.

6. **Canvas Transform Implementation**: Proper implementation of canvas transforms is critical for zoom and pan functionality. This requires:
   - Using the correct canvas ID in getCanvasTransform calls
   - Resetting the transform matrix before clearing the canvas (ctx.setTransform(1, 0, 0, 1, 0, 0))
   - Applying transforms in the correct order (translate then scale)

7. **Coordinate Space Transformations**: When converting between screen coordinates (like mouse positions) and world coordinates (like object positions in the canvas), it's crucial to apply the inverse transform correctly:
   - The order of transformations matters, and the inverse transform must be applied in the reverse order
   - For a transform that first translates by (offsetX, offsetY) then scales by scale, the inverse is:
     - Divide by scale
     - Subtract offsetX/scale (because offsetX is in screen space, not world space)
   - The correct formula is `(rawMouseX / scale) - (offsetX / scale)` instead of `(rawMouseX / scale) - offsetX`
