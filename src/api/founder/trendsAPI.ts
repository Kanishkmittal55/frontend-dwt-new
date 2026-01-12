/**
 * Trends API
 * Handles entity trend data for visualization
 */
import { founderClient } from './founderClient';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

export const EntityTypeSchema = z.enum(['company', 'topic', 'person', 'ticker']);
export const PeriodTypeSchema = z.enum(['hourly', 'daily', 'weekly']);

export const EntityTrendSchema = z.object({
  id: z.string().uuid().optional(),
  entity_name: z.string(),
  entity_type: EntityTypeSchema,
  entity_normalized: z.string(),
  period_type: PeriodTypeSchema,
  period_start: z.string(),
  period_end: z.string(),
  mention_count: z.number().int(),
  unique_sources: z.number().int().optional().nullable(),
  ewma_score: z.number().optional().nullable(),
  ewma_variance: z.number().optional().nullable(),
  trend_score: z.number().optional().nullable(),
  velocity: z.number().optional().nullable(),
  acceleration: z.number().optional().nullable(),
  is_trending: z.boolean().optional().nullable(),
  first_seen_trending_at: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable()
});

export const TrendingEntitiesResponseSchema = z.object({
  entities: z.array(EntityTrendSchema),
  period_type: PeriodTypeSchema,
  period_start: z.string(),
  period_end: z.string(),
  total: z.number().int().optional().nullable()
});

export const TrendHistoryPointSchema = z.object({
  period_start: z.string().optional().nullable(),
  mention_count: z.number().int().optional().nullable(),
  ewma_score: z.number().optional().nullable(),
  trend_score: z.number().optional().nullable(),
  is_trending: z.boolean().optional().nullable()
});

export const EntityTrendHistoryResponseSchema = z.object({
  entity_normalized: z.string(),
  entity_name: z.string().optional().nullable(),
  entity_type: EntityTypeSchema.optional().nullable(),
  history: z.array(TrendHistoryPointSchema)
});

// ============================================================================
// Types
// ============================================================================

export type EntityType = z.infer<typeof EntityTypeSchema>;
export type PeriodType = z.infer<typeof PeriodTypeSchema>;
export type EntityTrend = z.infer<typeof EntityTrendSchema>;
export type TrendingEntitiesResponse = z.infer<typeof TrendingEntitiesResponseSchema>;
export type TrendHistoryPoint = z.infer<typeof TrendHistoryPointSchema>;
export type EntityTrendHistoryResponse = z.infer<typeof EntityTrendHistoryResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

export interface GetTrendingEntitiesParams {
  period_type?: PeriodType;
  entity_type?: EntityType;
  limit?: number;
}

/**
 * Get currently trending entities
 * GET /v1/trends/entities
 */
export async function getTrendingEntities(
  params?: GetTrendingEntitiesParams
): Promise<TrendingEntitiesResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.period_type) {
    searchParams.set('period_type', params.period_type);
  }
  if (params?.entity_type) {
    searchParams.set('entity_type', params.entity_type);
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }

  const query = searchParams.toString();
  const url = `/v1/trends/entities${query ? `?${query}` : ''}`;
  
  const response = await founderClient.get<TrendingEntitiesResponse>(url);
  return TrendingEntitiesResponseSchema.parse(response);
}

export interface GetEntityTrendHistoryParams {
  period_type?: PeriodType;
  limit?: number;
}

/**
 * Get trend history for a specific entity (for charting)
 * GET /v1/trends/entities/{entityNormalized}/history
 */
export async function getEntityTrendHistory(
  entityNormalized: string,
  params?: GetEntityTrendHistoryParams
): Promise<EntityTrendHistoryResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.period_type) {
    searchParams.set('period_type', params.period_type);
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }

  const query = searchParams.toString();
  const url = `/v1/trends/entities/${encodeURIComponent(entityNormalized)}/history${query ? `?${query}` : ''}`;
  
  const response = await founderClient.get<EntityTrendHistoryResponse>(url);
  return EntityTrendHistoryResponseSchema.parse(response);
}

// ============================================================================
// Export
// ============================================================================

export const trendsAPI = {
  getTrendingEntities,
  getEntityTrendHistory
};

export default trendsAPI;


