import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  poweredByHeader: false,

  // Optimasi image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Optimasi compiler
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  reactCompiler: true,

  // React strict mode untuk development
  reactStrictMode: true,
  compress: true, // Enable gzip compression (usually default, but explicit is better)
  productionBrowserSourceMaps: false, // Keep false for smaller bundles

  // Optimasi experimental features
  experimental: {
    optimizePackageImports: [
      "three",
      "gsap",
      "cobe",
      "lucide-react",
      "framer-motion",
      "motion",
    ],
    scrollRestoration: true, // Better UX for back navigation
  },

  // Modular imports for better tree-shaking
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },

  // Webpack optimization
  webpack: (config: Configuration, { isServer }) => {
    // Optimization settings
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 244000, // ~244KB per chunk for better caching
          cacheGroups: {
            // Separate heavy libraries into their own chunks
            three: {
              test: /[\\/]node_modules[\\/](three)[\\/]/,
              name: "vendor-three",
              chunks: "all",
              priority: 30,
            },
            gsap: {
              test: /[\\/]node_modules[\\/](gsap)[\\/]/,
              name: "vendor-gsap",
              chunks: "all",
              priority: 30,
            },
            cobe: {
              test: /[\\/]node_modules[\\/](cobe)[\\/]/,
              name: "vendor-cobe",
              chunks: "all",
              priority: 30,
            },
            wagmi: {
              test: /[\\/]node_modules[\\/](wagmi|viem|@wagmi)[\\/]/,
              name: "vendor-wagmi",
              chunks: "all",
              priority: 25,
            },
            rainbow: {
              test: /[\\/]node_modules[\\/](@rainbow-me)[\\/]/,
              name: "vendor-rainbow",
              chunks: "all",
              priority: 25,
            },
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "vendor-framework",
              chunks: "all",
              priority: 40,
            },
            commons: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendor-commons",
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
        // Module IDs for better caching
        moduleIds: "deterministic",
      };
    }

    // Resolve fallbacks for client-side
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
        },
      };
    }

    return config;
  },
};

export default nextConfig;
