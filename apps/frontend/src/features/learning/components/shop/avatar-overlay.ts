import type { ShopItem } from '@/features/learning/api/gamification.api';

const CATEGORY_EMOJI: Record<string, string> = {
    AVATAR_HAIR:      '🎩',
    AVATAR_OUTFIT:    '👕',
    AVATAR_ACCESSORY: '💎',
    AVATAR_PET:       '🐾',
    BACKGROUND:       '🌟',
};

export const OVERLAY_POSITION: Record<string, string> = {
    AVATAR_HAIR:      'absolute -top-3 left-1/2 -translate-x-1/2 text-2xl',
    AVATAR_OUTFIT:    'absolute -bottom-3 left-1/2 -translate-x-1/2 text-xl',
    AVATAR_ACCESSORY: 'absolute top-1/2 -right-3 -translate-y-1/2 text-xl',
    AVATAR_PET:       'absolute -bottom-2 -right-2 text-2xl',
    BACKGROUND:       'absolute -top-2 -left-2 text-lg',
};

export function getItemEmoji(item: ShopItem): string {
    return CATEGORY_EMOJI[item.rawCategory] ?? '✨';
}

export function getEquippedOverlays(
    equippedBySlot: Record<string, number | null>,
    shopItems: ShopItem[],
): Array<{ item: ShopItem; emoji: string; positionClass: string }> {
    return Object.entries(equippedBySlot)
        .filter(([, id]) => id !== null)
        .map(([, id]) => shopItems.find((i) => i.id === id))
        .filter((item): item is ShopItem => Boolean(item))
        .map((item) => ({
            item,
            emoji: getItemEmoji(item),
            positionClass: OVERLAY_POSITION[item.rawCategory] ?? '',
        }));
}
