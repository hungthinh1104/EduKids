export interface ChildAvatarSource {
  avatar?: string | null;
}

export interface AvatarCustomizationSource {
  avatar?: string | null;
}

export const DEFAULT_CHILD_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=child';

export function resolveChildAvatarUrl(
  source: ChildAvatarSource | null | undefined,
  customization?: AvatarCustomizationSource | null,
  fallback: string = DEFAULT_CHILD_AVATAR,
): string {
  const customizationAvatar = customization?.avatar?.trim();
  const sourceAvatar = source?.avatar?.trim();

  return customizationAvatar || sourceAvatar || fallback;
}

export function syncChildAvatarById<T extends ChildAvatarSource & { id: number }>(
  profiles: T[],
  childId: number | null,
  avatar: string,
): T[] {
  if (!childId || !avatar.trim()) {
    return profiles;
  }

  return profiles.map((profile) =>
    profile.id === childId ? { ...profile, avatar } : profile,
  );
}
