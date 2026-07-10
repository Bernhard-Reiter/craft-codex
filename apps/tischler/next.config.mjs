import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import createNextIntlPlugin from 'next-intl/plugin'

// next-intl: bindet i18n/request.ts als Message-Loader ein (DE/EN).
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@craft-codex/core'],
  // pnpm-Monorepo: ohne expliziten Tracing-Root tracet Next.js die
  // Serverless-Funktionen gegen falsche .pnpm-Symlink-Pfade → der
  // `vercel deploy --prebuilt`-Upload bricht mit ENOENT auf next-server.
  // Root aufs Workspace-Root zeigen, damit die Datei-Traces stimmen.
  outputFileTracingRoot: monorepoRoot,
  experimental: {
    optimizePackageImports: ['@react-three/drei', '@react-three/fiber'],
  },
  // ESM-Konvention erlaubt `.js`-Suffix in TS-Source (Node ESM resolved das).
  // Webpack braucht extensionAlias um `.js` auf `.ts`/`.tsx` zu mappen,
  // sonst bricht z.B. `import "./tafel.js"` aus einem `.ts` File im next build.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default withNextIntl(nextConfig)
