// import PokerRoomContent from '@/components/table/poker-room-content'
import { Suspense } from 'react'

export default function PokerRoomPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div>
                Hello
                {/* <PokerRoomContent /> */}
            </div>
        </Suspense>
    )
}
