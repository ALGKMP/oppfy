export interface PostMediaProps {
  media: {
    id: string;
    url: string;
    isViewable: boolean;
    dimensions: {
      width: number;
      height: number;
    };
    recipient: {
      id: string;
    };
  };
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  stats: {
    hasLiked: boolean;
  };
}
