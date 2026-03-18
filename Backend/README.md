# NeuroGuild Backend

Express API and realtime service layer for authentication, profiles, jobs, messaging, notifications, governance queries, and protocol integrations.

## Overview

The backend is the coordination layer between the frontend, indexed on-chain data, application persistence, and external services. It validates sessions, serves REST endpoints, handles WebSocket connections, persists off-chain state in MongoDB, and bridges product flows to IPFS, The Graph, AI services, and deployed contracts.

## Responsibilities

- Verify wallet-based sign-in using SIWE-compatible message flow
- Issue and validate JWT-backed application sessions
- Bootstrap client and freelancer profiles from on-chain or local state
- Expose job, bid, governance, messaging, and notification APIs
- Serve realtime events through Socket.IO
- Query indexed contract state from the subgraph
- Upload and resolve protocol metadata through Pinata / IPFS
- Run AI-assisted job enhancement and scoring workflows

## Service Layout

```text
Backend/
├── abis/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── sockets/
├── .env
├── contract.env
└── server.js
```

- `controllers/` contains route handlers for auth, jobs, governance, users, conversations, and notifications.
- `routes/` defines the public API surface.
- `models/` contains MongoDB models for users, clients, freelancers, jobs, messages, and notifications.
- `services/` encapsulates subgraph access, token metadata generation, Pinata uploads, skill mint flows, and contract read helpers.
- `middleware/` contains HTTP and Socket.IO authentication guards.
- `sockets/` manages connection registration and event dispatch.
- `abis/` contains contract ABIs used by backend services.

## API Domains

The API is grouped into the following domains:

- `auth`: SIWE, JWT session checks, profile bootstrap, GitHub OAuth, public profiles
- `client`: client profile retrieval and updates
- `freelancer`: profile management, quizzes, skill mint checks, and SBT-related flows
- `jobs`: job discovery, AI enhancement, IPFS metadata, bids, snapshots, and role-based job views
- `governance`: proposal listings and proposal detail lookups
- `conversations`: message threads, history, seen state, and send actions
- `notifications`: notification feed and read state management

## Runtime Dependencies

| Category | Technology |
| --- | --- |
| API | Node.js, Express |
| Auth | SIWE, JWT, cookies |
| Database | MongoDB, Mongoose |
| Cache / Runtime | Redis, ioredis |
| Realtime | Socket.IO |
| Blockchain | Ethers |
| Indexing | GraphQL Request, The Graph |
| Storage | Pinata / IPFS |
| AI | Google GenAI |

## Environment Variables

Create [`Backend/.env`](/home/suraj/Documents/NeuroGuild-Network/Backend/.env):

```env
MONGODB_URI=
RPC_URL=
PRIVATE_KEY=
AI_API_KEY=
SUBGRAPH_API_KEY=
SUBGRAPH_ID=
SUBGRAPH_URL=
IPFS_GATEWAY_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
DOMAIN=
FRONTEND_URL=
FRONTEND_REDIRECT_URL=
COOKIE_SECURE=
COOKIE_SAME_SITE=
COOKIE_DOMAIN=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
PINATA_JWT=
REDIS_HOST=
REDIS_PORT=
```

Contract addresses are loaded from [`Backend/contract.env`](/home/suraj/Documents/NeuroGuild-Network/Backend/contract.env), including values such as:

```env
USER_CONTRACT_ADDRESS=
JOB_CONTRACT_ADDRESS=
REPUTATIONSBT_ADDRESS=
SKILLSBT_ADDRESS=
GOVERNANCETOKEN_ADDRESS=
GOVERCONTRACT_ADDRESS=
TIMELOCK_ADDRESS=
COUNCILREGISTRY_ADDRESS=
TREASURY_ADDRESS=
BOX_ADDRESS=
USDC_ADDRESS=
```

## Local Development

Install dependencies:

```bash
cd Backend
npm install
```

Run the API in development mode:

```bash
npm run dev
```

The service listens on `http://localhost:5000` and currently allows frontend requests from `http://localhost:5173`.

## Local Infrastructure

The root Docker Compose file provisions the backend runtime dependencies:

```bash
docker compose up -d
```

This starts:

- MongoDB
- Redis
- the backend container

See [`docker-compose.yml`](/home/suraj/Documents/NeuroGuild-Network/docker-compose.yml) for the current local topology.

## Realtime Layer

Socket.IO is initialized in [`Backend/server.js`](/home/suraj/Documents/NeuroGuild-Network/Backend/server.js) and authenticated through [`Backend/middleware/authSocket.middleware.js`](/home/suraj/Documents/NeuroGuild-Network/Backend/middleware/authSocket.middleware.js). On connection, users are joined to a personal room keyed by their authenticated user ID, allowing targeted notification and messaging delivery.

## External Integrations

- The Graph for indexed reads via subgraph queries
- Pinata / IPFS for metadata upload and retrieval
- Google GenAI for job enrichment and scoring
- GitHub OAuth for linked account flows
- Base Sepolia RPC for contract reads and write-assisted backend services

## Operational Notes

- Session auth is cookie-based after successful SIWE verification.
- Some backend flows depend on synchronized contract addresses generated by the contracts package.
- MongoDB stores application records; on-chain state remains the protocol source of truth for critical job and governance events.
- For system-level architecture, see the root [README.md](/home/suraj/Documents/NeuroGuild-Network/README.md).
