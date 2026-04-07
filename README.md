# RepoLense

RepoLense is an AI-powered repository intelligence tool that clones a GitHub repository, scans its source files, detects the tech stack, and generates an architecture summary plus Mermaid diagrams using a local LLM.

## What it does

- Clones or pulls a public GitHub repository
- Scans the repo file tree and detects languages
- Reads package metadata and identifies the tech stack
- Uses a local Ollama model to generate:
  - project summary
  - architecture overview
  - class/ER diagrams as Mermaid charts
- Streams progress updates to the React frontend via SSE

## Project structure

- `backend/`
  - `server.js` — Express backend and SSE analysis endpoint
  - `aiUnderstandRepo.js` — generates project understanding using Ollama
  - `aiGenerateDiagrams.js` — generates Mermaid diagrams using Ollama
  - `repoUtils.js` — repo scanning, language detection, README extraction, dependency parsing
  - `repoFilter.js` — important file filtering logic
  - `cache/` — cached analysis results
  - `repos/` — cloned GitHub repositories
- `frontend/`
  - `src/` — React application source
  - `App.jsx` — main UI for repo URL input, progress, and results
  - `main.jsx` — app bootstrap
  - `index.css`, `App.css` — styling and visual design

## Prerequisites

- Node.js installed (Node 18+ recommended)
- `git` CLI installed and available in PATH
- Local Ollama running on `http://localhost:11434`
- The `llama3:8b` model available in Ollama

## Setup

### Backend

1. Open a terminal in `backend/`
2. Install dependencies:

```bash
cd backend
npm install
```

### Frontend

1. Open a terminal in `frontend/`
2. Install dependencies:

```bash
cd frontend
npm install
```

## Running the app

### Start the backend

```bash
cd backend
node server.js
```

The backend listens on port `5000` and exposes the SSE endpoint:

- `GET /analyze-repo-stream?url=<repo-url>&refresh=true`

### Start the frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## Using RepoLense

1. Run the backend server.
2. Run the frontend app.
3. Open the frontend in the browser.
4. Paste a public GitHub repository URL in the input box.
5. Click `ANALYZE →`.

The UI will present:

- clone and scan progress
- detected file count, languages, and tech stack
- AI-generated project summary and architecture
- Mermaid diagrams rendered in the browser

## Notes

- Analysis results are cached in `backend/cache/`.
- Repositories are cloned into `backend/repos/`.
- To force a fresh analysis, use the `refresh=true` query parameter on the SSE endpoint.
- If the backend reports "Connection to server lost", verify that the server is running and reachable at `http://localhost:5000`.

## Limitations

- Only public GitHub repositories are supported by default.
- The app relies on a local Ollama instance; without it, AI understanding and diagram generation will fallback or fail.

## License

This repository does not include a license file.
