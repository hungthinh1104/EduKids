import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TopicEntity } from "../entities/topic.entity";
import { CmsContentStatus } from "@prisma/client";

@Injectable()
export class TopicRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<TopicEntity[]> {
    return await this.prisma.topic.findMany({
      where: {
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        vocabularies: {
          some: {
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findAllPaginated(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
          vocabularies: {
            some: {
              status: CmsContentStatus.PUBLISHED,
              deletedAt: null,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.topic.count({
        where: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
          vocabularies: {
            some: {
              status: CmsContentStatus.PUBLISHED,
              deletedAt: null,
            },
          },
        },
      }),
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
    return await this.prisma.topic.findFirst({
      where: {
        id,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        vocabularies: {
          some: {
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
    });
  }

  async findByIdWithVocabularies(id: number) {
    return await this.prisma.topic.findFirst({
      where: {
        id,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        vocabularies: {
          some: {
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
      include: {
        vocabularies: {
          where: {
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
          },
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
      where: {
        topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
      },
    });
  }

  async hasVideoByTopicId(topicId: number): Promise<boolean> {
    const videoMedia = await this.prisma.vocabularyMedia.findFirst({
      where: {
        type: "VIDEO",
        vocabulary: {
          topicId,
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
          topic: {
            status: CmsContentStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
      select: { id: true },
    });

    return Boolean(videoMedia);
  }
}
