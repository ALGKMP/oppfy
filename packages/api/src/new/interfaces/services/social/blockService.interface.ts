export interface IBlockService {
  blockUser(options: { blockerId: string; blockedId: string }): Promise<void>;

  unblockUser(options: { blockerId: string; blockedId: string }): Promise<void>;

  isBlocked(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<boolean>;

  getBlockedUsers(options: {
    userId: string;
    cursor?: { createdAt: Date; userId: string } | null;
    pageSize?: number;
  }): Promise<{
    items: {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
    }[];
    nextCursor: { createdAt: Date; userId: string } | null;
  }>;
}
