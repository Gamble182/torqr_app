import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://torqr.de';
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/datenschutz`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/impressum`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
