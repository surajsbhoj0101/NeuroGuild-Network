# 🧠 NeuroGuild Network

> ⚠️ Work in Progress  
> This README reflects the **current state** of the project and will evolve as development progresses.

**NeuroGuild Network** is an experimental Web3 protocol exploring **decentralized hiring and reputation**, where trust is built from **verifiable actions** instead of resumes or centralized profiles.

This project is under active development and is **not production-ready**.

---

## What Problem This Explores

Traditional hiring systems rely on:
- Self-claimed resumes
- Centralized reputation platforms
- Opaque trust signals

NeuroGuild explores a different idea:

> **Reputation should emerge from on-chain actions, not claims.**

---

## 🚧 Current Status

- Core smart contracts: ✅ functional
- Wallet authentication flow: ✅ implemented
- Job posting & interaction logic: ✅ working
- Subgraph indexing: ✅ live
- Reputation model: ✅ 
- UI/UX polish: 🚧 ongoing
- Governance & DAO logic(Votes with token and Repuation points): ✅ implemented
- DAO-based dispute resolution: ✅ implemented
- Contracts Testing(with more than 60% coverage) and Deployment: ✅ implemented
- Skill Test Mechanism: 🚧 ongoing

---

## What Exists Right Now

### 🔐 Authentication
- Wallet-based login (SIWE-style)
- JWT-based backend sessions
- No email/password system

### 👥 Roles
- Client & Freelancer roles
- Council Members Chosen by dao with Voting
- Role assignment on first login to Clients and Freelancers
- Basic access control

### 📄 Job System
- Jobs created via smart contracts
- Job metadata stored on IPFS
- On-chain references with off-chain flexibility

### 🤝 Interactions
- Freelancer bidding
- Job interaction tracking
- Contract events emitted & indexed

### 📊 Indexing
- Subgraph indexing for:
  - Jobs
  - Bids
  - Interaction events

### 🧠 Reputation (Experimental)
- Early reputation logic based on:
  - Participation
  - Interaction history
  - Job Completion
- AI-assisted scoring experiments (non-final)

---

## 🏗️ Tech Stack

**Blockchain**
- Solidity
- Foundry
- Ethereum-compatible networks

**Backend**
- Node.js
- Express
- MongoDB
- JWT authentication

**Indexing**
- The Graph (Subgraph)

**Frontend**
- React
- Tailwind CSS
- Wagmi + Ethers

**Storage**
- IPFS

---

## 🧪 What This Project Is / Isn’t

### ✅ This project *is*:
- A serious learning & research project
- A real smart-contract + subgraph system
- Focused on protocol-level thinking

### ❌ This project is *not*:
- Production-ready
- Feature-complete
- A commercial platform (yet)

---

## 🛣️ Planned Exploration (Subject to Change)

- Stabilized on-chain reputation primitives
- Skill verification flows
- SBT-based credentials
- Zero-knowledge reputation proofs
- Anti-sybil mechanisms

---

## 🤝 Contributions & Feedback

This is currently a **solo-built project**, but feedback is welcome:
- Architecture discussions
- Security reviews
- Reputation model critiques

Feel free to open issues or discussions.

---

## 📜 Disclaimer

This repository is for **educational and experimental purposes only**.  
Do not deploy with real funds or use for real hiring decisions.
