import type { PrismaClient } from "@prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { AvatarLayer } from "./dto/avatar-customization.dto";

export type AvatarCatalogCategory =
  | "AVATAR_HAIR"
  | "AVATAR_OUTFIT"
  | "AVATAR_ACCESSORY"
  | "AVATAR_PET"
  | "BACKGROUND";

export type AvatarCatalogItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: AvatarCatalogCategory;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  imageUrl?: string | null;
};

type AvatarCatalogClient = PrismaClient | PrismaService;

type AvatarRenderableItem = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  rarity?: string | null;
  imageUrl?: string | null;
};

export const DEFAULT_AVATAR_ITEMS: AvatarCatalogItem[] = [
  {
    id: 1,
    name: "Rainbow Hair",
    description: "Colorful rainbow hairstyle",
    category: "AVATAR_HAIR",
    price: 50,
    rarity: "RARE",
  },
  {
    id: 2,
    name: "Star Crown",
    description: "Shiny golden crown",
    category: "AVATAR_HAIR",
    price: 80,
    rarity: "EPIC",
  },
  {
    id: 3,
    name: "Wizard Hat",
    description: "Magical wizard hat",
    category: "AVATAR_HAIR",
    price: 100,
    rarity: "EPIC",
  },
  {
    id: 4,
    name: "Superhero Cape",
    description: "Fly like a hero!",
    category: "AVATAR_OUTFIT",
    price: 75,
    rarity: "RARE",
  },
  {
    id: 5,
    name: "Princess Dress",
    description: "Elegant royal dress",
    category: "AVATAR_OUTFIT",
    price: 120,
    rarity: "EPIC",
  },
  {
    id: 6,
    name: "Space Suit",
    description: "Explore the galaxy",
    category: "AVATAR_OUTFIT",
    price: 150,
    rarity: "LEGENDARY",
  },
  {
    id: 7,
    name: "Magic Wand",
    description: "Cast learning spells",
    category: "AVATAR_ACCESSORY",
    price: 60,
    rarity: "RARE",
  },
  {
    id: 8,
    name: "Star Glasses",
    description: "See everything sparkle",
    category: "AVATAR_ACCESSORY",
    price: 40,
    rarity: "COMMON",
  },
  {
    id: 9,
    name: "Flying Dragon",
    description: "Your loyal dragon friend",
    category: "AVATAR_PET",
    price: 200,
    rarity: "LEGENDARY",
  },
  {
    id: 10,
    name: "Unicorn Buddy",
    description: "Magical unicorn companion",
    category: "AVATAR_PET",
    price: 180,
    rarity: "LEGENDARY",
  },
];

let pendingCatalogSeed: Promise<void> | null = null;

export function getAvatarCategory(
  category?: string | null,
): AvatarCatalogCategory {
  switch (category) {
    case "AVATAR_HAIR":
    case "AVATAR_OUTFIT":
    case "AVATAR_ACCESSORY":
    case "AVATAR_PET":
    case "BACKGROUND":
      return category;
    default:
      return "BACKGROUND";
  }
}

export function getAvatarLayerForCategory(
  category?: string | null,
): AvatarLayer | undefined {
  switch (getAvatarCategory(category)) {
    case "AVATAR_HAIR":
      return AvatarLayer.HAIR;
    case "AVATAR_OUTFIT":
      return AvatarLayer.CLOTHING;
    case "AVATAR_ACCESSORY":
      return AvatarLayer.ACCESSORIES;
    default:
      return undefined;
  }
}

export function buildAvatarItemImageUrl(item: AvatarRenderableItem): string {
  return (
    item.imageUrl ||
    svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
        <rect width="128" height="128" rx="32" fill="${getCardBackground(item.category)}" />
        <circle cx="64" cy="68" r="30" fill="#ffd8b3" />
        ${renderItemLayer(item, 64, 68)}
      </svg>
    `)
  );
}

export function buildAvatarLayerAssetUrl(item: AvatarRenderableItem): string {
  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      ${renderItemLayer(item, 100, 106)}
    </svg>
  `);
}

