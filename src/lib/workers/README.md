# ZK Poker Web Workers

This directory contains web workers for handling Aleo blockchain operations off the main thread. The workers help maintain UI responsiveness by moving computationally intensive operations to background threads.

## Overview

The `poker-worker.ts` file provides a comprehensive implementation for interacting with the Aleo blockchain in a web worker context. It handles:

- Generating private keys
- Creating and joining games
- Placing bets
- Querying game, chips, and card states
- Fetching transaction statuses

## Usage

To use the worker in your application:

```typescript
import { logWorker } from '@/utils/logging';

// Create the worker
const worker = new Worker(new URL('@/lib/workers/poker-worker.ts', import.meta.url));

// Listen for messages from the worker
worker.onmessage = (event) => {
  const { type, result, error } = event.data;

  if (error) {
    // Handle error
    console.error(`Worker error (${type}):`, error);
    return;
  }

  // Handle successful responses
  switch (type) {
    case 'init':
      logWorker('Worker initialized successfully');
      break;
    case 'key':
      // Handle generated private key
      const privateKey = result as string;
      logWorker(`Private key generated: ${privateKey.substring(0, 10)}...`);
      break;
    case 'create_game':
      // Handle game creation result
      logWorker(`Game created: ${JSON.stringify(result)}`);
      break;
    // Handle other response types...
  }
};

// Send a message to the worker
worker.postMessage({
  action: 'get_key' // Generate a private key
});

// Create a game
worker.postMessage({
  action: 'create_game',
  data: {
    gameId: 12345,
    privateKey: 'your_private_key_here',
    buyIn: 100
  }
});

// Clean up when done
function cleanup() {
  worker.terminate();
}
```

## Available Actions

The worker supports the following actions:

| Action            | Description                | Required Data                            | Response Type |
| ----------------- | -------------------------- | ---------------------------------------- | ------------- |
| `get_key`         | Generate a new private key | None                                     | `key`         |
| `create_game`     | Create a new game          | `gameId`, `privateKey`, optional `buyIn` | `create_game` |
| `join_game`       | Join an existing game      | `gameId`, `privateKey`                   | `join_game`   |
| `place_bet`       | Place a bet in a game      | `gameId`, `privateKey`, `amount`         | `place_bet`   |
| `get_game_state`  | Get the state of a game    | `gameId`                                 | `game_state`  |
| `get_chips_state` | Get chip information       | `gameId`                                 | `chips_state` |
| `get_cards_state` | Get card information       | `gameId`                                 | `cards_state` |
| `get_transaction` | Get transaction status     | `txId`                                   | `transaction` |
| `set_network`     | Set the network to use     | `network` ('local' or 'testnet')         | `network`     |

## Error Handling

All worker operations include error handling. If an error occurs, the response will include an `error` field with details about what went wrong.

## Network Configuration

By default, the worker connects to a local Aleo network. You can change the network using the `set_network` action:

```typescript
worker.postMessage({
  action: 'set_network',
  data: {
    network: 'testnet' // 'local' or 'testnet'
  }
});
```

## Types

The worker uses TypeScript for type safety. The types are defined in `src/types/worker.d.ts`.

## Logging

The worker uses the application's logging utilities to maintain consistent logging throughout the application.
