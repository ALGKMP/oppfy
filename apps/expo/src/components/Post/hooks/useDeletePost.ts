import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

export const useDeletePost = () => {
  const utils = api.useUtils();
  const { user } = useAuth();

  const { mutate: deletePostMutation, isPending: isDeleting } =
    api.post.deletePost.useMutation({
      onMutate: async (newData) => {
        if (user === null) return;

        await utils.post.paginatePosts.invalidate({
          userId: user.uid,
        });

        const prevData = utils.post.paginatePosts.getInfiniteData({
          userId: user.uid,
        });
        if (prevData === undefined) return;

        utils.post.paginatePosts.setInfiniteData(
          { userId: user.uid },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.filter(
                (item) => item.post.id != newData.postId,
              ),
            })),
          },
        );
        return { prevData };
      },
      onError: (_err, _newData, ctx) => {
        if (user === null) return;
        if (ctx === undefined) return;

        utils.post.paginatePosts.setInfiniteData(
          { userId: user.uid },
          ctx.prevData,
        );
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
