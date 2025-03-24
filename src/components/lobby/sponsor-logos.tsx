'use client'
import Image from 'next/image'

export function SponsorLogos() {
    return (
        <div className='absolute -bottom-52 left-1/2 flex w-full max-w-4xl -translate-x-1/2 transform items-center justify-center space-x-4 px-4 md:space-x-8 lg:space-x-16'>
            <div className='relative h-10 w-28'>
                <Image
                    src='/images/logos/provable-logo.svg'
                    alt='Provable'
                    fill
                    className='w-auto sm:h-6 md:h-8 lg:h-10'
                    sizes='(max-width: 768px) 100vw, 80vw'
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
            </div>
            <div className='relative h-10 w-28'>
                <Image
                    src='/images/logos/aleo-logo.svg'
                    alt='Aleo'
                    fill
                    className='w-auto sm:h-6 md:h-8 lg:h-10'
                    sizes='(max-width: 768px) 100vw, 80vw'
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
            </div>
            <div className='relative h-10 w-28'>
                <Image
                    src='/images/logos/ethglobal-logo.svg'
                    alt='ETHGlobal'
                    fill
                    className='w-auto sm:h-6 md:h-8 lg:h-10'
                    sizes='(max-width: 768px) 100vw, 80vw'
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
            </div>
            <div className='relative h-10 w-28'>
                <Image
                    src='/images/logos/cursor-logo.svg'
                    alt='Cursor'
                    fill
                    className='w-auto sm:h-5 md:h-6 lg:h-7'
                    sizes='(max-width: 768px) 100vw, 80vw'
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
            </div>
        </div>
    )
}
