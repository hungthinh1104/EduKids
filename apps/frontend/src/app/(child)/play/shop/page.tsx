'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, Coins, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Heading, Caption, Body } from '@/shared/components/Typography';
import { GameHUD } from '@/features/learning/components/GameHUD';
import { LoadingScreen } from '@/components/edukids/LoadingScreen';
import { gamificationApi, ShopItem } from '@/features/learning/api/gamification.api';
import { useCurrentChild } from '@/features/learning/hooks/useCurrentChild';
import { CATEGORIES } from '@/features/learning/components/shop/constants';
import { ShopGrid } from '@/features/learning/components/shop/ShopGrid';
import { ItemPreviewDrawer } from '@/features/learning/components/shop/ItemPreviewDrawer';

export default function ShopPage() {
    const { child, loading: childLoading } = useCurrentChild();
    const childId = child?.id ?? 0;

    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [stars, setStars] = useState(0);
    const [coins, setCoins] = useState(0);
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
    const [previewAvatarUrl, setPreviewAvatarUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [purchased, setPurchased] = useState<number | null>(null);
    const purchaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (purchaseTimeoutRef.current) {
                clearTimeout(purchaseTimeoutRef.current);
            }
        };
    }, []);

    const [equippedBySlot, setEquippedBySlot] = useState<Record<string, number | null>>({
        'Mũ': null,
        'Áo': null,
        'Thú cưng': null,
        'Phụ kiện': null,
        'Nền': null,
    });

    useEffect(() => {
        async function fetchShopData() {
            if (!childId || !child) {
                return;
            }
            try {
                setLoading(true);
                setLoadError(null);
                const [items, rewards, customization] = await Promise.all([
                    gamificationApi.getShopItems(),
                    gamificationApi.getRewardsSummary(childId),
                    gamificationApi.getAvatarCustomization(childId),
                ]);
                setShopItems(items);
                setStars(rewards.stars);
                setCoins(rewards.coins);
                setPreviewAvatarUrl(customization.avatar || child.avatarUrl);
                setEquippedBySlot({
                    'Mũ': customization.equippedItems.find((item) => item.category === 'Mũ')?.id ?? null,
                    'Áo': customization.equippedItems.find((item) => item.category === 'Áo')?.id ?? null,
                    'Thú cưng': customization.equippedItems.find((item) => item.category === 'Thú cưng')?.id ?? null,
                    'Phụ kiện': customization.equippedItems.find((item) => item.category === 'Phụ kiện')?.id ?? null,
                    'Nền': customization.equippedItems.find((item) => item.category === 'Nền')?.id ?? null,
                });
            } catch (err) {
                console.error('Failed to fetch shop data:', err);
                setLoadError('Không thể tải dữ liệu cửa hàng lúc này. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        }
        if (!childId) {
            return;
        }
        void fetchShopData();
    }, [childId]);

    const equippedIds = Object.values(equippedBySlot).filter(Boolean) as number[];
    const filteredItems = shopItems.filter((i) => activeCategory === 'Tất cả' || i.category === activeCategory);
    const equippedLabels = Object.entries(equippedBySlot)
        .filter(([, itemId]) => Boolean(itemId))
        .map(([slot, itemId]) => {
            const item = shopItems.find((shopItem) => shopItem.id === itemId);
            return item ? `${slot}: ${item.name}` : null;
        })
        .filter((label): label is string => Boolean(label));

    async function handleBuy(item: ShopItem) {
        try {
            const result = await gamificationApi.purchaseItem(childId, item.id);
            if (result.success) {
                const purchasedItem = { ...item, owned: true };
                setShopItems((prev) =>
                    prev.map((i) => i.id === item.id ? purchasedItem : i)
                );
                setStars(result.remainingStars);
                setCoins(result.remainingCoins);
                setPurchased(item.id);
                setPreviewItem(purchasedItem);
                purchaseTimeoutRef.current = setTimeout(() => setPurchased(null), 2500);
            }
        } catch (err) {
            console.error('Failed to purchase item:', err);
            toast.error('Không thể mua item này', { description: 'Vui lòng kiểm tra số sao/xu và thử lại.' });
        }
    }

    async function handleEquip(item: ShopItem) {
        if (!child) {
            return;
        }
        try {
            await gamificationApi.equipItem(childId, item.id);
            const customization = await gamificationApi.getAvatarCustomization(childId);
            setPreviewAvatarUrl(customization.avatar || child.avatarUrl);
            setShopItems((prev) =>
                prev.map((shopItem) => {
                    const equippedItem = customization.equippedItems.find((equipped) => equipped.id === shopItem.id);
                    return {
                        ...shopItem,
                        isEquipped: Boolean(equippedItem),
                    };
                })
            );
            setPreviewItem((prev) => prev ? {
                ...prev,
                owned: true,
                isEquipped: customization.equippedItems.some((equipped) => equipped.id === prev.id),
            } : prev);
            setEquippedBySlot({
                'Mũ': customization.equippedItems.find((equipped) => equipped.category === 'Mũ')?.id ?? null,
                'Áo': customization.equippedItems.find((equipped) => equipped.category === 'Áo')?.id ?? null,
                'Thú cưng': customization.equippedItems.find((equipped) => equipped.category === 'Thú cưng')?.id ?? null,
                'Phụ kiện': customization.equippedItems.find((equipped) => equipped.category === 'Phụ kiện')?.id ?? null,
                'Nền': customization.equippedItems.find((equipped) => equipped.category === 'Nền')?.id ?? null,
            });
        } catch (err) {
            console.error('Failed to equip item:', err);
            toast.error('Không thể trang bị item', { description: 'Vui lòng thử lại.' });
        }
    }

    if (loading || childLoading || !child) {
        return <LoadingScreen text="Đang mở cửa hàng..." />;
    }

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-12 font-body selection:bg-primary/20">
            {/* Desktop HUD */}
            <div className="hidden md:block">
                <GameHUD
                    nickname={child.nickname}
                    avatarUrl={previewAvatarUrl || child.avatarUrl}
                    rewards={{ ...child.rewards, totalPoints: stars }}
                    activeNav="shop"
                />
            </div>

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b-2 border-border md:hidden">
                <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
                    <Link href="/play">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <ArrowLeft size={16} className="text-body" />
                        </motion.div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-accent" />
                        <Heading level={3} className="text-heading text-xl">Cửa Hàng Avatar</Heading>
                    </div>

                    {/* Wallet */}
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-warning-light border border-warning/30 px-3 py-1.5 rounded-full text-xs font-heading font-black text-warning">
                            <Star size={12} className="fill-warning" /> {stars.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 bg-background border border-border px-3 py-1.5 rounded-full text-xs font-heading font-black text-body">
                            <Coins size={12} /> {coins}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 pt-5 space-y-5">
                {/* Avatar preview strip */}
                <motion.div initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-candy rounded-[2rem] p-5 flex items-center gap-5">
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-card/20 border-4 border-white/50 flex items-center justify-center overflow-hidden">
                            <Image src={previewAvatarUrl || child.avatarUrl} alt={child.nickname} width={80} height={80} className="h-full w-full object-contain p-1" />
                        </div>
                        {/* Show equipped hat emoji on avatar */}
                        {equippedBySlot['Mũ'] && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full bg-card border border-border font-heading font-bold">
                                {shopItems.find((i) => i.id === equippedBySlot['Mũ'])?.name?.slice(0, 1) || 'M'}
                            </div>
                        )}
                    </div>
                    <div className="text-white">
                        <Heading level={3} color="textInverse" className="text-lg mb-0.5">{child.nickname}</Heading>
                        <Body color="textInverse" className="text-sm text-white/80">{shopItems.filter(i => i.owned).length} item đã có</Body>
                        <div className="flex gap-1.5 flex-wrap mt-1.5">
                            {equippedIds.map((eId) => {
                                const it = shopItems.find((i) => i.id === eId);
                                return it ? (
                                    <span key={eId} className="text-[11px] px-2 py-0.5 rounded-full bg-card/25 border border-white/30 text-white">
                                        {it.name}
                                    </span>
                                ) : null;
                            })}
                            {equippedIds.length === 0 && <Caption color="textInverse" className="text-xs text-white/60">Chưa trang bị gì</Caption>}
                        </div>
                        {equippedLabels.length > 0 && (
                            <Caption color="textInverse" className="text-xs mt-2 block text-white/80">
                                {equippedLabels.join(' • ')}
                            </Caption>
                        )}
                    </div>
                </motion.div>

                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <motion.button
                            key={cat}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-2xl font-heading font-bold text-sm border-2 transition-all ${activeCategory === cat ? 'bg-primary-light border-primary text-primary' : 'bg-card border-border text-body hover:border-primary/40'
                                }`}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                {/* Grid */}
                {loadError && (
                    <div className="bg-error/10 border-2 border-error/20 rounded-[2rem] p-5 text-center">
                        <Heading level={4} className="text-heading text-lg mb-2">Không tải được cửa hàng</Heading>
                        <Caption className="text-body">{loadError}</Caption>
                    </div>
                )}
                <ShopGrid
                    filteredItems={filteredItems}
                    handleBuy={handleBuy}
                    setPreviewItem={setPreviewItem}
                    stars={stars}
                    coins={coins}
                />
                {filteredItems.length === 0 && (
                    <div className="bg-card border-2 border-dashed border-border rounded-[2rem] p-8 text-center">
                        <Heading level={4} className="text-heading text-lg mb-2">Chưa có item trong mục này</Heading>
                        <Caption className="text-caption">Thử chuyển sang danh mục khác hoặc quay lại sau khi shop được cập nhật.</Caption>
                    </div>
                )}
            </div>

            {/* Purchase success toast */}
            <AnimatePresence>
                {purchased && (
                    <motion.div
                        initial={{ opacity: 1, y: 60, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.8 }}
                        className="fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 bg-success text-white px-6 py-3 rounded-2xl shadow-xl font-heading font-black text-sm flex items-center gap-2 z-50"
                    >
                        🎉 Mua thành công! Item đã thêm vào tủ đồ
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview drawer */}
            <ItemPreviewDrawer
                previewItem={previewItem}
                equippedBySlot={equippedBySlot}
                handleEquip={handleEquip}
                handleBuy={handleBuy}
                setPreviewItem={setPreviewItem}
            />
        </div>
    );
}
