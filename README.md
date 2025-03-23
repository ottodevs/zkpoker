# ZKPoker: Mental Poker on Aleo

<div align="center">
  <img src="public/top-logo.svg" alt="ZKPoker Logo" width="220" />
  <p><strong>Trustless, Decentralized Poker Powered by Zero-Knowledge Proofs</strong></p>
</div>

## Table of Contents

- [Overview](#overview)
- [Demo](#demo)
- [Features](#features)
- [How It Works](#how-it-works)
- [Mental Poker Implementation](#mental-poker-implementation)
    - [SRA Protocol with Modifications](#sra-shamir-rivest-adleman-protocol-with-modifications)
    - [Secure Deck Shuffling](#secure-deck-shuffling)
    - [Game State Management](#game-state-management)
- [Aleo Smart Contracts](#aleo-smart-contracts)
- [Architecture](#architecture)
- [Challenges](#challenges)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Smart Contract Deployment](#smart-contract-deployment)
- [Deployments](#deployments)
- [Tech Stack](#tech-stack)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

<div align="center">
  <p><em>EthGlobal Trifecta 2024 Hackathon - ZK Track Submission</em></p>
</div>

## Overview

ZKPoker is a trustless, decentralized poker platform powered by zero-knowledge proofs built on Aleo. Our implementation of mental poker eliminates the need for a trusted third party to deal cards or manage the game, ensuring complete fairness and true decentralization.

Most existing web3 poker solutions still rely on centralized components for card dealing and verification. ZKPoker solves the fundamental issue of "mental poker" - playing a fair card game without a trusted dealer - using modern cryptography and Aleo's privacy-preserving execution environment.

<div align="center">
  <img src="public/poker-table.svg" alt="ZKPoker Table" width="600" />
</div>

## Demo

- **Live Demo**: [https://zkpoker.vercel.app](https://zkpoker.vercel.app)
- **Video Demo**: [Watch on Loom](https://www.loom.com/share/1d3ee014b3d44503bcee0f3fa8351f83?sid=df3c18d1-9c54-4628-a665-1a570349cba3)

## Features

- **Fully Decentralized Card Games**: No trusted dealer or central server needed for shuffling and dealing cards
- **Provably Fair**: Zero-knowledge proofs ensure fairness without revealing players' cards
- **Privacy Preserving**: Players' strategies and hands are kept private until showdown
- **On-chain Game Logic**: All game mechanics run on Aleo smart contracts
- **Beautiful UI**: Modern, intuitive interface for seamless gameplay
- **Wallet Integration**: Connect with Leo wallet for secure authentication
- **Responsive Design**: Play on any device with adaptive layout

<div align="center">
  <img src="public/pokerback-ground.png" alt="ZKPoker Background" width="600" />
</div>

## How It Works

ZKPoker uses advanced cryptographic techniques to implement mental poker protocols on Aleo:

1. **Secure Shuffling**: Players collaboratively shuffle an encrypted deck without seeing card values
2. **Private Card Dealing**: Cards are dealt to players while preserving privacy
3. **Verifiable Actions**: All player actions (check, bet, fold) are validated on-chain
4. **Zero-Knowledge Showdown**: Only revealed hands are compared at showdown, maintaining privacy

```mermaid
flowchart TD
    A[Game Initialization] --> B[Deck Creation]
    B --> C[Player 1 Shuffle]
    C --> D[Player 2 Shuffle]
    D --> E[Player 3 Shuffle]
    E --> F[Encrypted Dealing]
    F --> G[Betting Rounds]
    G --> H[Community Cards Reveal]
    H --> I[More Betting Rounds]
    I --> J[Showdown]
    J --> K[Winner Determination]
    K --> L[Prize Distribution]
    L --> M[New Hand]
    M -->|Next Round| B
```

## Mental Poker Implementation

Mental poker is a cryptographic problem of playing a fair card game over a distance without a trusted third party. Our implementation combines several techniques:

### SRA (Shamir-Rivest-Adleman) Protocol with Modifications

We use a modified version of the SRA protocol for secure card operations:

1. **Card Representation**: Each card is represented as a unique 128-bit number
2. **Card Transformation**: We use simple XOR operations for encryption/decryption to minimize ZK circuit complexity
3. **Multi-Key Encryption**: Cards are encrypted with player-specific keys, requiring cooperation for decryption

```leo
// From zk_sra_encryption.aleo
function transform_card(card: u128, key: u128) -> u128 {
    return card ^ key; // Simple XOR operation
}
```

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant BC as Blockchain

    Note over P1,P2: Card Encryption Process
    P1->>P1: Generate key K₁
    P2->>P2: Generate key K₂
    P1->>BC: Encrypt card C with K₁: C' = C ⊕ K₁
    BC->>P2: Send encrypted card C'
    P2->>BC: Re-encrypt with K₂: C'' = C' ⊕ K₂
    BC->>P1: Send double-encrypted card C''
    Note over P1,P2: Decryption for Showdown
    P1->>BC: Reveal K₁
    P2->>BC: Reveal K₂
    BC->>BC: Decrypt C'' = C'' ⊕ K₁ ⊕ K₂ = C
```

### Secure Deck Shuffling

We implement a secure shuffling protocol where multiple players participate:

1. **Initial Deck Creation**: A standard 52-card deck is initialized
2. **Player Shuffling**: Each player applies their own secret shuffle to the encrypted deck
3. **Zero-Knowledge Verification**: Players prove they performed a valid shuffle without revealing the permutation

```leo
// From zk_deck_shuffle.aleo
transition full_shuffle(
    seed1: i8,
    seed2: i8,
    seed3: i8,
    deck: [[u128; 26]; 2]
) -> [[u128; 26]; 2] {
    // Complex shuffling logic goes here
    // ...
    return shuffled_deck;
}
```

### Game State Management

The main contract manages the poker game state, including:

- Player turns and actions
- Blinds and betting rounds
- Card dealing and community card revelation
- Showdown and winner determination

```leo
// From mental_poker_trifecta.aleo
struct Game {
    player1: address,
    player2: address,
    player3: address,
    buy_in: u64,
    deck: [[u128; 26]; 2],
    state: u8,
    dealer_button: u8,
    players_out: u8,
    players_folded: u8,
    // Additional fields...
}
```

```mermaid
stateDiagram-v2
    [*] --> WaitingForPlayers
    WaitingForPlayers --> DeckInitialization
    DeckInitialization --> DeckShuffling
    DeckShuffling --> DealingHoleCards
    DealingHoleCards --> PreFlopBetting
    PreFlopBetting --> DealingFlop
    DealingFlop --> FlopBetting
    FlopBetting --> DealingTurn
    DealingTurn --> TurnBetting
    TurnBetting --> DealingRiver
    DealingRiver --> RiverBetting
    RiverBetting --> Showdown
    Showdown --> WinnerDetermination
    WinnerDetermination --> NextHand
    NextHand --> DeckInitialization

    PreFlopBetting --> WinnerDetermination: All but one player folds
    FlopBetting --> WinnerDetermination: All but one player folds
    TurnBetting --> WinnerDetermination: All but one player folds
    RiverBetting --> WinnerDetermination: All but one player folds
```

## Aleo Smart Contracts

Our implementation consists of four interconnected Aleo programs:

### 1. mental_poker_trifecta.aleo (Main Contract)

The core contract managing the poker game, player actions, and state transitions:

- **Game Creation**: Initialize new games with blinds and buy-ins
- **Player Management**: Handle joining, betting, and folding
- **Game Flow**: Control betting rounds and turn progression
- **State Machine**: Manage the complex state transitions of a poker game

### 2. zk_sra_encryption.aleo

Implements the cryptographic primitives for card operations:

- **Card Encryption**: Transform cards using player-specific keys
- **Card Decryption**: Allow selective revelation of cards
- **Multi-Card Processing**: Efficiently handle operations on multiple cards

### 3. zk_deck_operations.aleo

Handles operations on the entire deck:

- **Deck Encryption**: Encrypt the entire deck in parts
- **Card Selection**: Extract and process specific cards
- **Hand Creation**: Form player hands and community cards

### 4. zk_deck_shuffle.aleo

Implements secure shuffling algorithms:

- **Permutation Generation**: Create unpredictable yet verifiable card orderings
- **Multi-Party Shuffling**: Allow each player to contribute to the shuffle
- **Shuffle Verification**: Ensure the integrity of the shuffle

<div align="center">
  <img src="public/dealer-chip.svg" alt="ZKPoker Dealer Chip" width="80" />
</div>

## Architecture

Our ZKPoker implementation follows a modular architecture that separates concerns while allowing for secure interactions between components:

```mermaid
graph TB
    subgraph "Frontend Application"
        UI[User Interface]
        GS[Game State]
        WC[Wallet Connector]
        WW[Web Workers]
    end

    subgraph "Aleo Blockchain"
        subgraph "ZKPoker Contracts"
            MPT[mental_poker_trifecta.aleo]
            SRA[zk_sra_encryption.aleo]
            DO[zk_deck_operations.aleo]
            DS[zk_deck_shuffle.aleo]
        end
        BC[Blockchain State]
    end

    UI <--> GS
    GS <--> WC
    GS <--> WW
    WC <--> MPT
    WW <--> MPT
    MPT <--> SRA
    MPT <--> DO
    MPT <--> DS
    SRA <--> BC
    DO <--> BC
    DS <--> BC
    MPT <--> BC

    classDef frontend fill:#f9f9f9,stroke:#333,stroke-width:1px
    classDef contract fill:#d8e8f4,stroke:#3c7aa8,stroke-width:1px
    classDef blockchain fill:#e8f4d8,stroke:#5a8a3c,stroke-width:1px

    class UI,GS,WC,WW frontend
    class MPT,SRA,DO,DS contract
    class BC blockchain
```

The architecture enables:

1. **Decentralized Execution**: All game logic runs on the Aleo blockchain
2. **Client-Side Cryptography**: Web Workers handle heavy cryptographic operations
3. **Modular Design**: Each contract has a specific responsibility
4. **Secure Communication**: All on-chain interactions are verifiable and private

## Challenges

Building a trustless poker platform on Aleo presented several challenges:

### 1. Circuit Complexity

Zero-knowledge proof generation for complex operations like shuffling is computationally intensive. We optimized our implementation by:

- Breaking down shuffle operations into smaller steps
- Using XOR-based encryption instead of more complex cryptography
- Optimizing data structures for Leo's constraints

### 2. Multi-Party Protocol Design

Coordinating multiple players in a decentralized environment required careful protocol design:

- State machine with clear transitions for each player action
- Fallback mechanisms for disconnections or timeouts
- Incentive structures to prevent cheating

### 3. Private Information Management

Balancing privacy with gameplay verification:

- Ensuring players can't see others' hole cards
- Allowing selective revelation during showdown
- Preventing collusion between players

### 4. User Experience

Creating a smooth experience despite blockchain constraints:

- Implementing optimistic UI updates before on-chain confirmation
- Handling transaction failures gracefully
- Providing appropriate feedback during cryptographic operations

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Leo (Aleo SDK)
- A Leo-compatible wallet (like Leo Wallet extension)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/zkpoker.git
cd zkpoker
```

2. Install dependencies

```bash
pnpm install
```

3. Start the development server

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Smart Contract Deployment

To deploy the Leo programs to Aleo:

1. Navigate to the Leo program directory

```bash
cd leo-program
```

2. Build the programs

```bash
snarkvm build
```

3. Deploy to Aleo local testnet

```bash
leo deploy --recursive -y
```

## Deployments

Our contracts are currently deployed on the Aleo local testnet using [Demox Labs' AmarAleo Chain](https://www.demoxlabs.xyz/). Due to ongoing issues with the public testnet (500 errors during deployment), we're currently focused on local testnet development.

Here's a summary of our deployment costs to the local testnet:

### Program Deployment Summary

| Program                    | Transaction ID                                                | Cost (credits) |
| -------------------------- | ------------------------------------------------------------- | -------------- |
| zk_deck_shuffle.aleo       | at1pvpkuumy3r56eqyszyyt85ml6uzjfj3v23alau3d0z7s594jm5yqpl4lp0 | 108.432550     |
| zk_sra_encryption.aleo     | at12cvm6ucvyeagkgf32ca93yh8m2h2lm5222xqdr84ak7n5rga7ygqra5uz5 | 13.611800      |
| zk_deck_operations.aleo    | at1a2tsk3mj2sdc5a9yrnh5cxmjac7jp09zu4ekl6t99jy7hgc5nyzqc37fnl | 41.227700      |
| mental_poker_trifecta.aleo | at1rk88g2nwcjzdq75pfnsz0a6xd00gjgewvswzjzkxrzuaczn7qvxqexpmc0 | 46.994400      |

For detailed deployment information, see our [deployments.md](deployments.md) file.

## Tech Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Howler.js**: Audio library for game sounds
- **Leo Wallet Adapter**: Connect with Leo wallets

### Blockchain

- **Aleo**: Privacy-focused L1 blockchain
- **Leo**: Language for zero-knowledge applications
- **SnarkVM**: Execution environment for Aleo programs
- **Web Workers**: Handle heavy cryptographic operations off the main thread

### Development Tools

- **ESLint/Prettier**: Code formatting and linting
- **pnpm**: Fast, disk-efficient package manager
- **VS Code**: Recommended editor with Leo extensions

<div align="center">
  <div style="display: flex; justify-content: center; gap: 20px;">
    <img src="public/cards/Ah.svg" alt="Ace of Hearts" width="60" />
    <img src="public/cards/Kc.svg" alt="King of Clubs" width="60" />
    <img src="public/cards/Qd.svg" alt="Queen of Diamonds" width="60" />
    <img src="public/cards/Js.svg" alt="Jack of Spades" width="60" />
  </div>
</div>

## Future Roadmap

```mermaid
gantt
    title ZKPoker Development Roadmap
    dateFormat  YYYY-MM-DD
    section Core Features
    Complete Texas Hold'em Implementation :2024-07-01, 2024-09-30
    Public Testnet Deployment            :2024-08-01, 2024-10-15
    Hand Evaluation Engine               :2024-09-01, 2024-10-30

    section Game Variants
    Sit-n-Go Tournaments                 :2024-10-01, 2024-12-15
    Omaha Implementation                 :2024-11-15, 2025-01-30
    Short Deck (6+ Hold'em)              :2024-12-15, 2025-02-28

    section Platform Features
    Mobile App Development               :2024-11-01, 2025-03-15
    Multi-Language Support               :2025-01-15, 2025-03-15
    Advanced Analytics                   :2025-02-01, 2025-04-30
    Community Features                   :2025-03-01, 2025-05-30
```

### Improved Texas Hold'em Implementation

- **Advanced Betting Rules**: Implement full No-Limit Texas Hold'em betting structure
- **Hand Evaluation**: Complete 5-card combination evaluation for accurate hand strength calculation
- **Side Pots**: Support for multiple side pots in all-in scenarios
- **Tournament Structure**: Blind level increases and elimination progression

### New Game Modes

- **Sit-n-Go**: Quick tournament format with 6-9 players
- **Multi-Table Tournaments**: Support for larger player pools with table balancing
- **Omaha**: Four-card variant with more complex drawing possibilities
- **Short Deck**: Remove 2-5 cards for more action-packed gameplay

### Enhanced Features

- **Mobile App**: Native mobile experience with push notifications
- **Multi-Language Support**: Internationalization for global audience
- **Advanced Analytics**: Hand history and strategy tools for players
- **Community Building**: Chat functions, player profiles, and achievements

### Technical Improvements

- **Public Testnet Deployment**: Resolve current 500 errors and deploy to public Aleo testnet
- **Optimized Circuits**: Further reduction in ZK circuit complexity
- **Improved Tutorial**: Step-by-step onboarding for new players
- **Enhanced Security**: Additional measures to prevent collusion and cheating

<div align="center">
  <img src="public/blue-chip.svg" alt="Blue Chip" width="50" />
  <img src="public/red-chip.svg" alt="Red Chip" width="50" />
  <img src="public/yellow-chip.svg" alt="Yellow Chip" width="50" />
  <img src="public/green-chip.svg" alt="Green Chip" width="50" />
</div>

## Contributing

We welcome contributions to ZKPoker! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Aleo team for their incredible platform and tools
- [Demox Labs](https://www.demoxlabs.xyz/) for their AmarAleo testnet infrastructure
- EthGlobal Trifecta 2024 for the opportunity to showcase this project
- The mental poker research community for laying the cryptographic foundations

---

<div align="center">
  <p>Built with ❤️ by the ZKPoker Team for EthGlobal Trifecta 2024</p>
</div>
