import { TopicEntity } from "../entities/topic.entity";
import { VocabularyEntity } from "../entities/vocabulary.entity";

export interface IContentRepository {
  createTopic(topic: TopicEntity): Promise<TopicEntity>;
  findTopicById(id: string): Promise<TopicEntity | null>;
  findAllTopics(): Promise<TopicEntity[]>;
  createVocabulary(vocab: VocabularyEntity): Promise<VocabularyEntity>;
  findVocabularyByTopic(topicId: string): Promise<VocabularyEntity[]>;
}
