'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export default function Home() {
    // const [account, setAccount] = useState(null)
    const [executing, setExecuting] = useState(false)
    const [deploying, setDeploying] = useState(false)

    const generateAccount = async () => {
        workerRef.current?.postMessage('key')
    }

    async function execute() {
        setExecuting(true)
        workerRef.current?.postMessage('execute')
    }

    async function deploy() {
        setDeploying(true)
        workerRef.current?.postMessage('deploy')
    }

    const workerRef = useRef<Worker | null>(null)

    // interface AleoWorkerMessageEvent {
    //     type: string
    //     result: string
    // }

    useEffect(() => {
        // Interceptar console.warn antes de inicializar el worker
        // const originalWarn = console.warn
        // console.warn = (...args) => {
        //     // Ignorar advertencias específicas relacionadas con async/await en el worker
        //     const warningMessage = args.join(' ')
        //     if (
        //         warningMessage.includes('async/await') &&
        //         (warningMessage.includes('@provablehq/sdk') || warningMessage.includes('@provablehq/wasm'))
        //     ) {
        //         return
        //     }
        //     originalWarn.apply(console, args)
        // }

        // workerRef.current = new Worker(new URL('../worker.ts', import.meta.url), {
        //     type: 'module',
        //     credentials: 'omit',
        //     name: 'aleo-worker',
        //     // credentials: 'omit',
        // })
        // workerRef.current.onmessage = (event: MessageEvent<AleoWorkerMessageEvent>) => {
        //     if (event.data.type === 'key') {
        //         setAccount(event.data.result as unknown as SetStateAction<null>)
        //     } else if (event.data.type === 'execute') {
        //         setExecuting(false)
        //     } else if (event.data.type === 'deploy') {
        //         setDeploying(false)
        //     }
        //     alert(`WebWorker Response => ${event.data.result}`)
        // }

        return () => {
            // Restaurar el console.warn original al desmontar
            // console.warn = originalWarn
            // workerRef.current?.terminate()
        }
    }, [])

    const _handleWork = useCallback(async () => {
        workerRef.current?.postMessage('execute')
    }, [])

    return (
        <main className='flex min-h-screen w-full flex-col items-center justify-center'>
            <div className='description'>
                <p>
                    Get started by editing&nbsp;
                    <code className='code'>src/app/dev/aleo/page.tsx</code>
                </p>
            </div>

            <div className='flex flex-col gap-4'>
                <p>
                    <button onClick={generateAccount}>
                        None
                        {/* {account ? `Account private key is ${JSON.stringify(account)}` : `Click to generate account`} */}
                    </button>
                </p>
                <p>
                    <button disabled={executing} onClick={execute}>
                        {executing ? `Executing...check console for details...` : `Execute helloworld.aleo`}
                    </button>
                </p>
                <p>
                    <button disabled={deploying} onClick={deploy}>
                        {deploying ? `Deploying...check console for details...` : `Deploy helloworld.aleo`}
                    </button>
                </p>
            </div>
        </main>
    )
}
