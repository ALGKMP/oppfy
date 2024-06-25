import { useMemo, useState } from "react";
import Fuse from "fuse.js";

interface UseSearchOptions<T> {
  data: T[];
  keys: string[];
  threshold?: number;
}

const useSearch = <T,>({
  data,
  keys,
  threshold = 0.3,
}: UseSearchOptions<T>) => {
  const [searchQuery, setSearchQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys,
        threshold,
      }),
    [data, keys, threshold],
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return data;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [data, searchQuery, fuse]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
  };
};

export default useSearch;
