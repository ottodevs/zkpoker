'use client'

import soundService from '@/services/sound-service'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function SoundToggle() {
    const [isMuted, setIsMuted] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [musicVolume, setMusicVolume] = useState(30)
    const [sfxVolume, setSfxVolume] = useState(50)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Initialize sound service when component mounts
    useEffect(() => {
        // Add click outside listener to close dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    const toggleMute = () => {
        const muted = soundService.toggleMute()
        setIsMuted(muted)
    }

    const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        setMusicVolume(value)
        soundService.setMusicVolume(value / 100)
    }

    const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        setSfxVolume(value)
        soundService.setSfxVolume(value / 100)
    }

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className='flex h-10 w-10 items-center justify-center rounded-full transition-colors'
                aria-label='Sound settings'>
                {isMuted ? (
                    <Image src='/icons/volume-mute.svg' alt='Sound muted' width={24} height={24} />
                ) : (
                    <Image src='/icons/volume-up.svg' alt='Sound on' width={24} height={24} />
                )}
            </button>

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
