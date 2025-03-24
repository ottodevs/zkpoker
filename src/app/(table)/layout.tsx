import GameHeader from '@/components/GameHeader'
import type { ReactNode } from 'react'

interface TableLayoutProps {
    children: ReactNode
}

export default function TableLayout({ children }: TableLayoutProps) {
    return (
        <div className='relative flex min-h-screen flex-col overflow-hidden bg-[#0E1C2E]'>
            {/* Game header component */}
            <GameHeader />

            {/* Main game area - full screen with appropriate spacing for header/footer */}
            <main className='flex-1 pt-12'>{children}</main>

            {/* Game controls will be rendered by the page itself */}
        </div>
    )
}
