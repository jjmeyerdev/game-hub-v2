import { useState, useRef, useCallback, useEffect } from 'react';
import type { IGDBGame } from '@/lib/types';

interface UseIGDBSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useIGDBSearch(options: UseIGDBSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/igdb/search?q=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data);
        setShowResults(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [minQueryLength]
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        search(newQuery);
      }, debounceMs);
    },
    [search, debounceMs]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setShowResults(false);
    setQuery('');
    setError(null);
  }, []);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResults]);

  return {
    query,
    results,
    loading,
    error,
    showResults,
    containerRef,
    setQuery: handleQueryChange,
    setShowResults,
    clearResults,
  };
}
