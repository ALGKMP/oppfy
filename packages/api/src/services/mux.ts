import { MuxRepository } from "../repositories/mux";

export class MuxService {
  private muxRepository = new MuxRepository();

  async createDirectUpload() {
    return await this.muxRepository.createDirectUpload();
  }
}
