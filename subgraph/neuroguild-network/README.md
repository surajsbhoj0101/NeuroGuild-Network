# NeuroGuild Subgraph

The Graph indexing package for NeuroGuild protocol state, governance activity, credential events, and job lifecycle data.

## Overview

The subgraph provides the read-optimized blockchain data layer for NeuroGuild Network. It listens to events emitted by the protocol contracts, maps them into queryable entities, and exposes a GraphQL interface that the backend and other consumers can use without scanning raw chain logs.

This package is responsible for converting on-chain activity into stable application read models for jobs, bids, disputes, users, governance proposals, votes, token balances, timelock operations, and protocol configuration.

## Responsibilities

- Index protocol events from deployed NeuroGuild contracts
- Maintain mutable read models for current protocol state
- Persist immutable history entities for auditable event trails
- Expose GraphQL-queryable entities for the backend and other services
- Support both local Graph Node deployments and Graph Studio workflows

## Indexed Contracts

The current subgraph tracks the following contracts on Base Sepolia:

- `UserRegistry`
- `JobContract`
- `ReputationSBT`
- `SkillSBT`
- `GovernanceToken`
- `GovernanceContract`
- `TimeLock`
- `CouncilRegistry`
- `Treasury`
- `Box`

Contract addresses and start blocks are defined in [`subgraph/neuroguild-network/networks.json`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/networks.json) and referenced by [`subgraph/neuroguild-network/subgraph.yaml`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/subgraph.yaml).

## Package Structure

```text
subgraph/neuroguild-network/
├── abis/
├── src/
├── schema.graphql
├── subgraph.yaml
├── networks.json
├── docker-compose.yml
└── package.json
```

- `abis/` contains contract ABIs used by the mappings.
- `src/` contains AssemblyScript handlers for each indexed contract.
- `schema.graphql` defines queryable entities and relationships.
- `subgraph.yaml` defines data sources, event handlers, and mapping entrypoints.
- `networks.json` stores network-specific contract addresses and start blocks.
- `docker-compose.yml` provisions local IPFS, Postgres, and Graph Node services.

## Mapping Modules

Each mapping file corresponds to a protocol contract:

- [`subgraph/neuroguild-network/src/user-registry.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/user-registry.ts)
- [`subgraph/neuroguild-network/src/job.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/job.ts)
- [`subgraph/neuroguild-network/src/reputation-sbt.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/reputation-sbt.ts)
- [`subgraph/neuroguild-network/src/skill-sbt.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/skill-sbt.ts)
- [`subgraph/neuroguild-network/src/governance-token.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/governance-token.ts)
- [`subgraph/neuroguild-network/src/governance-contract.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/governance-contract.ts)
- [`subgraph/neuroguild-network/src/timelock.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/timelock.ts)
- [`subgraph/neuroguild-network/src/council-registry.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/council-registry.ts)
- [`subgraph/neuroguild-network/src/treasury.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/treasury.ts)
- [`subgraph/neuroguild-network/src/box.ts`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/src/box.ts)

## Data Model

The schema is organized into two broad categories:

- mutable entities representing current protocol state
- immutable history entities representing append-only event records

Key mutable entities include:

- `ProtocolConfig`
- `User`
- `Job`
- `JobBid`
- `JobDispute`
- `Proposal`
- `TokenAccount`
- `GovernanceApproval`
- `SkillToken`
- `TimelockOperation`
- `TimelockRole`
- `TreasuryAccount`
- `BoxState`

These entities are defined in [`subgraph/neuroguild-network/schema.graphql`](/home/suraj/Documents/NeuroGuild-Network/subgraph/neuroguild-network/schema.graphql).

## Tooling

| Category | Technology |
| --- | --- |
| Indexer | The Graph |
| CLI | `@graphprotocol/graph-cli` |
| Mapping Runtime | AssemblyScript / `graph-ts` |
| Local Infra | Graph Node, Postgres, IPFS |
| Testing | Matchstick |

## Local Development

Install dependencies:

```bash
cd subgraph/neuroguild-network
npm install
```

Generate typed bindings:

```bash
npm run codegen
```

Build the subgraph:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Local Graph Node

Start local Graph infrastructure:

```bash
cd subgraph/neuroguild-network
docker compose up -d
```

This provisions:

- IPFS on `5001`
- Postgres on `5432`
- Graph Node endpoints on `8000`, `8001`, `8020`, `8030`, and `8040`

The current local Graph Node configuration expects an EVM RPC endpoint at `http://host.docker.internal:8545`.

## Deployment Workflow

Create the subgraph on local Graph Node:

```bash
npm run create-local
```

Deploy to local Graph Node:

```bash
npm run deploy-local
```

Deploy to Graph Studio:

```bash
npm run deploy
```

## Integration Notes

- The backend queries this subgraph to resolve indexed protocol state instead of traversing raw on-chain events.
- Contract ABIs and addresses must remain synchronized with the contracts package.
- When contracts are redeployed, update `networks.json` and `subgraph.yaml` data source configuration as needed before rebuilding and redeploying the subgraph.

## Related Documentation

- System architecture: [README.md](/home/suraj/Documents/NeuroGuild-Network/README.md)
- Frontend integration: [Frontend/README.md](/home/suraj/Documents/NeuroGuild-Network/Frontend/README.md)
- Backend integration: [Backend/README.md](/home/suraj/Documents/NeuroGuild-Network/Backend/README.md)
- Contract deployment: [Contracts/README.md](/home/suraj/Documents/NeuroGuild-Network/Contracts/README.md)
