export interface ChildAvatarSource {
  avatar?: string | null;
}

export const DEFAULT_CHILD_AVATAR = 'https://api.dicebear.com/9.x/bottts/svg?seed=child';

export function resolveChildAvatarUrl(
  source: ChildAvatarSource | null | undefined,
  fallback: string = DEFAULT_CHILD_AVATAR,
): string {
  return source?.avatar?.trim() || fallback;
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
