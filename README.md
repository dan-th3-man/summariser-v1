# Discord Chat Analyzer

A TypeScript-based service that analyzes Discord chat history from Supabase and generates comprehensive summaries using OpenAI's GPT-4.

## Features

- **Smart Message Analysis**: Processes Discord chat history and generates structured analysis including:

  - Concise technical discussion summaries
  - FAQ compilation from discussions
  - Help interaction tracking with point rewards
  - Action item extraction

- **Efficient Processing**:

  - Chunks messages for optimal processing
  - Uses GPT-4 for analysis
  - Progress tracking with detailed console output
  - Error handling and recovery

- **Structured Output**:
  - JSON formatted analysis
  - Point-based help interaction tracking
  - Categorized action items
  - FAQ compilation

## Prerequisites

- Node.js 18+
- Supabase project with Discord messages
- OpenAI API key
- Required environment variables:
  ```env
  SUPABASE_URL=your_supabase_url
  SUPABASE_KEY=your_supabase_key
  OPENAI_API_KEY=your_openai_key
  ```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

## Usage

Basic usage:

```bash
# Get messages from a channel
pnpm messages [serverId] [channelId] [days]

# Analyze messages
pnpm analyze [serverId] [channelId] [days]
```

Arguments:

- `serverId`: Discord server ID (optional, defaults to configured ID)
- `channelId`: Discord channel ID (optional, analyzes all channels if omitted)
- `days`: Number of days to analyze (optional, defaults to 7)

## Output Format

The script generates a structured JSON output containing:

1. **Summary**: Focused technical discussion overview
2. **FAQ**: Important questions and answers from the chat
3. **Help Interactions**: Community support tracking with point rewards:
   - 50-100 points: Direct problem solving
   - 30-80 points: Detailed explanations
   - 10-30 points: Quick answers
   - 5-10 points: Future help promises
4. **Action Items**: Categorized into:
   - Technical Tasks
   - Documentation Needs
   - Feature Requests

## Customization

You can modify the analysis behavior by adjusting:

- Model settings in `AnalyzerService`
- Chunk size in `analyzeChat`
- Analysis structure in `formatPrompt`
- Output formatting in `mergeAnalyses`

## Error Handling

The service includes:

- Graceful error recovery
- Progress tracking
- Chunk processing error handling
- Invalid response structure handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
# summariser-v1
