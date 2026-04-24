# ErrorLens Code - Antigravity Clone

An AI-first desktop coding IDE built with React, TypeScript, Vite, and Electron.

## Features

- **Multi-panel Interface**: Sidebar explorer, Monaco editor, Terminal, and Problems panel.
- **AI-Powered Chat**: Integrated AI assistant that understands your code context.
- **Bug Fixing**: AI-driven error detection and one-click fixes.
- **Git Integration**: Full source control management within the IDE.
- **Support for Multiple AI Providers**:
  - OpenAI (GPT-4o, GPT-4 Turbo)
  - Anthropic (Claude 3.5 Sonnet, Opus)
  - Google Gemini (1.5 Pro, Flash)
  - Ollama (Local models)

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide React
- **Editor**: Monaco Editor (@monaco-editor/react)
- **State Management**: Zustand
- **AI Integration**: Custom clients for OpenAI, Anthropic, Gemini, and Ollama
- **Desktop Wrapper**: Electron
- **Database**: SQLite (via better-sqlite3)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run the web version:
```bash
npm run dev
```

Run the desktop (Electron) version:
```bash
npm run electron:dev
```

### Building

```bash
npm run build
```

## License

MIT
