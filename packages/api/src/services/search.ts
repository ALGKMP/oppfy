import { SearchRepository } from "../repositories/search";

export class SearchService {
  private searchRepository = new SearchRepository();

  async profilesByUsername(username: string) {
    return await this.searchRepository.profilesByUsername(username);
  }
}
