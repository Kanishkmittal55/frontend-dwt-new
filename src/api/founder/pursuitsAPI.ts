/**
 * Pursuits API
 * HTTP client for founder pursuit CRUD (goals, tracks, milestones)
 * Phase 2: Pursuit Service + HTTP API
 */
import { founderClient } from './founderClient';
import {
  PursuitListResponseSchema,
  PursuitSchema,
  TrackSchema,
  MilestoneSchema,
  PursuitTrackListResponseSchema,
  PursuitMilestoneListResponseSchema,
  RadarDiscoveryListResponseSchema,
  RadarDiscoverySummaryResponseSchema,
  CreatePursuitRequestSchema,
  CreateTrackRequestSchema,
  CreateMilestoneRequestSchema,
  UpdatePursuitPhaseRequestSchema,
  parseApiResponse,
  type PursuitListResponse,
  type Pursuit,
  type Track,
  type Milestone,
  type RadarDiscoveryItem,
  type RadarDiscoverySummaryResponse,
  type CreatePursuitRequest,
  type CreateTrackRequest,
  type CreateMilestoneRequest
} from './schemas';

// ============================================================================
// Re-export types
// ============================================================================

export type {
  Pursuit,
  Track,
  Milestone,
  RadarDiscoveryItem,
  RadarDiscoverySummaryResponse,
  PursuitListResponse,
  CreatePursuitRequest,
  CreateTrackRequest,
  CreateMilestoneRequest,
  ScoreFilter
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all pursuits for a founder
 * GET /v1/founder/{userID}/pursuits
 */
export async function getPursuits(userID: number): Promise<PursuitListResponse> {
  const endpoint = `/v1/founder/${userID}/pursuits`;
  const response = await founderClient.get<PursuitListResponse>(endpoint);
  return parseApiResponse(PursuitListResponseSchema, response);
}

/**
 * Get the active pursuit for a goal type (client-side filter)
 * No dedicated backend endpoint - filters from getPursuits
 */
export async function getActivePursuit(
  userID: number,
  goalType: string
): Promise<Pursuit | null> {
  const response = await getPursuits(userID);
  const active = response.items.find(
    (p) => p.status === 'active' && p.goal_type === goalType
  );
  return active ?? null;
}

/**
 * Create a new pursuit
 * POST /v1/founder/{userID}/pursuits
 */
export async function createPursuit(
  userID: number,
  params: CreatePursuitRequest
): Promise<Pursuit> {
  parseApiResponse(CreatePursuitRequestSchema, params);
  const endpoint = `/v1/founder/${userID}/pursuits`;
  const response = await founderClient.post<Pursuit>(endpoint, params);
  return parseApiResponse(PursuitSchema, response);
}

/**
 * Get a single pursuit by UUID
 * GET /v1/founder/{userID}/pursuits/{uuid}
 */
export async function getPursuit(
  userID: number,
  pursuitUUID: string
): Promise<Pursuit> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}`;
  const response = await founderClient.get<Pursuit>(endpoint);
  return parseApiResponse(PursuitSchema, response);
}

/**
 * Get tracks for a pursuit
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks
 */
export async function getTracksByPursuit(
  userID: number,
  pursuitUUID: string
): Promise<Track[]> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks`;
  const response = await founderClient.get<{ items: Track[]; count: number }>(
    endpoint
  );
  const validated = parseApiResponse(PursuitTrackListResponseSchema, response);
  return validated.items;
}

/**
 * Create a track for a pursuit
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks
 */
export async function createTrack(
  userID: number,
  pursuitUUID: string,
  params: CreateTrackRequest
): Promise<Track> {
  parseApiResponse(CreateTrackRequestSchema, params);
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks`;
  const response = await founderClient.post<Track>(endpoint, params);
  return parseApiResponse(TrackSchema, response);
}

/** Score filter options: All (no filter), or exact bucket 7, 8, 9 (matches graph bars) */
export type ScoreFilter = 'all' | 7 | 8 | 9;

/**
 * Get radar discoveries (job listings, etc.) for a pursuit
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/radar/discoveries
 * @param score - Optional: 'all' | 7 | 8 | 9 for exact score bucket (matches graph)
 */
export async function getDiscoveriesByPursuit(
  userID: number,
  pursuitUUID: string,
  options?: { score?: ScoreFilter }
): Promise<RadarDiscoveryItem[]> {
  let endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/radar/discoveries`;
  const score = options?.score;
  if (score && score !== 'all') {
    endpoint += `?score=${score}`;
  }
  const response = await founderClient.get<{ items: RadarDiscoveryItem[]; count: number }>(
    endpoint
  );
  const validated = parseApiResponse(RadarDiscoveryListResponseSchema, response);
  return validated.items;
}

