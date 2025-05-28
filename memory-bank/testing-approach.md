## Brief overview
This set of guidelines focuses on the testing approach for the phonetic visualizer project, emphasizing user-controlled manual testing rather than automatic testing initiation.

## Testing workflow
- ALWAYS allow the user to manually test changes after implementation rather than automatically launching test environments
- NEVER automatically open browsers for testing - let the user decide when to test
- When changes are made to visualizers, wait for the user to initiate testing
- Provide clear instructions on how to test changes if requested, but don't execute those steps automatically
- Assume the user wants to test at their own pace and on their own schedule

## Implementation considerations
- After implementing new visualizers or making changes to existing ones, simply inform the user that changes are complete
- When fixing bugs, describe what was fixed but allow the user to verify the fix themselves
- For performance improvements, explain what was optimized but let the user observe the improvements firsthand
- When adding new features, explain what was added and how it can be tested, but don't launch test environments

## Communication style
- Use phrases like "The changes have been implemented. You can test them by..." instead of automatically testing
- When suggesting testing approaches, frame them as options rather than actions you're taking
- Provide clear, concise explanations of changes made so the user understands what to look for when testing
- If the user asks for help with testing, provide guidance without taking control of the testing process

## Feedback handling
- After the user tests changes, be receptive to feedback and ready to make additional adjustments
- Don't assume the success of changes until the user confirms through their own testing
- If the user reports issues after testing, focus on understanding their observations rather than defending the implementation
- Use the user's testing feedback to guide further refinements
