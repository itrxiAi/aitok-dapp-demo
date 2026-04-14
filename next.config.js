/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'demo.hak.life'],
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase the size limit to 10MB
    },
    responseLimit: '10mb',
  },
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
}

module.exports = nextConfig
