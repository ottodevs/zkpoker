import Image from 'next/image'

interface DashboardBackgroundProps {
    imageSrc?: string
}

export function DashboardBackground({ imageSrc = '/dashboard-bg.png' }: DashboardBackgroundProps) {
    return (
        <div className='absolute inset-0 size-full'>
            <Image src={imageSrc} alt='Dashboard Background' fill sizes='100vw' className='object-cover' priority />
        </div>
    )
}
