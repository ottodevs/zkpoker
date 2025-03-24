import { AmountSelector } from './amount-selector'
import { AvatarSelector } from './avatar-selector'

export function GameSetupPanel() {
    return (
        <div className='absolute right-[64px] bottom-[124px] w-[600px] max-w-full'>
            <div className='text-left'>
                <AvatarSelector />
                <AmountSelector />
            </div>
        </div>
    )
}
