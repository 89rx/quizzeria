// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      // Add the pdf-parse package here
      serverComponentsExternalPackages: ["pdf-parse"],
    },
  };
  
  export default nextConfig;