"use client";

import React, { useState } from 'react';
import soundService from '@/services/SoundService';

export default function TestAudioPage() {
  const [log, setLog] = useState<string[]>([]);
  const [volume, setVolume] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const logMessage = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toISOString()}] ${msg}`]);
  };

  const playMusic = () => {
    logMessage('Attempting to play music using SoundService');
    soundService.playMusic('LOBBY');
    setIsPlaying(true);
  };

  const stopMusic = () => {
    logMessage('Stopping music');
    soundService.stopMusic();
    setIsPlaying(false);
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    soundService.setMusicVolume(newVolume);
    logMessage(`Volume set to ${newVolume}`);
  };

  const playTestTone = () => {
    logMessage('Playing test tone...');
    
    // Create an oscillator for a test tone
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz = A4 note
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = 0.5; // Half volume
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1); // Play for 1 second
      
      logMessage('Test tone should be playing now');
    } catch (error) {
      logMessage(`Error playing test tone: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Audio Testing Page</h1>
      
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold">SoundService Controls</h2>
        <div className="flex space-x-4">
          <button 
            onClick={playMusic} 
            disabled={isPlaying}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            Play Lobby Music
          </button>
          
          <button 
            onClick={stopMusic}
            disabled={!isPlaying}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
          >
            Stop Music
          </button>
          
          <button 
            onClick={playTestTone}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Play Test Tone (1 sec)
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Native Audio Player</h2>
        <audio 
          src="/sounds/music/lobby.mp3" 
          controls 
          className="w-full max-w-md"
        />
        <p className="text-sm text-gray-600 mt-2">
          This is a direct HTML5 audio element. If you can hear sound here but not from the buttons above,
          the issue is with our SoundService implementation.
        </p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Log</h2>
        <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {log.map((message, i) => (
            <div key={i} className="mb-1">{message}</div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check that your system volume is turned up</li>
          <li>Ensure your browser has permission to play audio</li>
          <li>Try using headphones to rule out speaker issues</li>
          <li>Different browsers handle audio differently - try Chrome, Firefox, or Safari</li>
          <li>If the native audio player works but the SoundService doesn&apos;t, we need to fix our implementation</li>
          <li>If nothing works, the MP3 file might be corrupted or silent</li>
        </ul>
      </div>
    </div>
  );
} 