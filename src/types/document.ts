export interface DocumentMetadata {
    size: number;
    format: string;
    filename: string;
  }
  
  export interface DocumentError {
    message: string;
    details?: string;
  }
  
  export interface Document {
    _id: string;
    workspaces: string[];
    status: 'pending' | 'uploaded' | 'processing' | 'processed' | 'ready' | 'failed';
    errors: DocumentError[];
    metadata: DocumentMetadata;
    tags: Record<string, string[]>;
    user_metadata: Record<string, any>;
    created_at: string;
    updated_at?: string;
    created_by: string;
  }
  
  export interface DocumentUploadForm {
    file: File | null;
    tags: string[];
    user_metadata: Record<string, string>;
  }