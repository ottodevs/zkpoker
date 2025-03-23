declare module '*.worker.ts' {
    class WebpackWorker extends Worker {
        constructor()
    }
    export default WebpackWorker
}

declare module 'worker-loader!*' {
    class WebpackWorker extends Worker {
        constructor()
    }
    export default WebpackWorker
}

// Allow importing worker files directly with TS
declare module '*/worker-poker.ts' {
    const content: Worker
    export default content
}
