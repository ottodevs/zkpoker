import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

interface BuyInOverlayProps {
    isOpen: boolean
    onClose: () => void
    onBuyIn: (avatarIndex: number, amount: number) => void
    minBuyIn: number
    maxBuyIn: number
    blinds: string
}

export default function BuyInOverlay({
    isOpen,
    onClose,
    onBuyIn,
    minBuyIn = 100,
    maxBuyIn = 1000,
    blinds = '10/20',
}: BuyInOverlayProps) {
    const [selectedAvatar, setSelectedAvatar] = useState(0)
    const [buyInAmount, setBuyInAmount] = useState(200)
    const [sliderPosition, setSliderPosition] = useState(20) // 20% of the way between min and max
    const [isDragging, setIsDragging] = useState(false)

    const sliderRef = useRef<HTMLDivElement>(null)

    // Reset values when overlay opens
    useEffect(() => {
        if (isOpen) {
            setSelectedAvatar(0)
            setBuyInAmount(200)
            setSliderPosition(20)
        }
    }, [isOpen])

    // Update slider position when buy-in amount changes
    useEffect(() => {
        const percentage = ((buyInAmount - minBuyIn) / (maxBuyIn - minBuyIn)) * 100
        setSliderPosition(Math.max(0, Math.min(percentage, 100)))
    }, [buyInAmount, minBuyIn, maxBuyIn])

    // Handle input change
    const handleBuyInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value.replace(/\D/g, '') || '0', 10)
        const clamped = Math.min(Math.max(value, minBuyIn), maxBuyIn)
        setBuyInAmount(clamped)
    }

    // Handle slider click
    const handleSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) {
            // Only handle if not already dragging
            updateSliderFromClientX(event.clientX)
        }
    }

    // Handle slider thumb mouse down for dragging
    const handleMouseDown = (event: React.MouseEvent) => {
        event.preventDefault() // Prevent text selection during drag
        setIsDragging(true)
    }

    // Update slider position based on mouse position
    const updateSliderFromClientX = useCallback(
        (clientX: number) => {
            if (sliderRef.current) {
                const rect = sliderRef.current.getBoundingClientRect()
                const position = clientX - rect.left
                const percentage = Math.min(Math.max((position / rect.width) * 100, 0), 100)

                const newAmount = Math.round(minBuyIn + (percentage / 100) * (maxBuyIn - minBuyIn))
                setBuyInAmount(newAmount)
            }
        },
        [minBuyIn, maxBuyIn],
    )

    // Add global mouse event listeners for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateSliderFromClientX(e.clientX)
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        // Clean up event listeners
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, updateSliderFromClientX])

    // Set to minimum buy-in
    const handleMinClick = () => {
        setBuyInAmount(minBuyIn)
    }

    // Set to maximum buy-in
    const handleMaxClick = () => {
        setBuyInAmount(maxBuyIn)
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
            <div
                className={`relative w-[616px] rounded-[20px] bg-gradient-to-b from-[#273b56] to-[#0d1c2d] shadow-[0px_0px_125px_14px_rgba(0,0,0,0.45)]`}>
                {/* Close button */}
                <button className='absolute top-6 right-6 h-6 w-6 text-white' onClick={onClose}>
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path
                            d='M18 6L6 18M6 6L18 18'
                            stroke='white'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </button>

                {/* Avatar selection section */}
                <div className='px-8 pt-8'>
                    <h2 className='mb-4 text-base font-bold text-white/70'>Select Avatar</h2>

                    <div className='mb-8 flex gap-4'>
                        {[0, 1, 2, 3, 4].map(index => (
                            <button
                                key={index}
                                className={`relative h-[88px] w-[88px] overflow-hidden rounded-full bg-[#273b56] transition-all duration-200 ${selectedAvatar === index ? 'scale-110 ring-4 ring-[#4df0b3] ring-offset-2 ring-offset-[#0d1c2d]' : 'hover:ring-2 hover:ring-white/50'}`}
                                onClick={() => setSelectedAvatar(index)}>
                                <Image
                                    src={`/images/avatars/avatar${index + 1}.png`}
                                    alt={`Avatar ${index + 1}`}
                                    width={88}
                                    height={88}
                                    className='h-full w-full object-cover'
                                    unoptimized
                                    priority
                                />
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className='mb-8 h-[1px] w-full bg-white/20' />

                    {/* Buy-in info */}
                    <div className='mb-4'>
                        <h2 className='text-base font-bold text-white/70'>No Limit Buy-In: {blinds}</h2>
                    </div>

                    {/* Balance display */}
                    <div className='mb-8 flex h-12 w-full items-center rounded-[13px] bg-white/5 px-6 py-2.5'>
                        <div className='text-lg font-bold text-white'>Balance: </div>
                        <div className='ml-1 flex items-center gap-1.5'>
                            <div className='flex h-[22.7px] w-[22.7px] items-center justify-center rounded-full bg-[#121212]'>
                                <Image
                                    src='/images/icons/aleo-icon.svg'
                                    alt='Aleo'
                                    width={12}
                                    height={13}
                                    style={{ height: 'auto', width: 'auto' }}
                                />
                            </div>
                            <div className='text-lg font-bold text-white'>1,000 Aleo</div>
                        </div>
                    </div>

                    {/* Buy-in amount section */}
                    <div className='mb-8'>
                        <div className='mb-8 flex justify-between'>
                            <div className='text-base font-bold text-white/70'>Buy-in Amount</div>
                            <div className='flex h-12 w-52 items-center justify-end rounded-[13px] bg-white/5 px-6 py-2.5 outline-2 outline-[#e7e7e7]/20'>
                                <input
                                    type='text'
                                    value={buyInAmount}
                                    onChange={handleBuyInChange}
                                    className='w-full bg-transparent text-right text-lg font-bold text-white outline-none'
                                />
                            </div>
                        </div>

                        {/* Min/Max and slider section */}
                        <div className='mb-16 flex items-center'>
                            {/* MIN button */}
                            <button
                                className='flex cursor-pointer flex-col items-center rounded-[13px] bg-white/5 px-[38px] py-2.5 outline-2 outline-[#e7e7e7]/20 transition-colors hover:bg-white/10'
                                onClick={handleMinClick}>
                                <div className='text-lg font-bold text-white'>MIN</div>
                                <div className='text-lg font-bold text-white'>{minBuyIn}</div>
                            </button>

                            {/* Slider - Added px-6 for padding on both sides */}
                            <div className='relative mx-4 flex-1 px-6'>
                                {/* Slider track */}
                                <div
                                    ref={sliderRef}
                                    className='relative h-[15px] w-full cursor-pointer bg-[#e7e7e7]/20'
                                    onClick={handleSliderClick}>
                                    {/* Active part of slider */}
                                    <div
                                        className='absolute top-0 left-0 h-full bg-[#40d09a]'
                                        style={{ width: `${sliderPosition}%` }}
                                    />

                                    {/* Slider thumb */}
                                    <div
                                        className={`absolute top-[-4px] h-[23px] w-[30px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                        style={{ left: `calc(${sliderPosition}% - 15px)` }}
                                        onMouseDown={handleMouseDown}>
                                        {/* Custom slider thumb shape - diamond-like */}
                                        <svg
                                            width='30'
                                            height='23'
                                            viewBox='0 0 30 23'
                                            fill='none'
                                            xmlns='http://www.w3.org/2000/svg'>
                                            <path d='M0 0H23.8462L30 23H6.15385L0 0Z' fill='#289C72' />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* MAX button */}
                            <button
                                className='flex cursor-pointer flex-col items-center rounded-[13px] bg-white/5 px-[38px] py-2.5 outline-2 outline-[#e7e7e7]/20 transition-colors hover:bg-white/10'
                                onClick={handleMaxClick}>
                                <div className='text-lg font-bold text-white'>MAX</div>
                                <div className='text-lg font-bold text-white'>{maxBuyIn.toLocaleString()}</div>
                            </button>
                        </div>
                    </div>

                    {/* Buy in amount display */}
                    <div className='mb-8 text-center text-4xl font-bold text-white'>Buy in: {buyInAmount}</div>

                    {/* OK button */}
                    <button
                        className='mb-8 h-16 w-full rounded-[13px] bg-gradient-to-b from-[#4df0b3] to-[#24966c] text-2xl font-bold text-black transition-colors hover:from-[#5effc0] hover:to-[#2bab7c]'
                        onClick={() => onBuyIn(selectedAvatar, buyInAmount)}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}
