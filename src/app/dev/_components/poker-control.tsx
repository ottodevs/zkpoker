import { Button } from '@/components/ui/button'
import { Exo } from 'next/font/google'
import { useState } from 'react'

// Initialize the Exo font
const exo = Exo({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
})

// Console logging with emojis for better debugging
const logAction = (action: string, message: string) => console.log(`🎮 [Control-${action}] ${message}`)

interface PokerControlProps {
    onAction: (action: string) => void
    playerChips: number
    minBet: number
    isPlayerTurn: boolean
    isLoading: boolean
}

// SVG Components for button backgrounds
const BlueButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='120'
        height='66'
        viewBox='0 0 120 66'
        fill='none'
        className='absolute inset-0 h-full w-full transition-all duration-200'>
        <path
            d='M105.593 8.72985C104.56 4.76607 100.98 2 96.8839 2H11.6467C5.75436 2 1.45147 7.5683 2.93775 13.2701L14.4071 57.2701C15.4403 61.2339 19.0199 64 23.1161 64H108.353C114.246 64 118.549 58.4317 117.062 52.7299L105.593 8.72985Z'
            fill={isHovered ? '#1e5478' : '#153F59'}
        />
        <path
            d='M11.6467 1H96.8839C101.435 1 105.413 4.07341 106.561 8.47761L118.03 52.4776C119.681 58.813 114.9 65 108.353 65H23.1161C18.5647 65 14.5875 61.9266 13.4394 57.5224L1.97009 13.5224C0.318657 7.18699 5.09966 1 11.6467 1Z'
            stroke={isHovered ? '#6fa3b3' : '#4C7582'}
            strokeOpacity='0.7'
            strokeWidth='2'
        />
    </svg>
)

const RightBlueButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='119'
        height='67'
        viewBox='0 0 119 67'
        fill='none'
        className='absolute inset-0 h-full w-full transition-all duration-200'>
        <path
            d='M13.8993 9.29431C14.9325 5.33052 18.512 2.56445 22.6083 2.56445H107.845C113.738 2.56445 118.041 8.13275 116.554 13.8346L105.085 57.8346C104.052 61.7984 100.472 64.5645 96.3761 64.5645H11.1389C5.24655 64.5645 0.943658 58.9962 2.42994 53.2943L13.8993 9.29431Z'
            fill={isHovered ? '#1e5478' : '#153F59'}
        />
        <path
            d='M22.6083 1.56445C18.0569 1.56445 14.0797 4.63786 12.9316 9.04207L1.46228 53.0421C-0.190713 59.3775 4.59012 65.5645 11.1389 65.5645H96.3761C100.927 65.5645 104.905 62.491 106.053 58.0868L117.522 14.0868C119.174 7.75145 114.393 1.56445 107.845 1.56445H22.6083Z'
            stroke={isHovered ? '#6fa3b3' : '#4C7582'}
            strokeOpacity='0.7'
            strokeWidth='2'
        />
    </svg>
)

const FoldButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='170'
        height='67'
        viewBox='0 0 170 67'
        fill='none'
        className='absolute inset-0 h-full w-full transition-all duration-200'>
        <path
            d='M156.185 9.30856C155.157 5.33778 151.574 2.56445 147.473 2.56445H11.1193C5.23299 2.56445 0.931137 8.12197 2.40657 13.8203L13.7991 57.8204C14.8272 61.7911 18.41 64.5645 22.5117 64.5645H158.865C164.751 64.5645 169.053 59.0069 167.578 53.3086L156.185 9.30856Z'
            fill={`url(#paint0_linear_18_1683${isHovered ? '_hover' : ''})`}
        />
        <path
            d='M147.473 1.56445C152.03 1.56445 156.011 4.64593 157.153 9.0579L168.546 53.0579C170.185 59.3894 165.405 65.5645 158.865 65.5645H22.5117C17.9543 65.5645 13.9733 62.483 12.831 58.071L1.43849 14.071C-0.200882 7.73946 4.57896 1.56445 11.1193 1.56445H147.473Z'
            stroke={`url(#paint1_linear_18_1683${isHovered ? '_hover' : ''})`}
            strokeOpacity='0.7'
            strokeWidth='2'
        />
        <defs>
            <linearGradient
                id='paint0_linear_18_1683'
                x1='84.9922'
                y1='2.56445'
                x2='84.9922'
                y2='64.5645'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#FF6571' />
                <stop offset='1' stopColor='#AE1E20' />
            </linearGradient>
            <linearGradient
                id='paint0_linear_18_1683_hover'
                x1='84.9922'
                y1='2.56445'
                x2='84.9922'
                y2='64.5645'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#FF7F89' />
                <stop offset='1' stopColor='#CC2426' />
            </linearGradient>
            <linearGradient
                id='paint1_linear_18_1683'
                x1='84.9922'
                y1='2.56445'
                x2='84.9922'
                y2='64.5645'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#C95B5D' />
                <stop offset='1' stopColor='#FF9395' />
            </linearGradient>
            <linearGradient
                id='paint1_linear_18_1683_hover'
                x1='84.9922'
                y1='2.56445'
                x2='84.9922'
                y2='64.5645'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#DA6A6C' />
                <stop offset='1' stopColor='#FFA7A9' />
            </linearGradient>
        </defs>
    </svg>
)

const RaiseButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='171'
        height='67'
        viewBox='0 0 171 67'
        fill='none'
        className='absolute inset-0 h-full w-full transition-all duration-200'>
        <path
            d='M13.8859 9.2962C14.9185 5.33149 18.4985 2.56445 22.5954 2.56445H159.848C165.74 2.56445 170.042 8.13131 168.558 13.8327L157.098 57.8327C156.066 61.7974 152.486 64.5645 148.389 64.5645H11.1363C5.24474 64.5645 0.94199 58.9976 2.42683 53.2962L13.8859 9.2962Z'
            fill={`url(#paint0_linear_18_1686${isHovered ? '_hover' : ''})`}
        />
        <path
            d='M22.5954 1.56445C18.0432 1.56445 14.0655 4.63893 12.9182 9.04417L1.45911 53.0442C-0.190713 59.3791 4.59012 65.5645 11.1363 65.5645H148.389C152.941 65.5645 156.919 62.49 158.066 58.0847L169.525 14.0847C171.175 7.74985 166.394 1.56445 159.848 1.56445H22.5954Z'
            stroke={isHovered ? '#a5ffce' : '#8EFFC4'}
            strokeOpacity='0.7'
            strokeWidth='2'
        />
        <defs>
            <linearGradient
                id='paint0_linear_18_1686'
                x1='85.4922'
                y1='12.8847'
                x2='85.4922'
                y2='64.5645'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#4DF0B4' />
                <stop offset='1' stopColor='#25976C' />
            </linearGradient>
            <linearGradient
                id='paint0_linear_18_1686_hover'
                x1='85.4922'
                y1='12.8847'
                x2='85.4922'
                y2='64.5645'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#65FFC5' />
                <stop offset='1' stopColor='#2FB383' />
            </linearGradient>
        </defs>
    </svg>
)

const MinusButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='170'
        height='46'
        viewBox='0 0 170 46'
        fill='none'
        className='absolute inset-0 h-full w-full transition-all duration-200'>
        <path
            d='M10.9621 40.2599C11.5357 42.4626 13.5246 44 15.8008 44H162.531C165.804 44 168.195 40.9075 167.37 37.7401L159.038 5.74008C158.464 3.53735 156.475 2 154.199 2H7.4686C4.19561 2 1.80523 5.09251 2.62995 8.2599L10.9621 40.2599Z'
            fill={isHovered ? '#82c7fe' : '#63B8FD'}
        />
        <path
            d='M15.8008 45C13.0694 45 10.6827 43.1552 9.9944 40.5119L1.66222 8.51188C0.672554 4.71102 3.54101 1 7.4686 1H154.199C156.93 1 159.317 2.84482 160.005 5.48809L168.338 37.4881C169.327 41.289 166.459 45 162.531 45H15.8008Z'
            stroke={isHovered ? '#6fa3b3' : '#4C7582'}
            strokeOpacity='0.7'
            strokeWidth='2'
        />
    </svg>
)

const PlusButtonBg = ({ isHovered }: { isHovered?: boolean }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='170'
        height='46'
        viewBox='0 0 170 46'
        fill='none'
        className='absolute inset-0 h-full w-full transition-all duration-200'>
        <path
            d='M159.038 40.2599C158.464 42.4626 156.475 44 154.199 44H7.46866C4.19565 44 1.80525 40.9075 2.62999 37.7401L10.9623 5.74008C11.5359 3.53735 13.5248 2 15.801 2H162.531C165.804 2 168.195 5.09251 167.37 8.2599L159.038 40.2599Z'
            fill={isHovered ? '#82c7fe' : '#63B8FD'}
        />
        <path
            d='M154.199 45C156.931 45 159.317 43.1552 160.006 40.5119L168.338 8.51188C169.327 4.71102 166.459 1 162.531 1H15.801C13.0696 1 10.6829 2.84482 9.99461 5.48809L1.66226 37.4881C0.672577 41.289 3.54105 45 7.46866 45H154.199Z'
            stroke={isHovered ? '#6fa3b3' : '#4C7582'}
            strokeOpacity='0.7'
            strokeWidth='2'
        />
    </svg>
)

