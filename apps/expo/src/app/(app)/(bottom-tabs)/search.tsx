import React, { useEffect, useState } from "react";
import { Input, Text, useDebounce, View } from "tamagui";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const SEARCH_REFRESH_DELAY = 500;

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    RouterOutputs["users"]["search"]
  >([]);
  const [loading, setLoading] = useState(false);

  const search = api.users.search.useMutation();

  // Debounced search function
  const debouncedSearch = useDebounce((value: string) => {
    if (value) {
      setLoading(true);
      search.mutate(
        { username: value },
        {
          onSuccess: (data) => {
            setSearchResults(data);
            setLoading(false);
          },
          onError: () => {
            setLoading(false);
          },
        },
      );
    } else {
      setSearchResults([]); // Clear results if search term is empty
    }
  }, SEARCH_REFRESH_DELAY); // 500ms delay

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$4">
      <Text color="white">Search</Text>
      <Input
        placeholder="Search by username"
        placeholderTextColor="#888"
        color="white"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <View>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          searchResults.map((user) => (
            <Text key={user.id}>{user.username}</Text>
          ))
        )}
      </View>
    </View>
  );
};

export default Search;
