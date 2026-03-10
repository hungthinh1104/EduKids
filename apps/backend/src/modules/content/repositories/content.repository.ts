import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TopicEntity } from "../entities/topic.entity";
import { VocabularyEntity } from "../entities/vocabulary.entity";
import { IContentRepository } from "./content.repository.interface";

@Injectable()
export class ContentRepository implements IContentRepository {
  constructor(private prisma: PrismaService) {}

  async createTopic(topic: TopicEntity): Promise<TopicEntity> {
    // TODO: Implement createTopic
    return topic;
  }

  async findTopicById(_id: string): Promise<TopicEntity | null> {
    // TODO: Implement findTopicById
    return null;
  }

  async findAllTopics(): Promise<TopicEntity[]> {
    // TODO: Implement findAllTopics
    return [];
  }

  async createVocabulary(vocab: VocabularyEntity): Promise<VocabularyEntity> {
    // TODO: Implement createVocabulary
    return vocab;
  }

  async findVocabularyByTopic(_topicId: string): Promise<VocabularyEntity[]> {
    // TODO: Implement findVocabularyByTopic
    return [];
  }
}
