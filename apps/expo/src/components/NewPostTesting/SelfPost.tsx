import React, { memo } from "react";

import PostCard from "./PostCard";
import type { PostData } from "./PostCard";

interface SelfPostProps extends PostData {
  endpoint: "self-profile";
}

const SelfPost = memo((postProps: SelfPostProps) => {
  return (
    <>
      <PostCard {...postProps} />
    </>
  );
});

export default SelfPost;
