'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavigationItem = {
    label: string
    path: string
}

export default function LobbyNavigation() {
    const pathname = usePathname()

    const navigationItems: NavigationItem[] = [
        { label: 'HOME', path: '/' },
        { label: 'TOURNAMENTS', path: '/tournaments' },
        { label: 'CASH GAMES', path: '/cash-games' },
    ]

    // Helper function to determine if a navigation item is active
    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(path)
    }

    return (
        <nav className='flex flex-col space-y-4 p-5'>
            {navigationItems.map(item => (
                <Link
                    key={item.path}
                    href={item.path}
                    className={`relative flex h-[54px] w-full cursor-pointer items-center rounded-[13px] px-[18px] py-[11px] ${isActive(item.path) ? 'bg-white/5' : 'hover:bg-white/5'} transition-colors duration-200`}>
                    <span className='text-2xl font-bold text-white'>{item.label}</span>
                </Link>
            ))}
        </nav>
    )
}
