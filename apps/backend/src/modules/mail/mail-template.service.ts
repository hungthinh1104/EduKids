import { Injectable } from "@nestjs/common";
import {
  DeliveryChannel,
  ProgressReportDto,
  ReportChildSummaryDto,
} from "../report/report.dto";

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

@Injectable()
export class MailTemplateService {
  private getFrontendBaseUrl(): string {
    const frontendUrl =
      process.env.FRONTEND_URL?.trim() ||
      (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

    if (!frontendUrl) {
      throw new Error(
        "FRONTEND_URL is required in production for report email links.",
      );
    }

    return frontendUrl.replace(/\/$/, "");
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private renderLayout(params: {
    previewText: string;
    heading: string;
    intro: string;
    bodyHtml: string;
    ctaLabel?: string;
    ctaUrl?: string;
    footerNote?: string;
  }): string {
    const ctaHtml =
      params.ctaLabel && params.ctaUrl
        ? `
          <p style="margin: 24px 0 0;">
            <a
              href="${this.escapeHtml(params.ctaUrl)}"
              style="display: inline-block; background: #ff7a18; color: #ffffff; text-decoration: none; font-weight: 700; padding: 14px 22px; border-radius: 14px;"
            >
              ${this.escapeHtml(params.ctaLabel)}
            </a>
          </p>
        `
        : "";

    const footerNote = params.footerNote
      ? `<p style="margin: 20px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">${this.escapeHtml(params.footerNote)}</p>`
      : "";

    return `
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${this.escapeHtml(params.heading)}</title>
        </head>
        <body style="margin: 0; padding: 0; background: #fff7ed; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
          <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
            ${this.escapeHtml(params.previewText)}
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%); padding: 28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);">
                  <tr>
                    <td style="padding: 28px 32px; background: linear-gradient(135deg, #ff7a18 0%, #ffb347 100%); color: #ffffff;">
                      <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">EduKids</div>
                      <h1 style="margin: 12px 0 0; font-size: 30px; line-height: 1.2;">${this.escapeHtml(params.heading)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">${this.escapeHtml(params.intro)}</p>
                      ${params.bodyHtml}
                      ${ctaHtml}
                      ${footerNote}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 32px 28px; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                      Bạn nhận email này vì đang sử dụng EduKids. Nếu cần hỗ trợ, hãy phản hồi lại email này.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  renderResetPasswordEmail(params: {
    firstName?: string | null;
    email: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): EmailTemplate {
    const recipientName = params.firstName?.trim() || params.email;
    const safeName = this.escapeHtml(recipientName);
    const safeUrl = this.escapeHtml(params.resetUrl);
    const expiresText = `${params.expiresInMinutes} phút`;

    const html = this.renderLayout({
      previewText: "Đặt lại mật khẩu EduKids",
      heading: "Đặt lại mật khẩu",
      intro: `Xin chào ${recipientName}, chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản EduKids của bạn.`,
      bodyHtml: `
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 18px; padding: 18px 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 15px; line-height: 1.7;">
            Liên kết này sẽ hết hạn sau <strong>${this.escapeHtml(expiresText)}</strong>.
            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này và mật khẩu hiện tại vẫn giữ nguyên.
          </p>
        </div>
        <p style="margin: 18px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
          Nếu nút bên dưới không hoạt động, bạn có thể copy liên kết này vào trình duyệt:
        </p>
        <p style="margin: 8px 0 0; word-break: break-all; font-size: 13px; color: #ea580c;">
          ${safeUrl}
        </p>
      `,
      ctaLabel: "Đặt lại mật khẩu",
      ctaUrl: params.resetUrl,
      footerNote:
        "Vì lý do bảo mật, vui lòng không chia sẻ liên kết này với người khác.",
    });

    const text = [
      `Xin chào ${recipientName},`,
      "",
      "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản EduKids của bạn.",
      `Liên kết đặt lại mật khẩu: ${params.resetUrl}`,
      `Liên kết có hiệu lực trong ${expiresText}.`,
      "",
      "Nếu bạn không yêu cầu thay đổi mật khẩu, hãy bỏ qua email này.",
      "",
      "EduKids",
    ].join("\n");

    return {
      subject: "EduKids - Đặt lại mật khẩu",
      html: html.replace(safeName, safeName),
      text,
    };
  }

  renderWeeklyProgressReportEmail(params: {
    parentName?: string | null;
    childName: string;
    report: ProgressReportDto;
  }): EmailTemplate {
    const frontendBaseUrl = this.getFrontendBaseUrl();
    const parentGreeting = params.parentName?.trim()
      ? `Xin chào ${params.parentName.trim()},`
      : "Xin chào,";
    const child: ReportChildSummaryDto | undefined = params.report.children[0];
    const childName = child?.childName || params.childName;
    const deliveryChannel =
      params.report.deliveryChannel || DeliveryChannel.EMAIL;
    const generatedDate = new Date(
      params.report.generatedAt,
    ).toLocaleDateString("vi-VN");

    const statCard = (label: string, value: string) => `
      <td style="width: 50%; padding: 0 6px 12px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${this.escapeHtml(label)}</div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700; color: #0f172a;">${this.escapeHtml(value)}</div>
        </div>
      </td>
    `;

    const html = this.renderLayout({
      previewText: `Báo cáo học tập mới của bé ${childName}`,
      heading: `Báo cáo học tập của bé ${childName}`,
      intro: `${parentGreeting} EduKids vừa tổng hợp tiến độ học gần đây để bạn tiện theo dõi và đồng hành cùng bé.`,
      bodyHtml: `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 18px; padding: 18px 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 15px; line-height: 1.7;">
            ${this.escapeHtml(params.report.summaryMessage)}
          </p>
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 8px 0 12px;">
          <tr>
            ${statCard("Phút học", String(child?.minutesLearned ?? 0))}
            ${statCard("Phiên học", String(child?.sessionsCompleted ?? 0))}
          </tr>
          <tr>
            ${statCard("Điểm quiz TB", `${child?.averageQuizScore ?? 0}%`)}
            ${statCard("Phát âm", `${child?.pronunciationAccuracy ?? 0}%`)}
          </tr>
          <tr>
            ${statCard("Từ đã học", String(child?.wordsLearned ?? 0))}
            ${statCard("Huy hiệu mới", String(child?.newBadges ?? 0))}
          </tr>
        </table>

        <div style="background: #f8fafc; border-radius: 18px; padding: 18px 20px; margin-top: 8px;">
          <h2 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Gợi ý tiếp theo</h2>
          <p style="margin: 0; font-size: 15px; line-height: 1.7;">${this.escapeHtml(params.report.recommendations)}</p>
        </div>

        <div style="margin-top: 18px; font-size: 13px; color: #6b7280; line-height: 1.7;">
          Tạo ngày ${this.escapeHtml(generatedDate)} • Kênh gửi ${this.escapeHtml(deliveryChannel)}
        </div>
      `,
      ctaLabel: "Xem thêm trên EduKids",
      ctaUrl: `${frontendBaseUrl}/reports`,
      footerNote:
        child?.aiInsight ||
        "Tiếp tục duy trì nhịp học đều đặn để bé giữ phong độ nhé.",
    });

    const text = [
      parentGreeting,
      "",
      `Báo cáo học tập của bé ${childName}`,
      params.report.summaryMessage,
      "",
      `Phút học: ${child?.minutesLearned ?? 0}`,
      `Phiên học: ${child?.sessionsCompleted ?? 0}`,
      `Điểm quiz trung bình: ${child?.averageQuizScore ?? 0}%`,
      `Điểm phát âm: ${child?.pronunciationAccuracy ?? 0}%`,
      `Từ đã học: ${child?.wordsLearned ?? 0}`,
      `Huy hiệu mới: ${child?.newBadges ?? 0}`,
      "",
      `Gợi ý: ${params.report.recommendations}`,
      "",
      `Xem thêm: ${frontendBaseUrl}/reports`,
      "",
      "EduKids",
    ].join("\n");

    return {
      subject: `EduKids - Báo cáo học tập của bé ${childName}`,
      html,
      text,
    };
  }
}
