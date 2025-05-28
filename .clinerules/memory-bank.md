## Brief overview
This set of guidelines outlines the Memory Bank system - a comprehensive documentation approach that ensures continuity of knowledge between sessions. The Memory Bank serves as the single source of truth for project understanding and must be maintained with precision.

## Documentation structure
- Maintain a hierarchical set of core Markdown files in a memory-bank directory
- Required core files include: projectbrief.md, productContext.md, activeContext.md, systemPatterns.md, techContext.md, and progress.md
- Create additional context files/folders when needed to organize complex documentation
- Ensure files build upon each other in a clear hierarchy with projectbrief.md as the foundation

## File maintenance workflow
- Create projectbrief.md at project start if it doesn't exist
- Update activeContext.md and progress.md most frequently as they track current state
- Review ALL Memory Bank files when triggered by "update memory bank" command
- Document changes after implementing significant features or discovering new patterns
- Maintain precise documentation as if complete memory reset will occur between sessions

## Documentation content guidelines
- projectbrief.md: Define core requirements, goals, and project scope
- productContext.md: Explain why the project exists, problems it solves, and user experience goals
- activeContext.md: Document current focus, recent changes, next steps, and active decisions
- systemPatterns.md: Detail system architecture, key technical decisions, and component relationships
- techContext.md: List technologies, development setup, technical constraints, and dependencies
- progress.md: Track what works, what's left to build, current status, and known issues

## Session workflow
- Begin each new session by reading ALL Memory Bank files
- In Plan Mode: Verify context completeness, develop strategy, present approach
- In Act Mode: Check Memory Bank, update documentation, execute task, document changes
- Update documentation when discovering new patterns, implementing changes, or clarifying context

## Communication approach
- Treat the Memory Bank as the only link to previous work
- Maintain documentation with precision and clarity
- Focus particularly on activeContext.md and progress.md for tracking current state
- Document insights and patterns that emerge during development
