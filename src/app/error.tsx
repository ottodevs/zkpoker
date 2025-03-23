'use client'

import { useEffect } from 'react'

export default function Error() {
    useEffect(() => {
        console.log('Error')
    }, [])
    return <div>Error</div>
}
