/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        outputFileTracingRoot: process.cwd(),
        serverComponentsExternalPackages: ['canvas', 'ipp']
    },
    poweredByHeader: false,
    reactStrictMode: true,
    swcMinify: true,
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [...config.externals, 
                'canvas',
                'ipp'
            ];
        }
        return config;
    }
}

module.exports = nextConfig