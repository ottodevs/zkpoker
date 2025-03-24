import Header from '@/components/header'
import LobbyFooter from '@/components/lobby/lobby-footer'
import LobbyNavigation from '@/components/lobby/lobby-navigation'

interface LobbyLayoutProps {
    children: React.ReactNode
}

export default function LobbyLayout({ children }: LobbyLayoutProps) {
    return (
        <div className='flex min-h-screen flex-col bg-[#0E1C2E]'>
            <Header />

            <div className='flex flex-1 bg-[#18293E]'>
                {/* Sidebar with responsive styling */}
                <div className='w-[271px] min-w-[271px] bg-[#112237] sm:w-[200px] sm:min-w-[200px] md:w-[271px] md:min-w-[271px]'>
                    <LobbyNavigation />
                </div>

                {/* Main content area with footer */}
                <div className='flex flex-1 flex-col'>
                    <main className='flex-1 overflow-auto p-4 sm:p-6 md:p-8'>{children}</main>

                    <div className='px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8'>
                        <LobbyFooter />
                    </div>
                </div>
            </div>
        </div>
    )
}
