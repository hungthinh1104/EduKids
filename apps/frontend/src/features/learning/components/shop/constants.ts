// Constants

export const CATEGORIES = ['Tất cả', 'Mũ', 'Áo', 'Thú cưng', 'Phụ kiện'];

export const RARITY_STYLE: Record<string, { label: string; cls: string; glow: string }> = {
    common: { label: 'Thường', cls: 'bg-background text-caption border-border', glow: '' },
    rare: { label: 'Hiếm', cls: 'bg-primary-light text-primary border-primary/30', glow: 'shadow-primary/20' },
    epic: { label: 'Huyền thoại', cls: 'bg-accent-light text-accent border-accent/30', glow: 'shadow-accent/25' },
    legendary: { label: '✨ Huyền tích', cls: 'bg-warning-light text-warning border-warning/40', glow: 'shadow-warning/30' },
};
