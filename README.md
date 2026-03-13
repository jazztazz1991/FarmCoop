# FarmCoop

A full-stack cooperative economy platform for Farming Simulator 25 communities. Players manage wallets, trade on a marketplace, take out loans, purchase insurance, run production chains, and compete on leaderboards — all synced with the game via a mod bridge.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Discord OAuth 2.0 |
| Styling | Tailwind CSS |
| Testing | Vitest · React Testing Library · Playwright |
| Deployment | Docker · Render |
| CI | GitHub Actions |

## Features

- **Wallet & Ledger** — deposit, withdraw, and transfer funds with a full transaction history
- **Marketplace** — list items for sale, browse, and purchase with automatic settlement
- **Contracts** — create and fulfill delivery contracts with deadlines and payouts
- **Banking** — savings accounts, loans with interest accrual, and certificates of deposit
- **Insurance** — crop, vehicle, and liability policies with premium calculation and claims
- **Production Chains** — build factories, run multi-stage recipes, and collect output
- **Dynamic Pricing** — server-scoped commodity prices with history tracking
- **Farm Management** — claim and manage farm plots per game server
- **Leaderboard** — ranked player standings
- **Notifications** — in-app alerts for trades, payments, claims, and production events
- **FS25 Bridge** — background service that syncs game state via local files or FTP

## Architecture

```text
src/
├── app/              # Next.js App Router (pages + API routes)
├── domain/           # Business logic (15 domains, DDD-style)
│   ├── auth/         ├── banking/       ├── contract/
│   ├── event/        ├── farm/          ├── insurance/
│   ├── leaderboard/  ├── marketplace/   ├── notification/
│   ├── pricing/      ├── production/    ├── server/
│   ├── transaction/  ├── user/          └── wallet/
├── components/       # Presentational React components
├── lib/              # Shared utilities (Prisma client, auth helpers)
└── styles/           # Global CSS
bridge/               # FS25 game sync service (local or FTP transport)
prisma/               # Schema (22 models) + migrations + seed
```

Each domain follows a consistent pattern: `model → validator → repository → service`.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- A [Discord application](https://discord.com/developers/applications) with OAuth2 redirect URI set to `http://localhost:3000/api/auth/discord/callback`

### Setup

```bash
# Clone and install
git clone https://github.com/your-username/FarmCoop.git
cd FarmCoop
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and Discord credentials

# Set up database
npx prisma migrate deploy
npx prisma db seed

# Start development server
npm run dev
```

The app runs at `http://localhost:3000`.

### Docker

```bash
# Production
docker compose up -d

# Development (with hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Bridge Service

The bridge syncs game data between FS25 and the web app:

```bash
# Local transport (reads from FS25 mod settings folder)
BRIDGE_TRANSPORT=local npm run bridge

# FTP transport (reads from a remote dedicated server)
BRIDGE_TRANSPORT=ftp npm run bridge
```

## Testing

```bash
npm test              # Unit tests (Vitest)
npm run test:ui       # Component tests (RTL)
npm run test:all      # All unit + component tests
npm run test:e2e      # End-to-end tests (Playwright)
```

**Coverage:** 39 test suites · 320+ unit/RTL tests · 13 E2E specs

## Deployment

### Render (recommended)

This repo includes a `render.yaml` blueprint. Connect the repo to Render and it will auto-provision:

- **Web Service** — the Next.js app (Docker)
- **Background Worker** — the bridge service
- **PostgreSQL** — managed database

### Manual Docker

```bash
docker compose up -d --build
```

The Dockerfile uses a multi-stage build (deps → build → slim Alpine runner) and runs Prisma migrations on startup.

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DISCORD_CLIENT_ID` | Yes | Discord OAuth app ID |
| `DISCORD_CLIENT_SECRET` | Yes | Discord OAuth app secret |
| `API_KEY` | Yes | Internal API key for bridge auth |
| `BRIDGE_TRANSPORT` | No | `local` (default) or `ftp` |

## API

61 API routes under `/api/`, organized by domain. All endpoints require authentication (session cookie or API key). Responses use minimal DTOs — no raw database objects are exposed.

## License

MIT
