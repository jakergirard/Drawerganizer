/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        outputFileTracingRoot: undefined,
        serverComponentsExternalPackages: ['canvas']
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                canvas: false
            }
        }
        return config
    }
}

module.exports = nextConfig