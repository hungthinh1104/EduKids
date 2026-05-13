export interface ChildAvatarSource {
  avatar?: string | null;
}

export interface AvatarCustomizationSource {
  avatar?: string | null;
}

export const DEFAULT_CHILD_AVATAR = 'https://api.dicebear.com/9.x/bottts/svg?seed=child';

export function resolveChildAvatarUrl(
  source: ChildAvatarSource | null | undefined,
  customization?: AvatarCustomizationSource | null,
  fallback: string = DEFAULT_CHILD_AVATAR,
): string {
  const customizationAvatar = customization?.avatar?.trim();
  const sourceAvatar = source?.avatar?.trim();

  // Ignore generated SVG data URLs (shop layer previews) — they represent a
  // different visual style than the DiceBear avatar chosen at profile creation.
  // Only apply an external customization URL (e.g. a future CDN-hosted avatar).
  const externalCustomization =
    customizationAvatar && !customizationAvatar.startsWith('data:')
      ? customizationAvatar
      : null;

  return externalCustomization || sourceAvatar || fallback;
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
