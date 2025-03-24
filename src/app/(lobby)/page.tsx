import { DashboardContainer } from '@/components/lobby/dashboard-container'
import { GameSetupPanel } from '@/components/lobby/game-setup-panel'
import { SponsorLogos } from '@/components/lobby/sponsor-logos'

export default function HomePage() {
    return (
        <div className='relative mx-auto h-[793px] w-full max-w-[1281px]'>
            <DashboardContainer>
                <SponsorLogos />
                <GameSetupPanel />
            </DashboardContainer>
        </div>
    )
}
