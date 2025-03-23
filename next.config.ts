import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
            {
                // Agregar encabezados CORS para solicitudes de la API
                source: '/api/aleo/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-aleo-sdk-version',
                    },
                ],
            },
        ]
    },
    async rewrites() {
        return [
            {
                source: '/testnet/stateRoot/:path*',
                destination: 'http://localhost:3030/testnet/stateRoot/:path*',
            },
            // Proxy todas las solicitudes a la API de Aleo
            {
                source: '/api/aleo/:path*',
                destination: 'http://localhost:3030/:path*',
            },
            // Proxy específico para las solicitudes de programas
            {
                source: '/api/aleo/testnet/program/:program*',
                destination: 'http://localhost:3030/testnet/program/:program*',
            },
        ]
    },
    httpAgentOptions: {
        keepAlive: false,
    },
    webpack: config => {
        // fix top level await issues with provable sdk
        config.target = typeof config.target === 'string' ? config.target : ['web', 'es2022']

        // minify the code and prevent issues with workers source maps
        config.optimization = {
            ...config.optimization,
            minimize: true,
        }
        return config
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
}

export default nextConfig
