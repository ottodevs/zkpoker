import { DashboardBackground } from './dashboard-background'

interface DashboardContainerProps {
    children: React.ReactNode
    className?: string
    backgroundImageSrc?: string
}

export function DashboardContainer({
    children,
    className = '',
    backgroundImageSrc = '/dashboard-bg.png',
}: DashboardContainerProps) {
    return (
        <div
            className={`absolute top-14 left-0 h-[698px] w-full rounded-tl-3xl rounded-tr-3xl bg-[#142030] ${className}`}>
            <DashboardBackground imageSrc={backgroundImageSrc} />
            {children}
        </div>
    )
}
