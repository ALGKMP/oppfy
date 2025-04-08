import { inject } from "inversify";

import type { IPostService } from "../interfaces/services/content/post.service.interface";
import type { IPostInteractionService } from "../interfaces/services/content/postInteraction.service.interface";
import type { IBlockService } from "../interfaces/services/social/block.service.interface";
import type { IFollowService } from "../interfaces/services/social/follow.service.interface";
import type { IFriendService } from "../interfaces/services/social/friend.service.interface";
import type { IReportService } from "../interfaces/services/social/report.service.interface";
import type { IAuthService } from "../interfaces/services/user/auth.service.interface";
import type { IProfileService } from "../interfaces/services/user/profile.service.interface";
import type { IUserService } from "../interfaces/services/user/user.service.interface";
import { TYPES } from "../types";

export class Services {
  constructor(
    @inject(TYPES.BlockService)
    public readonly block: IBlockService,
    @inject(TYPES.FollowService)
    public readonly follow: IFollowService,
    @inject(TYPES.FriendService)
    public readonly friend: IFriendService,
    @inject(TYPES.ProfileService)
    public readonly profile: IProfileService,
    @inject(TYPES.ReportService)
    public readonly report: IReportService,
    @inject(TYPES.UserService)
    public readonly user: IUserService,
    @inject(TYPES.PostService)
    public readonly post: IPostService,
    @inject(TYPES.PostInteractionService)
    public readonly postInteraction: IPostInteractionService,
    @inject(TYPES.AuthService)
    public readonly auth: IAuthService,
  ) {}
}
