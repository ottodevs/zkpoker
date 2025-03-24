'use client'
import Image from 'next/image'
import aleoLogo from '../../../public/aleo-logo.svg'
import cursorLogo from '../../../public/cursor-logo.svg'
import ethglobalLogo from '../../../public/ethglobal-logo.svg'
import provableLogo from '../../../public/provable-logo.svg'

export function SponsorLogos() {
    return (
        <div className='absolute -bottom-52 left-1/2 flex w-full max-w-4xl -translate-x-1/2 transform items-center justify-center space-x-4 px-4 md:space-x-8 lg:space-x-16'>
            <div className='relative h-10 w-28'>
                <Image
                    src={provableLogo}
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
                    src={aleoLogo}
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
                    src={aleoLogo}
                    alt='Aleo'
                    fill
                    className='w-auto sm:h-6 md:h-7 lg:h-8'
                    sizes='(max-width: 768px) 100vw, 80vw'
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
            </div>
            <div className='relative h-10 w-28'>
                <Image
                    src={ethglobalLogo}
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
                    src={cursorLogo}
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
