import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const PAGE_SIZE = 10;

const useDeletePost = () => {
  const utils = api.useUtils();
  const { user } = useAuth();

  const { mutate: deletePostMutation, isPending: isDeleting } =
    api.post.deletePost.useMutation({
      onMutate: async (newData) => {
        if (user === null) return;

        await utils.post.paginatePosts.invalidate({
          pageSize: PAGE_SIZE,
        });
        await utils.post.paginatePostsForFeed.invalidate({
          pageSize: PAGE_SIZE,
        });

        const prevPostsData = utils.post.paginatePosts.getInfiniteData({
          pageSize: PAGE_SIZE,
        });
        const prevPostsForFeedData =
          utils.post.paginatePostsForFeed.getInfiniteData({
            pageSize: PAGE_SIZE,
          });

        if (prevPostsData === undefined) return;
        if (prevPostsForFeedData === undefined) return;

        utils.post.paginatePosts.setInfiniteData(
          { pageSize: PAGE_SIZE },
          {
            ...prevPostsData,
            pages: prevPostsData.pages.map((page) => ({
              ...page,
              items: page.items.filter(
                (item) => item.post.id != newData.postId,
              ),
            })),
          },
        );
        utils.post.paginatePostsForFeed.setInfiniteData(
          { pageSize: PAGE_SIZE },
          {
            ...prevPostsForFeedData,
            pages: prevPostsForFeedData.pages.map((page) => ({
              ...page,
            })),
          },
        );
        return { prevData: { prevPostsData, prevPostsForFeedData } };
      },
      onError: (_err, _newData, ctx) => {
        if (user === null) return;
        if (ctx === undefined) return;

        utils.post.paginatePosts.setInfiniteData(
          { pageSize: PAGE_SIZE },
          ctx.prevData.prevPostsData,
        );
        utils.post.paginatePostsForFeed.setInfiniteData(
          { pageSize: PAGE_SIZE },
          ctx.prevData.prevPostsForFeedData,
        );
      },
      onSettled: () => {
        void utils.post.paginatePosts.invalidate();
        void utils.post.paginatePostsForFeed.invalidate();
      },
    });

  const deletePost = (postId: string) => {
    deletePostMutation({ postId });
  };

  return {
    deletePost,
    isDeleting,
  };
};

export { useDeletePost };
