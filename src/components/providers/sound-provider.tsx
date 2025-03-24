'use client'

import soundService from '@/services/sound-service'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

// Create a context to share sound state across the app
interface SoundContextType {
    isMuted: boolean
    isMusicEnabled: boolean
    musicVolume: number
    sfxVolume: number
    toggleMute: () => void
    toggleMusic: () => void
    setMusicVolume: (volume: number) => void
    setSfxVolume: (volume: number) => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

// Hook to use sound context
export const useSound = () => {
    const context = useContext(SoundContext)
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider')
    }
    return context
}

interface SoundProviderProps {
    children: React.ReactNode
}

export function SoundProvider({ children }: SoundProviderProps) {
    // Internal state for UI synchronization
    const [isMuted, setIsMuted] = useState(false)
    const [isMusicEnabled, setIsMusicEnabled] = useState(false)
    const [musicVolume, setMusicVolumeState] = useState(30)
    const [sfxVolume, setSfxVolumeState] = useState(50)

    // Use ref to track initialization status and prevent double initialization
    const initialized = useRef(false)

    // Initialize sound system when the provider loads
    useEffect(() => {
        if (typeof window === 'undefined') return

        // Skip initialization if already done
        if (initialized.current) return
        initialized.current = true

        // Preload sounds on mount (only happens once)
        soundService.preloadLobbyMusic()

        // Initialize state
        setIsMuted(soundService.isMuted())
        setIsMusicEnabled(soundService.isMusicEnabled())
    }, [])

    // Function to toggle mute
    const toggleMute = () => {
        const newMutedState = soundService.toggleMute()
        setIsMuted(newMutedState)
    }

    // Function to toggle music
    const toggleMusic = () => {
        const newMusicState = soundService.toggleMusicEnabled()
        setIsMusicEnabled(newMusicState)

        // If enabling music, start playing
        if (newMusicState && !soundService.isMuted()) {
            soundService.playMusic('LOBBY')
        }
    }

    // Function to set music volume
    const handleSetMusicVolume = (volume: number) => {
        // Update UI state
        setMusicVolumeState(volume)

        // Update sound service (convert from 0-100 to 0-1)
        soundService.setMusicVolume(volume / 100)
    }

    // Function to set SFX volume
    const handleSetSfxVolume = (volume: number) => {
        // Update UI state
        setSfxVolumeState(volume)

        // Update sound service (convert from 0-100 to 0-1)
        soundService.setSfxVolume(volume / 100)
    }

    // Create context value
    const value: SoundContextType = {
        isMuted,
        isMusicEnabled,
        musicVolume,
        sfxVolume,
        toggleMute,
        toggleMusic,
        setMusicVolume: handleSetMusicVolume,
        setSfxVolume: handleSetSfxVolume,
    }

    // The provider doesn't render anything additional, just provides the sound context
    return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}
