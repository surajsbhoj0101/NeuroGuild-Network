# NeuroGuild Frontend

React application for wallet onboarding, job workflows, governance participation, reputation views, and realtime collaboration.

## Overview

The frontend is the primary user-facing surface of NeuroGuild Network. It connects wallets, manages authenticated application state, renders client and freelancer dashboards, and orchestrates interactions with both the backend API and deployed smart contracts.

This package is optimized for fast local iteration with Vite while remaining aligned with the protocol architecture defined in the root repository.

## Responsibilities

- Connect user wallets with RainbowKit, Wagmi, Viem, and Ethers
- Handle SIWE-based login flows against the backend
- Render role-specific experiences for clients and freelancers
- Surface governance proposals, voting workflows, and protocol views
- Display job lifecycle state, bids, disputes, and contract-linked details
- Maintain realtime messaging and notification UX via Socket.IO

## Application Structure

```text
Frontend/
├── src/
│   ├── abis/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── sockets/
│   └── utils/
├── public/
├── .env
├── contract.env
└── package.json
```

- `src/pages/` contains route-level views such as dashboards, job pages, governance, proposals, messaging, and public profiles.
- `src/components/` contains reusable UI and contract-related presentation components.
- `src/contexts/` contains app-wide providers for auth, sockets, notifications, theme, and token balances.
- `src/utils/` contains API clients and contract interaction helpers such as job posting, bidding, governance actions, and SBT flows.
- `src/abis/` contains generated contract ABIs used by the client.

## Routing

The application uses `react-router-dom` with route groups for:

- Public landing page
- Freelancer dashboard, profile, settings, and skill verification
- Client dashboard, profile, job posting, and job management
- Governance proposal browsing and proposal detail pages
- Messaging and contract detail views
- Public profile pages

## Runtime Dependencies

| Category | Technology |
| --- | --- |
| Framework | React 18, Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Wallets | RainbowKit, Wagmi, Viem, Ethers |
| Data Fetching | TanStack Query, Axios |
| Realtime | Socket.IO Client |
| Charts / UI | Chart.js, Lucide React, React Icons |

## Environment Variables

Create [`Frontend/.env`](/home/suraj/Documents/NeuroGuild-Network/Frontend/.env):

```env
VITE_API_URL=
VITE_CLIENT_ID=
VITE_RPC_URL=
```

Contract addresses are loaded from [`Frontend/contract.env`](/home/suraj/Documents/NeuroGuild-Network/Frontend/contract.env). This file is generated after contract deployment and includes both plain and `VITE_`-prefixed keys, for example:

```env
VITE_JOB_CONTRACT_ADDRESS=
VITE_USER_CONTRACT_ADDRESS=
VITE_REPUTATIONSBT_ADDRESS=
VITE_SKILLSBT_ADDRESS=
VITE_GOVERNANCETOKEN_ADDRESS=
VITE_GOVERCONTRACT_ADDRESS=
VITE_TIMELOCK_ADDRESS=
VITE_COUNCILREGISTRY_ADDRESS=
VITE_TREASURY_ADDRESS=
VITE_BOX_ADDRESS=
VITE_USDC_ADDRESS=
```

## Local Development

Install dependencies:

```bash
cd Frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Lint the codebase:

```bash
npm run lint
```

## Backend Integration

The frontend expects the backend API to be reachable at `VITE_API_URL` and uses cookie-based authentication after SIWE verification. Most product flows depend on the backend being available for:

- nonce generation and SIWE verification
- profile bootstrap and session checks
- job metadata retrieval and AI-assisted scoring
- messaging and notifications
- governance proposal reads

## Contract Integration

Contract interactions are encapsulated in [`Frontend/src/utils/`](/home/suraj/Documents/NeuroGuild-Network/Frontend/src/utils). These helpers cover:

- user creation and registration flows
- job posting and bid submission
- bid acceptance and work completion
- governance proposal creation and voting
- delegation and token balance reads
- skill SBT minting and reputation queries

## Notes

- The app assumes a local frontend origin of `http://localhost:5173` in the current backend CORS configuration.
- Contract address sync is handled by the contracts package after deployment.
- For system-wide architecture and request flow, see the root [README.md](/home/suraj/Documents/NeuroGuild-Network/README.md).