/** ApplyPilot-style discovery engines (JobSpy, Workday, SmartExtract) */
export const DISCOVERY_ENGINES = ['jobspy', 'workday', 'smartextract'] as const;

export type RunRadarCrawlOptions = {
  sourceSites?: string[];
};

// ============================================================================
// Radar Runs (discovery crawl runs per track)
// ============================================================================

export type PursuitTrackRadarRunStatus =
  | 'enqueued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PursuitTrackRadarRunResponse {
  uuid?: string;
  pursuit_uuid?: string;
  track_uuid?: string;
  user_id?: number;
  run_status?: PursuitTrackRadarRunStatus;
  current_source_site?: string | null;
  sources_completed_count?: number;
  sources_total?: number;
  source_sites?: string;
  ingested_count?: number;
  total_crawled_count?: number;
  error_message?: string | null;
  enqueued_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PursuitTrackRadarRunListResponse {
  items: PursuitTrackRadarRunResponse[];
  count: number;
}

/**
 * Get radar runs for a track
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/radar/runs
 */
export async function getRadarRunsByTrack(
  userID: number,
  pursuitUUID: string,
  trackUUID: string
): Promise<PursuitTrackRadarRunResponse[]> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/radar/runs`;
  const response = await founderClient.get<PursuitTrackRadarRunListResponse>(endpoint);
  return response.items ?? [];
}

/**
 * Create a radar run for a track (enqueues crawl job)
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/radar/runs
 * Returns 202 and runs crawl in background; WebSocket events emitted as discoveries are ingested.
 */
export async function createRadarRun(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  options: { source_sites?: string[] } = {}
): Promise<PursuitTrackRadarRunResponse> {
  const { source_sites = DISCOVERY_ENGINES } = options;
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/radar/runs`;
  const response = await founderClient.post<PursuitTrackRadarRunResponse>(endpoint, {
    source_sites
  });
  return response;
}

/**
 * Get discovery items for a radar run
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/radar/runs/{runUUID}/discoveries
 */
export async function getRadarRunDiscoveries(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  runUUID: string
): Promise<RadarDiscoveryItem[]> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/radar/runs/${runUUID}/discoveries`;
  const response = await founderClient.get<{ items: RadarDiscoveryItem[]; count: number }>(
    endpoint
  );
  return response.items ?? [];
}

/**
 * Delete a radar run
 * DELETE /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/radar/runs/{runUUID}
 */
export async function deleteRadarRun(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  runUUID: string
): Promise<void> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/radar/runs/${runUUID}`;
  await founderClient.delete(endpoint);
}

/**
 * Cancel a radar run (stops in-flight crawl)
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/radar/runs/{runUUID}/cancel
 */
export async function cancelRadarRun(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  runUUID: string
): Promise<PursuitTrackRadarRunResponse> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/radar/runs/${runUUID}/cancel`;
  console.log('[cancelRadarRun] Requesting cancel', { userID, pursuitUUID, trackUUID, runUUID });
  const response = await founderClient.post<PursuitTrackRadarRunResponse>(endpoint, {});
  console.log('[cancelRadarRun] Cancel success', { runUUID, status: response.run_status });
  return response;
}

// ============================================================================
// Legacy radar crawl (pursuit-level, kept for backward compatibility)
// ============================================================================

/**
 * Run radar crawl for a pursuit (scans job boards, ingests discoveries)
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/radar/crawl
 * Returns 202 and emits WebSocket founder.agent.discoveries events.
 * @deprecated Prefer createRadarRun for track-level runs
 */
export async function runRadarCrawl(
  userID: number,
  pursuitUUID: string,
  options: RunRadarCrawlOptions = {}
): Promise<{ results?: { source_site: string; ingested: number; total_crawled: number; error?: string }[]; status?: string; message?: string }> {
  const { sourceSites = DISCOVERY_ENGINES } = options;
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/radar/crawl`;
  const response = await founderClient.post<{
    results?: { source_site: string; ingested: number; total_crawled: number; error?: string }[];
    status?: string;
    message?: string;
  }>(endpoint, { source_sites: sourceSites });
  return response;
}

