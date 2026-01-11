/**
 * Upload API
 * Handles file uploads to S3 and document processing jobs
 */
import { founderClient } from './founderClient';
import {
  PresignedUploadResponseSchema,
  ScraperJobResponseSchema,
  parseApiResponse,
  type PresignedUploadResponse,
  type ScraperJobResponse
} from './schemas';

// ============================================================================
// Types
// ============================================================================

export interface UploadUrlRequest {
  user_id: number;
  filename: string;
  content_type?: string;
}

export interface StartJobRequest {
  user_id: number;
  spider: string;
  args?: Record<string, string>;
  input_file_url?: string;
  input_file_type?: 'txt' | 'pdf';
}

export type { PresignedUploadResponse, ScraperJobResponse };

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get a presigned URL for uploading a file to S3
 * POST /v1/autograph/upload-url
 * 
 * @param userId - The user's ID
 * @param filename - Name of the file to upload
 * @param contentType - MIME type (optional, inferred from extension)
 * @returns Presigned upload URL and S3 URI
 */
export async function getUploadUrl(
  userId: number,
  filename: string,
  contentType?: string
): Promise<PresignedUploadResponse> {
  const response = await founderClient.post<PresignedUploadResponse>(
    '/v1/autograph/upload-url',
    {
      user_id: userId,
      filename,
      content_type: contentType
    }
  );

  return parseApiResponse(PresignedUploadResponseSchema, response);
}

/**
 * Upload a file directly to S3 using a presigned URL
 * 
 * @param presignedUrl - The presigned URL from getUploadUrl()
 * @param file - The File object to upload
 * @param contentType - MIME type of the file
 * @returns true if upload successful
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File,
  contentType?: string
): Promise<boolean> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType || file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
  }

  return true;
}

/**
 * Start a document processing job
 * POST /v1/autograph/scraper/start
 * 
 * @param request - Job request with user_id, spider type, and optional file URL
 * @returns Job details including UUID
 */
export async function startProcessingJob(
  request: StartJobRequest
): Promise<ScraperJobResponse> {
  const response = await founderClient.post<ScraperJobResponse>(
    '/v1/autograph/scraper/start',
    {
      user_id: request.user_id,
      spider: request.spider,
      args: request.args || {},
      input_file_url: request.input_file_url,
      input_file_type: request.input_file_type
    }
  );

  return parseApiResponse(ScraperJobResponseSchema, response);
}

/**
 * Upload a file and start processing in one step
 * 
 * @param userId - The user's ID
 * @param file - The File to upload and process
 * @returns Job details
 */
export async function uploadAndProcess(
  userId: number,
  file: File
): Promise<ScraperJobResponse> {
  // 1. Get presigned URL
  const uploadInfo = await getUploadUrl(userId, file.name, file.type);

  // 2. Upload file to S3
  await uploadFileToS3(uploadInfo.upload_url, file, file.type);

  // 3. Start processing job
  const job = await startProcessingJob({
    user_id: userId,
    spider: 'text_processor',
    input_file_url: uploadInfo.s3_uri,
    input_file_type: file.name.endsWith('.txt') ? 'txt' : 'txt' // Backend only supports txt currently
  });

  return job;
}

/**
 * Submit extracted text for processing (from ScribeOCR)
 * Creates a text file in S3 and starts processing
 * 
 * @param userId - The user's ID
 * @param text - The extracted text content
 * @param sourceName - Optional name for the source (default: "extracted-text")
 * @returns Job details
 */
export async function submitTextForProcessing(
  userId: number,
  text: string,
  sourceName: string = 'extracted-text'
): Promise<ScraperJobResponse> {
  // Create a text file from the extracted text
  const filename = `${sourceName}-${Date.now()}.txt`;
  const textBlob = new Blob([text], { type: 'text/plain' });
  const textFile = new File([textBlob], filename, { type: 'text/plain' });

  // Upload and process
  return uploadAndProcess(userId, textFile);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Validate file type for upload
 */
export function isValidFileType(filename: string): boolean {
  const validExtensions = ['txt', 'pdf'];
  const ext = filename.split('.').pop()?.toLowerCase();
  return validExtensions.includes(ext || '');
}

// ============================================================================
// Export
// ============================================================================

export const uploadAPI = {
  getUploadUrl,
  uploadFileToS3,
  startProcessingJob,
  uploadAndProcess,
  submitTextForProcessing,
  getMimeType,
  isValidFileType
};

export default uploadAPI;























