## Brief overview
This set of guidelines is specific to the phonetic visualizer project and outlines preferences for developing and modifying visualizations.

## Communication style
- Provide direct, technical responses without conversational fillers like "Great", "Certainly", etc.
- After making code changes, allow the user to test those changes manually rather than automatically launching a browser
- When suggesting new visualizers, focus on the technical implementation details and visual concepts

## Development workflow
- When removing features, systematically remove all references across multiple files
- Let the user make the final decision on which visualizers to keep or remove
- ALWAYS allow the user to test changes manually after implementation
- NEVER automatically open browsers for testing - let the user decide when to test

## Coding best practices
- Maintain consistent spacing between characters in visualizations to prevent overlapping
- Implement smooth animations with appropriate timing for visualizations
- Use fixed rotation values instead of random ones to prevent flickering effects
- Implement proper morphing effects for character transformations when applicable
- Add appropriate comments to explain visualization algorithms
- For smooth zoom animations, avoid large filled areas and gradients that are computationally intensive to redraw
- Prefer outlines and simple shapes for better performance during zoom operations
- Minimize the number of elements that need to be redrawn during zoom and pan operations

## Project structure
- Keep visualizer implementations in separate files in the js/visualizers directory
- Maintain clean separation between state management, utilities, and visualization rendering
- When adding or removing visualizers, update all relevant files: js/main.js, index.html, js/visualizer-base.js, and relevant memory-bank files (activeContext.md, progress.md). Files like styles.css, js/utils.js, and js/state.js may not always need changes if the visualizer was using the generic system.

## Testing approach
- ALWAYS allow the user to manually test changes rather than automatically launching test environments
- NEVER automatically open browsers for testing - let the user decide when to test
- When changes are made to visualizers, wait for the user to initiate testing
- Provide clear instructions on how to test changes if requested, but don't execute those steps automatically
- When the user provides feedback about visual issues (like overlapping or flashing), prioritize fixing those specific concerns