export function buildAvatarPreviewImageUrl(
  equippedItems: AvatarRenderableItem[],
): string {
  const itemsByCategory = new Map(
    equippedItems.map((item) => [getAvatarCategory(item.category), item]),
  );

  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="avatarBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff7cc" />
          <stop offset="100%" stop-color="#d7ecff" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="100" fill="url(#avatarBg)" />
      ${renderBackgroundDecoration(itemsByCategory.get("BACKGROUND"))}
      ${renderPet(itemsByCategory.get("AVATAR_PET"))}
      <ellipse cx="100" cy="176" rx="58" ry="18" fill="#e6eefb" />
      ${renderOutfit(itemsByCategory.get("AVATAR_OUTFIT"))}
      <circle cx="100" cy="88" r="34" fill="#ffd8b3" />
      <circle cx="88" cy="82" r="4" fill="#3d2f2f" />
      <circle cx="112" cy="82" r="4" fill="#3d2f2f" />
      <path d="M88 102c8 8 16 8 24 0" fill="none" stroke="#c06d6d" stroke-width="4" stroke-linecap="round" />
      ${renderHair(itemsByCategory.get("AVATAR_HAIR"))}
      ${renderAccessory(itemsByCategory.get("AVATAR_ACCESSORY"))}
    </svg>
  `);
}

export async function ensureDefaultAvatarCatalog(
  prisma: AvatarCatalogClient,
): Promise<void> {
  if (!pendingCatalogSeed) {
    pendingCatalogSeed = Promise.all(
      DEFAULT_AVATAR_ITEMS.map((item) =>
        prisma.avatarItem.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            rarity: item.rarity,
          },
          create: {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            rarity: item.rarity,
          },
        }),
      ),
    )
      .then(() => undefined)
      .catch((error) => {
        pendingCatalogSeed = null;
        throw error;
      });
  }

  await pendingCatalogSeed;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    svg.replace(/\s+/g, " ").trim(),
  )}`;
}

function getCardBackground(category?: string | null): string {
  switch (getAvatarCategory(category)) {
    case "AVATAR_HAIR":
      return "#fde68a";
    case "AVATAR_OUTFIT":
      return "#dbeafe";
    case "AVATAR_ACCESSORY":
      return "#ede9fe";
    case "AVATAR_PET":
      return "#dcfce7";
    default:
      return "#f3f4f6";
  }
}

function renderItemLayer(
  item: AvatarRenderableItem,
  centerX: number,
  centerY: number,
): string {
  switch (getAvatarCategory(item.category)) {
    case "AVATAR_HAIR":
      return renderHair(item, centerX, centerY);
    case "AVATAR_OUTFIT":
      return renderOutfit(item, centerX, centerY);
    case "AVATAR_ACCESSORY":
      return renderAccessory(item, centerX, centerY);
    case "AVATAR_PET":
      return renderPet(item, centerX, centerY);
    default:
      return "";
  }
}

function renderHair(
  item?: AvatarRenderableItem,
  centerX = 100,
  centerY = 106,
): string {
  if (!item) {
    return `
      <path d="M62 ${centerY - 28}c10-20 54-20 66 0v14H62z" fill="#8b5e3c" />
      <path d="M64 ${centerY - 6}c8 10 56 10 64 0" fill="none" stroke="#8b5e3c" stroke-width="10" stroke-linecap="round" />
    `;
  }

  if (item.id === 1) {
    return `
      <path d="M58 ${centerY - 34}c12-24 60-24 72 0v18H58z" fill="#7c3aed" />
      <path d="M64 ${centerY - 26}c12-10 24-14 36-14s24 4 36 14" fill="none" stroke="#22c55e" stroke-width="8" stroke-linecap="round" />
      <path d="M64 ${centerY - 18}c12-10 24-14 36-14s24 4 36 14" fill="none" stroke="#f97316" stroke-width="8" stroke-linecap="round" />
      <path d="M64 ${centerY - 10}c12-10 24-14 36-14s24 4 36 14" fill="none" stroke="#3b82f6" stroke-width="8" stroke-linecap="round" />
    `;
  }

  if (item.id === 2) {
    return `
      <path d="M60 ${centerY - 28}c10-18 58-18 68 0v16H60z" fill="#6d4c41" />
      <path d="M74 ${centerY - 44}l8 14 18-6 18 6 8-14 4 24H70z" fill="#facc15" />
      <circle cx="${centerX}" cy="${centerY - 40}" r="6" fill="#fff7ae" />
    `;
  }

  return `
    <path d="M58 ${centerY - 24}c10-18 60-18 72 0v18H58z" fill="#2b2d42" />
    <path d="M74 ${centerY - 52}l-18 30h18l-6 22 24-28h-16l14-24z" fill="#6d28d9" />
    <path d="M92 ${centerY - 52}l-18 30h56l-18-30z" fill="#7c3aed" />
    <circle cx="${centerX + 12}" cy="${centerY - 34}" r="4" fill="#fde68a" />
  `;
}

