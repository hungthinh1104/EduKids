export class ChildProfileEntity {
  id: string;
  userId: string;
  name: string;
  age: number;
  currentLevel: number;
  totalStars: number;
  totalExperience: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
