/**
 * Library API
 * Handles URL scraping and data source management for idea generation
 */
import { founderClient } from './founderClient';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

export const UrlSourceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string().optional().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  ideas_generated: z.number().int().default(0),
  error: z.string().optional().nullable(),
  created_at: z.string(),
  processed_at: z.string().optional().nullable()
});

export const UrlSourcesResponseSchema = z.object({
  sources: z.array(UrlSourceSchema),
  total: z.number().int()
});

export const ScrapeUrlRequestSchema = z.object({
  user_id: z.number().int(),
  urls: z.array(z.string().url())
});

export const ScrapeJobResponseSchema = z.object({
  job_id: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  urls_count: z.number().int(),
  created_at: z.string()
});

// ============================================================================
// Types
// ============================================================================

export type UrlSource = z.infer<typeof UrlSourceSchema>;
export type UrlSourcesResponse = z.infer<typeof UrlSourcesResponseSchema>;
export type ScrapeJobResponse = z.infer<typeof ScrapeJobResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Submit URLs for scraping and idea extraction
 * POST /v1/autograph/scraper/start
 */
export async function submitUrlsForScraping(
  userId: number,
  urls: string[]
): Promise<ScrapeJobResponse> {
  const response = await founderClient.post<ScrapeJobResponse>(
    '/v1/autograph/scraper/start',
    {
      user_id: userId,
      spider: 'url_scraper',
      args: {
        urls: urls.join(',')
      }
    }
  );
  
  // Transform response to match our schema
  return {
    job_id: (response as any).id || crypto.randomUUID(),
    status: 'queued',
    urls_count: urls.length,
    created_at: new Date().toISOString()
  };
}

/**
 * Get URL sources for a user
 * Note: This may need backend support - currently returns from local storage
 */
export async function getUrlSources(userId: number): Promise<UrlSourcesResponse> {
  // TODO: Replace with actual API call when backend endpoint exists
  // GET /v1/autograph/sources?user_id={userId}
  const stored = localStorage.getItem(`library_sources_${userId}`);
  if (stored) {
    const sources = JSON.parse(stored) as UrlSource[];
    return { sources, total: sources.length };
  }
  return { sources: [], total: 0 };
}

/**
 * Save URL sources to local storage (temporary until backend support)
 */
export function saveUrlSources(userId: number, sources: UrlSource[]): void {
  localStorage.setItem(`library_sources_${userId}`, JSON.stringify(sources));
}

/**
 * Add new URL sources
 */
export async function addUrlSources(
  userId: number,
  urls: string[]
): Promise<UrlSource[]> {
  const existing = await getUrlSources(userId);
  
  const newSources: UrlSource[] = urls.map(url => ({
    id: crypto.randomUUID(),
    url,
    title: extractDomainFromUrl(url),
    status: 'pending' as const,
    ideas_generated: 0,
    error: null,
    created_at: new Date().toISOString(),
    processed_at: null
  }));
  
  const allSources = [...newSources, ...existing.sources];
  saveUrlSources(userId, allSources);
  
  return newSources;
}

/**
 * Update source status
 */
export async function updateSourceStatus(
  userId: number,
  sourceId: string,
  status: UrlSource['status'],
  error?: string
): Promise<void> {
  const { sources } = await getUrlSources(userId);
  const updated = sources.map(s => 
    s.id === sourceId 
      ? { ...s, status, error: error || null, processed_at: status === 'completed' ? new Date().toISOString() : s.processed_at }
      : s
  );
  saveUrlSources(userId, updated);
}

/**
 * Delete a URL source
 */
export async function deleteUrlSource(userId: number, sourceId: string): Promise<void> {
  const { sources } = await getUrlSources(userId);
  const filtered = sources.filter(s => s.id !== sourceId);
  saveUrlSources(userId, filtered);
}

// ============================================================================
// Helpers
// ============================================================================

function extractDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// ============================================================================
// Export
// ============================================================================

export const libraryAPI = {
  submitUrlsForScraping,
  getUrlSources,
  addUrlSources,
  updateSourceStatus,
  deleteUrlSource
};

export default libraryAPI;

