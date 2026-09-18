import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // รูปโปรไฟล์จาก LINE Get Profile API
    remotePatterns: [{ protocol: 'https', hostname: 'profile.line-scdn.net' }],
  },
};

export default nextConfig;
