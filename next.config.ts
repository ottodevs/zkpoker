import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    reactStrictMode: true,
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
        ]
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
}

export default nextConfig
