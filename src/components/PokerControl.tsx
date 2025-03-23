import React, { useState, useRef, useEffect, useCallback } from "react";
import { Exo } from 'next/font/google';
import Image from "next/image";

// Initialize the Exo font
const exo = Exo({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

interface PokerControlProps {
  onAction: (action: string) => void;
  playerChips?: number; // Optional prop for player's total chips
  avatarIndex?: number; // Add avatar index prop
}

// SVG Components for button backgrounds
const BlueButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="66" viewBox="0 0 120 66" fill="none" className="absolute inset-0 w-full h-full transition-all duration-200">
    <path d="M105.593 8.72985C104.56 4.76607 100.98 2 96.8839 2H11.6467C5.75436 2 1.45147 7.5683 2.93775 13.2701L14.4071 57.2701C15.4403 61.2339 19.0199 64 23.1161 64H108.353C114.246 64 118.549 58.4317 117.062 52.7299L105.593 8.72985Z" fill={isHovered ? "#1e5478" : "#153F59"}/>
    <path d="M11.6467 1H96.8839C101.435 1 105.413 4.07341 106.561 8.47761L118.03 52.4776C119.681 58.813 114.9 65 108.353 65H23.1161C18.5647 65 14.5875 61.9266 13.4394 57.5224L1.97009 13.5224C0.318657 7.18699 5.09966 1 11.6467 1Z" stroke={isHovered ? "#6fa3b3" : "#4C7582"} strokeOpacity="0.7" strokeWidth="2"/>
  </svg>
);

const RightBlueButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="119" height="67" viewBox="0 0 119 67" fill="none" className="absolute inset-0 w-full h-full transition-all duration-200">
    <path d="M13.8993 9.29431C14.9325 5.33052 18.512 2.56445 22.6083 2.56445H107.845C113.738 2.56445 118.041 8.13275 116.554 13.8346L105.085 57.8346C104.052 61.7984 100.472 64.5645 96.3761 64.5645H11.1389C5.24655 64.5645 0.943658 58.9962 2.42994 53.2943L13.8993 9.29431Z" fill={isHovered ? "#1e5478" : "#153F59"}/>
    <path d="M22.6083 1.56445C18.0569 1.56445 14.0797 4.63786 12.9316 9.04207L1.46228 53.0421C-0.190713 59.3775 4.59012 65.5645 11.1389 65.5645H96.3761C100.927 65.5645 104.905 62.491 106.053 58.0868L117.522 14.0868C119.174 7.75145 114.393 1.56445 107.845 1.56445H22.6083Z" stroke={isHovered ? "#6fa3b3" : "#4C7582"} strokeOpacity="0.7" strokeWidth="2"/>
  </svg>
);

const FoldButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="170" height="67" viewBox="0 0 170 67" fill="none" className="absolute inset-0 w-full h-full transition-all duration-200">
    <path d="M156.185 9.30856C155.157 5.33778 151.574 2.56445 147.473 2.56445H11.1193C5.23299 2.56445 0.931137 8.12197 2.40657 13.8203L13.7991 57.8204C14.8272 61.7911 18.41 64.5645 22.5117 64.5645H158.865C164.751 64.5645 169.053 59.0069 167.578 53.3086L156.185 9.30856Z" fill={`url(#paint0_linear_18_1683${isHovered ? '_hover' : ''})`}/>
    <path d="M147.473 1.56445C152.03 1.56445 156.011 4.64593 157.153 9.0579L168.546 53.0579C170.185 59.3894 165.405 65.5645 158.865 65.5645H22.5117C17.9543 65.5645 13.9733 62.483 12.831 58.071L1.43849 14.071C-0.200882 7.73946 4.57896 1.56445 11.1193 1.56445H147.473Z" stroke={`url(#paint1_linear_18_1683${isHovered ? '_hover' : ''})`} strokeOpacity="0.7" strokeWidth="2"/>
    <defs>
      <linearGradient id="paint0_linear_18_1683" x1="84.9922" y1="2.56445" x2="84.9922" y2="64.5645" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6571"/>
        <stop offset="1" stopColor="#AE1E20"/>
      </linearGradient>
      <linearGradient id="paint0_linear_18_1683_hover" x1="84.9922" y1="2.56445" x2="84.9922" y2="64.5645" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7F89"/>
        <stop offset="1" stopColor="#CC2426"/>
      </linearGradient>
      <linearGradient id="paint1_linear_18_1683" x1="84.9922" y1="2.56445" x2="84.9922" y2="64.5645" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C95B5D"/>
        <stop offset="1" stopColor="#FF9395"/>
      </linearGradient>
      <linearGradient id="paint1_linear_18_1683_hover" x1="84.9922" y1="2.56445" x2="84.9922" y2="64.5645" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DA6A6C"/>
        <stop offset="1" stopColor="#FFA7A9"/>
      </linearGradient>
    </defs>
  </svg>
);

const RaiseButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="171" height="67" viewBox="0 0 171 67" fill="none" className="absolute inset-0 w-full h-full transition-all duration-200">
    <path d="M13.8859 9.2962C14.9185 5.33149 18.4985 2.56445 22.5954 2.56445H159.848C165.74 2.56445 170.042 8.13131 168.558 13.8327L157.098 57.8327C156.066 61.7974 152.486 64.5645 148.389 64.5645H11.1363C5.24474 64.5645 0.94199 58.9976 2.42683 53.2962L13.8859 9.2962Z" fill={`url(#paint0_linear_18_1686${isHovered ? '_hover' : ''})`}/>
    <path d="M22.5954 1.56445C18.0432 1.56445 14.0655 4.63893 12.9182 9.04417L1.45911 53.0442C-0.190713 59.3791 4.59012 65.5645 11.1363 65.5645H148.389C152.941 65.5645 156.919 62.49 158.066 58.0847L169.525 14.0847C171.175 7.74985 166.394 1.56445 159.848 1.56445H22.5954Z" stroke={isHovered ? "#a5ffce" : "#8EFFC4"} strokeOpacity="0.7" strokeWidth="2"/>
    <defs>
      <linearGradient id="paint0_linear_18_1686" x1="85.4922" y1="12.8847" x2="85.4922" y2="64.5645" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4DF0B4"/>
        <stop offset="1" stopColor="#25976C"/>
      </linearGradient>
      <linearGradient id="paint0_linear_18_1686_hover" x1="85.4922" y1="12.8847" x2="85.4922" y2="64.5645" gradientUnits="userSpaceOnUse">
        <stop stopColor="#65FFC5"/>
        <stop offset="1" stopColor="#2FB383"/>
      </linearGradient>
    </defs>
  </svg>
);

const MinusButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="170" height="46" viewBox="0 0 170 46" fill="none" className="absolute inset-0 w-full h-full transition-all duration-200">
    <path d="M10.9621 40.2599C11.5357 42.4626 13.5246 44 15.8008 44H162.531C165.804 44 168.195 40.9075 167.37 37.7401L159.038 5.74008C158.464 3.53735 156.475 2 154.199 2H7.4686C4.19561 2 1.80523 5.09251 2.62995 8.2599L10.9621 40.2599Z" fill={isHovered ? "#82c7fe" : "#63B8FD"}/>
    <path d="M15.8008 45C13.0694 45 10.6827 43.1552 9.9944 40.5119L1.66222 8.51188C0.672554 4.71102 3.54101 1 7.4686 1H154.199C156.93 1 159.317 2.84482 160.005 5.48809L168.338 37.4881C169.327 41.289 166.459 45 162.531 45H15.8008Z" stroke={isHovered ? "#6fa3b3" : "#4C7582"} strokeOpacity="0.7" strokeWidth="2"/>
  </svg>
);

const PlusButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="170" height="46" viewBox="0 0 170 46" fill="none" className="absolute inset-0 w-full h-full transition-all duration-200">
    <path d="M159.038 40.2599C158.464 42.4626 156.475 44 154.199 44H7.46866C4.19565 44 1.80525 40.9075 2.62999 37.7401L10.9623 5.74008C11.5359 3.53735 13.5248 2 15.801 2H162.531C165.804 2 168.195 5.09251 167.37 8.2599L159.038 40.2599Z" fill={isHovered ? "#82c7fe" : "#63B8FD"}/>
    <path d="M154.199 45C156.931 45 159.317 43.1552 160.006 40.5119L168.338 8.51188C169.327 4.71102 166.459 1 162.531 1H15.801C13.0696 1 10.6829 2.84482 9.99461 5.48809L1.66226 37.4881C0.672577 41.289 3.54105 45 7.46866 45H154.199Z" stroke={isHovered ? "#6fa3b3" : "#4C7582"} strokeOpacity="0.7" strokeWidth="2"/>
  </svg>
);

const WinBoxBg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="171" height="47" viewBox="0 0 171 47" fill="none" className="absolute inset-0 w-full h-full">
    <path d="M159.53 40.8243C158.957 43.0271 156.968 44.5645 154.691 44.5645H7.96085C4.68784 44.5645 2.29744 41.4719 3.12218 38.3045L11.4545 6.30453C12.0281 4.1018 14.017 2.56445 16.2932 2.56445H163.024C166.297 2.56445 168.687 5.65697 167.862 8.82435L159.53 40.8243Z" fill="#153F59"/>
    <path d="M154.691 45.5645C157.423 45.5645 159.81 43.7196 160.498 41.0763L168.83 9.07633C169.82 5.27547 166.951 1.56445 163.024 1.56445H16.2932C13.5618 1.56445 11.1751 3.40927 10.4868 6.05255L2.15445 38.0526C1.16476 41.8534 4.03323 45.5645 7.96085 45.5645H154.691Z" stroke="#4C7582" strokeOpacity="0.7" strokeWidth="2"/>
  </svg>
);

const BetBoxBg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="171" height="47" viewBox="0 0 171 47" fill="none" className="absolute inset-0 w-full h-full">
    <path d="M11.4543 40.8243C12.0279 43.0271 14.0168 44.5645 16.293 44.5645H163.024C166.297 44.5645 168.687 41.4719 167.862 38.3045L159.53 6.30453C158.956 4.1018 156.967 2.56445 154.691 2.56445H7.96079C4.6878 2.56445 2.29742 5.65697 3.12214 8.82435L11.4543 40.8243Z" fill="#153F59"/>
    <path d="M16.293 45.5645C13.5616 45.5645 11.1748 43.7196 10.4866 41.0763L2.15441 9.07633C1.16474 5.27547 4.0332 1.56445 7.96079 1.56445H154.691C157.423 1.56445 159.809 3.40927 160.498 6.05255L168.83 38.0526C169.82 41.8534 166.951 45.5645 163.024 45.5645H16.293Z" stroke="#4C7582" strokeOpacity="0.7" strokeWidth="2"/>
  </svg>
);

const UserChipBoxBg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="190" height="70" viewBox="0 0 190 70" fill="none" className="absolute inset-0 w-full h-full">
    <path d="M188.958 14.459L176.946 61.871C175.403 66.3773 170.742 69.5 165.409 69.5H24.9862C19.7045 69.5 15.0752 66.4359 13.4898 61.9882L1.08357 14.5772L1.07823 14.5568L1.07118 14.5369C-1.36488 7.6574 4.33557 0.5 12.5746 0.5H177.426C185.607 0.5 191.303 7.56491 188.97 14.4208L188.963 14.4397L188.958 14.459Z" fill="url(#paint0_linear_28_1504)" stroke="#686868"/>
    <defs>
      <linearGradient id="paint0_linear_28_1504" x1="94.346" y1="8.46774" x2="94.346" y2="101" gradientUnits="userSpaceOnUse">
        <stop stopColor="#353535"/>
        <stop offset="1" stopColor="#373737"/>
      </linearGradient>
    </defs>
  </svg>
);

