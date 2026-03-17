import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CmsContentStatus } from "@prisma/client";

@Injectable()
export class VocabularyRepository {
  constructor(private prisma: PrismaService) {}

  async findByTopicId(topicId: number) {
    return await this.prisma.vocabulary.findMany({
      where: {
        topicId,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      include: {
        media: true,
      },
      orderBy: { id: "asc" },
    });
  }

  async findById(id: number) {
    return await this.prisma.vocabulary.findFirst({
      where: {
        id,
        status: CmsContentStatus.PUBLISHED,
        deletedAt: null,
        topic: {
          status: CmsContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      include: {
        media: true,
      },
    });
  }
}
