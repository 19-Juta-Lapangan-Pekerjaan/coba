# Gelap

Introducing Gelap, a confidential RWA Dark Pool and private execution layer built on the Mantle ecosystem. Gelap leverages a hybrid architecture combining Trusted Execution Environments (TEE) for real-time private matching with SP1 zkVM for verifiable correctness. This design allows users to utilize shielded vaults for depositing collateral, execute private swaps with zero MEV, and trade Real-World Assets (RWAs) like T-bills and private credit without exposing their positions or strategies on-chain. Gelap ensures market integrity by eliminating front-running and providing a compliance-ready infrastructure where institutional privacy meets decentralized settlement.

## Why Built on Mantle?

- **Modular Architecture for Privacy:** Mantle’s modular design provides the high-performance, low-cost data availability required to process heavy cryptographic proofs (SP1 zkVM) and TEE execution traces without checking scalability.

- **Native RWA & Yield Alignment:** Mantle is a hub for yield-bearing assets (mETH) and RWAs (USDY). Gelap is built here to serve as the necessary privacy layer for these assets, allowing them to be traded securely and confidentially.

- **Institutional-Grade Reliability:** Leveraging Mantle’s robust finality and security inherited from Ethereum, Gelap can offer the secure settlement assurances required for high-value institutional trades.

## Why Mantle is Ideal for Gelap

- Solving the Institutional Privacy Gap: Institutions cannot trade RWAs on-chain if their net asset values (NAV) and order flows are visible. Mantle’s RWA-heavy ecosystem is the perfect environment for Gelap’s Dark Pool, which unlocks institutional capital by protecting trade secrecy.
- Synergy with Native Yield: Gelap complements Mantle’s economy by allowing users to hold and trade yield-bearing assets (like mETH) within a shielded pool. This ensures users maintain their privacy without forfeiting the native yield that makes Mantle unique.
- The Zero-MEV Trading Experience: In an ecosystem focused on efficiency, Gelap offers Mantle users a "Dark Pool" experience where sandwich attacks and MEV are impossible, creating the fairest execution environment on the network.
- First-Mover Advantage: As the first verifiable Confidential Dark Pool on Mantle, Gelap establishes itself as critical infrastructure, capturing early liquidity from privacy-conscious whales and institutions entering the ecosystem.

## Problem

- **Dark Forest Risks:** On-chain trading exposes order flow to MEV bots (sandwich attacks, front-running).
- **Institutional Friction:** Institutions cannot trade RWAs (like T-Bills or Private Credit) on public chains because exposing their positions ruins their competitive advantage.
- **Liquidity Fragmentation:** Existing privacy solutions are often slow or lack support for complex assets like RWAs.

## Solution

- **Dark Pool Execution:** Orders are matched inside a TEE (Enclave), keeping them invisible to the public until settled.
- **Verifiable Privacy:** We use SP1 zkVM to generate zero-knowledge proofs confirming that the TEE acted honestly, without revealing the trade data.
- **Shielded Assets:** Users trade with "shielded balances," ensuring wallet history remains unlinkable.

## Products

....

## How Gelap works

....

## Deployments

### Mantle Tesnet

| GelapShieldedAccount | `0x54EC23CBCE1A9d33F05C4d3d79Ec28Aff3c8ce8D` |
| MockSP1Verifier | `0x79117dbB5A08B03cD796d06EdeEC6e0f2c554f4B` |

# Oracle

..

# Others

Link:
