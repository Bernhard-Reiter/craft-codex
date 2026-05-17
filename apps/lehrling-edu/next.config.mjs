/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@voai/lehrlings-core'],
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

export default nextConfig
