  export interface Workspace {
    _id: string;
    name: string;
    description?: string;
  }
  
  export interface ChunkFormData {
    content: string;
    contentType: 'text' | 'json';
    tags: string[];
    user_metadata: Record<string, any>;
  }
  
  export interface ChunkOverlap {
    chunkId: string;
    overlapPercentage: number;
  }
  
  export interface PaginationParams {
    page: number;
    limit: number;
    total?: number;
  }
  
  export interface FilterParams {
    searchTerm: string;
    filterType: string;
    sortBy: string;
  }

  