import { cn } from '@/lib/utils'

interface GameModeToggleProps {
    mode: string
    setMode: (mode: string) => void
    onToggleMode: (mode: string) => void
}

interface ToggleButtonProps {
    isActive: boolean
    label: string
    onClick: () => void
}

const ToggleButton = ({ isActive, label, onClick }: ToggleButtonProps) => (
    <div
        className={cn(
            'inline-flex h-12 w-[89px] cursor-pointer flex-col items-center justify-center rounded-[80px] px-4 py-3 transition-all duration-150 hover:brightness-105',
            isActive && 'z-10 border-2 border-[#4ef0b3]/70 bg-[#0e1c2e] shadow-[0_0_15px_rgba(77,240,180,0.35)]',
        )}
        onClick={onClick}>
        <div className='inline-flex items-center justify-start'>
            <div className='text-lg leading-tight font-bold text-white'>{label}</div>
        </div>
    </div>
)

export default function GameModeToggle({ mode, setMode, onToggleMode }: GameModeToggleProps) {
    const handleModeChange = (newMode: string) => {
        setMode(newMode)
        onToggleMode?.(newMode)
    }

    return (
        <div className='relative inline-flex h-12 w-[178px] items-center justify-center gap-px rounded-[80px] border-2 border-[#243d5c] bg-[#0D1C2E]/80 shadow-[0_0_10px_rgba(77,240,180,0.15)] transition-all duration-150 hover:border-[#243d5c]/50 hover:shadow-[0_0_15px_rgba(77,240,180,0.25)]'>
            {['real', 'free'].map(currentMode => (
                <ToggleButton
                    key={currentMode}
                    isActive={currentMode === mode}
                    label={currentMode.toUpperCase()}
                    onClick={() => handleModeChange(currentMode)}
                />
            ))}
        </div>
    )
}