const UsernameBoxBg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="194" height="32" viewBox="0 0 194 32" fill="none" className="absolute inset-0 w-full h-full">
    <path d="M193.226 6.52571L186.896 28.1865C186.132 30.1004 183.795 31.5 181.032 31.5H13.1766C10.4412 31.5 8.11852 30.1271 7.33329 28.2369L0.795006 6.57724L0.788164 6.55457L0.77921 6.53265C0.185184 5.07846 0.570827 3.60113 1.64695 2.45568C2.73019 1.30266 4.51127 0.5 6.63127 0.5H187.369C189.474 0.5 191.247 1.29222 192.333 2.43431C193.412 3.56926 193.809 5.03505 193.241 6.48328L193.233 6.50417L193.226 6.52571Z" fill="url(#paint0_linear_28_1505)" stroke="#686868"/>
    <defs>
      <linearGradient id="paint0_linear_28_1505" x1="49.7538" y1="0" x2="49.7538" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3F4348"/>
        <stop offset="1" stopColor="#4A4A4A"/>
      </linearGradient>
    </defs>
  </svg>
);

// Betting Slider SVG Components
const SliderThumb = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="23" viewBox="0 0 30 23" fill="none">
    <path d="M0 0H23.8462L30 23H6.15385L0 0Z" fill="#289C72"/>
  </svg>
);

const SliderActiveGauge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="184" height="15" viewBox="0 0 184 15" fill="none">
    <path d="M0 0H180L184 15H4L0 0Z" fill="#40D09A"/>
  </svg>
);

const SliderInactiveGauge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="185" height="15" viewBox="0 0 185 15" fill="none">
    <path d="M0 0H181L185 15H4L0 0Z" fill="#D9D9D9" fillOpacity="0.3"/>
  </svg>
);

