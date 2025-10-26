import { Chunk, ChunkOverlap, FilterParams } from '../../types/chunk-ui';

export class ChunkUtils {
    static formatContent(content: string | object, length = 150): string {
      if (typeof content === 'string') {
        return content.length > length ? content.substring(0, length) + '...' : content;
      }
      return JSON.stringify(content).substring(0, length) + '...';
    }
  
    static formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  
    static detectOverlaps(chunk: Chunk, allChunks: Chunk[]): ChunkOverlap[] {
      if (!chunk.content || typeof chunk.content !== 'string') return [];
      
      const overlaps: ChunkOverlap[] = [];
      const chunkContent = chunk.content.toLowerCase();
      const minOverlapLength = 50;
      
      allChunks.forEach(otherChunk => {
        if (otherChunk._id === chunk._id || 
            !otherChunk.content || 
            typeof otherChunk.content !== 'string') return;
        
        const otherContent = otherChunk.content.toLowerCase();
        
        for (let i = 0; i <= chunkContent.length - minOverlapLength; i++) {
          const substring = chunkContent.substring(i, i + minOverlapLength);
          if (otherContent.includes(substring)) {
            overlaps.push({
              chunkId: otherChunk._id,
              overlapPercentage: Math.round((minOverlapLength / chunkContent.length) * 100)
            });
            break;
          }
        }
      });
      
      return overlaps;
    }
  
    static processChunks(
      chunks: Chunk[], 
      filters: FilterParams
    ): Chunk[] {
      let filtered = chunks.filter(chunk => {
        const matchesSearch = !filters.searchTerm || 
          (typeof chunk.content === 'string' && 
           chunk.content.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
          (chunk.tags && 
           chunk.tags.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase())));
        
        const matchesType = filters.filterType === 'all' || chunk.data_type === filters.filterType;
        
        return matchesSearch && matchesType;
      });
  
      // Sort chunks
      switch (filters.sortBy) {
        case 'created_asc':
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'created_desc':
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'type':
          filtered.sort((a, b) => a.data_type.localeCompare(b.data_type));
          break;
      }
  
      return filtered;
    }
  
    static getChunkIcon(dataType: string): string {
      const iconMap: Record<string, string> = {
        'json': 'IconJson',
        'csv': 'IconFileTypeCsv',
        'code': 'IconCode',
        'text': 'IconFileText'
      };
      return iconMap[dataType] || 'IconFileText';
    }
  
    static copyToClipboard(content: string | object): void {
      const text = typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2);
      navigator.clipboard.writeText(text);
    }
  }