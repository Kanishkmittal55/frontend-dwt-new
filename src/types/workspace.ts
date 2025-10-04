// src/types/workspace.ts
export interface Workspace {
    _id: string;
    name: string;
    description?: string;
    public: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    documents?: string[];
    chunks?: string[];
    schemas?: string[];
    graphs?: string[];
  }
  
  export interface WorkspaceStats {
    documents: number;
    chunks: number;
    schemas: number;
    graphs: number;
  }
  
  export interface WorkspaceContextValue {
    workspace: Workspace | null;
    workspaceId: string | null;
    stats: WorkspaceStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
  }
