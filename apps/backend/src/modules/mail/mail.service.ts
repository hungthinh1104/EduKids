import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendMailResult = {
  sent: boolean;
  messageId?: string;
  error?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporterPromise: Promise<nodemailer.Transporter> | null = null;

  isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
    );
  }

  private getFromAddress(): string {
    return (
      process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@edukids.local"
    );
  }

  private getTransporter(): Promise<nodemailer.Transporter> | null {
    if (!this.isConfigured()) {
      return null;
    }

    if (!this.transporterPromise) {
      const port = Number(process.env.SMTP_PORT || 587);
      this.transporterPromise = Promise.resolve(
        nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }),
      );
    }

    return this.transporterPromise;
  }

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    const transporterPromise = this.getTransporter();
    if (!transporterPromise) {
      this.logger.warn(
        `SMTP is not configured. Skipping email "${input.subject}" to ${input.to}.`,
      );
      return {
        sent: false,
        error: "SMTP_NOT_CONFIGURED",
      };
    }

    try {
      const transporter = await transporterPromise;
      const info = await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      return {
        sent: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "UNKNOWN_SMTP_ERROR";
      this.logger.error(
        `Failed to send email "${input.subject}" to ${input.to}: ${message}`,
      );
      return {
        sent: false,
        error: message,
      };
    }
  }
}
