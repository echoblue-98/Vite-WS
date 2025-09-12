const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});


/** @type {import('next').NextConfig} */
const nextConfig = {
  // config options here
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = withBundleAnalyzer({
  ...nextConfig,
});
