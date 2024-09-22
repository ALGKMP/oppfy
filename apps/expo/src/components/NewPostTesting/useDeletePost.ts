import { api } from "~/utils/api";

export const useDeletePost = () => {
  const utils = api.useUtils();
  const { mutate: deletePost, isLoading: isDeleting } =
    api.post.deletePost.useMutation({
      onMutate: async (newData) => {
        await utils.post.paginatePostsOfUserSelf.invalidate();

        const prevData = utils.post.paginatePostsOfUserSelf.getInfiniteData();
        if (!prevData) return;

        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          {},
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.postId != newData.postId),
            })),
          },
        );
        return { prevData };
      },
      onError: (_err, _newData, ctx) => {
        if (!ctx) return;
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          ctx.prevData,
        );
      },
      onSettled: async () => {
        await utils.post.paginatePostsOfUserSelf.invalidate();
      },
    });

  return {
    deletePost,
    isDeleting,
  };
};
