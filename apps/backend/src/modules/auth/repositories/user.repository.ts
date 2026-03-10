import { Injectable } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { UserEntity } from "../entities/user.entity";
import { IUserRepository } from "./user.repository.interface";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    return await this.prisma.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: (user.role as Role) || Role.PARENT,
      },
    });
  }

  async findById(id: number): Promise<UserEntity | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: number, user: Partial<UserEntity>): Promise<UserEntity> {
    const updateData: Prisma.UserUpdateInput = {};
    if (user.email !== undefined) updateData.email = user.email;
    if (user.passwordHash !== undefined)
      updateData.passwordHash = user.passwordHash;
    if (user.firstName !== undefined) updateData.firstName = user.firstName;
    if (user.lastName !== undefined) updateData.lastName = user.lastName;
    if (user.role !== undefined) updateData.role = user.role as Role;
    if (user.isActive !== undefined) updateData.isActive = user.isActive;
    if (user.lastLoginAt !== undefined)
      updateData.lastLoginAt = user.lastLoginAt;

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
