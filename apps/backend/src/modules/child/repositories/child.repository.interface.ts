import { ChildProfileEntity } from "../entities/child-profile.entity";

export interface IChildRepository {
  create(child: ChildProfileEntity): Promise<ChildProfileEntity>;
  findById(id: string): Promise<ChildProfileEntity | null>;
  findByUserId(userId: string): Promise<ChildProfileEntity[]>;
  update(
    id: string,
    child: Partial<ChildProfileEntity>,
  ): Promise<ChildProfileEntity>;
  delete(id: string): Promise<void>;
}
