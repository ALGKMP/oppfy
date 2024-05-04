// import repositories from "../repositories";
import { FollowerRepository } from "../repositories/follower";
import { FriendsRepository } from "../repositories/friend";

export class StatsService {
  private followersRepository = new FollowerRepository();
  private friendsRepository = new FriendsRepository();

  async getUserStats(userId: string) {
    const followerCount = await this.followersRepository.followerCount(userId);
    const followingCount =
      await this.followersRepository.followingCount(userId);
    const friendCount = await this.friendsRepository.friendsCount(userId);

    return { followerCount, followingCount, friendCount };
  }
}
