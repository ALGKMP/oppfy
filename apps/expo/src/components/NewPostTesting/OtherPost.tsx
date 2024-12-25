import React, { memo } from "react";

import PostCard from "./PostCard";
import type { PostData } from "./PostCard";

interface OtherPostProps extends PostData {
  endpoint: "other-profile" | "home-feed";
}

const OtherPost = memo((postProps: OtherPostProps) => {
  return (
    <>
      <PostCard {...postProps} />
    </>
  );
});

export default OtherPost;
