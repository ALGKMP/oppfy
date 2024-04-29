
export interface ProfileMetadata {
  user: string;
  key: string;
  bucket: string;
}

export interface PostMetadata {
  author: string;
  friend: string;
  caption?: string;
}
