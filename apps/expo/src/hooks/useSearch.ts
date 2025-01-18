import { useMemo, useState } from "react";
import type { IFuseOptions } from "fuse.js";
import Fuse from "fuse.js";

interface UseSearchOptions<T> {
  data: T[];
  fuseOptions: IFuseOptions<T>;
}

const useSearch = <T>({ data, fuseOptions }: UseSearchOptions<T>) => {
  const [searchQuery, setSearchQuery] = useState("");

  const fuse = useMemo(() => new Fuse(data, fuseOptions), [data, fuseOptions]);

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
