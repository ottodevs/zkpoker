"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { Exo } from 'next/font/google';

const exo = Exo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

export default function Dashboard() {
  const [hyperTurbo, setHyperTurbo] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-[#0E1C2E]">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 bg-[#18293E]">
        {/* Sidebar */}
        <div className={`w-[271px] min-w-[271px] bg-[#112237] ${exo.className}`}>
          <div className="flex flex-col p-5 space-y-4">
            <Link href="/" className="relative w-full h-[54px]">
              <div className="w-full h-[54px] absolute bg-white/5 rounded-[13px]">
                <div className="absolute left-[18px] top-[11px] text-white text-2xl font-bold">HOME</div>
              </div>
            </Link>
            <Link 
              href="/tournaments"
              className="flex items-center px-[18px] py-[11px] text-white text-2xl font-bold hover:bg-white/5 rounded-[13px]"
            >
              TOURNAMENTS
            </Link>
            <Link 
              href="/cash-games"
              className="flex items-center px-[18px] py-[11px] text-white text-2xl font-bold hover:bg-white/5 rounded-[13px]"
            >
              CASH GAMES
            </Link>
          </div>
        </div>
        
        {/* Main Area */}
        <div className="flex-1 flex justify-center items-center p-8">
          <div className="w-full max-w-[1281px] h-[793px] relative mx-auto">
            {/* Main content background */}
            <div className="w-full h-[698px] absolute left-0 top-0 bg-[#142030] rounded-tl-3xl rounded-tr-3xl">
              {/* Quick Game Panel */}
              <div className="absolute bottom-[64px] right-[64px] w-[600px]">
                <div className="text-left">
                  <div className="flex flex-col text-left mb-2 p-[32px] bg-white/5 rounded-[13px]">
                    <h2 className={`text-white/80 text-[16px] font-bold mb-4 ${exo.className}`}>Select Avatar</h2>
                    
                    {/* Avatar Selection - All 5 avatars */}
                    <div className="flex justify-between gap-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <Image 
                          src="/avatar1.png" 
                          alt="Avatar 1" 
                          width={80} 
                          height={80} 
                          priority
                          unoptimized
                        />
                      </div>
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <Image 
                          src="/avatar2.png" 
                          alt="Avatar 2" 
                          width={80} 
                          height={80} 
                          priority
                        />
                      </div>
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <Image 
                          src="/avatar3.png" 
                          alt="Avatar 3" 
                          width={80} 
                          height={80} 
                          priority
                        />
                      </div>
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <Image 
                          src="/avatar4.png" 
                          alt="Avatar 4" 
                          width={80} 
                          height={80} 
                          priority
                        />
                      </div>
                      <div className="w-20 h-20 rounded-full overflow-hidden">
                        <Image 
                          src="/avatar5.png" 
                          alt="Avatar 5" 
                          width={80} 
                          height={80} 
                          priority
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Enter Amount */}
                  <div className="p-[32px] bg-white/5 rounded-[13px]">
                    <h2 className={`text-white/80 text-[16px] font-bold mb-4 ${exo.className}`}>Enter Amount</h2>
                    <div className="flex items-center">
                      <div className="flex-1">
                        {/* Amount input */}
                        <input 
                          type="text" 
                          defaultValue="0.00" 
                          className={`w-[354px] h-[48px] bg-white/5 rounded-[13px] px-4 text-white outline-2 outline-[#e7e7e7]/20 inline-flex justify-center items-center mb-2 ${exo.className}`}
                        />
                        {/* Amount buttons */}
                        <div className="flex gap-2">
                          {['5', '10', '50', 'MAX'].map((value) => (
                            <div 
                              key={value}
                              className="w-[83px] h-12 px-[37px] py-2.5 bg-white/5 rounded-[13px] outline-2 outline-[#e7e7e7]/20 inline-flex justify-center items-center gap-2.5"
                            >
                              <div className={`text-center text-white text-lg font-bold ${exo.className}`}>
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Play Button */}
                      <div className="flex items-center">
                        <Image 
                          src="/play-button.svg" 
                          alt="Play" 
                          width={172} 
                          height={108}
                          priority
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section with border */}
            <div className="w-full h-[102px] absolute left-0 top-[691px] bg-[#27374a] rounded-bl-3xl rounded-br-3xl border-2 border-[#37455e] flex items-center justify-between px-8">
              {/* Mental Poker Logo and Text */}
              <div className="flex items-center gap-3">
                <Image 
                  src="/bottom-logo-faded.svg" 
                  alt="Mental Poker" 
                  width={268} 
                  height={30}
                />
              </div>
              
              {/* Hyper Turbo Toggle */}
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

          {/* Floating Sponsor Logos */}
          <div className="absolute bottom-12 left-7/12 transform -translate-x-1/2 flex justify-center items-center gap-16 flex-wrap">
            <Image src="/provable-logo.svg" alt="Provable" width={120} height={40} />
            <Image src="/aleo-logo.svg" alt="Aleo" width={100} height={30} />
            <Image src="/ethglobal-logo.svg" alt="ETHGlobal" width={120} height={40} />
            <Image src="/cursor-logo.svg" alt="Cursor" width={100} height={30} />
          </div>
        </div>
      </div>
    </div>
  );
}