function renderOutfit(
  item?: AvatarRenderableItem,
  centerX = 100,
  centerY = 106,
): string {
  if (!item) {
    return `
      <path d="M68 ${centerY + 8}c10 8 54 8 64 0l10 54H58z" fill="#60a5fa" />
    `;
  }

  if (item.id === 4) {
    return `
      <path d="M68 ${centerY + 4}c10 10 54 10 64 0l16 62H52z" fill="#2563eb" />
      <path d="M68 ${centerY + 10}l-18 42 18 16z" fill="#ef4444" />
      <path d="M132 ${centerY + 10}l18 42-18 16z" fill="#ef4444" />
      <circle cx="${centerX}" cy="${centerY + 20}" r="10" fill="#fde68a" />
    `;
  }

  if (item.id === 5) {
    return `
      <path d="M72 ${centerY + 4}c8 10 48 10 56 0l14 58H58z" fill="#f472b6" />
      <path d="M82 ${centerY + 28}l18 18 18-18 12 36H70z" fill="#f9a8d4" />
      <circle cx="${centerX}" cy="${centerY + 16}" r="8" fill="#fff7ae" />
    `;
  }

  return `
    <path d="M68 ${centerY + 4}c10 10 54 10 64 0l14 62H54z" fill="#94a3b8" />
    <path d="M78 ${centerY + 14}h44v42H78z" fill="#0f172a" />
    <path d="M82 ${centerY + 18}h10v10H82zm26 0h10v10h-10zm-13 18h10v10H95z" fill="#67e8f9" />
    <path d="M72 ${centerY + 4}l-14 18 10 10 12-18zm56 0l14 18-10 10-12-18z" fill="#cbd5e1" />
    `;
}

function renderAccessory(
  item?: AvatarRenderableItem,
  centerX = 100,
  centerY = 106,
): string {
  if (!item) {
    return "";
  }

  if (item.id === 7) {
    return `
      <path d="M${centerX + 34} ${centerY + 10}l18 30" stroke="#8b5cf6" stroke-width="6" stroke-linecap="round" />
      <circle cx="${centerX + 54}" cy="${centerY + 42}" r="8" fill="#fde68a" />
      <path d="M${centerX + 54} ${centerY + 30}l3 8h8l-6 5 3 8-8-5-8 5 3-8-6-5h8z" fill="#facc15" />
    `;
  }

  return `
    <rect x="${centerX - 28}" y="${centerY - 8}" width="20" height="14" rx="6" fill="none" stroke="#4338ca" stroke-width="5" />
    <rect x="${centerX + 8}" y="${centerY - 8}" width="20" height="14" rx="6" fill="none" stroke="#4338ca" stroke-width="5" />
    <path d="M${centerX - 8} ${centerY - 2}h16" stroke="#4338ca" stroke-width="5" stroke-linecap="round" />
  `;
}

function renderPet(
  item?: AvatarRenderableItem,
  centerX = 100,
  centerY = 106,
): string {
  if (!item) {
    return "";
  }

  if (item.id === 9) {
    return `
      <circle cx="${centerX + 58}" cy="${centerY + 38}" r="22" fill="#34d399" />
      <path d="M${centerX + 44} ${centerY + 20}l-6-14 16 8zm20 0l6-14-16 8" fill="#10b981" />
      <circle cx="${centerX + 50}" cy="${centerY + 36}" r="3" fill="#1f2937" />
      <circle cx="${centerX + 66}" cy="${centerY + 36}" r="3" fill="#1f2937" />
      <path d="M${centerX + 50} ${centerY + 48}c6 4 10 4 16 0" fill="none" stroke="#166534" stroke-width="3" stroke-linecap="round" />
    `;
  }

  return `
    <circle cx="${centerX + 56}" cy="${centerY + 40}" r="22" fill="#ffffff" stroke="#c084fc" stroke-width="4" />
    <path d="M${centerX + 50} ${centerY + 18}l8-20 8 20" fill="#f472b6" />
    <circle cx="${centerX + 48}" cy="${centerY + 38}" r="3" fill="#1f2937" />
    <circle cx="${centerX + 64}" cy="${centerY + 38}" r="3" fill="#1f2937" />
    <path d="M${centerX + 48} ${centerY + 48}c6 4 10 4 16 0" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" />
  `;
}

function renderBackgroundDecoration(item?: AvatarRenderableItem): string {
  if (!item) {
    return `
      <circle cx="44" cy="48" r="18" fill="#ffffff" fill-opacity="0.55" />
      <circle cx="156" cy="42" r="12" fill="#ffffff" fill-opacity="0.45" />
    `;
  }

  return `
    <rect width="200" height="200" rx="100" fill="#fdf2f8" />
    <circle cx="44" cy="48" r="18" fill="#f9a8d4" fill-opacity="0.45" />
    <circle cx="160" cy="40" r="14" fill="#93c5fd" fill-opacity="0.45" />
  `;
}