export default function PokerControl({ onAction, playerChips = 2300, avatarIndex = 0 }: PokerControlProps) {
  const [betAmount, setBetAmount] = useState("2000");
  const [sliderPosition, setSliderPosition] = useState(20); // Initial position percentage
  const [isDragging, setIsDragging] = useState(false);
  // Button hover states
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  // Track all-in state
  const [isAllIn, setIsAllIn] = useState(false);
  
  // Log the avatar index when the component renders or the avatarIndex prop changes
  useEffect(() => {
    console.log("PokerControl received avatarIndex:", avatarIndex);
    console.log("Avatar path should be:", `/avatar${avatarIndex + 1}.png`);
    console.log("Player chips:", playerChips);
  }, [avatarIndex, playerChips]);
  
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  // Use player's chips as the maximum bet instead of hardcoded value
  const maxBet = playerChips;

  // Update slider position from bet amount
  const updatePositionFromBet = useCallback((bet: string | number) => {
    const numValue = typeof bet === 'string' ? parseInt(bet, 10) || 0 : bet;
    // Make sure bet cannot exceed player chips
    const cappedBet = Math.min(numValue, playerChips);
    const percentage = Math.min((cappedBet / maxBet) * 100, 100);
    setSliderPosition(percentage);
    
    // Update bet amount if it was capped
    if (numValue !== cappedBet && typeof bet === 'string') {
      setBetAmount(cappedBet.toString());
    }
  }, [maxBet, playerChips]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    
    // Cap the bet at player's available chips
    const numericValue = parseInt(value, 10) || 0;
    const cappedValue = Math.min(numericValue, playerChips);
    
    // Set the capped value
    setBetAmount(cappedValue.toString());
    
    // If user manually changes bet, they're no longer all-in
    setIsAllIn(cappedValue === playerChips);
    
    // Tell the poker room about the bet change
    onAction(`bet_${cappedValue}`);
    
    // Update slider position when input changes
    updatePositionFromBet(cappedValue);
  };

  const updateSliderPosition = useCallback((clientX: number) => {
    if (sliderContainerRef.current) {
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const position = clientX - rect.left;
      const percentage = Math.min(Math.max((position / rect.width) * 100, 0), 100);
      
      setSliderPosition(percentage);
      
      // Update bet amount based on slider position, capped at player chips
      const newBet = Math.min(Math.floor((percentage / 100) * maxBet), playerChips);
      setBetAmount(newBet.toString());
      
      // If the bet equals max chips, it's an all-in
      setIsAllIn(newBet === playerChips);
      
      onAction(`bet_${newBet}`);
    }
  }, [maxBet, onAction, playerChips]);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle direct clicks, not drag events
    if (!isDragging) {
      updateSliderPosition(e.clientX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Prevent text selection during drag
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSliderPosition(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add event listeners if dragging
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateSliderPosition]);

  return (
    <div 
      className={`fixed bottom-0 left-0 w-full ${exo.className}`}
      style={{
        height: "315px",
        background: "linear-gradient(180deg, #273B56 0%, #0D1C2D 100%)"
      }}
    >
      <div className="w-full max-w-[1300px] mx-auto h-full flex flex-col justify-between pt-4 pb-10 px-9">
        {/* Top row - WIN and BET info with Avatar in center */}
        <div className="flex justify-center gap-4 items-center">
          {/* WIN box */}
          <div className="relative w-[171px] h-[47px] -mt-5">
            <WinBoxBg />
            <div className="absolute inset-0 flex items-center px-4 text-white">
              <span className="mr-2 text-gray-300">WIN:</span>
              <span className="font-bold text-xl">$2,190</span>
            </div>
          </div>
          
          {/* Avatar in center */}
          <div className="relative pt-6">
            <div className="relative">
              {/* Make the gold ring more prominent */}
              <div className="absolute inset-0 rounded-full shadow-[0_0_18px_12px_rgba(255,215,0,0.7)] blur-md"></div>
              <Image src="/user-ring.svg" alt="Player" width={120} height={120} className="relative z-10 w-[120px] h-[120px]" />
              <div className="absolute top-[4px] left-[4px] w-[108px] h-[108px] rounded-full overflow-hidden ">
                <Image 
                  src={`/avatar${avatarIndex + 1}.png`}
                  alt={`Player Avatar (${avatarIndex})`}
                  width={100}
                  height={100}
                  className="object-cover w-full h-full"
                  unoptimized={true}
                  priority
                />
              </div>
            </div>
          </div>
          
          {/* BET box with input */}
          <div className="relative w-[171px] h-[47px] -mt-5">
            <BetBoxBg />
            <div className="absolute inset-0 flex items-center px-4 text-white">
              <span className="mr-2 text-gray-300">BET:</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={`$${betAmount}`}
                  onChange={handleBetChange}
                  className="w-full bg-transparent border-none outline-none text-xl font-bold text-right"
                  style={{ caretColor: 'white' }}
                />
              </div>
            </div>
            
            {/* Slider component - positioned relative to the bet input */}
            <div className="absolute -right-[225px] top-0 mt-3">
              <div 
                ref={sliderContainerRef}
                className={`relative h-[15px] w-[185px] ${isAllIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onClick={!isAllIn ? handleSliderClick : undefined}
              >
                {/* Inactive gauge (background) */}
                <div className="absolute left-0 top-0">
                  <SliderInactiveGauge />
                </div>
                
                {/* Active gauge (foreground) */}
                <div 
                  className="absolute left-0 top-0 overflow-hidden" 
                  style={{ width: `${sliderPosition}%` }}
                >
                  <SliderActiveGauge />
                </div>
                
                {/* Slider thumb */}
                <div 
                  className={`absolute top-[-4px] transform -translate-x-1/2 z-10 ${isAllIn ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={!isAllIn ? handleMouseDown : undefined}
                >
                  <SliderThumb />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle row - Action buttons */}
        <div className="flex justify-between items-center -mt-17">
          {/* Left side buttons */}
          <div className="flex">
            {/* STAND button */}
            <div className="relative w-[120px] h-[66px]">
              <BlueButtonBg isHovered={hoveredButton === 'stand'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('stand')}
                onMouseEnter={() => setHoveredButton('stand')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                STAND
              </button>
            </div>
            
            {/* TIME button */}
            <div className="relative w-[120px] h-[66px] -ml-1 mr-6">
              <BlueButtonBg isHovered={hoveredButton === 'time'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('time')}
                onMouseEnter={() => setHoveredButton('time')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                TIME
              </button>
            </div>
            
            {/* CHECK button */}
            <div className="relative w-[120px] h-[66px] -ml-1">
              <BlueButtonBg isHovered={hoveredButton === 'check'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('check')}
                onMouseEnter={() => setHoveredButton('check')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                CHECK
              </button>
            </div>
            
            {/* FOLD button */}
            <div className="relative w-[170px] h-[67px] -ml-1">
              <FoldButtonBg isHovered={hoveredButton === 'fold'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('fold')}
                onMouseEnter={() => setHoveredButton('fold')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                FOLD
              </button>
            </div>
          </div>
          
          {/* Right side buttons */}
          <div className="flex">
            {/* RAISE button */}
            <div className="relative w-[171px] h-[67px]">
              <RaiseButtonBg isHovered={hoveredButton === 'raise'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('raise')}
                onMouseEnter={() => setHoveredButton('raise')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                RAISE
              </button>
            </div>
            
            {/* CALL button */}
            <div className="relative w-[119px] h-[67px] -ml-1">
              <RightBlueButtonBg isHovered={hoveredButton === 'call'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('call')}
                onMouseEnter={() => setHoveredButton('call')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                CALL
              </button>
            </div>
            
            {/* POT button */}
            <div className="relative w-[119px] h-[67px]  ml-6">
              <RightBlueButtonBg isHovered={hoveredButton === 'pot'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => onAction('pot')}
                onMouseEnter={() => setHoveredButton('pot')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                POT
              </button>
            </div>
            
            {/* ALL IN button */}
            <div className="relative w-[119px] h-[67px] -ml-1">
              <RightBlueButtonBg isHovered={hoveredButton === 'all_in'} />
              <button 
                className="absolute inset-0 flex items-center justify-center text-white font-bold z-10 text-[21px] transition-all duration-200 cursor-pointer"
                onClick={() => {
                  // Set bet amount to player's total chips
                  setBetAmount(playerChips.toString());
                  // Set all-in state to true
                  setIsAllIn(true);
                  // Set slider to max position
                  setSliderPosition(100);
                  onAction(`all_in_${playerChips}`);
                }}
                onMouseEnter={() => setHoveredButton('all_in')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                ALL IN
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom row - Minus, username/chips, Plus */}
        <div className="flex justify-center items-center pb-4">
          {/* Minus button */}
          <div className="relative w-[170px] h-[46px]">
            <MinusButtonBg isHovered={hoveredButton === 'minus'} />
            <button 
              className={`absolute inset-0 flex items-center justify-center text-white font-bold text-[21px] z-10 transition-all duration-200 ${isAllIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={() => {
                if (isAllIn) return;
                const currentBet = parseInt(betAmount, 10);
                const newBet = Math.max(currentBet - 100, 0);
                setBetAmount(newBet.toString());
                setIsAllIn(false);
                updatePositionFromBet(newBet);
                onAction(`bet_${newBet}`);
              }}
              onMouseEnter={() => !isAllIn && setHoveredButton('minus')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              -
            </button>
          </div>
          
          {/* Username and chip count with new design */}
          <div className="relative w-[190px] h-[70px]">
            <UserChipBoxBg />
            
            {/* Username area at top */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[194px] h-[32px]">
              <div className="relative w-full h-full">
                <UsernameBoxBg />
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <span className="text-gray-300 text-sm">username</span>
                </div>
              </div>
            </div>
            
            {/* Chip count */}
            <div className="absolute inset-0 flex items-center justify-center text-white pt-8">
              <span className="text-xl font-bold">{playerChips.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Plus button */}
          <div className="relative w-[170px] h-[46px]">
            <PlusButtonBg isHovered={hoveredButton === 'plus'} />
            <button 
              className={`absolute inset-0 flex items-center justify-center text-white font-bold text-[21px] z-10 transition-all duration-200 ${isAllIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              onClick={() => {
                if (isAllIn) return;
                const currentBet = parseInt(betAmount, 10);
                const newBet = currentBet + 100;
                setBetAmount(newBet.toString());
                setIsAllIn(false);
                updatePositionFromBet(newBet);
                onAction(`bet_${newBet}`);
              }}
              onMouseEnter={() => !isAllIn && setHoveredButton('plus')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* Table information */}
      <div className="absolute bottom-0 left-0 text-white text-xs p-2 bg-black/50">
        No Limit Holdem | Room: 136 | Seat 4 | Players: 3
      </div>
    </div>
  );
} 