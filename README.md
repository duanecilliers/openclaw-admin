# OpenClaw Admin

Web-based admin dashboard for managing an [OpenClaw](https://github.com/openclaw/openclaw) instance. Built for local, single-user use.

## Features

- **Agent Management** — View and edit Discord persona bots with live avatars from Discord API. Edit system prompts per agent with restart-on-save flow.
- **Workspace Files** — Edit shared workspace files (SOUL.md, USER.md, AGENTS.md, MEMORY.md, TOOLS.md) with CodeMirror 6 and syntax highlighting.
- **Skills Browser** — Read-only inventory of installed skills, grouped by category.
- **Cron Jobs** — View, create, toggle, trigger, and delete scheduled jobs. Supports cron expressions, intervals, system events, and agent turns.
- **Channel Routing** — Visualize per-account bot → channel routing for Discord's multi-account architecture.
- **Config Viewer** — Read-only JSON view of the full OpenClaw config (sensitive fields masked).
- **Gateway Controls** — Live status, restart button, connection monitoring.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev servers (frontend :5180 + API :5181)
npm run dev
```

The frontend proxies `/api` requests to the backend. Both servers hot-reload on file changes.

Open [http://localhost:5180](http://localhost:5180) to access the dashboard.

## Requirements

- Node.js 20+
- [OpenClaw](https://github.com/openclaw/openclaw) installed and configured at `~/.openclaw/openclaw.json`
- One or more Discord bot accounts configured in OpenClaw (see below)

## Discord Bot Setup

OpenClaw Admin reads your bot configuration from `~/.openclaw/openclaw.json`. The dashboard works best with OpenClaw's **multi-account Discord architecture**, where each persona bot has its own account, channels, and system prompt.

### Creating Discord Bot Accounts

For each persona you want, create a bot application at the [Discord Developer Portal](https://discord.com/developers/applications):

1. **New Application** → give it a name (e.g. "Coach", "Analyst", "Writer")
2. Go to **Bot** → click **Reset Token** → copy the token
3. Enable **Message Content Intent** under Privileged Gateway Intents
4. Go to **OAuth2** → **URL Generator** → select `bot` scope → select permissions: `Send Messages`, `Read Message History`, `Add Reactions`
5. Use the generated URL to invite the bot to your Discord server
6. Repeat for each persona

### OpenClaw Config Structure

Each bot account goes in `channels.discord.accounts`. The **default** account is your primary bot. Additional accounts are persona bots, each with their own `guilds` config that defines which channels they respond in:

```jsonc
{
  "channels": {
    "discord": {
      "enabled": true,
      "accounts": {
        "default": {
          "name": "Assistant",
          "token": "your-primary-bot-token"
        },
        "coach": {
          "name": "Coach",
          "token": "coach-bot-token",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": {
                "CHANNEL_ID": {
                  "allow": true,
                  "systemPrompt": "You are a fitness coach. Motivate, track workouts, and push for consistency."
                }
              }
            }
          }
        },
        "writer": {
          "name": "Writer",
          "token": "writer-bot-token",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": {
                "CHANNEL_ID": {
                  "allow": true,
                  "systemPrompt": "You are a creative writing assistant. Help with drafts, editing, and storytelling."
                }
              }
            }
          }
        }
      },
      "guilds": {
        "YOUR_GUILD_ID": {
          "requireMention": false,
          "users": ["YOUR_DISCORD_USER_ID"],
          "channels": {
            "*": {
              "allow": true,
              "systemPrompt": "You are a helpful assistant."
            }
          }
        }
      }
    }
  }
}
```

> **Key points:**
> - The **default** account uses the top-level `guilds` config (with `*` wildcard for all channels)
> - Each **persona** account has its own `guilds` config scoped to specific channels
> - System prompts are per-channel — this is where you define each bot's personality
> - The admin dashboard lets you edit these prompts visually and shows the full routing table

### Finding Your IDs

- **Guild ID**: Right-click your server name → Copy Server ID (enable Developer Mode in Discord settings)
- **Channel ID**: Right-click a channel → Copy Channel ID
- **User ID**: Right-click your username → Copy User ID

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Editor | CodeMirror 6 |
| Data | TanStack Query |
| Backend | Hono.js (Node) |
| Config | Direct read/write to `~/.openclaw/openclaw.json` |

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

## License

MIT
