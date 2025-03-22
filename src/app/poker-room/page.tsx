"use client";

import Image from "next/image";
import Link from "next/link";
import PokerControl from "@/components/PokerControl";
import { useState } from "react";

export default function PokerRoom() {
  // Function to handle button actions with console logs
  const handleAction = (action: string) => {
    console.log(`Player action: ${action}`);
  };

  // Track which seat is being hovered
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

  // Function to handle seat click
  const handleSeatClick = (seatNumber: number) => {
    console.log(`Clicked on seat ${seatNumber}`);
    // Additional logic for seat selection would go here
  };

  // Empty seat component with hover effect
  const EmptySeat = ({ seatNumber }: { seatNumber: number }) => {
    const isHovered = hoveredSeat === seatNumber;
    
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
      <div className="absolute top-5 left-5 w-[162px] p-6 bg-gradient-to-b from-[#21516f] to-[#153f59] rounded-[35px] outline outline-[5px] outline-offset-[-5px] outline-[#3c5e6d] inline-flex flex-col justify-center items-start gap-2">
        <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">BLINDS</div>
        <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">100/200</div>
        <div className="self-stretch justify-start text-white text-base font-bold font-['Exo']">TIME</div>
        <div className="self-stretch justify-start text-white text-2xl font-bold font-['Exo']">9:41</div>
      </div>
      
      {/* Poker table - positioned 100px above the control panel */}
      <div className="absolute bottom-[415px] left-1/2 transform -translate-x-1/2">
        <div className="poker-table-container" style={{ minWidth: "1047px", width: "1047px" }}>
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
            <Image src="/opponent-ring.svg" alt="Opponent" width={80} height={80} />
            <div 
              className="absolute top-[10px] left-[10px] w-[60px] h-[60px] rounded-full bg-purple-600"
            ></div>
          </div>
          
          <div className="absolute bottom-[40%] left-[-10%]">
            <EmptySeat seatNumber={4} />
          </div>
          
          {/* Bottom row */}
          <div className="absolute bottom-[-15%] left-[10%]">
            <EmptySeat seatNumber={5} />
          </div>
          
          {/* Position for player - center bottom */}
          {/* Player position is handled by PokerControl component */}
          
          <div className="absolute bottom-[-15%] right-[10%]">
            <EmptySeat seatNumber={6} />
          </div>
          
          {/* Right side seats */}
          <div className="absolute bottom-[100%] right-[2%]">
            <EmptySeat seatNumber={7} />
          </div>
          
          <div className="absolute top-[76px] -right-[10%]">
            <Image src="/opponent-ring.svg" alt="Opponent" width={80} height={80} />
            <div 
              className="absolute top-[10px] left-[10px] w-[60px] h-[60px] rounded-full bg-pink-600"
            ></div>
          </div>
        </div>
        
        {/* Community cards would go here */}
        
      </div>
      
      {/* Back to lobby link */}
      <Link href="/" className="absolute top-5 right-5 bg-gray-800/80 text-white px-4 py-2 rounded-lg">
        Back to Lobby
      </Link>
      
      {/* Player's cards - positioned above the user avatar in the control panel */}
      <div className="absolute bottom-[276px] left-1/2 transform -translate-x-1/2 flex z-10">
        <div className="relative -rotate-6 -mr-8">
          <Image src="/cards/ad.svg" alt="Ace of Diamonds" width={106} height={155} />
        </div>
        <div className="relative rotate-6">
          <Image src="/cards/11d.svg" alt="Jack of Diamonds" width={106} height={155} />
        </div>
      </div>
      
      {/* Poker Controls */}
      <PokerControl onAction={handleAction} />
      
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