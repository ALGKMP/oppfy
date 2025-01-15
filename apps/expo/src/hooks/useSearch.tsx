import { useMemo, useState } from "react";
import type { FuseOptionKey } from "fuse.js";
import Fuse from "fuse.js";

interface UseSearchOptions<T> {
  data: T[];
  keys: (keyof T)[];
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
        keys: keys as FuseOptionKey<T>[],
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
