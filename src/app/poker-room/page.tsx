"use client";

import React, { useCallback, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import PokerControl from "@/components/PokerControl";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

// Define types for our game state
interface Player {
  id: string;
  position: number; // Seat number (1-9)
  chips: number;
  avatarIndex: number;
  holeCards: string[]; // e.g. ["Ah", "Kd"]
  currentBet: number;
  status: 'active' | 'folded' | 'all-in' | 'waiting';
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

interface GameState {
  // Table state
  players: Player[];
  pot: number;
  sidePots: { amount: number, eligiblePlayers: string[] }[];
  communityCards: string[];
  dealerPosition: number;
  blinds: { small: number, big: number };
  currentBettingRound: 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | null;
  currentPlayerTurn: number | null;
  gamePhase: 'waiting' | 'dealing' | 'betting' | 'showdown' | 'finished';
  minBet: number;
  lastRaiseAmount: number;
  deck: string[];
  // Track the human player's ID for perspective rendering
  humanPlayerId: string | null;
}

// Add new types for turns and player actions after the GameState interface
type PlayerAction = 'check' | 'call' | 'bet' | 'raise' | 'fold' | 'all-in';

export default function PokerRoom() {
  const searchParams = useSearchParams();
  
  // Player data from URL params
  const [playerData, setPlayerData] = useState({
    avatarIndex: 0,
    chips: 2300,
    blinds: "100/200",
    gameType: "cash" // Default to cash game
  });
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Track available seats - wrapped in useMemo to prevent recreation on each render
  const availableSeats = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], []);
  
  // Track game status with a more visible state
  const [gameStatus, setGameStatus] = useState<'initializing' | 'waiting' | 'ready' | 'playing' | 'finished'>('initializing');
  
  // Use a ref to track if initialization has occurred
  const hasInitialized = useRef(false);
  
  // Helper function to shuffle the deck
  const shuffleDeck = useCallback((deck: string[]): string[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);
  
  // Initialize game with this player
  const initializeGame = useCallback((playerId: string, position: number, chips: number, avatarIndex: number) => {
    console.log(`Initializing game with player ${playerId} sitting at position ${position}`);
    
    // Always use 10/20 blinds regardless of what was passed in URL
    const smallBlind = 10;
    const bigBlind = 20;
    
    // Create initial deck (will be shuffled when game actually starts)
    const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = suits.flatMap(suit => values.map(value => `${value}${suit}`));
    
    // Create new player
    const newPlayer: Player = {
      id: playerId,
      position,
      chips,
      avatarIndex,
      holeCards: [],
      currentBet: 0,
      status: 'waiting', // Player is waiting for the game to start
      isDealer: true, // First player is dealer by default (will rotate)
      isSmallBlind: false,
      isBigBlind: false
    };
    
    // Create initial game state
    const initialGameState: GameState = {
      players: [newPlayer],
      pot: 0,
      sidePots: [],
      communityCards: [],
      dealerPosition: position,
      blinds: { small: smallBlind, big: bigBlind },
      currentBettingRound: null, // Not yet started
      currentPlayerTurn: null, // Not yet started
      gamePhase: 'waiting', // Waiting for more players
      minBet: bigBlind,
      lastRaiseAmount: 0,
      deck: shuffleDeck(deck),
      humanPlayerId: playerId // Track the human player for perspective rendering
    };
    
    setGameState(initialGameState);
    return initialGameState;
  }, [shuffleDeck]);
  
  // Start a new hand in the game
  const startGame = useCallback((currentGameState = gameState) => {
    if (!currentGameState || currentGameState.players.length < 2) {
      console.log("Cannot start game: need at least 2 players");
      return;
    }
    
    console.log("Starting new game with", currentGameState.players.length, "players");
    
    // Update game status to playing
    setGameStatus('playing');
    
    // Create a fresh copy of the game state to work with
    const newGameState = { ...currentGameState };
    
    // Shuffle the deck
    newGameState.deck = shuffleDeck([...newGameState.deck]);
    
    // Assign dealer, small blind, big blind positions
    assignTablePositions(newGameState);
    
    // Deal two cards to each player
    dealHoleCards(newGameState);
    
    // Set the current player turn (after big blind)
    setCurrentPlayerTurn(newGameState);
    
    // Update game phase and betting round
    newGameState.gamePhase = 'betting';
    newGameState.currentBettingRound = 'pre-flop';
    
    // Update the game state
    setGameState(newGameState);
    
    console.log("Game started successfully!", newGameState);
  }, [gameState, setGameStatus, shuffleDeck, setGameState]);
  
  // Add a simulated opponent for testing
  const addSimulatedOpponent = useCallback((currentGameState = gameState) => {
    if (!currentGameState) {
      console.log("Cannot add opponent, game state not initialized");
      return;
    }
    
    console.log("Adding simulated opponent...");
    
    // Find an empty seat different from the human player
    const playerPositions = new Set(currentGameState.players.map(p => p.position));
    const emptySeatPositions = availableSeats.filter(pos => !playerPositions.has(pos));
    
    if (emptySeatPositions.length === 0) {
      console.log("No empty seats available for simulated opponent");
      return;
    }
    
    // Choose a seat across from the player if possible
    const opposingSeatIndex = Math.floor(Math.random() * emptySeatPositions.length);
    const opponentSeatNumber = emptySeatPositions[opposingSeatIndex];
    
    // Create bot player with random avatar and appropriate chips
    const botAvatarIndex = Math.floor(Math.random() * 5); // 0-4
    const botPlayer: Player = {
      id: `bot_${Date.now()}`,
      position: opponentSeatNumber,
      chips: currentGameState.players[0].chips, // Match human player's chips
      avatarIndex: botAvatarIndex,
      holeCards: [],
      currentBet: 0,
      status: 'waiting',
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false
    };
    
    console.log(`Adding simulated opponent at seat ${opponentSeatNumber} with avatar ${botAvatarIndex}`);
    
    // Update game state with new player
    const updatedGameState = {
      ...currentGameState,
      players: [...currentGameState.players, botPlayer]
    };
    
    setGameState(updatedGameState);
    
    // Wait for the DOM to update and opponent to be visually rendered
    setGameStatus('ready');
    
    // Check if opponent is visually seated
    console.log("Opponent added to game state, waiting for visual rendering...");
    setTimeout(() => {
      console.log("Checking if players are ready to start game...");
      if (updatedGameState && updatedGameState.players.length >= 2) {
        console.log("Two players seated and visible! The game can now start.");
        // Only start the game once we know the opponent is visually rendered
        startGame(updatedGameState);
      }
    }, 1500);
  }, [gameState, availableSeats, setGameState, setGameStatus, startGame]);
  
  // Auto-seat the player in an available seat
  const autoSeatPlayer = useCallback((avatarIndex: number, chips: number) => {
    // Generate a player ID
    const playerId = `player_${Date.now()}`;
    
    // Always seat player at position 9 (bottom center) for consistent UI
    const seatNumber = 9;
    
    console.log(`Auto-seating player at seat ${seatNumber}`);
    
    // Initialize game with this player
    const initialGameState = initializeGame(playerId, seatNumber, chips, avatarIndex);
    
    // Add a visual waiting state
    setGameStatus('waiting');
    
    // After initialization, we could add a simulated opponent for testing
    // This would be handled by the server in a real multiplayer game
    console.log("Waiting for opponent to join...");
    setTimeout(() => {
      // We need to pass the initialGameState to make sure we have a game state even if component re-renders
      addSimulatedOpponent(initialGameState);
    }, 2000); // Increased delay to 2 seconds for better visual experience
  }, [initializeGame, setGameStatus, addSimulatedOpponent]);
  
  // Parse URL parameters on load and auto-initialize the game
  useEffect(() => {
    // Only run this once to prevent multiple initializations
    if (hasInitialized.current) {
      return;
    }
    
    if (searchParams) {
      const avatarIndex = parseInt(searchParams.get('avatar') || '0', 10);
      const chips = parseInt(searchParams.get('chips') || '2300', 10);
      const blinds = searchParams.get('blinds') || '100/200';
      const gameType = searchParams.get('gameType') || 'cash';
      
      console.log("Poker room received params:", { avatarIndex, chips, blinds, gameType });
      console.log("Avatar should be:", `/avatar${avatarIndex + 1}.png`);
      
      setPlayerData({
        avatarIndex,
        chips,
        blinds,
        gameType
      });
      
      // Auto-initialize game with the player in a random seat
      // In a real game, this would be coordinated with the server
      autoSeatPlayer(avatarIndex, chips);
      
      // Mark as initialized
      hasInitialized.current = true;
    }
  }, [searchParams, autoSeatPlayer]); // Added autoSeatPlayer to dependency array
  
  // Assign dealer, small blind, and big blind positions
  const assignTablePositions = (gameState: GameState) => {
    // Reset all player positions
    gameState.players.forEach(player => {
      player.isDealer = false;
      player.isSmallBlind = false;
      player.isBigBlind = false;
      player.status = 'active'; // All players are active at start of hand
    });
    
    // Sort players by position for easier assignment
    const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position);
    
    // Assign dealer button (first player to join is dealer in first hand)
    const dealerIndex = 0;
    sortedPlayers[dealerIndex].isDealer = true;
    gameState.dealerPosition = sortedPlayers[dealerIndex].position;
    console.log(`Dealer assigned to player at seat ${sortedPlayers[dealerIndex].position}`);
    
    // Assign small blind (next player after dealer)
    const sbIndex = (dealerIndex + 1) % sortedPlayers.length;
    sortedPlayers[sbIndex].isSmallBlind = true;
    
    // Collect small blind
    const sbAmount = gameState.blinds.small;
    sortedPlayers[sbIndex].chips -= sbAmount;
    sortedPlayers[sbIndex].currentBet = sbAmount;
    gameState.pot += sbAmount;
    console.log(`Small blind (${sbAmount}) collected from player at seat ${sortedPlayers[sbIndex].position}`);
    console.log(`Player at seat ${sortedPlayers[sbIndex].position} now has ${sortedPlayers[sbIndex].chips} chips and currentBet = ${sortedPlayers[sbIndex].currentBet}`);
    
    // Assign big blind (next player after small blind)
    const bbIndex = (sbIndex + 1) % sortedPlayers.length;
    sortedPlayers[bbIndex].isBigBlind = true;
    
    // Collect big blind
    const bbAmount = gameState.blinds.big;
    sortedPlayers[bbIndex].chips -= bbAmount;
    sortedPlayers[bbIndex].currentBet = bbAmount;
    gameState.pot += bbAmount;
    console.log(`Big blind (${bbAmount}) collected from player at seat ${sortedPlayers[bbIndex].position}`);
    console.log(`Player at seat ${sortedPlayers[bbIndex].position} now has ${sortedPlayers[bbIndex].chips} chips and currentBet = ${sortedPlayers[bbIndex].currentBet}`);
    
    console.log(`Assigned positions: Dealer=seat ${sortedPlayers[dealerIndex].position}, SB=seat ${sortedPlayers[sbIndex].position}, BB=seat ${sortedPlayers[bbIndex].position}`);
    console.log(`Collected blinds: SB=${sbAmount}, BB=${bbAmount}, Total pot=${gameState.pot}`);
  };
  
  // Deal two hole cards to each player
  const dealHoleCards = (gameState: GameState) => {
    // Reset all hole cards
    gameState.players.forEach(player => {
      player.holeCards = [];
    });
    
    // Sort players by position for clockwise dealing
    const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position);
    
    // Get dealer index
    const dealerIndex = sortedPlayers.findIndex(p => p.isDealer);
    
    // Deal first card to each player starting from small blind
    for (let i = 0; i < sortedPlayers.length; i++) {
      const playerIndex = (dealerIndex + 1 + i) % sortedPlayers.length;
      const card = gameState.deck.pop();
      if (card) {
        sortedPlayers[playerIndex].holeCards.push(card);
      }
    }
    
    // Deal second card to each player starting from small blind
    for (let i = 0; i < sortedPlayers.length; i++) {
      const playerIndex = (dealerIndex + 1 + i) % sortedPlayers.length;
      const card = gameState.deck.pop();
      if (card) {
        sortedPlayers[playerIndex].holeCards.push(card);
      }
    }
    
    // Log the cards dealt to each player (for debugging)
    gameState.players.forEach(player => {
      console.log(`Player ${player.id} at seat ${player.position} received cards: ${player.holeCards.join(', ')}`);
    });
  };
  
  // Set the current player turn after dealer positions are assigned
  const setCurrentPlayerTurn = (gameState: GameState) => {
    // Find the player after the big blind
    const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position);
    const bbIndex = sortedPlayers.findIndex(p => p.isBigBlind);
    const nextPlayerIndex = (bbIndex + 1) % sortedPlayers.length;
    
    // Set the current player turn to the player after the big blind
    gameState.currentPlayerTurn = sortedPlayers[nextPlayerIndex].position;
    
    console.log(`Current player turn: ${gameState.currentPlayerTurn} (seat number)`);
  };
  
  // Helper function to convert card value to SVG file path
  const getCardImagePath = (card: string) => {
    if (!card) return null;
    
    // Convert card value to file path format
    // Format: '2h' -> '2h.svg', 'Kd' -> '13d.svg', etc.
    let cardValue = card.slice(0, -1); // Get value without suit
    const suit = card.slice(-1).toLowerCase(); // Get suit (last character)
    
    // Convert face cards to numbers for file naming
    if (cardValue === 'J' || cardValue === 'j') cardValue = '11';
    else if (cardValue === 'Q' || cardValue === 'q') cardValue = '12';
    else if (cardValue === 'K' || cardValue === 'k') cardValue = '13';
    // Ace can stay as "A" since that's how the files are named
    
    return `/cards/${cardValue}${suit}.svg`;
  };
  
  /**
   * Process player actions (check, call, bet, raise, fold)
   */
  const processPlayerAction = (action: string) => {
    console.log(`Processing player action: ${action}`);
    
    if (!gameState) return;
    
    // Find the human player (assume always at position 5)
    const player = gameState.players.find(p => p.id === gameState.humanPlayerId);
    
    if (!player) {
      console.error("Player not found");
      return;
    }
    
    // Check if it's the player's turn
    if (!isPlayerTurn(gameState, player.id)) {
      console.log("Not your turn!");
      return;
    }
    
    // Get valid actions and check if the action is valid
    const validActions = getValidActions(gameState);
    
    // Verify the action is valid
    const actionType = action.includes('_') ? action.split('_')[0] : action;
    if (!validActions.includes(actionType as PlayerAction)) {
      console.log(`Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`);
      return;
    }
    
    console.log(`Executing valid action: ${action}`);
    
    // Process different actions
    if (action === 'call') {
      handleCallAction(gameState, player);
      
      // Update game state after action
      const updatedGameState = advanceTurn(gameState);
      setGameState(updatedGameState);
    }
    // Handle other actions like check, fold, raise, etc.
    // ... existing code ...
  };

  /**
   * Handle the "call" action
   */
  const handleCallAction = (gameState: GameState, player: Player) => {
    console.log("Processing call action...");
    console.log(`Player current bet: ${player.currentBet}, chips: ${player.chips}`);
    
    // Find the highest bet at the table
    const highestBet = Math.max(...gameState.players.map(p => p.currentBet));
    console.log(`Highest bet at table: ${highestBet}`);
    
    // Calculate how much more the player needs to add to call
    const amountToCall = highestBet - player.currentBet;
    console.log(`Amount needed to call: ${amountToCall}`);
    
    // Check if player has enough chips to call
    if (player.chips < amountToCall) {
      console.error(`Not enough chips to call. Need ${amountToCall} but only have ${player.chips}`);
      return;
    }
    
    console.log(`Player calls ${amountToCall} (total bet will be ${player.currentBet + amountToCall})`);
    
    // Deduct the call amount from player's chips
    player.chips -= amountToCall;
    
    // Add the call amount to player's current bet
    player.currentBet += amountToCall;
    
    // Add the call amount to the pot
    gameState.pot += amountToCall;
    
    console.log(`Call processed. Player now has ${player.chips} chips and current bet of ${player.currentBet}`);
    console.log(`New pot total: ${gameState.pot}`);
    
    // Advance to the next player
    advanceToNextPlayer(gameState);
    
    // Update the game state
    setGameState({ ...gameState });
  };

  /**
   * Advance to the next player's turn
   */
  const advanceToNextPlayer = (gameState: GameState) => {
    // Get the next player in turn
    const nextPlayerPosition = getNextPlayerInTurn(gameState, gameState.currentPlayerTurn);
    
    // If there's no next player (all folded or all-in), end the round
    if (nextPlayerPosition === null) {
      // End current betting round and advance to next phase
      advanceGamePhase(gameState);
      return;
    }
    
    // Set the next player as the current turn
    gameState.currentPlayerTurn = nextPlayerPosition;
    console.log(`Turn advanced to player at position ${nextPlayerPosition}`);
  };

  // Track which seat is being hovered
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  
  // Track if player's cards are visible (for testing purposes)
  const [playerCardsVisible, setPlayerCardsVisible] = useState(true);

  // Function to handle seat click - updated to call handlePlayerJoinSeat
  const handleSeatClick = (seatNumber: number) => {
    console.log(`Clicked on seat ${seatNumber}`);
    handlePlayerJoinSeat(seatNumber);
  };
  
  // Function to get the human player's hole cards
  const getHumanPlayerCards = () => {
    if (!gameState || !gameState.humanPlayerId) return null;
    
    const humanPlayer = gameState.players.find(p => p.id === gameState.humanPlayerId);
    if (!humanPlayer || humanPlayer.holeCards.length < 2) return null;
    
    return {
      card1: getCardImagePath(humanPlayer.holeCards[0]),
      card2: getCardImagePath(humanPlayer.holeCards[1])
    };
  };

  // Return early if page is still loading
  const { card1, card2 } = getHumanPlayerCards() || { card1: null, card2: null };

  // Log when playerData changes
  useEffect(() => {
    console.log("Player data updated:", playerData);
    console.log("Rendering PokerControl with avatarIndex:", playerData.avatarIndex);
  }, [playerData]);
  
  // Function to handle a player joining a specific seat (for manual seat selection)
  const handlePlayerJoinSeat = (seatNumber: number) => {
    console.log(`Player joining seat ${seatNumber}`);
    
    // This would be used for manually joining a seat
    // But we're now auto-seating players when they arrive
    if (gameState) {
      console.log("Game already initialized. Player already seated.");
      return;
    }
    
    // Generate a temporary player ID (would come from authentication in a real app)
    const playerId = `player_${Date.now()}`;
    
    // Initialize game with the player in the selected seat
    initializeGame(playerId, seatNumber, playerData.chips, playerData.avatarIndex);
  };

  // Updated Empty Seat component to show actual player cards when occupied
  const EmptySeat = ({ seatNumber }: { seatNumber: number }) => {
    // Check if this seat is occupied
    const isOccupied = gameState?.players.some(player => player.position === seatNumber) || false;
    
    // For perspective rendering, we want to know if this is the human player's seat
    const isHumanPlayer = gameState?.players.some(
      player => player.position === seatNumber && player.id === gameState.humanPlayerId
    ) || false;
    
    // Log seat status for debugging
    if (isOccupied) {
      console.log(`Seat ${seatNumber} is occupied by ${isHumanPlayer ? 'human player' : 'opponent'}`);
    }
    
    // Only show hover effects for empty seats
    const isHovered = !isOccupied && hoveredSeat === seatNumber;
    
    // Create a separate mouse handler for each seat
    const handleMouseEnter = (e: React.MouseEvent) => {
      // Prevent event bubbling
      e.stopPropagation();
      if (!isOccupied) {
        setHoveredSeat(seatNumber);
      }
    };
    
    const handleMouseLeave = (e: React.MouseEvent) => {
      // Prevent event bubbling
      e.stopPropagation();
      // Only set to null if this is the currently hovered seat
      if (hoveredSeat === seatNumber) {
        setHoveredSeat(null);
      }
    };
    
    // For rendering purposes, find the player at this seat (if any)
    const playerAtSeat = gameState?.players.find(player => player.position === seatNumber);
    
    // If this is the human player's seat, we don't render anything here
    // as the player will be shown at the bottom center via the PokerControl component
    if (isHumanPlayer) {
      console.log(`Not rendering seat ${seatNumber} because it's the human player's seat`);
      return null;
    }
    
    // If a player is seated here, show their avatar and cards (face down)
    if (isOccupied && playerAtSeat) {
      console.log(`Rendering opponent at seat ${seatNumber} with avatar ${playerAtSeat.avatarIndex}`);
      return (
        <div className="relative">
          {/* Container for avatar and cards */}
          <div className="relative">
            {/* Player avatar */}
            <Image 
              src="/opponent-ring.svg" 
              alt="Player" 
              width={80} 
              height={80}
              priority
              style={{ height: "auto" }}
            />
            <div 
              className="absolute top-[10px] left-[10px] w-[60px] h-[60px] rounded-full overflow-hidden"
            >
              <Image 
                src={`/avatar${playerAtSeat.avatarIndex + 1}.png`}
                alt={`Player ${seatNumber}`}
                width={60}
                height={60}
                className="object-cover w-full h-full"
                priority
                unoptimized={true}
                style={{ height: "auto" }}
              />
            </div>

            {/* Player's cards (face down for opponents) - positioned on top of the avatar */}
            {gameState?.gamePhase !== 'waiting' && gameStatus === 'playing' && playerAtSeat.holeCards.length > 0 && (
              <div className="absolute top-[30px] left-[10px] z-20">
                <div className="relative flex -space-x-10">
                  <Image 
                    src="/backofcard.png" 
                    alt="Card Back" 
                    width={80} 
                    height={120} 
                    priority 
                    className="-rotate-15 scale-[0.55]"
                    style={{ height: "auto" }}
                  />
                  <Image 
                    src="/backofcard.png" 
                    alt="Card Back" 
                    width={80} 
                    height={120} 
                    priority 
                    className="rotate-15 scale-[0.55]"
                    style={{ height: "auto" }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Debug seat number */}
          <div className="absolute -bottom-6 w-full text-center">
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
              Seat {seatNumber}
            </span>
          </div>
        </div>
      );
    }
    
    // Otherwise, render an empty seat
    return (
      <div 
        className="relative cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleSeatClick(seatNumber)}
        style={{ 
          pointerEvents: "auto", 
          touchAction: "none",
          position: "relative",
          zIndex: isHovered ? 30 : 10
        }}
      >
        <Image 
          src="/empty-seat.svg" 
          alt="Empty Seat" 
          width={80} 
          height={80} 
          className={`transition-transform duration-150 ${isHovered ? 'scale-110' : 'scale-100'}`}
          priority
          style={{ height: "auto" }}
        />
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
          <span className="text-white text-xs font-bold text-center">
            EMPTY<br />SEAT {seatNumber}
          </span>
        </div>
        {isHovered && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none">
            Click to sit here
          </div>
        )}
      </div>
    );
  };

  // Add a useEffect to log game status changes
  useEffect(() => {
    console.log("Game status changed:", gameStatus);
  }, [gameStatus]);
  
  // Add a useEffect to log players in the game state
  useEffect(() => {
    if (gameState) {
      console.log("Game state updated. Current players:", gameState.players);
      console.log("Current game phase:", gameState.gamePhase);
      if (gameState.players.length >= 2) {
        console.log("Both players seated! Human player ID:", gameState.humanPlayerId);
        console.log("Player 1 position:", gameState.players[0].position);
        console.log("Player 2 position:", gameState.players[1].position);
      }
    }
  }, [gameState]);
  
  // Add useEffect to debug card dealing
  useEffect(() => {
    if (gameState && gameStatus === 'playing') {
      console.log("Cards should be visible now - Game phase:", gameState.gamePhase);
      
      const humanPlayer = gameState.players.find(p => p.id === gameState.humanPlayerId);
      if (humanPlayer && humanPlayer.holeCards.length === 2) {
        console.log("Human player's cards:", humanPlayer.holeCards);
        console.log("Card 1 image path:", getCardImagePath(humanPlayer.holeCards[0]));
        console.log("Card 2 image path:", getCardImagePath(humanPlayer.holeCards[1]));
      } else {
        console.log("Human player has no cards yet or not found");
      }
    }
  }, [gameStatus, gameState]);
  
  // Add helper function to get dealer button position for each seat
  const getDealerButtonPosition = (seatNumber: number) => {
    const positions: { [key: number]: { top: string, left: string } } = {
      1: { top: 'calc(65% - 20px)', left: 'calc(28% - 30px)' },
      2: { top: 'calc(52% - 20px)', left: 'calc(15% - 20px)' },
      3: { top: 'calc(40% - 20px)', left: 'calc(18% - 0px)' },
      4: { top: 'calc(37% - 20px)', left: 'calc(28% - 0px)' },
      5: { top: 'calc(37% - 20px)', left: 'calc(66% - 0px)' },
      6: { top: 'calc(39% - 20px)', left: 'calc(77% - 0px)' },
      7: { top: 'calc(52% - 17px)', left: 'calc(82% + 0px)' },
      8: { top: 'calc(65% - 20px)', left: 'calc(69% + 30px)' },
      9: { top: 'calc(65% - 20px)', left: 'calc(45% + 40px)' }
    };
    
    return positions[seatNumber] || { top: '0', left: '0' };
  };

  // Helper function to get blind chips position for each seat
  const getChipPosition = (seatNumber: number) => {
    const positions: { [key: number]: { top: string, left: string } } = {
      1: { top: 'calc(60% + 20px)', left: 'calc(23% + 15px)' },
      2: { top: 'calc(37% + 21px)', left: 'calc(6% + 28px)' },
      3: { top: 'calc(20% + 20px)', left: 'calc(11% + 30px)' },
      4: { top: 'calc(12% + 22px)', left: 'calc(25% + 28px)' },
      5: { top: 'calc(12% + 22px)', left: 'calc(68% - 22px)' },
      6: { top: 'calc(17% + 20px)', left: 'calc(83% - 30px)' },
      7: { top: 'calc(40% + 14px)', left: 'calc(89% - 24px)' },
      8: { top: 'calc(58% + 26px)', left: 'calc(73% - 5px)' },
      9: { top: 'calc(60% + 20px)', left: 'calc(50% - 10px)' }
    };
    
    return positions[seatNumber] || { top: '0', left: '0' };
  };

  // Add these turn management functions after the startGame function
  /**
   * Get the next player in turn order (clockwise)
   * Skips players who have folded or are all-in
   */
  const getNextPlayerInTurn = (gameState: GameState, currentPosition: number | null): number | null => {
    if (!gameState || gameState.players.length < 2) {
      return null;
    }
    
    // Sort players by position for clockwise order
    const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position);
    
    // If no current position, start with player after big blind
    if (currentPosition === null) {
      const bbIndex = sortedPlayers.findIndex(p => p.isBigBlind);
      if (bbIndex === -1) return sortedPlayers[0].position;
      return sortedPlayers[(bbIndex + 1) % sortedPlayers.length].position;
    }
    
    // Find the current player's index
    const currentIndex = sortedPlayers.findIndex(p => p.position === currentPosition);
    if (currentIndex === -1) {
      console.error("Current player position not found:", currentPosition);
      return sortedPlayers[0].position; // Fallback to first player
    }
    
    // Find the next active player (not folded or all-in)
    let nextIndex = (currentIndex + 1) % sortedPlayers.length;
    let loopCount = 0;
    
    // Loop through players until we find an active one or have checked all players
    while (loopCount < sortedPlayers.length) {
      const nextPlayer = sortedPlayers[nextIndex];
      
      // Only active players can take their turn
      if (nextPlayer.status === 'active') {
        return nextPlayer.position;
      }
      
      // Move to the next player
      nextIndex = (nextIndex + 1) % sortedPlayers.length;
      loopCount++;
    }
    
    // If all players are inactive (folded/all-in), return null to end the round
    return null;
  };

  /**
   * Advance the turn to the next player
   */
  const advanceTurn = (gameState: GameState): GameState => {
    // Create a copy of the game state
    const newGameState = { ...gameState };
    
    // Get the next player in turn
    const nextPlayerPosition = getNextPlayerInTurn(newGameState, newGameState.currentPlayerTurn);
    
    // If there's no next player (all folded or all-in), end the round
    if (nextPlayerPosition === null) {
      // End current betting round and advance to next phase
      advanceGamePhase(newGameState);
      return newGameState;
    }
    
    // Set the next player as the current turn
    newGameState.currentPlayerTurn = nextPlayerPosition;
    console.log(`Turn advanced to player at position ${nextPlayerPosition}`);
    
    return newGameState;
  };

  /**
   * Advance the game phase after a betting round ends
   */
  const advanceGamePhase = (gameState: GameState): void => {
    // If game is not in betting phase, do nothing
    if (gameState.gamePhase !== 'betting') {
      return;
    }
    
    console.log(`Advancing game phase from ${gameState.currentBettingRound}`);
    
    // Handle different betting rounds
    switch (gameState.currentBettingRound) {
      case 'pre-flop':
        // Deal the flop (first three community cards)
        dealFlop(gameState);
        gameState.currentBettingRound = 'flop';
        break;
        
      case 'flop':
        // Deal the turn (fourth community card)
        dealTurn(gameState);
        gameState.currentBettingRound = 'turn';
        break;
        
      case 'turn':
        // Deal the river (fifth community card)
        dealRiver(gameState);
        gameState.currentBettingRound = 'river';
        break;
        
      case 'river':
        // Move to showdown
        gameState.gamePhase = 'showdown';
        gameState.currentBettingRound = 'showdown';
        // In a real game, this would evaluate hands and determine the winner
        break;
        
      default:
        console.error("Unknown betting round:", gameState.currentBettingRound);
    }
    
    // Reset bets for the new round if not at showdown
    if (gameState.currentBettingRound !== 'showdown') {
      resetBetsForNewRound(gameState);
      
      // Set the player after the dealer as the first to act in post-flop rounds
      const sortedPlayers = [...gameState.players].sort((a, b) => a.position - b.position);
      const dealerIndex = sortedPlayers.findIndex(p => p.isDealer);
      const firstToActIndex = (dealerIndex + 1) % sortedPlayers.length;
      
      // Check if this player is still active
      if (sortedPlayers[firstToActIndex].status === 'active') {
        gameState.currentPlayerTurn = sortedPlayers[firstToActIndex].position;
      } else {
        // Find the next active player
        gameState.currentPlayerTurn = getNextPlayerInTurn(gameState, sortedPlayers[firstToActIndex].position);
      }
    }
    
    console.log(`Advanced to ${gameState.currentBettingRound}, turn: ${gameState.currentPlayerTurn}`);
  };

  /**
   * Reset all players' bets for a new betting round
   */
  const resetBetsForNewRound = (gameState: GameState): void => {
    gameState.players.forEach(player => {
      player.currentBet = 0;
    });
    
    // Reset the minimum bet to the big blind
    gameState.minBet = gameState.blinds.big;
    gameState.lastRaiseAmount = 0;
    
    console.log("Reset bets for new round");
  };

  /**
   * Deal the flop (first three community cards)
   */
  const dealFlop = (gameState: GameState): void => {
    // Burn a card first (standard poker procedure)
    gameState.deck.pop();
    
    // Deal three cards to the community
    for (let i = 0; i < 3; i++) {
      const card = gameState.deck.pop();
      if (card) {
        gameState.communityCards.push(card);
      }
    }
    
    console.log("Dealt flop:", gameState.communityCards);
  };

  /**
   * Deal the turn (fourth community card)
   */
  const dealTurn = (gameState: GameState): void => {
    // Burn a card first
    gameState.deck.pop();
    
    // Deal the turn card
    const card = gameState.deck.pop();
    if (card) {
      gameState.communityCards.push(card);
    }
    
    console.log("Dealt turn:", gameState.communityCards[3]);
  };

  /**
   * Deal the river (fifth community card)
   */
  const dealRiver = (gameState: GameState): void => {
    // Burn a card first
    gameState.deck.pop();
    
    // Deal the river card
    const card = gameState.deck.pop();
    if (card) {
      gameState.communityCards.push(card);
    }
    
    console.log("Dealt river:", gameState.communityCards[4]);
  };

  /**
   * Check if it's a player's turn
   */
  const isPlayerTurn = useCallback((gameState: GameState, playerId: string): boolean => {
    if (!gameState || gameState.currentPlayerTurn === null) return false;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;
    
    return player.position === gameState.currentPlayerTurn;
  }, []);

  /**
   * Get valid actions for the current player
   */
  const getValidActions = useCallback((gameState: GameState): PlayerAction[] => {
    if (!gameState || gameState.currentPlayerTurn === null) {
      return [];
    }
    
    const currentPlayer = gameState.players.find(p => p.position === gameState.currentPlayerTurn);
    if (!currentPlayer) return [];
    
    const validActions: PlayerAction[] = ['fold'];
    
    // Find the highest bet at the table
    const highestBet = Math.max(...gameState.players.map(p => p.currentBet));
    
    // If no one has bet yet or player has matched the highest bet, they can check
    if (highestBet === 0 || currentPlayer.currentBet === highestBet) {
      validActions.push('check');
    }
    
    // If there's a bet to call and player has enough chips
    if (highestBet > currentPlayer.currentBet && currentPlayer.chips > highestBet - currentPlayer.currentBet) {
      validActions.push('call');
    }
    
    // If player has enough chips to bet or raise
    if (currentPlayer.chips > 0) {
      // If no bet yet, player can bet
      if (highestBet === 0) {
        validActions.push('bet');
      } 
      // If there's already a bet, player can raise if they have enough chips
      else if (currentPlayer.chips > highestBet - currentPlayer.currentBet + gameState.minBet) {
        validActions.push('raise');
      }
    }
    
    // All-in is always an option if player has chips
    if (currentPlayer.chips > 0) {
      validActions.push('all-in');
    }
    
    return validActions;
  }, []);

  // Function to handle button actions from the UI
  const handleAction = (action: string) => {
    console.log(`Player action: ${action}`);
    
    // Process the player action
    switch(action) {
      case 'stand':
        // Handle player standing up (leaving the table)
        setGameState(null);
        console.log("Player stood up from table");
        break;
      
      case 'toggleCards':
        // Toggle card visibility for testing
        setPlayerCardsVisible(prev => !prev);
        console.log("Toggled card visibility:", !playerCardsVisible);
        break;
      
      case 'call':
      case 'check':
      case 'bet':
      case 'raise':
      case 'fold':
      case 'all-in':
        // Handle poker actions
        processPlayerAction(action);
        break;
        
      default:
        if (action.startsWith('bet_') || action.startsWith('all_in_')) {
          // Handle bet amount actions
          processPlayerAction(action);
        } else {
          console.log("Action not implemented:", action);
        }
    }
  };

  // Add a useEffect to update playerData when gameState changes
  useEffect(() => {
    if (gameState && gameState.humanPlayerId) {
      // Find the human player
      const humanPlayer = gameState.players.find(p => p.id === gameState.humanPlayerId);
      if (humanPlayer) {
        // Update playerData with the current chips from gameState
        setPlayerData(prevData => ({
          ...prevData,
          chips: humanPlayer.chips
        }));
        console.log("Updated player chips in UI to:", humanPlayer.chips);
      }
    }
  }, [gameState]);

  // Add a function to update UI based on valid actions
  const updateActionButtons = useCallback(() => {
    if (!gameState || !gameState.humanPlayerId) return;
    
    const isHumanTurn = isPlayerTurn(gameState, gameState.humanPlayerId);
    const validActions = getValidActions(gameState);
    
    console.log("Current turn:", isHumanTurn ? "Human player" : "CPU player");
    console.log("Valid actions:", validActions);
    
    // In a real implementation, this would enable/disable buttons
    // based on the valid actions
  }, [gameState, isPlayerTurn, getValidActions]);
  
  // Call this whenever gameState changes
  useEffect(() => {
    if (gameState) {
      updateActionButtons();
    }
  }, [gameState, updateActionButtons]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden"
         style={{
           backgroundImage: "url('/pokerback-ground.png')",
           backgroundSize: "cover",
           backgroundPosition: "center",
           backgroundRepeat: "no-repeat",
           backgroundAttachment: "fixed",
           height: "100vh",
           width: "100vw",
         }}>
      
      {/* Game status indicator for debugging */}
      <div className="absolute top-5 right-[120px] bg-black/70 text-white px-4 py-2 rounded-lg z-50">
        Status: {gameStatus} {gameState && `(Players: ${gameState.players.length})`}
      </div>
      
      {/* Game information - only shown for tournaments */}
      {playerData.gameType === 'tournament' && (
        <div className="absolute top-5 left-5 w-[162px] p-6 bg-gradient-to-b from-[#21516f] to-[#153f59] rounded-[35px] outline-[5px] outline-offset-[-5px] outline-[#3c5e6d] inline-flex flex-col justify-center items-start gap-2">
          <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">BLINDS</div>
          <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">{playerData.blinds}</div>
          <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">TIME</div>
          <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">9:41</div>
        </div>
      )}
      
      {/* Poker table - positioned 100px above the control panel */}
      <div className="absolute bottom-[415px] left-1/2 transform -translate-x-1/2">
        <div className="poker-table-container relative" style={{ minWidth: "1047px", width: "1047px", height: "auto" }}>
          <Image 
            src="/poker-table.svg" 
            alt="Poker Table" 
            width={1047} 
            height={534} 
            priority 
            style={{ 
              width: "100%", 
              height: "auto",
              maxWidth: "100%",
            }}
            className="poker-table"
          />
          
          {/* Pot display in the middle of the table */}
          {gameState && gameState.pot > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center">
                <span className="mr-2 font-bold">POT:</span>
                <span className="text-xl font-bold">{gameState.pot}</span>
              </div>
            </div>
          )}
          
          {/* Waiting for players message */}
          {(gameStatus === 'waiting' || gameStatus === 'ready') && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-black/80 text-white px-8 py-6 rounded-xl flex flex-col items-center">
                <div className="animate-pulse mb-4">
                  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="text-2xl font-bold font-['Exo']">
                  {gameStatus === 'waiting' ? 'Waiting for players...' : 'Player found! Starting game...'}
                </div>
                <div className="text-gray-300 mt-2">
                  {gameStatus === 'waiting' ? 'Looking for an opponent' : 'Dealing cards...'}
                </div>
              </div>
            </div>
          )}
          
          {/* Seat positions around the table - numbered counterclockwise */}
          {/* Bottom left - Seat 1 */}
          <div className="absolute bottom-[-15%] left-[20%] ">
            <EmptySeat seatNumber={1} />
          </div>
          
          {/* Lower left - Seat 2 */}
          <div className="absolute bottom-[42%] left-[-10%]">
            <EmptySeat seatNumber={2} />
          </div>
          
          {/* Middle left - Seat 3 */}
          <div className="absolute top-[-30%] left-[-4%] transform translate-x-1/2">
            <EmptySeat seatNumber={3} />
          </div>
          
          {/* Upper left - Seat 4 */}
          <div className="absolute top-[-40%] left-[25%]">
            <EmptySeat seatNumber={4} />
          </div>
          
          {/* Top left - Seat 5 */}
          <div className="absolute top-[-40%] right-[25%] transform -translate-x-1/2">
            <EmptySeat seatNumber={5} />
          </div>
          
          {/* Top right - Seat 6 */}
          <div className="absolute top-[-30%] right-[7%] transform translate-x-1/2">
            <EmptySeat seatNumber={6} />
          </div>
          
          {/* Upper right - Seat 7 */}
          <div className="absolute top-[30%] right-[-10%]">
            <EmptySeat seatNumber={7} />
          </div>
          
          {/* Lower right - Seat 8 */}
          <div className="absolute bottom-[-15%] right-[20%]">
            <EmptySeat seatNumber={8} />
          </div>
          
          {/* Bottom right (player position) - Seat 9 */}
          <div className="absolute bottom-[-15%] left-1/2 transform translate-x-[25%]">
            <EmptySeat seatNumber={9} />
          </div>
        </div>
        
        {/* Mock Dealer Buttons and Chips for Positioning */}
        <div className="absolute inset-0">
          {/* Dealer button and blinds visualization */}
          {gameState?.players.map((player) => (
            <React.Fragment key={player.id}>
              {/* Dealer button */}
              {player.isDealer && (
                <div
                  className="absolute z-30"
                  style={{
                    top: getDealerButtonPosition(player.position).top,
                    left: getDealerButtonPosition(player.position).left,
                  }}
                >
                  <Image
                    src="/dealer-chip.svg"
                    alt="Dealer"
                    width={40}
                    height={40}
                    priority
                    style={{ height: "auto" }}
                  />
                </div>
              )}

              {/* Small blind chip */}
              {player.isSmallBlind && player.currentBet > 0 && (
                <div
                  className="absolute z-30"
                  style={{
                    top: getChipPosition(player.position).top,
                    left: getChipPosition(player.position).left,
                  }}
                >
                  <div className="relative">
                    <Image
                      src="/red-chip.svg"
                      alt="Small Blind"
                      width={40}
                      height={40}
                      priority
                      style={{ height: "auto", width: "auto" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {gameState.blinds.small}
                    </div>
                  </div>
                </div>
              )}

              {/* Big blind chip */}
              {player.isBigBlind && player.currentBet > 0 && (
                <div
                  className="absolute z-30"
                  style={{
                    top: getChipPosition(player.position).top,
                    left: getChipPosition(player.position).left,
                  }}
                >
                  <div className="relative">
                    <Image
                      src="/blue-chip.svg"
                      alt="Big Blind"
                      width={40}
                      height={40}
                      priority
                      style={{ height: "auto", width: "auto" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {gameState.blinds.big}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
      </div>
      
      {/* Back to lobby link */}
      <Link href="/" className="absolute top-5 right-5 bg-gray-800/80 text-white px-4 py-2 rounded-lg">
        Back to Lobby
      </Link>
      
      {/* Player's cards - positioned above the user avatar in the control panel */}
      <div className="absolute bottom-[276px] left-1/2 transform -translate-x-1/2 flex z-10">
        {playerCardsVisible && gameState && gameStatus === 'playing' && (
          <>
            {card1 ? (
              <div className="relative -rotate-6 -mr-8">
                <Image 
                  src={card1} 
                  alt="First Card" 
                  width={106} 
                  height={155} 
                  priority
                  unoptimized={true}
                  style={{ height: "auto" }}
                />
              </div>
            ) : (
              <div className="relative -rotate-6 -mr-8">
                <div className="w-[106px] h-[155px] bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Waiting...</span>
                </div>
              </div>
            )}
            
            {card2 ? (
              <div className="relative rotate-6">
                <Image 
                  src={card2} 
                  alt="Second Card" 
                  width={106} 
                  height={155}
                  priority
                  unoptimized={true}
                  style={{ height: "auto" }}
                />
              </div>
            ) : (
              <div className="relative rotate-6">
                <div className="w-[106px] h-[155px] bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Waiting...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Poker Controls */}
      <PokerControl onAction={handleAction} playerChips={playerData.chips} avatarIndex={playerData.avatarIndex} />
      
      {/* Add styles to handle responsive behavior */}
      <style jsx global>{`
        @media (max-width: 1274px) {
          .poker-table-container {
            width: 100% !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
} 