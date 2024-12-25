import { api } from "~/utils/api";

export type Endpoint = "self-profile" | "other-profile" | "home-feed" | "single-post";

interface IncrementLikeCountProps {
  postId: string;
  endpoint: Endpoint;
  changeCountBy: number;
  userId?: string;
}

export const useOptimisticUpdatePost = () => {
  const utils = api.useUtils();

  const changeLikeCount = async ({
    postId,
    endpoint,
    changeCountBy,
    userId,
  }: IncrementLikeCountProps) => {
    switch (endpoint) {
      case "self-profile": {
        await utils.post.paginatePostsOfUserSelf.cancel();
        const prevData = utils.post.paginatePostsOfUserSelf.getInfiniteData({
          pageSize: 10,
        });
        if (!prevData) return;
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === postId
                  ? { ...item, likesCount: item.likesCount + changeCountBy }
                  : item,
              ),
            })),
          },
        );
        break;
      }

      case "other-profile": {
        if (!userId) return;
        await utils.post.paginatePostsOfUserOther.cancel();
        const prevData = utils.post.paginatePostsOfUserOther.getInfiniteData({
          userId,
          pageSize: 10,
        });
        if (!prevData) return;
        utils.post.paginatePostsOfUserOther.setInfiniteData(
          { userId, pageSize: 10 },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === postId
                  ? { ...item, likesCount: item.likesCount + changeCountBy }
                  : item,
              ),
            })),
          },
        );
        break;
      }

      case "single-post": {
        await utils.post.getPost.cancel();
        const prevData = utils.post.getPost.getData({ postId });
        if (!prevData) return;
        utils.post.getPost.setData(
          { postId },
          { ...prevData, likesCount: prevData.likesCount + changeCountBy },
        );
        break;
      }

      case "home-feed": {
        await utils.post.paginatePostsForFeed.cancel();
        const prevData = utils.post.paginatePostsForFeed.getInfiniteData({
          pageSize: 10,
        });
        if (!prevData) return;
        utils.post.paginatePostsForFeed.setInfiniteData(
          { pageSize: 10 },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === postId
                  ? { ...item, likesCount: item.likesCount + changeCountBy }
                  : item,
              ),
            })),
          },
        );
      }
    }
  };

  const changeCommentCount = async ({
    postId,
    endpoint,
    changeCountBy,
    userId,
  }: IncrementLikeCountProps) => {
    switch (endpoint) {
      case "self-profile": {
        await utils.post.paginatePostsOfUserSelf.cancel();
        const prevData = utils.post.paginatePostsOfUserSelf.getInfiniteData({
          pageSize: 10,
        });
        if (!prevData) return;
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === postId
                  ? {
                      ...item,
                      commentsCount: item.commentsCount + changeCountBy,
                    }
                  : item,
              ),
            })),
          },
        );
        break;
      }
      case "other-profile": {
        if (!userId) return;
        await utils.post.paginatePostsOfUserOther.cancel();
        const prevData = utils.post.paginatePostsOfUserOther.getInfiniteData({
          userId,
          pageSize: 10,
        });
        if (!prevData) return;
        utils.post.paginatePostsOfUserOther.setInfiniteData(
          { userId, pageSize: 10 },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === postId
                  ? {
                      ...item,
                      commentsCount: item.commentsCount + changeCountBy,
                    }
                  : item,
              ),
            })),
          },
        );
        break;
      }

      case "single-post": {
        await utils.post.getPost.cancel();
        const prevData = utils.post.getPost.getData({ postId });
        if (!prevData) return;
        utils.post.getPost.setData(
          { postId },
          {
            ...prevData,
            commentsCount: prevData.commentsCount + changeCountBy,
          },
        );
        break;
      }
      case "home-feed": {
        await utils.post.paginatePostsForFeed.cancel();
        const prevData = utils.post.paginatePostsForFeed.getInfiniteData({
          pageSize: 10,
        });
        if (!prevData) return;
        utils.post.paginatePostsForFeed.setInfiniteData(
          { pageSize: 10 },
          {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === postId
                  ? {
                      ...item,
                      commentsCount: item.commentsCount + changeCountBy,
                    }
                  : item,
              ),
            })),
          },
        );
      }
    }
  };

  const invalidatePost = async ({
    postId,
    endpoint,
    userId,
  }: {
    postId: string;
    endpoint: Endpoint;
    userId?: string;
  }) => {
    switch (endpoint) {
      case "self-profile":
        await utils.post.paginatePostsOfUserSelf.invalidate({
          pageSize: 10,
        });
        break;
      case "other-profile":
        if (!userId) return;
        await utils.post.paginatePostsOfUserOther.invalidate({
          userId,
          pageSize: 10,
        });
        break;
      case "home-feed":
        await utils.post.paginatePostsForFeed.invalidate({
          pageSize: 10,
        });
        break;
      case "single-post":
        await utils.post.getPost.invalidate({ postId });
        break;
      default:
        break;
    }
  };

  return { changeLikeCount, changeCommentCount, invalidatePost };
};
