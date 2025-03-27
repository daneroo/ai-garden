# Mastra 101

## Setup

```bash
pnpm create mastra@latest
```

## Architecture

Mastra provides a development environment for building and testing AI agents. The architecture consists of several layers:

1. **Mastra Dev UI** (`mastra dev`):
   - Provides a generic, interactive interface
   - Acts as a frontend to communicate with all registered agents
   - Uses the OpenAPI/Swagger specification to understand what agents and tools are available

2. **API Layer**:
   - Exposes all registered agents through OpenAPI/Swagger
   - Provides a standardized way to interact with agents
   - Makes the interface consistent regardless of what agents or tools are registered

3. **Agents Layer**:
   - Each agent (like our `weatherAgent`) is registered with Mastra
   - Agents have access to specific tools they can use
   - Agents handle the logic of when and how to use their tools

4. **Tools Layer**:
   - Tools (like our `weatherTool`) are the actual implementations that can perform actions
   - Tools are exposed to agents that need them
   - Tools provide specific functionality (like fetching weather data)

The flow of interaction is:
```
User → Mastra Dev UI → OpenAPI/Swagger → Registered Agents → Tools
```

This architecture makes it easy to:
- Add new agents
- Add new tools
- Modify existing agents or tools
- All while maintaining a consistent interface through the Mastra Dev UI
