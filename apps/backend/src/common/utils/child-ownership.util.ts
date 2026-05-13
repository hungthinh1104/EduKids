import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Throws NotFoundException if childId does not belong to parentId.
 * Use this in any controller/service that accepts a childId from a PARENT token.
 */
export async function assertChildOwnership(
  prisma: PrismaService,
  childId: number,
  parentId: number,
): Promise<void> {
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, parentId, deletedAt: null },
    select: { id: true },
  });
  if (!child) {
    throw new NotFoundException("Child profile not found");
  }
}
