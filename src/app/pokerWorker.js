/* eslint-disable no-restricted-globals */

// Console logging with emojis for better debugging
const logInit = (message) => console.log(`🚀 [Worker-Init] ${message}`);
const logError = (message, error) => console.error(`❌ [Worker-Error] ${message}`, error || '');
const logInfo = (message) => console.log(`ℹ️ [Worker-Info] ${message}`);
const logAction = (action, message) => console.log(`🎮 [Worker-${action}] ${message}`);

logInit("Worker starting...");

// Initialize the worker
async function initialize() {
  try {
    logInit("Initializing worker");
    // In a real implementation, we would initialize the Aleo SDK here
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
    // Simulate a private key for now
    return "priv_test_" + Math.random().toString(36).substring(2, 15);
  } catch (error) {
    logError("Error generating private key", error);
    return null;
  }
}

// Create a new game
async function createGame(gameId, privateKey) {
  try {
    logAction("Create", `Creating game with ID: ${gameId}`);
    // Simulate creating a game
    const creator = `aleo_${privateKey.substring(5, 15)}`;
    logAction("Create", `Game ${gameId} created by ${creator}`);
    
    return {
      gameId,
      status: "created",
      creator
    };
  } catch (error) {
    logError(`Error creating game ${gameId}`, error);
    return { error: "Failed to create game" };
  }
}

// Join an existing game
async function joinGame(gameId, privateKey) {
  try {
    logAction("Join", `Joining game with ID: ${gameId}`);
    // Simulate joining a game
    const player = `aleo_${privateKey.substring(5, 15)}`;
    logAction("Join", `Joined game ${gameId} as ${player}`);
    
    return {
      gameId,
      status: "joined",
      player
    };
  } catch (error) {
    logError(`Error joining game ${gameId}`, error);
    return { error: "Failed to join game" };
  }
}

// Place a bet in the game
async function placeBet(gameId, amount, privateKey) {
  try {
    logAction("Bet", `Placing bet of ${amount} in game ${gameId}`);
    // Simulate placing a bet
    const player = `aleo_${privateKey.substring(5, 15)}`;
    logAction("Bet", `Bet of ${amount} placed in game ${gameId} by ${player}`);
    
    return {
      gameId,
      amount,
      status: "bet_placed",
      player
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
          logAction("Key", `Generated key: ${privateKey}`);
          self.postMessage({ type: "key", result: privateKey });
        } else {
          logError("Failed to generate private key");
          self.postMessage({ type: "error", result: "Failed to generate private key" });
        }
        break;
        
      case "create_game":
        const createResult = await createGame(data.gameId, data.privateKey);
        logAction("Create", `Game creation result: ${JSON.stringify(createResult)}`);
        self.postMessage({ type: "create_game", result: createResult });
        break;
        
      case "join_game":
        const joinResult = await joinGame(data.gameId, data.privateKey);
        logAction("Join", `Game join result: ${JSON.stringify(joinResult)}`);
        self.postMessage({ type: "join_game", result: joinResult });
        break;
        
      case "place_bet":
        const betResult = await placeBet(data.gameId, data.amount, data.privateKey);
        logAction("Bet", `Bet result: ${JSON.stringify(betResult)}`);
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