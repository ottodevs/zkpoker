"use client";

import Image from "next/image";
import Link from "next/link";
import PokerControl from "@/components/PokerControl";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// Console logging with emojis for better debugging
const logInit = (message: string) => console.log(`🚀 [Room-Init] ${message}`);
const logError = (message: string, error?: any) => console.error(`❌ [Room-Error] ${message}`, error || '');
const logInfo = (message: string) => console.log(`ℹ️ [Room-Info] ${message}`);
const logAction = (action: string, message: string) => console.log(`🎮 [Room-${action}] ${message}`);

export default function PokerRoom() {
  const searchParams = useSearchParams();
  const gameId = parseInt(searchParams.get("gameId") || "1", 10);
  const isCreator = searchParams.get("creator") === "true";
  
  const [account, setAccount] = useState<string | null>(null);
  const [gameState, setGameState] = useState<{
    playerTurn: number; // 1, 2, or 3
    playerCards: [string, string]; // Card codes like "Ad", "Kc"
    communityCards: string[]; // Array of card codes
    pot: number;
    playerChips: number;
    betAmount: number;
    isPlayerTurn: boolean;
  }>({
    playerTurn: 1,
    playerCards: ["Ad", "Jd"], // Default starting cards for display
    communityCards: [],
    pot: 0,
    playerChips: 1000,
    betAmount: 0,
    isPlayerTurn: true
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Track which seat is being hovered
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [players, setPlayers] = useState<{[key: number]: {address: string, chips: number} | null}>({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
  });
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize the worker
    logInit(`Initializing poker room for game ${gameId}, creator: ${isCreator}`);
    
    if (typeof window !== 'undefined') {
      try {
        logInit("Creating worker");
        // Create the worker using a simple JS file for compatibility
        workerRef.current = new Worker(new URL('../pokerWorker.js', import.meta.url));
        
        workerRef.current.onmessage = (event) => {
          const { type, result } = event.data;
          logInfo(`Received worker response: ${type}`);
          
          if (type === "place_bet") {
            setIsLoading(false);
            // Update game state based on bet result
            logAction("Bet", `Placed bet of ${result.amount}`);
            setGameState(prev => ({
              ...prev,
              pot: prev.pot + result.amount,
              playerChips: prev.playerChips - result.amount,
              isPlayerTurn: false
            }));
          } else if (type === "error") {
            setIsLoading(false);
            logError(`Worker error: ${result}`);
            alert(`Error: ${result}`);
          } else if (type === "init") {
            logInit(`Worker initialized: ${result}`);
          }
        };
        
        // Get stored account
        const storedKey = localStorage.getItem("pokerPrivateKey");
        if (storedKey) {
          logAction("Account", "Using stored private key");
          setAccount(storedKey);
        } else {
          logError("No stored private key found");
          alert("No account found. Please go back to the lobby to create an account.");
        }

        // If we're the creator, mark seat 1 as taken
        if (isCreator && storedKey) {
          logAction("Game", "Creator taking seat 1");
          setPlayers(prev => ({
            ...prev,
            1: { address: "You (Player 1)", chips: 1000 }
          }));
        }
      } catch (error) {
        logError("Error creating worker", error);
        alert("Failed to initialize the game. Please check the console for details.");
      }
    }
    
    return () => {
      if (workerRef.current) {
        logInfo("Terminating worker");
        workerRef.current.terminate();
      }
    };
  }, [isCreator, gameId]);

  // Function to handle poker actions
  const handleAction = (action: string) => {
    if (!account) {
      alert("No account found. Please go back to the lobby.");
      return;
    }

    if (!workerRef.current) {
      logError("Worker not initialized yet");
      return;
    }

    if (action.startsWith("bet_")) {
      const amount = parseInt(action.split("_")[1], 10);
      setIsLoading(true);
      logAction("Bet", `Sending bet of ${amount} to worker`);
      
      // Place bet via the worker
      workerRef.current.postMessage({ 
        action: "place_bet", 
        data: { 
          gameId, 
          amount, 
          privateKey: account 
        } 
      });
    } else if (action === "fold") {
      // Handle fold action
      logAction("Fold", "Player folded");
      setGameState(prev => ({
        ...prev,
        isPlayerTurn: false
      }));
    } else if (action === "check") {
      // Handle check action
      logAction("Check", "Player checked");
      setGameState(prev => ({
        ...prev,
        isPlayerTurn: false
      }));
    }
    
    logInfo(`Player action: ${action}`);
  };

  // Function to handle seat click
  const handleSeatClick = (seatNumber: number) => {
    if (!account) {
      alert("No account found. Please go back to the lobby.");
      return;
    }
    
    // If seat is already taken, don't do anything
    if (players[seatNumber]) {
      logInfo(`Seat ${seatNumber} is already taken`);
      return;
    }
    
    // Take the seat
    logAction("Seat", `Taking seat ${seatNumber}`);
    setPlayers(prev => ({
      ...prev,
      [seatNumber]: { address: "You", chips: 1000 }
    }));
  };

  // Empty seat component with hover effect
  const EmptySeat = ({ seatNumber }: { seatNumber: number }) => {
    const isHovered = hoveredSeat === seatNumber;
    const isTaken = players[seatNumber] !== null;
    
    if (isTaken) {
      return (
        <div className="relative">
          <Image src="/opponent-ring.svg" alt="Player" width={80} height={80} />
          <div className="absolute top-[10px] left-[10px] w-[60px] h-[60px] rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{seatNumber}</span>
          </div>
        </div>
      );
    }
    
    return (
      <div 
        className="relative group cursor-pointer"
        onMouseEnter={() => setHoveredSeat(seatNumber)}
        onMouseLeave={() => setHoveredSeat(null)}
        onClick={() => handleSeatClick(seatNumber)}
      >
        <Image 
          src="/empty-seat.svg" 
          alt="Empty Seat" 
          width={80} 
          height={80} 
          className={`transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
        />
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
          <span className="text-white text-xs font-bold text-center">
            EMPTY<br />SEAT
          </span>
        </div>
        {isHovered && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
            Click to sit here
          </div>
        )}
      </div>
    );
  };

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
      
      {/* Game information */}
      <div className="absolute top-5 left-5 w-[162px] p-6 bg-gradient-to-b from-[#21516f] to-[#153f59] rounded-[35px] outline-[5px] outline-offset-[-5px] outline-[#3c5e6d] inline-flex flex-col justify-center items-start gap-2">
        <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">GAME ID</div>
        <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">{gameId}</div>
        <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">BLINDS</div>
        <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">100/200</div>
        <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">POT</div>
        <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">${gameState.pot}</div>
      </div>
      
      {/* Poker table - positioned 100px above the control panel */}
      <div className="absolute bottom-[415px] left-1/2 transform -translate-x-1/2">
        <div className="poker-table-container relative" style={{ minWidth: "1047px", width: "1047px" }}>
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
          
          {/* Center pot display */}
          {gameState.pot > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 px-4 py-2 rounded-lg">
              <div className="text-white font-bold text-xl">${gameState.pot}</div>
            </div>
          )}
          
          {/* Community cards */}
          {gameState.communityCards.length > 0 && (
            <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2">
              {gameState.communityCards.map((card, index) => (
                <div key={index} className="relative">
                  <Image 
                    src={`/cards/${card}.svg`} 
                    alt={`Card ${index + 1}`} 
                    width={75} 
                    height={110} 
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Seat positions around the table */}
          {/* Top row - 3 seats horizontally */}
          <div className="absolute top-[-40%] left-1/2 transform -translate-x-1/2">
            <EmptySeat seatNumber={1} />
          </div>
          
          <div className="absolute top-[-40%] left-[calc(40%-122px)] transform -translate-x-1/2">
            <EmptySeat seatNumber={2} />
          </div>
          
          <div className="absolute top-[-40%] right-[calc(40%-122px)] transform translate-x-1/2">
            <EmptySeat seatNumber={3} />
          </div>
          
          {/* Left side seats */}
          <div className="absolute -top-[76px] left-[2%]">
            <EmptySeat seatNumber={4} />
          </div>
          
          <div className="absolute bottom-[40%] left-[-10%]">
            <EmptySeat seatNumber={5} />
          </div>
          
          {/* Bottom row */}
          <div className="absolute bottom-[-15%] left-[10%]">
            <EmptySeat seatNumber={6} />
          </div>
          
          {/* Right side seats */}
          <div className="absolute bottom-[-15%] right-[10%]">
            <EmptySeat seatNumber={7} />
          </div>
          
          <div className="absolute bottom-[100%] right-[2%]">
            <EmptySeat seatNumber={8} />
          </div>
        </div>
      </div>
      
      {/* Back to lobby link */}
      <Link href="/" className="absolute top-5 right-5 bg-gray-800/80 text-white px-4 py-2 rounded-lg">
        Back to Lobby
      </Link>
      
      {/* Player's cards - positioned above the user avatar in the control panel */}
      <div className="absolute bottom-[276px] left-1/2 transform -translate-x-1/2 flex z-10">
        <div className="relative -rotate-6 -mr-8">
          <Image 
            src={`/cards/${gameState.playerCards[0]}.svg`} 
            alt="Card 1" 
            width={106} 
            height={155} 
          />
        </div>
        <div className="relative rotate-6">
          <Image 
            src={`/cards/${gameState.playerCards[1]}.svg`} 
            alt="Card 2" 
            width={106} 
            height={155} 
          />
        </div>
      </div>
      
      {/* Poker Controls */}
      <PokerControl 
        onAction={handleAction} 
        playerChips={gameState.playerChips} 
        minBet={100}
        isPlayerTurn={gameState.isPlayerTurn}
        isLoading={isLoading}
      />
      
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