/**
 * Get radar discovery summary for a pursuit (dashboard stats)
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/radar/discoveries/summary
 */
export async function getDiscoveriesSummary(
  userID: number,
  pursuitUUID: string
): Promise<RadarDiscoverySummaryResponse> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/radar/discoveries/summary`;
  const response = await founderClient.get<RadarDiscoverySummaryResponse>(endpoint);
  return parseApiResponse(RadarDiscoverySummaryResponseSchema, response);
}

/**
 * Get assets (resume, cover letter, portfolio) for a track
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/assets
 */
export async function getTrackAssets(
  userID: number,
  pursuitUUID: string,
  trackUUID: string
): Promise<PursuitTrackAssetResponse[]> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/assets`;
  const response = await founderClient.get<{
    items: PursuitTrackAssetResponse[];
    count: number;
  }>(endpoint);
  return response.items ?? [];
}

/**
 * Get milestones for a track
 * GET /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/milestones
 */
export async function getMilestonesByTrack(
  userID: number,
  pursuitUUID: string,
  trackUUID: string
): Promise<Milestone[]> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/milestones`;
  const response = await founderClient.get<{
    items: Milestone[];
    count: number;
  }>(endpoint);
  const validated = parseApiResponse(
    PursuitMilestoneListResponseSchema,
    response
  );
  return validated.items;
}

/**
 * Create a milestone for a track
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/milestones
 */
export async function createMilestone(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  params: CreateMilestoneRequest
): Promise<Milestone> {
  parseApiResponse(CreateMilestoneRequestSchema, params);
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/milestones`;
  const response = await founderClient.post<Milestone>(endpoint, params);
  return parseApiResponse(MilestoneSchema, response);
}

/**
 * Update pursuit phase
 * PUT /v1/founder/{userID}/pursuits/{uuid}/phase
 */
export async function updatePursuitPhase(
  userID: number,
  pursuitUUID: string,
  phase: string
): Promise<Pursuit> {
  parseApiResponse(UpdatePursuitPhaseRequestSchema, { phase });
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/phase`;
  const response = await founderClient.put<Pursuit>(endpoint, { phase });
  return parseApiResponse(PursuitSchema, response);
}

/**
 * Complete a pursuit
 * POST /v1/founder/{userID}/pursuits/{uuid}/complete
 */
export async function completePursuit(
  userID: number,
  pursuitUUID: string
): Promise<Pursuit> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/complete`;
  const response = await founderClient.post<Pursuit>(endpoint);
  return parseApiResponse(PursuitSchema, response);
}

/**
 * Complete a milestone
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/milestones/{milestoneUUID}/complete
 */
export async function completeMilestone(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  milestoneUUID: string
): Promise<Milestone> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/milestones/${milestoneUUID}/complete`;
  const response = await founderClient.post<Milestone>(endpoint);
  return parseApiResponse(MilestoneSchema, response);
}

/**
 * Delete a pursuit
 * DELETE /v1/founder/{userID}/pursuits/{uuid}
 */
export async function deletePursuit(
  userID: number,
  pursuitUUID: string
): Promise<void> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}`;
  await founderClient.delete(endpoint);
}

/**
 * Delete a track
 * DELETE /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}
 */
export async function deleteTrack(
  userID: number,
  pursuitUUID: string,
  trackUUID: string
): Promise<void> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}`;
  await founderClient.delete(endpoint);
}

/**
 * Delete a milestone
 * DELETE /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/milestones/{milestoneUUID}
 */
export async function deleteMilestone(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  milestoneUUID: string
): Promise<void> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/milestones/${milestoneUUID}`;
  await founderClient.delete(endpoint);
}

// ============================================================================
// Track Asset Upload (resume, cover letter, portfolio)
// ============================================================================

