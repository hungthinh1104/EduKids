import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: number, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: number): Promise<void>;
}
