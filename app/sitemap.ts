import type { MetadataRoute } from 'next';
import { getServerEnv } from '@/shared/config/index.server';
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: getServerEnv().siteUrl }];
}
