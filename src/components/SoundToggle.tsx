"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import soundService from '@/services/SoundService';

export default function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [musicVolume, setMusicVolume] = useState(30);
  const [sfxVolume, setSfxVolume] = useState(50);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize sound service when component mounts
  useEffect(() => {
    soundService.preloadSounds();
    
    // Add click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setMusicVolume(value);
    soundService.setMusicVolume(value / 100);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSfxVolume(value);
    soundService.setSfxVolume(value / 100);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Sound settings"
      >
        {isMuted ? (
          <Image 
            src="/icons/volume-mute.svg" 
            alt="Sound muted" 
            width={24} 
            height={24}
          />
        ) : (
          <Image 
            src="/icons/volume-up.svg" 
            alt="Sound on" 
            width={24} 
            height={24}
          />
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-[#0E1C2E] rounded-lg shadow-lg p-4 z-50 border border-[#37455e]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-sm font-bold">Sound Settings</h3>
            <button 
              onClick={toggleMute}
              className="text-white text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
            >
              {isMuted ? "Unmute All" : "Mute All"}
            </button>
          </div>
          
          {/* Music Volume */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-white text-xs">Music Volume</label>
              <span className="text-white text-xs">{musicVolume}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={musicVolume} 
              onChange={handleMusicVolumeChange}
              className="w-full accent-[#4DF0B4] bg-white/20 h-2 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* SFX Volume */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-white text-xs">Sound Effects</label>
              <span className="text-white text-xs">{sfxVolume}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sfxVolume} 
              onChange={handleSfxVolumeChange}
              className="w-full accent-[#4DF0B4] bg-white/20 h-2 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
} 