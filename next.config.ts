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
            {
                source: '/api/testnet/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
                    { key: 'Cache-Control', value: 'public, max-age=10, s-maxage=10' },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
                    },
                ],
            },
        ]
    },
    async rewrites() {
        return [
            // Testnet block API endpoint
            {
                source: '/api/local/:path*',
                destination: 'http://localhost:3030/:path*',
            },
            // Remote API testnet
            {
                source: '/api/aleo/:path*',
                destination: 'https://api.explorer.provable.com/v1/:path*',
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
