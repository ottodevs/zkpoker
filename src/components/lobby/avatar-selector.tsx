'use client'

import { useState } from 'react'
import { AvatarButton } from './avatar-button'

export function AvatarSelector() {
    const [selectedAvatar, setSelectedAvatar] = useState(1)
    const [focused, setFocused] = useState(false)

    return (
        <div
            className={`mb-2 flex flex-col rounded-[13px] bg-white/5 p-[32px] text-left backdrop-blur-lg backdrop-filter transition-shadow duration-300 ${focused ? 'shadow-[0_0_15px_rgba(85,255,190,0.1)]' : ''}`}
            onMouseEnter={() => setFocused(true)}
            onMouseLeave={() => setFocused(false)}>
            <h2 className='mb-4 text-[16px] font-bold text-white/80'>Select Avatar</h2>
            <div className='flex flex-wrap justify-between gap-4'>
                {[1, 2, 3, 4, 5].map(num => (
                    <AvatarButton
                        key={num}
                        avatarNumber={num}
                        isSelected={selectedAvatar === num}
                        onClick={() => setSelectedAvatar(num)}
                    />
                ))}
            </div>
        </div>
    )
}
