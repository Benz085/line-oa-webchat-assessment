import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // รูปโปรไฟล์จาก LINE Get Profile API (host เป็นได้ทั้ง profile. และ sprofile.)
    remotePatterns: [{ protocol: 'https', hostname: '**.line-scdn.net' }],
  },
};

export default nextConfig;