export type TrackAssetType = 'resume' | 'cover_letter' | 'portfolio';

export interface PursuitTrackAssetPresignedResponse {
  upload_url?: string;
  s3_key?: string;
  s3_uri?: string;
  expires_at?: string;
}

export interface PursuitTrackAssetResponse {
  uuid: string;
  track_uuid: string;
  asset_type: string;
  s3_uri: string;
  filename: string;
  content_type?: string;
  asset_relevance_enabled?: boolean;
  extracted_text?: string | null;
  created_at?: string;
}

/**
 * Get presigned URL for uploading an asset to a track
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/assets/upload-url
 */
export async function getTrackAssetUploadUrl(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  params: { filename: string; content_type?: string; asset_type?: TrackAssetType }
): Promise<PursuitTrackAssetPresignedResponse> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/assets/upload-url`;
  return founderClient.post<PursuitTrackAssetPresignedResponse>(endpoint, params);
}

/**
 * Complete asset upload after file has been uploaded to S3
 * POST /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/assets/complete
 */
export async function completeTrackAssetUpload(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  params: { s3_uri: string; filename: string; content_type?: string; asset_type: TrackAssetType }
): Promise<PursuitTrackAssetResponse> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/assets/complete`;
  return founderClient.post<PursuitTrackAssetResponse>(endpoint, params);
}

/**
 * Upload a file (resume, cover letter, portfolio) to a pursuit track.
 * Reuses uploadFileToS3 from uploadAPI.
 */
export async function uploadTrackAsset(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  file: File,
  assetType: TrackAssetType = 'resume'
): Promise<PursuitTrackAssetResponse> {
  const { uploadFileToS3 } = await import('./uploadAPI');

  const uploadInfo = await getTrackAssetUploadUrl(userID, pursuitUUID, trackUUID, {
    filename: file.name,
    content_type: file.type || undefined,
    asset_type: assetType
  });

  const uploadUrl = uploadInfo.upload_url ?? '';
  const s3Uri = uploadInfo.s3_uri ?? '';
  await uploadFileToS3(uploadUrl, file, file.type);

  return completeTrackAssetUpload(userID, pursuitUUID, trackUUID, {
    s3_uri: s3Uri,
    filename: file.name,
    content_type: file.type || undefined,
    asset_type: assetType
  });
}

/**
 * Delete an asset from a track
 * DELETE /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/assets/{assetUUID}
 */
export async function deleteTrackAsset(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  assetUUID: string
): Promise<void> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/assets/${assetUUID}`;
  await founderClient.delete(endpoint);
}

/**
 * Toggle asset relevance for job matching
 * PATCH /v1/founder/{userID}/pursuits/{pursuitUUID}/tracks/{trackUUID}/assets/{assetUUID}/relevance
 */
export async function updateTrackAssetRelevance(
  userID: number,
  pursuitUUID: string,
  trackUUID: string,
  assetUUID: string,
  assetRelevanceEnabled: boolean
): Promise<PursuitTrackAssetResponse> {
  const endpoint = `/v1/founder/${userID}/pursuits/${pursuitUUID}/tracks/${trackUUID}/assets/${assetUUID}/relevance`;
  const response = await founderClient.patch<PursuitTrackAssetResponse>(endpoint, {
    asset_relevance_enabled: assetRelevanceEnabled
  });
  return response;
}

// ============================================================================
// API Object (for convenience, matches ideasAPI pattern)
// ============================================================================

export const pursuitsAPI = {
  getPursuits,
  getActivePursuit,
  createPursuit,
  getPursuit,
  getTracksByPursuit,
  getTrackAssets,
  getDiscoveriesByPursuit,
  runRadarCrawl,
  getRadarRunsByTrack,
  createRadarRun,
  cancelRadarRun,
  deleteRadarRun,
  createTrack,
  getMilestonesByTrack,
  createMilestone,
  updatePursuitPhase,
  completePursuit,
  completeMilestone,
  deletePursuit,
  deleteTrack,
  deleteMilestone,
  getTrackAssetUploadUrl,
  completeTrackAssetUpload,
  uploadTrackAsset,
  deleteTrackAsset,
  updateTrackAssetRelevance
};

export default pursuitsAPI;
