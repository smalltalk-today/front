import type { MetadataRoute } from 'next';
import { getServerEnv } from '@/shared/config/index.server';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/dev/' },
    sitemap: new URL('/sitemap.xml', getServerEnv().siteUrl).toString(),
  };
}
