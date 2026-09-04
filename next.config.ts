import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  // next-pwa (webpack-based) is added in Module 4 once we pin the right adapter.
  // For now, manifest.json and the service worker stub handle PWA metadata.
}

export default nextConfig
