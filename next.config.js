/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        outputFileTracingRoot: process.cwd(),
        serverComponentsExternalPackages: ['canvas', 'ipp'],
        forceSwcTransforms: true
    },
    poweredByHeader: false,
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    productionBrowserSourceMaps: false,
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [...config.externals, 
                'canvas',
                'ipp'
            ];
        }
        // Optimize bundle size
        config.optimization = {
            ...config.optimization,
            minimize: true,
            sideEffects: true,
            usedExports: true
        };
        return config;
    }
}

module.exports = nextConfig