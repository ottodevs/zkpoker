interface AmountButtonProps {
    value: string
    onClick?: () => void
}

export function AmountButton({ value, onClick }: AmountButtonProps) {
    return (
        <div
            onClick={onClick}
            className='inline-flex h-12 w-[83px] cursor-pointer items-center justify-center gap-2.5 rounded-[13px] bg-white/5 px-[37px] py-2.5 transition-all duration-150 hover:bg-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] focus:bg-white/8 focus:ring-2 focus:ring-[#4DF0B4]/50 focus:outline-none active:scale-95 active:bg-white/15 active:shadow-[0_0_15px_rgba(255,255,255,0.15)]'>
            <div className='text-center text-lg font-bold text-white'>{value}</div>
        </div>
    )
}
