import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { MailTemplateService } from "./mail-template.service";

@Module({
  providers: [MailService, MailTemplateService],
  exports: [MailService, MailTemplateService],
})
export class MailModule {}
