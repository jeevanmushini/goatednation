import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GOATED NATION | Premium Anime Streetwear',
    short_name: 'GOATED NATION',
    description:
      'Wear the culture. Premium heavyweight oversized anime streetwear, graphic tees, hoodies, and cargo pants.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0E0E0E',
    icons: [
      {
        src: '/icon-48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
