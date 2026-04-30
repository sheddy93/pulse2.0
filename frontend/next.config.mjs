/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Disable Turbopack to use webpack for stable build
  experimental: {
    // Turbopack disabled for production stability
  },
  // API Strategy: Direct API client with NEXT_PUBLIC_API_BASE_URL containing /api
  // All api calls use path WITHOUT leading /api (e.g., api.post('/auth/login/'))
  // No rewrite needed - api client handles all requests directly
};

export default nextConfig;