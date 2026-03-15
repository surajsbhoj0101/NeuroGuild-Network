# NeuroGuild Contracts

Foundry workspace for the NeuroGuild protocol contracts, governance modules, credential primitives, and deployment scripts.

## Overview

The contracts package is the protocol core of NeuroGuild Network. It defines user registration, job escrow and lifecycle management, reputation and skill credentials, governance execution, council membership, and treasury-controlled operations.

Deployments currently target an EVM-compatible network with Base Sepolia configured through Foundry RPC aliases.

## Contract Inventory

```text
Contracts/src/
├── dao/
├── escrow/
├── jobs/
├── sbt/
├── test_token/
└── user/
```

### Core Modules

- `src/user/UserRegistry.sol`: protocol-level user registration and role assignment
- `src/jobs/JobContract.sol`: job creation, bidding, acceptance, work submission, settlement, ratings, and disputes
- `src/sbt/ReputationSBT.sol`: non-transferable reputation state derived from protocol participation
- `src/sbt/SkillSBT.sol`: non-transferable skill credentials linked to council validation
- `src/dao/GovernanceToken.sol`: governance token used for voting and delegation
- `src/dao/governance_standard/GovernerContract.sol`: governor contract for proposal lifecycle management
- `src/dao/governance_standard/TimeLock.sol`: timelock controller for delayed execution and privileged administration
- `src/dao/CouncilRegistry.sol`: registry of council members and governance-linked authority
- `src/dao/Treasury.sol`: treasury-controlled custody and protocol fee handling
- `src/dao/Box.sol`: governance execution target used in proposal flows
- `src/test_token/ERC20Usdc.sol`: local and test deployment ERC-20 token

## Deployment Architecture

The deployment pipeline is centered around [`Contracts/script/DeploymentScript.sol`](/home/suraj/Documents/NeuroGuild-Network/Contracts/script/DeploymentScript.sol) and [`Contracts/script/DeployHelper.sol`](/home/suraj/Documents/NeuroGuild-Network/Contracts/script/DeployHelper.sol).

The deployer script provisions:

1. Test USDC
2. Governance token
3. Timelock
4. Reputation SBT
5. Governor
6. Council registry
7. Skill SBT
8. User registry
9. Treasury
10. Job contract
11. Box

After deployment, [`Contracts/script/postDeploy.js`](/home/suraj/Documents/NeuroGuild-Network/Contracts/script/postDeploy.js) extracts contract addresses from Foundry broadcast artifacts and writes synchronized `contract.env` files for the frontend, backend, and subgraph packages.

## Tooling

| Category | Technology |
| --- | --- |
| Build / Test | Foundry (`forge`) |
| Scripting | Foundry scripts + Node.js post-deploy sync |
| Language | Solidity `0.8.28` |
| Network Config | `foundry.toml` with `baseSepolia` RPC alias |

## Configuration

Create [`Contracts/.env`](/home/suraj/Documents/NeuroGuild-Network/Contracts/.env):

```env
PRIVATE_KEY=
RPC_URL=
REVIEW_PERIOD_DAYS=
REP_REWARD=
REP_PENALTY=
MIN_DELAY_SECONDS=
```

The current Foundry config lives in [`Contracts/foundry.toml`](/home/suraj/Documents/NeuroGuild-Network/Contracts/foundry.toml).

## Development Commands

Install package dependencies:

```bash
cd Contracts
npm install
```

Build contracts:

```bash
forge build
```

Run tests:

```bash
forge test
```

Deploy contracts and propagate addresses:

```bash
npm run deploy
```

Only refresh generated contract environment files:

```bash
npm run postDeploy
```

## Testing

The main Foundry test suite is located at [`Contracts/test/Tests.t.sol`](/home/suraj/Documents/NeuroGuild-Network/Contracts/test/Tests.t.sol). It covers protocol-critical flows such as:

- user registration
- blocked-user enforcement
- job creation constraints
- bid submission, rejection, and acceptance
- work submission and acceptance
- treasury fee behavior
- rating and reputation updates
- timelock-controlled parameter changes

## Deployment Notes

- `npm run deploy` uses the `baseSepolia` RPC alias configured in `foundry.toml`.
- Deployment output is written under `Contracts/broadcast/`.
- Address propagation is automated; downstream packages should not require manual ABI or address edits after a successful deployment.
- Treat `PRIVATE_KEY` and deployment artifacts as sensitive operational data.

## Related Documentation

- System architecture: [README.md](/home/suraj/Documents/NeuroGuild-Network/README.md)
- Frontend integration: [Frontend/README.md](/home/suraj/Documents/NeuroGuild-Network/Frontend/README.md)
- Backend integration: [Backend/README.md](/home/suraj/Documents/NeuroGuild-Network/Backend/README.md)
