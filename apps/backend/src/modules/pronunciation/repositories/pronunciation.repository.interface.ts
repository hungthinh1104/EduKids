import { PronunciationAttemptEntity } from '../entities/pronunciation-attempt.entity';

export interface IPronunciationRepository {
  create(attempt: PronunciationAttemptEntity): Promise<PronunciationAttemptEntity>;
  findByChild(childId: string): Promise<PronunciationAttemptEntity[]>;
}
