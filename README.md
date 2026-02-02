# OpenClaw Admin

Web-based admin dashboard for managing an [OpenClaw](https://github.com/openclaw/openclaw) instance. Built for local, single-user use.

![Agents view](reference-ui.png)

## Features

- **Agent Management** — View and edit Discord persona bots with live avatars from Discord API. Edit system prompts per agent with restart-on-save flow.
- **Workspace Files** — Edit shared workspace files (SOUL.md, USER.md, AGENTS.md, MEMORY.md, TOOLS.md) with CodeMirror 6 and syntax highlighting.
- **Skills Browser** — Read-only inventory of installed skills, grouped by category.
- **Cron Jobs** — View, create, toggle, trigger, and delete scheduled jobs. Supports cron expressions, intervals, system events, and agent turns.
- **Channel Routing** — Visualize per-account bot → channel routing for Discord's multi-account architecture.
- **Config Viewer** — Read-only JSON view of the full OpenClaw config.
- **Gateway Controls** — Live status, restart button, connection monitoring.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Editor | CodeMirror 6 |
| Data | TanStack Query |
| Backend | Hono.js (Node) |
| Config | Direct read/write to `~/.openclaw/openclaw.json` |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev servers (frontend :5180 + API :5181)
npm run dev
```

The frontend proxies `/api` requests to the backend. Both servers hot-reload on file changes.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and API servers |
| `npm run dev:fe` | Frontend only (port 5180) |
| `npm run dev:api` | API only (port 5181) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Architecture

```
src/                    # React frontend
├── components/         # UI components (agents, channels, cron, editor, etc.)
├── hooks/              # TanStack Query hooks
├── lib/                # API client, utilities
├── pages/              # Tab page components
└── main.tsx

server/                 # Hono.js backend
├── routes/             # API route handlers
├── lib/                # Config, cron, agents, gateway helpers
└── index.ts
```

### Key Design Decisions

- **Agents = Discord bot accounts** — Maps to `channels.discord.accounts` in the OpenClaw config. Each persona bot has its own guilds config defining which channels it responds in.
- **Atomic config writes** — All config mutations write to a temp file, backup the current config, then atomic rename. 10 timestamped backups kept in `~/.openclaw/backups/`.
- **Discord API caching** — Bot avatars and guild channel names fetched from Discord API, cached in memory for 30 minutes.
- **No auth** — Local-only tool, no authentication layer.

## Requirements

- Node.js 20+
- OpenClaw installed and configured at `~/.openclaw/openclaw.json`
- Discord bot tokens in the OpenClaw config (for avatar/channel resolution)

## License

Private — not yet licensed for distribution.
