import React, { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { Input, Text, View } from "tamagui";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

const SEARCH_REFRESH_DELAY = 200;

const Search = () => {
  const [searchResults, setSearchResults] = useState<
    RouterOutputs["search"]["search"]
  >([]);

  const search = api.search.search.useMutation();

  const debouncedSearch = debounce(async (partialUsername: string) => {
    if (!partialUsername) return;

    const data = await search.mutateAsync({ username: partialUsername });
    setSearchResults(data);
  }, SEARCH_REFRESH_DELAY);

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$4">
      <Text color="white">Search</Text>
      <Input
        placeholder="Search by username"
        placeholderTextColor="#888"
        color="white"
        onChangeText={debouncedSearch}
      />
      <View>
        {searchResults.map((user) => (
          <Text key={user.id}>{user.username}</Text>
        ))}
      </View>
    </View>
  );
};

export default Search;
