"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Exo } from 'next/font/google';
import Header from '@/components/Header';
import BuyInOverlay from '@/components/BuyInOverlay';
import soundService from '@/services/SoundService';
import { useRouter } from 'next/navigation';

const exo = Exo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

// Cash games data
const CASH_GAMES = [
  { svg: 'nlh1020', blinds: '10/20', buyIn: '100 - 1,000', players: 2, minBuyIn: 100, maxBuyIn: 1000 },
  { svg: 'nlh100200', blinds: '100/200', buyIn: '4,000 - 40,000', players: 2, minBuyIn: 4000, maxBuyIn: 40000 },
  { svg: 'nlh5001000', blinds: '500/1,000', buyIn: '20,000 - 200k', players: 2, minBuyIn: 20000, maxBuyIn: 200000 },
  { svg: 'nlh25005000', blinds: '2,500/5,000', buyIn: '100k - 1M', players: 2, minBuyIn: 100000, maxBuyIn: 1000000 },
  { svg: 'nlh500010000', blinds: '5,000/10,000', buyIn: '200k - 2M', players: 2, minBuyIn: 200000, maxBuyIn: 2000000 },
];

const JoinButtonBg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="119" height="62" viewBox="0 0 119 62" fill="none" className="absolute inset-0">
    <path d="M15.9296 6.11273C17.1672 2.45877 20.596 0 24.4539 0H109.288C115.449 0 119.789 6.05161 117.812 11.8873L102.909 55.887C101.671 59.541 98.2427 61.9998 94.3848 61.9998H9.55065C3.38932 61.9998 -0.950255 55.9482 1.02635 50.1125L15.9296 6.11273Z" fill="url(#paint0_linear_41_28)"/>
    <defs>
      <linearGradient id="paint0_linear_41_28" x1="59.4193" y1="10.3202" x2="59.4193" y2="61.9998" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4DF0B4"/>
        <stop offset="1" stopColor="#25976C"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function Dashboard() {
  const router = useRouter();
  const [hyperTurbo, setHyperTurbo] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'tournaments' | 'cash-games'>('home');
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [selectedGame, setSelectedGame] = useState<(typeof CASH_GAMES)[0] | null>(null);

  // Initialize background music when the component mounts
  useEffect(() => {
    // For browsers with autoplay restrictions, we need user interaction
    // Create a one-time click handler to enable audio
    const enableAudio = () => {
      soundService.preloadLobbyMusic();
      soundService.playMusic('LOBBY');
      // Remove the event listener once it's used
      document.removeEventListener('click', enableAudio);
    };

    // Try to play immediately, but set up the click handler as fallback
    soundService.preloadLobbyMusic();
    soundService.playMusic('LOBBY');
    document.addEventListener('click', enableAudio, { once: true });
    
    // Cleanup on unmount
    return () => {
      soundService.stopMusic();
      document.removeEventListener('click', enableAudio);
    };
  }, []);

  const handleJoinClick = (game: (typeof CASH_GAMES)[0]) => {
    soundService.playSfx('CLICKFX');
    setSelectedGame(game);
    setShowBuyIn(true);
  };

  const handleBuyIn = (avatarIndex: number, amount: number) => {
    soundService.playSfx('CLICKFX');
    setShowBuyIn(false);
    router.push(`/poker-room?avatar=${avatarIndex}&chips=${amount}&blinds=${selectedGame?.blinds}&gameType=cash`);
  };

  // Render the main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'tournaments':
        return (
          <div className="max-w-[1260px] w-full mx-auto">
            <div className="flex flex-col mb-6">
              <div className="flex items-center text-white mb-4">
                <h1 className={`text-2xl font-bold ${exo.className}`}>TOURNAMENTS</h1>
              </div>
              <div className="h-px bg-white/10"></div>
            </div>
            <div className="text-white text-lg">
              Tournaments coming soon...
            </div>
          </div>
        );

      case 'cash-games':
        return (
          <div className="max-w-[1260px] w-full mx-auto">
            <div className="flex flex-col mb-6">
              <div className="flex items-center text-white mb-4">
                <h1 className={`text-2xl font-bold ${exo.className} w-[300px]`}>CASH GAMES</h1>
                <div className={`flex ${exo.className} ml-[200px]`}>
                  <span className="text-lg font-bold -ml-4 w-[300px]">BLINDS</span>
                  <span className="text-lg font-bold ml-56 w-[300px]">BUY-IN</span>
                  <span className="text-lg font-bold -ml-40">ACTION</span>
                </div>
              </div>
              <div className="h-px bg-white/10"></div>
            </div>

            <div className="space-y-6">
              {CASH_GAMES.map((game, index) => (
                <div key={index} className="relative flex items-center w-full">
                  <Image
                    src={`/nlh-games/${game.svg}.svg`}
                    alt={`NLH ${game.blinds}`}
                    width={1260}
                    height={80}
                    className="w-full h-auto"
                    style={{ height: "auto" }}
                  />
                  <div className="absolute right-8 w-[124.839px] h-[62px] top-7 cursor-pointer" onClick={() => handleJoinClick(game)}>
                    <JoinButtonBg />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-black text-xl font-bold ${exo.className}`}>JOIN</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default: // Home view
        return (
          <div className="w-full max-w-[1281px] h-[793px] relative mx-auto">
            <div className="w-full h-[698px] absolute left-0 top-14 bg-[#142030] rounded-tl-3xl rounded-tr-3xl">
              <div className="absolute inset-0 w-full h-full">
                <Image 
                  src="/dashboard-bg.png" 
                  alt="Dashboard Background" 
                  layout="fill"
                  objectFit="cover"
                  priority
                />
              </div>

              {/* Sponsor Logos */}
              <div className="absolute -bottom-52 left-1/2 transform -translate-x-1/2 flex justify-center items-center space-x-4 md:space-x-8 lg:space-x-16 w-full max-w-4xl px-4">
                <Image src="/provable-logo.svg" alt="Provable" width={120} height={40} className="w-auto h-5 sm:h-6 md:h-8 lg:h-10" />
                <Image src="/aleo-logo.svg" alt="Aleo" width={100} height={30} className="w-auto h-5 sm:h-6 md:h-7 lg:h-8" />
                <Image src="/ethglobal-logo.svg" alt="ETHGlobal" width={120} height={40} className="w-auto h-5 sm:h-6 md:h-8 lg:h-10" />
                <Image src="/cursor-logo.svg" alt="Cursor" width={100} height={30} className="w-auto h-4 sm:h-5 md:h-6 lg:h-7" />
              </div>

              <div className="absolute bottom-[124px] right-[64px] w-[600px]">
                <div className="text-left">
                  <div className="flex flex-col text-left mb-2 p-[32px] bg-white/5 rounded-[13px] backdrop-filter backdrop-blur-lg">
                    <h2 className={`text-white/80 text-[16px] font-bold mb-4 ${exo.className}`}>Select Avatar</h2>
                    <div className="flex justify-between gap-4">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className={`w-20 h-20 rounded-full ${num === 1 ? 'border-3 border-[#55ffbe]' : ''} overflow-hidden`}>
                          <Image 
                            src={`/avatar${num}.png`}
                            alt={`Avatar ${num}`}
                            width={80}
                            height={80}
                            priority
                            unoptimized={num === 1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-[32px] bg-white/5 rounded-[13px] backdrop-filter backdrop-blur-lg">
                    <h2 className={`text-white/80 text-[16px] font-bold mb-4 ${exo.className}`}>Enter Amount</h2>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          defaultValue="0.00" 
                          className={`w-[354px] h-[48px] bg-white/5 rounded-[13px] px-4 text-white outline-2 outline-[#e7e7e7]/20 inline-flex justify-center items-center mb-2 ${exo.className}`}
                        />
                        <div className="flex gap-2">
                          {['5', '10', '50', 'MAX'].map((value) => (
                            <div 
                              key={value}
                              className="w-[83px] h-12 px-[37px] py-2.5 bg-white/5 rounded-[13px] outline-2 outline-[#e7e7e7]/20 inline-flex justify-center items-center gap-2.5 cursor-pointer"
                            >
                              <div className={`text-center text-white text-lg font-bold ${exo.className}`}>
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center cursor-pointer">
                        <Image 
                          src="/play-button.svg" 
                          alt="Play" 
                          width={172} 
                          height={108}
                          priority
                          style={{ height: "auto", width: "auto" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-[102px] absolute left-0 top-[691px] bg-[#27374a] rounded-bl-3xl rounded-br-3xl border-2 border-[#37455e] flex items-center justify-between px-8">
              <div className="flex items-center gap-3">
                <Image 
                  src="/bottom-logo-faded.svg" 
                  alt="Mental Poker" 
                  width={268} 
                  height={30}
                  style={{ height: "auto", width: "auto" }}
                />
              </div>
              
              <div className="flex items-center">
                <div className="relative inline-block">
                  <input
                    type="checkbox"
                    id="hyperTurbo"
                    className="sr-only"
                    checked={hyperTurbo}
                    onChange={() => setHyperTurbo(!hyperTurbo)}
                  />
                  <div 
                    className={`flex w-[50px] h-[28px] p-[2px] items-center ${
                      hyperTurbo 
                        ? 'justify-end bg-gradient-to-b from-[#4DF0B4] from-[16.65%] to-[#25976C] to-[100%]' 
                        : 'justify-start bg-gray-400'
                    } rounded-full transition-all duration-200`}
                  >
                    <div className="w-[24px] h-[24px] bg-white rounded-full shadow-md"></div>
                  </div>
                </div>
                <div className={`text-white ml-2 font-bold ${exo.className}`}>Hyper turbo</div>
              </div>
            </div>
          </div>
          
        );
        
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0E1C2E]">
      <Header />
      
      <div className="flex flex-1 bg-[#18293E]">
        {/* Sidebar */}
        <div className={`w-[271px] min-w-[271px] bg-[#112237] ${exo.className}`}>
          <div className="flex flex-col p-5 space-y-4">
            <div 
              className={`relative w-full h-[54px] cursor-pointer ${currentView === 'home' ? 'bg-white/5' : 'hover:bg-white/5'} rounded-[13px]`}
              onClick={() => setCurrentView('home')}
            >
              <div className="absolute left-[18px] top-[11px] text-white text-2xl font-bold">HOME</div>
            </div>
            <div 
              className={`flex items-center px-[18px] py-[11px] text-white text-2xl font-bold cursor-pointer ${currentView === 'tournaments' ? 'bg-white/5' : 'hover:bg-white/5'} rounded-[13px]`}
              onClick={() => setCurrentView('tournaments')}
            >
              TOURNAMENTS
            </div>
            <div 
              className={`flex items-center px-[18px] py-[11px] text-white text-2xl font-bold cursor-pointer ${currentView === 'cash-games' ? 'bg-white/5' : 'hover:bg-white/5'} rounded-[13px]`}
              onClick={() => setCurrentView('cash-games')}
            >
              CASH GAMES
            </div>
          </div>
        </div>
        
        {/* Main Area */}
        <div className="flex-1 p-8">
          {renderMainContent()}
        </div>
      </div>

      {/* Buy-in Overlay */}
      {selectedGame && (
        <BuyInOverlay
          isOpen={showBuyIn}
          onClose={() => setShowBuyIn(false)}
          onBuyIn={handleBuyIn}
          minBuyIn={selectedGame.minBuyIn}
          maxBuyIn={selectedGame.maxBuyIn}
          blinds={selectedGame.blinds}
        />
      )}
    </div>
  );
}
