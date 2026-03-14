import { PronunciationAssessmentResultDto } from '../dto/pronunciation-assessment.dto';

export class PronunciationAttemptEntity {
  id: string;
  childId: string;
  vocabularyId: string;
  aiScore: number;
  mode?: string;
  referenceText?: string;
  recordingDurationMs?: number;
  feedback: string;
  assessment?: PronunciationAssessmentResultDto;
  createdAt: Date;
}
