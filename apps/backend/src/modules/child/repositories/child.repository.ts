import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ChildProfileEntity } from "../entities/child-profile.entity";
import { IChildRepository } from "./child.repository.interface";

@Injectable()
export class ChildRepository implements IChildRepository {
  constructor(private prisma: PrismaService) {}

  async create(child: ChildProfileEntity): Promise<ChildProfileEntity> {
    // TODO: Implement create
    return child;
  }

  async findById(_id: string): Promise<ChildProfileEntity | null> {
    // TODO: Implement findById
    return null;
  }

  async findByUserId(_userId: string): Promise<ChildProfileEntity[]> {
    // TODO: Implement findByUserId
    return [];
  }

  async update(
    _id: string,
    child: Partial<ChildProfileEntity>,
  ): Promise<ChildProfileEntity> {
    // TODO: Implement update
    return child as ChildProfileEntity;
  }

  async delete(_id: string): Promise<void> {
    // TODO: Implement delete
  }
}
