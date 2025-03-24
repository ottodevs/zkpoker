import Link from 'next/link'

interface ErrorContentProps {
    title: string
    subtitle: string
    message: string
    children?: React.ReactNode
}

export default function ErrorContent({ title, subtitle, message, children }: ErrorContentProps) {
    return (
        <div className='mb-10 rounded-xl bg-[#112237]/80 p-8 backdrop-blur-sm'>
            <h1 className='mb-2 text-3xl font-bold text-red-500'>{title}</h1>
            <h2 className='mb-6 text-xl font-bold text-white'>{subtitle}</h2>

            <p className='mb-4 text-white/80'>{message}</p>

            {children}

            {/* Recovery options */}
            <div className='mt-8 flex flex-wrap justify-center gap-4'>
                <Link
                    href='/'
                    className='inline-flex items-center rounded-full border-2 border-[#4DF0B4]/50 bg-transparent px-6 py-3 font-bold text-[#4DF0B4] hover:bg-[#4DF0B4]/10 focus:ring-2 focus:ring-[#4DF0B4] focus:ring-offset-2 focus:ring-offset-[#142030] focus:outline-none'>
                    Return to Home
                </Link>
            </div>
        </div>
    )
}
