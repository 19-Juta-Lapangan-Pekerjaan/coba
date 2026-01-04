import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  /* config options here */

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

  // React strict mode untuk development
  reactStrictMode: true,

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
