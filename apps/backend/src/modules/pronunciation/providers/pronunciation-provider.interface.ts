import {
  PronunciationAssessmentProvider,
} from '../dto/pronunciation-assessment.dto';
import type { PronunciationAssessmentResultDto } from '../dto/pronunciation-assessment.dto';
import type { BuildAssessmentInput } from '../pronunciation-assessment.service';

export interface PronunciationProvider {
  readonly name: PronunciationAssessmentProvider;
  assess(input: BuildAssessmentInput): Promise<PronunciationAssessmentResultDto | null>;
}
