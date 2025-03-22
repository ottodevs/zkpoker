import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Exo } from 'next/font/google';

const exo = Exo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

interface BuyInOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyIn: (avatarIndex: number, amount: number) => void;
  minBuyIn: number;
  maxBuyIn: number;
  blinds: string;
}

export default function BuyInOverlay({
  isOpen,
  onClose,
  onBuyIn,
  minBuyIn = 100,
  maxBuyIn = 1000,
  blinds = "10/20"
}: BuyInOverlayProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [buyInAmount, setBuyInAmount] = useState(200);
  const [sliderPosition, setSliderPosition] = useState(20); // 20% of the way between min and max
  const [isDragging, setIsDragging] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Reset values when overlay opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(0);
      setBuyInAmount(200);
      setSliderPosition(20);
    }
  }, [isOpen]);
  
  // Update slider position when buy-in amount changes
  useEffect(() => {
    const percentage = ((buyInAmount - minBuyIn) / (maxBuyIn - minBuyIn)) * 100;
    setSliderPosition(Math.max(0, Math.min(percentage, 100)));
  }, [buyInAmount, minBuyIn, maxBuyIn]);
  
  // Handle input change
  const handleBuyInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/\D/g, '') || '0', 10);
    const clamped = Math.min(Math.max(value, minBuyIn), maxBuyIn);
    setBuyInAmount(clamped);
  };
  
  // Handle slider click
  const handleSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) { // Only handle if not already dragging
      updateSliderFromClientX(event.clientX);
    }
  };
  
  // Handle slider thumb mouse down for dragging
  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent text selection during drag
    setIsDragging(true);
  };
  
  // Update slider position based on mouse position
  const updateSliderFromClientX = (clientX: number) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const position = clientX - rect.left;
      const percentage = Math.min(Math.max((position / rect.width) * 100, 0), 100);
      
      const newAmount = Math.round(minBuyIn + (percentage / 100) * (maxBuyIn - minBuyIn));
      setBuyInAmount(newAmount);
    }
  };
  
  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderFromClientX(e.clientX);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Set to minimum buy-in
  const handleMinClick = () => {
    setBuyInAmount(minBuyIn);
  };
  
  // Set to maximum buy-in
  const handleMaxClick = () => {
    setBuyInAmount(maxBuyIn);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className={`w-[616px] relative bg-gradient-to-b from-[#273b56] to-[#0d1c2d] rounded-[20px] shadow-[0px_0px_125px_14px_rgba(0,0,0,0.45)] ${exo.className}`}
      >
        {/* Close button */}
        <button 
          className="absolute right-6 top-6 w-6 h-6 text-white"
          onClick={onClose}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Avatar selection section */}
        <div className="pt-8 px-8">
          <h2 className="text-white/70 text-base font-bold mb-4">Select Avatar</h2>
          
          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3, 4].map((index) => (
              <button
                key={index}
                className={`w-[88px] h-[88px] rounded-full bg-[#273b56] transition-all duration-200 overflow-hidden relative
                  ${selectedAvatar === index ? 'ring-4 ring-[#4df0b3] ring-offset-2 ring-offset-[#0d1c2d] scale-110' : 'hover:ring-2 hover:ring-white/50'}`}
                onClick={() => setSelectedAvatar(index)}
              >
                <Image 
                  src={`/avatar${index + 1}.png`}
                  alt={`Avatar ${index + 1}`} 
                  width={88} 
                  height={88}
                  className="object-cover w-full h-full"
                  unoptimized
                  priority
                />
                {selectedAvatar === index && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#4df0b3] text-black text-xs font-bold text-center py-1">
                    SELECTED
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Divider */}
          <div className="w-full h-[1px] bg-white/20 mb-8" />
          
          {/* Buy-in info */}
          <div className="mb-4">
            <h2 className="text-white/70 text-base font-bold">No Limit Buy-In: {blinds}</h2>
          </div>
          
          {/* Balance display */}
          <div className="w-full h-12 px-6 py-2.5 bg-white/5 rounded-[13px] flex items-center mb-8">
            <div className="text-white text-lg font-bold">Balance: </div>
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-[22.7px] h-[22.7px] bg-[#121212] rounded-full flex items-center justify-center">
                <Image src="/aleo-icon.svg" alt="Aleo" width={12} height={13} style={{ height: "auto" }} />
              </div>
              <div className="text-white text-lg font-bold">1,000 Aleo</div>
            </div>
          </div>
          
          {/* Buy-in amount section */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              <div className="text-white/70 text-base font-bold">Buy-in Amount</div>
              <div className="w-52 h-12 px-6 py-2.5 bg-white/5 rounded-[13px] outline outline-2 outline-[#e7e7e7]/20 flex items-center justify-end">
                <input
                  type="text"
                  value={buyInAmount}
                  onChange={handleBuyInChange}
                  className="bg-transparent text-white text-lg font-bold text-right w-full outline-none"
                />
              </div>
            </div>
            
            {/* Min/Max and slider section */}
            <div className="flex items-center mb-16">
              {/* MIN button */}
              <button 
                className="px-[38px] py-2.5 bg-white/5 rounded-[13px] outline outline-2 outline-[#e7e7e7]/20 flex flex-col items-center cursor-pointer hover:bg-white/10 transition-colors"
                onClick={handleMinClick}
              >
                <div className="text-white text-lg font-bold">MIN</div>
                <div className="text-white text-lg font-bold">{minBuyIn}</div>
              </button>
              
              {/* Slider - Added px-6 for padding on both sides */}
              <div className="flex-1 mx-4 px-6 relative">
                {/* Slider track */}
                <div 
                  ref={sliderRef}
                  className="w-full h-[15px] bg-[#e7e7e7]/20 relative cursor-pointer"
                  onClick={handleSliderClick}
                >
                  {/* Active part of slider */}
                  <div 
                    className="h-full bg-[#40d09a] absolute left-0 top-0" 
                    style={{ width: `${sliderPosition}%` }}
                  />
                  
                  {/* Slider thumb */}
                  <div 
                    className={`w-[30px] h-[23px] absolute top-[-4px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ left: `calc(${sliderPosition}% - 15px)` }}
                    onMouseDown={handleMouseDown}
                  >
                    {/* Custom slider thumb shape - diamond-like */}
                    <svg width="30" height="23" viewBox="0 0 30 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0H23.8462L30 23H6.15385L0 0Z" fill="#289C72"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* MAX button */}
              <button 
                className="px-[38px] py-2.5 bg-white/5 rounded-[13px] outline outline-2 outline-[#e7e7e7]/20 flex flex-col items-center cursor-pointer hover:bg-white/10 transition-colors"
                onClick={handleMaxClick}
              >
                <div className="text-white text-lg font-bold">MAX</div>
                <div className="text-white text-lg font-bold">{maxBuyIn.toLocaleString()}</div>
              </button>
            </div>
          </div>
          
          {/* Buy in amount display */}
          <div className="text-center text-white text-4xl font-bold mb-8">
            Buy in: {buyInAmount}
          </div>
          
          {/* OK button */}
          <button 
            className="w-full h-16 bg-gradient-to-b from-[#4df0b3] to-[#24966c] rounded-[13px] text-black text-2xl font-bold mb-8 hover:from-[#5effc0] hover:to-[#2bab7c] transition-colors"
            onClick={() => onBuyIn(selectedAvatar, buyInAmount)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
} 