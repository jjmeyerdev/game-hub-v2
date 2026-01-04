import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
      },
      // PSN avatar and game images
      {
        protocol: 'http',
        hostname: 'psn-rsc.prod.dl.playstation.net',
      },
      {
        protocol: 'https',
        hostname: 'psn-rsc.prod.dl.playstation.net',
      },
      {
        protocol: 'https',
        hostname: '*.playstation.net',
      },
      {
        protocol: 'https',
        hostname: 'image.api.playstation.com',
      },
      {
        protocol: 'https',
        hostname: '*.playstation.com',
      },
      // Xbox avatar and game images
      {
        protocol: 'https',
        hostname: 'images-eds-ssl.xboxlive.com',
      },
      {
        protocol: 'http',
        hostname: 'images-eds.xboxlive.com',
      },
      {
        protocol: 'https',
        hostname: 'images-eds.xboxlive.com',
      },
      {
        protocol: 'https',
        hostname: '*.xboxlive.com',
      },
      {
        protocol: 'http',
        hostname: '*.xboxlive.com',
      },
      // Microsoft Store images (Xbox games)
      {
        protocol: 'http',
        hostname: 'store-images.s-microsoft.com',
      },
      {
        protocol: 'https',
        hostname: 'store-images.s-microsoft.com',
      },
      {
        protocol: 'https',
        hostname: '*.s-microsoft.com',
      },
      {
        protocol: 'http',
        hostname: '*.s-microsoft.com',
      },
      // Steam avatar and game images
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.akamai.steamstatic.com',
      },
      // Epic Games Store images
      {
        protocol: 'https',
        hostname: 'cdn1.epicgames.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.epicgames.com',
      },
      {
        protocol: 'https',
        hostname: '*.epicgames.com',
      },
    ],
  },
};

export default nextConfig;
