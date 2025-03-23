'use client'

import './globals.css'

import Image from 'next/image'
import type { SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import aleoLogo from '../../../../public/aleo.svg'
import nextLogo from '../../../../public/next.svg'
import styles from './page.module.css'

export default function Home() {
    const [account, setAccount] = useState(null)
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

    interface AleoWorkerMessageEvent {
        type: string
        result: string
    }

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

        workerRef.current = new Worker(new URL('../worker.ts', import.meta.url), {
            type: 'module',
            credentials: 'omit',
            name: 'aleo-worker',
            // credentials: 'omit',
        })
        workerRef.current.onmessage = (event: MessageEvent<AleoWorkerMessageEvent>) => {
            if (event.data.type === 'key') {
                setAccount(event.data.result as unknown as SetStateAction<null>)
            } else if (event.data.type === 'execute') {
                setExecuting(false)
            } else if (event.data.type === 'deploy') {
                setDeploying(false)
            }
            alert(`WebWorker Response => ${event.data.result}`)
        }

        return () => {
            // Restaurar el console.warn original al desmontar
            // console.warn = originalWarn
            workerRef.current?.terminate()
        }
    }, [])

    const _handleWork = useCallback(async () => {
        workerRef.current?.postMessage('execute')
    }, [])

    return (
        <main className={styles.main}>
            <div className={styles.description}>
                <p>
                    Get started by editing&nbsp;
                    <code className={styles.code}>src/app/dev/aleo/page.tsx</code>
                </p>
            </div>

            <div className={styles.center}>
                <Image
                    className='w-auto drop-shadow-[0_0_0.3rem_#ffffff70] invert'
                    src={nextLogo.src}
                    alt='Next.js Logo'
                    width={180}
                    height={45}
                    priority
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
                <Image
                    className='w-auto drop-shadow-[0_0_0.3rem_#ffffff70] invert'
                    src={aleoLogo.src}
                    alt='Aleo Logo'
                    width={180}
                    height={45}
                    priority
                    loader={({ src, width, quality }) => {
                        return `${src}?w=${width}&q=${quality || 75}`
                    }}
                />
            </div>

            <div className={styles.card}>
                <p>
                    <button onClick={generateAccount}>
                        {account ? `Account private key is ${JSON.stringify(account)}` : `Click to generate account`}
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
