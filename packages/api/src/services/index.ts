import { inject } from "inversify";

import { TYPES } from "../symbols";
import { PostService } from "./content/post.service";
import { PostInteractionService } from "./content/postInteraction.service";
import { BlockService } from "./social/block.service";
import { FollowService } from "./social/follow.service";
import { FriendService } from "./social/friend.service";
import { ReportService } from "./social/report.service";
import { AuthService } from "./user/auth.service";
import { ContactsService } from "./user/contacts.service";
import { ProfileService } from "./user/profile.service";
import { UserService } from "./user/user.service";

export class Services {
  constructor(
    @inject(TYPES.BlockService)
    public readonly block: BlockService,
    @inject(TYPES.FollowService)
    public readonly follow: FollowService,
    @inject(TYPES.FriendService)
    public readonly friend: FriendService,
    @inject(TYPES.ContactsService)
    public readonly contacts: ContactsService,
    @inject(TYPES.ProfileService)
    public readonly profile: ProfileService,
    @inject(TYPES.ReportService)
    public readonly report: ReportService,
    @inject(TYPES.UserService)
    public readonly user: UserService,
    @inject(TYPES.PostService)
    public readonly post: PostService,
    @inject(TYPES.PostInteractionService)
    public readonly postInteraction: PostInteractionService,
    @inject(TYPES.AuthService)
    public readonly auth: AuthService,
  ) {}
}
