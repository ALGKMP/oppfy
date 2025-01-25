import type { Contact } from "expo-contacts";
import type { InfiniteData, QueryFunctionContext } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import useContacts from "./useContacts";

const INITIAL_PAGE_SIZE = 20;
const PAGE_SIZE = 10;

interface ContactsPage {
  items: Contact[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

type ContactsQueryKey = ["contacts"];
type ContactsInfiniteData = InfiniteData<ContactsPage>;

export const useContactsInfinite = () => {
  const { getDeviceContactsNotOnApp } = useContacts();

  return useInfiniteQuery<
    ContactsPage,
    Error,
    ContactsInfiniteData,
    ContactsQueryKey,
    number | null
  >({
    queryKey: ["contacts"],
    queryFn: async (
      context: QueryFunctionContext<ContactsQueryKey, number | null>,
    ) => {
      const isInitialFetch = !context.pageParam;
      const contacts = await getDeviceContactsNotOnApp();
      
      const startIndex = context.pageParam ?? 0;
      const pageSize = isInitialFetch ? INITIAL_PAGE_SIZE : PAGE_SIZE;
      const endIndex = startIndex + pageSize;
      
      const items = contacts.slice(startIndex, endIndex);
      const hasNextPage = endIndex < contacts.length;

      return {
        items,
        nextCursor: hasNextPage ? endIndex : null,
        hasNextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });
};