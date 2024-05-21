import { MuxRepository } from "../../repositories/mux/mux";

export class MuxService {
  private muxRepository = new MuxRepository();

  async createDirectUpload(
    authorId: string,
    recipientId: string,
    caption: string = "",
  ) {
    return await this.muxRepository.createDirectUpload(
      authorId,
      recipientId,
      caption,
    );
  }
}
