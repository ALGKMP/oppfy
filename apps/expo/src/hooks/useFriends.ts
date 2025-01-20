import type { UseInfiniteQueryResult } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export type SelfFriends = RouterOutputs["friend"]["paginateFriendsSelf"];
export type OtherFriends = RouterOutputs["friend"]["paginateFriendsOthers"];

interface UseFriendsProps {
  userId?: string;
  pageSize?: number;
}

const useFriends = ({
  userId,
  pageSize = 10,
}: UseFriendsProps = {}): UseInfiniteQueryResult<
  OtherFriends | SelfFriends,
  unknown
> & {
  friends: OtherFriends["items"][number][] | undefined;
} => {
  const query = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId: userId!, pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: STALE_TIME,
      enabled: !!userId,
    },
  );

  const selfQuery = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: STALE_TIME,
      enabled: !userId,
    },
  );

  if (userId) {
    return {
      ...query,
      friends: query.data?.pages.flatMap((page) => page.items),
    };
  }

  return {
    ...selfQuery,
    friends: selfQuery.data?.pages.flatMap((page) => page.items),
  };
};

export default useFriends;
