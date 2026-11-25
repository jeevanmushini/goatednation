import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      {
        userAgent: ['Googlebot', 'Googlebot-Image', 'Googlebot-Favicon', 'Bingbot'],
        allow: '/',
      },
    ],
    sitemap: 'https://goatednation.com/sitemap.xml',
  };
}
