/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

const buildTarget = process.env.BUILD_TARGET // 'frontend' | 'backend' | undefined

const nextConfig = {
  // frontend → static export for S3+CloudFront
  // backend → standalone for Docker/ECS
  // undefined → default Next.js output (Amplify)
  ...(buildTarget === 'frontend' ? {
    output: 'export',
    images: { unoptimized: true },
    // trailingSlash generates /page/index.html instead of /page.html
    // Required for S3+CloudFront static hosting with CloudFront Function URL rewriting
    // Only for frontend — backend must NOT redirect /api/blog → /api/blog/ (breaks ALB health check)
    trailingSlash: true,
  } : buildTarget === 'backend' ? {
    output: 'standalone',
  } : {}),

  // Security + CORS headers (only when not static export)
  ...(buildTarget !== 'frontend' ? {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'screen-wake-lock=(*), microphone=()' },
          ],
        },
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: process.env.CORS_ORIGIN || '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
          ],
        },
      ]
    },
  } : {}),
}

module.exports = withPWA(nextConfig)
