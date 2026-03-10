import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TopicEntity } from "../entities/topic.entity";

@Injectable()
export class TopicRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<TopicEntity[]> {
    return await this.prisma.topic.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  async findAllPaginated(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.topic.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      items: topics,
    };
  }

  async findById(id: number): Promise<TopicEntity | null> {
    return await this.prisma.topic.findUnique({
      where: { id },
    });
  }

  async findByIdWithVocabularies(id: number) {
    return await this.prisma.topic.findUnique({
      where: { id },
      include: {
        vocabularies: {
          include: {
            media: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  async countVocabulariesByTopicId(topicId: number): Promise<number> {
    return await this.prisma.vocabulary.count({
      where: { topicId },
    });
  }
}
