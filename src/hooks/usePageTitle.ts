import { useEffect } from 'react';

const BASE_TITLE = 'Marketing Campaign Platform';

export const usePageTitle = (page: string) => {
  useEffect(() => {
    document.title = `${page} — ${BASE_TITLE}`;
    return () => { document.title = BASE_TITLE; };
  }, [page]);
};
