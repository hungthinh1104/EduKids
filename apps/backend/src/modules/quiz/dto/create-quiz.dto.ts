export class CreateQuizDto {
  questionText: string;
  vocabularyId: string;
  options: string[];
  correctOptionIndex: number;
}
