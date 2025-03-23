import { Suspense } from 'react'

export default function PokerRoomLayout({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
}
