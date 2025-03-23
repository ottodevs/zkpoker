/* eslint-disable no-restricted-globals */
import {
  Account,
  initThreadPool,
  PrivateKey,
  ProgramManager,
} from "@provablehq/sdk";

// Console logging with emojis for better debugging
const logInit = (message: string) => console.log(`🚀 [Worker-Init] ${message}`);
const logError = (message: string, error?: any) => console.error(`❌ [Worker-Error] ${message}`, error || '');
const logInfo = (message: string) => console.log(`ℹ️ [Worker-Info] ${message}`);
const logAction = (action: string, message: string) => console.log(`🎮 [Worker-${action}] ${message}`);

// Import the poker program from the Leo file
const poker_program = /* leo */`
program poker.aleo {
    mapping games: u32 => Game;
    mapping chips: u32 => Chips;
    mapping cards: u32 => Cards;

    struct Game {
        player1: address,
        player2: address,
        player3: address,
        buy_in: u64,
        deck: [[u128; 26]; 2],
        state: u8,
        dealer_button: u8,
        players_out: u8,
        last_bet: u8,
    }

    struct Chips {
        player1: u16,
        player2: u16,
        player3: u16,
        player1_bet: u16,
        player2_bet: u16,
        player3_bet: u16,
    }

    struct Cards {
        player1: [u128; 2],
        player2: [u128; 2],
        player3: [u128; 2],
        flop: [u128; 3],
        turn: u128,
        river: u128,
    }
}`;

// Initialization function
async function initialize() {
  try {
    logInit("Initializing worker thread pool...");
    await initThreadPool();
    logInit("Worker initialized successfully!");
    self.postMessage({ type: "init", result: "Worker initialized" });
  } catch (error) {
    logError("Error initializing worker", error);
    self.postMessage({ type: "error", result: "Failed to initialize worker" });
  }
}

// Generate a private key for the account
function getPrivateKey() {
  try {
    logAction("Key", "Generating new private key");
    return new PrivateKey().to_string();
  } catch (error) {
    logError("Error generating private key", error);
    return null;
  }
}

// Create a new game
async function createGame(gameId: number, privateKey: string) {
  try {
    logAction("Create", `Creating game with ID: ${gameId}`);
    const programManager = new ProgramManager();
    
    // Set the account from private key
    const account = new Account({ privateKey });
    programManager.setAccount(account);
    
    // In the real implementation, we would call the create_game function
    // For this example, we'll simulate the response
    logAction("Create", `Game ${gameId} created by ${account.address().to_string().substring(0, 10)}...`);
    
    return {
      gameId,
      status: "created",
      creator: account.address().to_string()
    };
  } catch (error) {
    logError(`Error creating game ${gameId}`, error);
    return { error: "Failed to create game" };
  }
}

// Join an existing game
async function joinGame(gameId: number, privateKey: string) {
  try {
    logAction("Join", `Joining game with ID: ${gameId}`);
    const programManager = new ProgramManager();
    
    // Set the account from private key
    const account = new Account({ privateKey });
    programManager.setAccount(account);
    
    // In the real implementation, we would call the join_game function
    // For this example, we'll simulate the response
    logAction("Join", `Joined game ${gameId} as ${account.address().to_string().substring(0, 10)}...`);
    
    return {
      gameId,
      status: "joined",
      player: account.address().to_string()
    };
  } catch (error) {
    logError(`Error joining game ${gameId}`, error);
    return { error: "Failed to join game" };
  }
}

// Place a bet in the game
async function placeBet(gameId: number, amount: number, privateKey: string) {
  try {
    logAction("Bet", `Placing bet of ${amount} in game ${gameId}`);
    const programManager = new ProgramManager();
    
    // Set the account from private key
    const account = new Account({ privateKey });
    programManager.setAccount(account);
    
    // In the real implementation, we would call the bet function
    // For this example, we'll simulate the response
    logAction("Bet", `Bet of ${amount} placed in game ${gameId}`);
    
    return {
      gameId,
      amount,
      status: "bet_placed",
      player: account.address().to_string()
    };
  } catch (error) {
    logError(`Error placing bet in game ${gameId}`, error);
    return { error: "Failed to place bet" };
  }
}

// Initialize the worker
initialize().catch(error => {
  logError("Failed to initialize worker", error);
  self.postMessage({ type: "error", result: "Failed to initialize worker" });
});

// Handle messages from the main thread
self.onmessage = async function (e) {
  try {
    const { action, data } = e.data;
    logInfo(`Received action: ${action}`);
    
    switch (action) {
      case "get_key":
        const privateKey = getPrivateKey();
        if (privateKey) {
          logAction("Key", `Generated key: ${privateKey.substring(0, 10)}...`);
          self.postMessage({ type: "key", result: privateKey });
        } else {
          logError("Failed to generate private key");
          self.postMessage({ type: "error", result: "Failed to generate private key" });
        }
        break;
        
      case "create_game":
        const createResult = await createGame(data.gameId, data.privateKey);
        logAction("Create", `Game creation result: ${JSON.stringify(createResult).substring(0, 100)}...`);
        self.postMessage({ type: "create_game", result: createResult });
        break;
        
      case "join_game":
        const joinResult = await joinGame(data.gameId, data.privateKey);
        logAction("Join", `Game join result: ${JSON.stringify(joinResult).substring(0, 100)}...`);
        self.postMessage({ type: "join_game", result: joinResult });
        break;
        
      case "place_bet":
        const betResult = await placeBet(data.gameId, data.amount, data.privateKey);
        logAction("Bet", `Bet result: ${JSON.stringify(betResult).substring(0, 100)}...`);
        self.postMessage({ type: "place_bet", result: betResult });
        break;
        
      default:
        logError(`Unknown action: ${action}`);
        self.postMessage({ type: "error", result: `Unknown action: ${action}` });
    }
  } catch (error) {
    logError(`Error handling action ${e.data?.action || 'unknown'}`, error);
    self.postMessage({ type: "error", result: `Error handling action: ${error}` });
  }
}; 