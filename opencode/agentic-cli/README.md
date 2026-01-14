# agentic-cli

This document describes installing [agentic-cli](https://github.com/Cluster444/agentic)
This is right from the docs

## Installation

```bash
bun add -g agentic-cli
```

### Deploy to Your Project

This will pull all agents/commands into a local `.opencode` directory.

```bash
cd ~/projects/my-app
agentic pull
```

### Deploy globally

This will pull all agents/commands into your global `~/.config/opencode/` directory.

```bash
agentic pull -g
```

### Development Workflow

1. Use the **ticket** command to work with the agent to build out ticket details
2. Use the **research** command to analyze the codebase from the ticket details
3. Use the **plan** command to generate an implementation plan for the ticket using the research
4. Use the **execute** command to implement the changes
5. Use the **commit** command to commit your work
6. Use the **review** command to verify the implementation

Between each phase it is important to inspect the output from each phase and ensure that it is actually in alignment with what you want the project do be and the direction it is going. Errors in these files will cascade to the next phase and produce code that is not what you wanted.

In OpenCode, these commands are invoked with a slash: `/ticket`, `/research`, `/plan`, `/execute`, etc.
Most of these commands want the ticket in question that you want to review, exceptions are ticket itself, and commit/review. Ticket you give an actual prompt that describes what you're trying to do, and commit/review are meant to work in the context window that you ran execute in so that it has all of the details of how the process itself went.

## References

- [agentic-cli GitHub](https://github.com/Cluster444/agentic)
