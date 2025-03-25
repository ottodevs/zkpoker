'use client'

import { useSound } from '@/components/providers/sound-provider'
import { ControlButton } from '@/components/ui/control-button'
import { Music, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function SoundToggle() {
    const { isMuted, isMusicEnabled, musicVolume, sfxVolume, toggleMute, toggleMusic, setMusicVolume, setSfxVolume } =
        useSound()

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Setup click outside listener
    useEffect(() => {
        // Add click outside listener to close dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside)

        // Cleanup function
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        setMusicVolume(value)
    }

    const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        setSfxVolume(value)
    }

    const IconComponent = useMemo(() => (isMuted ? VolumeX : Volume2), [isMuted])

    return (
        <div className='relative' ref={dropdownRef}>
            <ControlButton variant='bordered' onClick={toggleDropdown} aria-label='Sound settings'>
                <IconComponent className='size-4' />
            </ControlButton>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className='absolute right-0 z-50 mt-2 w-60 rounded-lg border border-[#37455e] bg-[#0E1C2E] p-4 shadow-lg'>
                    <div className='mb-4 flex items-center justify-between'>
                        <h3 className='text-sm font-bold text-white'>Sound Settings</h3>
                        <button
                            onClick={toggleMute}
                            className='rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20'>
                            {isMuted ? 'Unmute All' : 'Mute All'}
                        </button>
                    </div>

                    {/* Music Toggle */}
                    <div className='mb-4 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <Music className='h-4 w-4 text-[#4df0b4]/70' />
                            <span className='text-xs text-white'>Background Music</span>
                        </div>
                        <button
                            onClick={toggleMusic}
                            className={`rounded px-2 py-1 text-xs text-white ${
                                isMusicEnabled
                                    ? 'bg-[#4DF0B4]/20 hover:bg-[#4DF0B4]/30'
                                    : 'bg-white/10 hover:bg-white/20'
                            }`}>
                            {isMusicEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>

                    {/* Music Volume */}
                    <div className='mb-4'>
                        <div className='mb-1 flex items-center justify-between'>
                            <label className='text-xs text-white'>Music Volume</label>
                            <span className='text-xs text-white'>{musicVolume}%</span>
                        </div>
                        <input
                            type='range'
                            min='0'
                            max='100'
                            value={musicVolume}
                            onChange={handleMusicVolumeChange}
                            className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#4DF0B4]'
                            disabled={!isMusicEnabled}
                        />
                    </div>

                    {/* SFX Volume */}
                    <div>
                        <div className='mb-1 flex items-center justify-between'>
                            <label className='text-xs text-white'>Sound Effects</label>
                            <span className='text-xs text-white'>{sfxVolume}%</span>
                        </div>
                        <input
                            type='range'
                            min='0'
                            max='100'
                            value={sfxVolume}
                            onChange={handleSfxVolumeChange}
                            className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#4DF0B4]'
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
