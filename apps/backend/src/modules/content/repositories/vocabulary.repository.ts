import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class VocabularyRepository {
  constructor(private prisma: PrismaService) {}

  async findByTopicId(topicId: number) {
    return await this.prisma.vocabulary.findMany({
      where: { topicId },
      include: {
        media: true,
      },
      orderBy: { id: "asc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.vocabulary.findUnique({
      where: { id },
      include: {
        media: true,
      },
    });
  }
}
