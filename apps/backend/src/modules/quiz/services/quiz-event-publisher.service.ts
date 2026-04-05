import { Injectable, Logger } from "@nestjs/common";
import {
  DomainEventEnvelope,
  createDomainEventEnvelope,
} from "../../../common/events/domain-event-envelope";
import {
  QuizCompletedEventPayload,
  QuizSubmittedEventPayload,
} from "../events/quiz-events";

@Injectable()
export class QuizEventPublisherService {
  private readonly logger = new Logger(QuizEventPublisherService.name);

  async publishQuizSubmitted(
    payload: QuizSubmittedEventPayload,
  ): Promise<DomainEventEnvelope<QuizSubmittedEventPayload>> {
    const event = createDomainEventEnvelope({
      eventName: "QuizSubmittedEvent",
      correlationId: payload.quizSessionId,
      idempotencyKey: `${payload.quizSessionId}:${payload.questionId}`,
      payload,
    });

    this.logger.log(`EVENT ${event.eventName} ${JSON.stringify(event)}`);

    return event;
  }

  async publishQuizCompleted(
    payload: QuizCompletedEventPayload,
  ): Promise<DomainEventEnvelope<QuizCompletedEventPayload>> {
    const event = createDomainEventEnvelope({
      eventName: "QuizCompletedEvent",
      correlationId: payload.quizSessionId,
      idempotencyKey: `${payload.quizSessionId}:completed`,
      payload,
    });

    this.logger.log(`EVENT ${event.eventName} ${JSON.stringify(event)}`);

    return event;
  }
}
