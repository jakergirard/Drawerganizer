/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        outputFileTracingRoot: undefined,
    },
    poweredByHeader: false,
    reactStrictMode: true,
    swcMinify: true,
}

module.exports = nextConfig