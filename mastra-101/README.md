# Mastra 101

## TODO

- Mastra Memory - Use cases
- Vector Upsert - not working
- parse Gutenber (general) - multiple works
- parse ePub

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

```txt
User → Mastra Dev UI → OpenAPI/Swagger → Registered Agents → Tools
```

This architecture makes it easy to:

- Add new agents
- Add new tools
- Modify existing agents or tools
- All while maintaining a consistent interface through the Mastra Dev UI

## Add RAG

Well, we need to build it step by step.
You must confirm with me at every step.

- [RAG Guide](https://mastra.ai/docs/guides/04-research-assistant#understanding-rag-components)
- [Semantically Chunking HTML](https://mastra.ai/examples/rag/chunking/chunk-html)
- [LibSQL Vector Store](https://mastra.ai/docs/reference/rag/libsql)
- [Chroma Vector Store](https://mastra.ai/docs/reference/rag/chroma)

Differences with example:

- we will use import { LibSQLVector } from "@mastra/core/vector/libsql"; because chromadb does not seem to be a thing
- we will use local ollama embeddings: ollama:mxbai-embed-large
- we will be processing a single html source (aristotle Niciomachean Ethics, which will be split with custom code into Books/Chapters
  - <https://www.gutenberg.org/files/8438/8438-h/8438-h.htm>

If I understand correctly, we need to build the agent and the store:

- agent will go into src/mastra/agents/rag.ts (and be exported from src/mastra/agents/index.ts
- store can be built and run independantly (we will do this first
  - it will live in src/store.ts
  - it will be invoked (according to the guide) with:
    - `npx tsx src/store.ts`

### Dependencies

```bash
pnpm add @mastra/rag ai
```

### Store

Invoke Create and Store Embeddings with:

```bash
npx tsx src/store.ts
```

- vector store is created in `./data/vector.db`

```bash
sqlite3 data/libsql/vector.db ".tables"
sqlite3 data/libsql/vector.db ".schema"
sqlite3 data/libsql/vector.db "SELECT COUNT(*) FROM ethics;"
```

### Book structure

```html
<div class="chapter">

<h2><a name="chap00"></a>ARISTOTLE&rsquo;S ETHICS</h2>

</div><!--end chapter-->

<div class="chapter">

<h2><a name="chap01"></a>BOOK I</h2>

<h3>Chapter I.</h3>

<p>
Every art, and every science reduced to a teachable form, and in like manner
every action and moral choice, aims, it is thought, at some good: for which
reason a common and by no means a bad description of the Chief Good is,
&ldquo;that which all things aim at.&rdquo;
</p>
```

### Chunking Behavior

When using Mastra's HTML chunking with different header/section combinations:

1. Using `headers: [["h2", "Book"]]`:
   - Works perfectly for capturing book-level content
   - Each chunk contains the book title as metadata and its content
   - Works independently

2. Using `sections: [["h3", "Chapter"]]`:
   - Correctly identifies all chapter markers
   - But fails to capture content (empty chunks)
   - Works independently

3. Using `headers: [["h3", "Chapter"]]`:
   - Works for capturing chapter-level content
   - But fails to capture the higher Book level context
   - Works independently

This behavior is likely useful for other Gutenberg-published works that follow a similar structure with hierarchical headers (h2, h3) for books and chapters.