const WinBoxBg = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='171'
        height='47'
        viewBox='0 0 171 47'
        fill='none'
        className='absolute inset-0 h-full w-full'>
        <path
            d='M159.53 40.8243C158.957 43.0271 156.968 44.5645 154.691 44.5645H7.96085C4.68784 44.5645 2.29744 41.4719 3.12218 38.3045L11.4545 6.30453C12.0281 4.1018 14.017 2.56445 16.2932 2.56445H163.024C166.297 2.56445 168.687 5.65697 167.862 8.82435L159.53 40.8243Z'
            fill='#153F59'
        />
        <path
            d='M154.691 45.5645C157.423 45.5645 159.81 43.7196 160.498 41.0763L168.83 9.07633C169.82 5.27547 166.951 1.56445 163.024 1.56445H16.2932C13.5618 1.56445 11.1751 3.40927 10.4868 6.05255L2.15445 38.0526C1.16476 41.8534 4.03323 45.5645 7.96085 45.5645H154.691Z'
            stroke='#4C7582'
            strokeOpacity='0.7'
            strokeWidth='2'
        />
    </svg>
)

const BetBoxBg = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='171'
        height='47'
        viewBox='0 0 171 47'
        fill='none'
        className='absolute inset-0 h-full w-full'>
        <path
            d='M11.4543 40.8243C12.0279 43.0271 14.0168 44.5645 16.293 44.5645H163.024C166.297 44.5645 168.687 41.4719 167.862 38.3045L159.53 6.30453C158.956 4.1018 156.967 2.56445 154.691 2.56445H7.96079C4.6878 2.56445 2.29742 5.65697 3.12214 8.82435L11.4543 40.8243Z'
            fill='#153F59'
        />
        <path
            d='M16.293 45.5645C13.5616 45.5645 11.1748 43.7196 10.4866 41.0763L2.15441 9.07633C1.16474 5.27547 4.0332 1.56445 7.96079 1.56445H154.691C157.423 1.56445 159.809 3.40927 160.498 6.05255L168.83 38.0526C169.82 41.8534 166.951 45.5645 163.024 45.5645H16.293Z'
            stroke='#4C7582'
            strokeOpacity='0.7'
            strokeWidth='2'
        />
    </svg>
)

const UserChipBoxBg = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='190'
        height='70'
        viewBox='0 0 190 70'
        fill='none'
        className='absolute inset-0 h-full w-full'>
        <path
            d='M188.958 14.459L176.946 61.871C175.403 66.3773 170.742 69.5 165.409 69.5H24.9862C19.7045 69.5 15.0752 66.4359 13.4898 61.9882L1.08357 14.5772L1.07823 14.5568L1.07118 14.5369C-1.36488 7.6574 4.33557 0.5 12.5746 0.5H177.426C185.607 0.5 191.303 7.56491 188.97 14.4208L188.963 14.4397L188.958 14.459Z'
            fill='url(#paint0_linear_28_1504)'
            stroke='#686868'
        />
        <defs>
            <linearGradient
                id='paint0_linear_28_1504'
                x1='94.346'
                y1='8.46774'
                x2='94.346'
                y2='101'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#353535' />
                <stop offset='1' stopColor='#373737' />
            </linearGradient>
        </defs>
    </svg>
)

