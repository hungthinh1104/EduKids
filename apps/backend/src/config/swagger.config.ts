import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("EduKids API")
    .setDescription(
      "Production-grade REST API for EduKids - AI-powered English learning platform for children aged 6-12",
    )
    .setVersion("1.0.0")
    .setContact("EduKids Team", "https://edukids.com", "support@edukids.com")
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addTag("Auth", "Authentication and authorization endpoints")
    .addTag("Children", "Child profile management")
    .addTag("Content", "Topics and vocabulary management")
    .addTag("Quiz", "Quiz generation and submission")
    .addTag("Pronunciation", "AI pronunciation scoring")
    .addTag("Learning", "Learning progress and review queue")
    .addTag("Gamification", "Points, badges, levels, and avatar shop")
    .addTag("Analytics", "Activity tracking and statistics")
    .addTag("Reports", "Weekly reports and email notifications")
    .addTag("System", "System configuration and health")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addServer("http://localhost:3001/api", "Local Development")
    .addServer("https://api.edukids.com/api", "Production")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "EduKids API Documentation",
  });
}
