import { Injectable } from '@nestjs/common';

@Injectable()
export class WeakTopicDetectionService {
  detectFromTopicScores(topicScores: Map<number, number[]>): {
    weakTopicIds: number[];
    strongTopicIds: number[];
  } {
    const entries = Array.from(topicScores.entries());

    const weakTopicIds = entries
      .filter(([_, scores]) => {
        if (!scores || scores.length === 0) return false;
        const avg = scores.reduce((sum, value) => sum + (value || 0), 0) / scores.length;
        return avg < 70;
      })
      .map(([topicId]) => topicId);

    const strongTopicIds = entries
      .filter(([_, scores]) => {
        if (!scores || scores.length === 0) return false;
        const avg = scores.reduce((sum, value) => sum + (value || 0), 0) / scores.length;
        return avg >= 85;
      })
      .map(([topicId]) => topicId);

    return { weakTopicIds, strongTopicIds };
  }
}