const UsernameBoxBg = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='194'
        height='32'
        viewBox='0 0 194 32'
        fill='none'
        className='absolute inset-0 h-full w-full'>
        <path
            d='M193.226 6.52571L186.896 28.1865C186.132 30.1004 183.795 31.5 181.032 31.5H13.1766C10.4412 31.5 8.11852 30.1271 7.33329 28.2369L0.795006 6.57724L0.788164 6.55457L0.77921 6.53265C0.185184 5.07846 0.570827 3.60113 1.64695 2.45568C2.73019 1.30266 4.51127 0.5 6.63127 0.5H187.369C189.474 0.5 191.247 1.29222 192.333 2.43431C193.412 3.56926 193.809 5.03505 193.241 6.48328L193.233 6.50417L193.226 6.52571Z'
            fill='url(#paint0_linear_28_1505)'
            stroke='#686868'
        />
        <defs>
            <linearGradient
                id='paint0_linear_28_1505'
                x1='49.7538'
                y1='0'
                x2='49.7538'
                y2='32'
                gradientUnits='userSpaceOnUse'>
                <stop stopColor='#3F4348' />
                <stop offset='1' stopColor='#4A4A4A' />
            </linearGradient>
        </defs>
    </svg>
)

// Betting Slider SVG Components
const SliderThumb = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='30' height='23' viewBox='0 0 30 23' fill='none'>
        <path d='M0 0H23.8462L30 23H6.15385L0 0Z' fill='#289C72' />
    </svg>
)

const SliderActiveGauge = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='184' height='15' viewBox='0 0 184 15' fill='none'>
        <path d='M0 0H180L184 15H4L0 0Z' fill='#40D09A' />
    </svg>
)

const SliderInactiveGauge = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='185' height='15' viewBox='0 0 185 15' fill='none'>
        <path d='M0 0H181L185 15H4L0 0Z' fill='#D9D9D9' fillOpacity='0.3' />
    </svg>
)

export default function PokerControl({
    onAction,
    playerChips,
    minBet = 100,
    isPlayerTurn = true,
    isLoading = false,
}: PokerControlProps) {
    const [betAmount, setBetAmount] = useState<number>(minBet)
    const [showBetSlider, setShowBetSlider] = useState<boolean>(false)
    const [hoveredButton, setHoveredButton] = useState<string | null>(null)

    const handleRaiseClick = () => {
        logAction('UI', 'Raise button clicked')
        setShowBetSlider(!showBetSlider)
    }

    const handleFold = () => {
        logAction('Fold', 'Player folded')
        onAction('fold')
    }

    const handleCheck = () => {
        logAction('Check', 'Player checked')
        onAction('check')
    }

    const handleBet = () => {
        logAction('Bet', `Player bet ${betAmount}`)
        onAction(`bet_${betAmount}`)
        setShowBetSlider(false)
    }

    const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newBet = parseInt(e.target.value, 10)
        setBetAmount(newBet)
        logAction('UI', `Bet slider changed to ${newBet}`)
    }

    // Calculate the allowed betting range
    const minBetAllowed = Math.min(minBet, playerChips)
    const maxBetAllowed = playerChips

    return (
        <div className='w-full rounded-lg bg-gradient-to-r from-[#031f2f] to-[#0c3342] p-4 shadow-lg'>
            <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-xl font-bold text-white'>Your Chips: ${playerChips}</h3>
                {isLoading && <div className='text-yellow-400'>Processing...</div>}
            </div>

            {!isPlayerTurn ? (
                <div className='py-4 text-center text-gray-300'>Waiting for other players...</div>
            ) : (
                <div className='flex flex-col gap-4'>
                    <div className='flex justify-between gap-2'>
                        <Button
                            onClick={handleFold}
                            disabled={isLoading}
                            className='flex-1 rounded bg-red-700 px-4 py-2 text-white hover:bg-red-800'>
                            Fold
                        </Button>
                        <Button
                            onClick={handleCheck}
                            disabled={isLoading}
                            className='flex-1 rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800'>
                            Check
                        </Button>
                        <Button
                            onClick={handleRaiseClick}
                            disabled={isLoading || playerChips < minBet}
                            className='flex-1 rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800'>
                            Raise
                        </Button>
                    </div>

                    {showBetSlider && (
                        <div className='mt-4 rounded-lg bg-[#0a2333] p-4'>
                            <div className='mb-2 flex justify-between'>
                                <span className='text-white'>Bet Amount: ${betAmount}</span>
                                <span className='text-sm text-gray-400'>
                                    Min: ${minBetAllowed} | Max: ${maxBetAllowed}
                                </span>
                            </div>
                            <input
                                type='range'
                                min={minBetAllowed}
                                max={maxBetAllowed}
                                value={betAmount}
                                onChange={handleBetAmountChange}
                                className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700'
                            />
                            <div className='mt-4 flex justify-end'>
                                <Button
                                    onClick={handleBet}
                                    disabled={isLoading}
                                    className='rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700'>
                                    Bet ${betAmount}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
