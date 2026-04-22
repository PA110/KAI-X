/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Three.js and WebGL to work properly
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  
  // Disable strict mode for Three.js compatibility
  reactStrictMode: false,

  webpack: (config) => {
    // Handle Three.js examples imports
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

module.exports = nextConfig;
