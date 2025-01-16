type Endpoint = "self-profile" | "other-profile" | "single-post" | "home-feed";

export interface PostMediaProps {
  media: {
    id: string;
    url: string;
    dimensions: {
      width: number;
      height: number;
    };
    recipient: {
      id: string;
    };
  };
  stats: {
    hasLiked: boolean;
  };
  endpoint: Endpoint;
  isViewable: boolean;
}
