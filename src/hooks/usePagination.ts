import { useState, useEffect } from 'react';

export const usePagination = (totalItems: number, itemsPerPage: number) => {
    const [page, setPage] = useState(1);
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    
    const goToPage = (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)));
    };
    
    return {
      page,
      totalPages,
      startIndex,
      endIndex,
      goToPage,
      setPage
    };
  };