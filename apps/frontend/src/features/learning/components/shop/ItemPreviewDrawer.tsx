import { motion, AnimatePresence } from 'framer-motion';
import { Check, Wand2, ShoppingCart } from 'lucide-react';
import { Heading, Caption } from '@/shared/components/Typography';
import { ShopItem } from '@/features/learning/api/gamification.api';
import { RARITY_STYLE } from './constants';

interface ItemPreviewDrawerProps {
    previewItem: ShopItem | null;
    equippedBySlot: Record<string, number | null>;
    handleEquip: (item: ShopItem) => void;
    handleBuy: (item: ShopItem) => void;
    setPreviewItem: (item: ShopItem | null) => void;
}

export function ItemPreviewDrawer({
    previewItem,
    equippedBySlot,
    handleEquip,
    handleBuy,
    setPreviewItem
}: ItemPreviewDrawerProps) {
    return (
        <AnimatePresence>
            {previewItem && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setPreviewItem(null)} />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full z-50 bg-card rounded-t-[2.5rem] md:rounded-3xl p-6 border-t-4 md:border-4 border-primary shadow-2xl max-w-lg mx-auto"
                    >
                        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-5" />
                        <div className="flex items-center gap-5 mb-6">
                            <span className="text-7xl">{previewItem.emoji}</span>
                            <div>
                                <div className={`text-xs font-heading font-black px-2 py-0.5 rounded-full border inline-block mb-2 ${RARITY_STYLE[previewItem.rarity]?.cls}`}>
                                    {RARITY_STYLE[previewItem.rarity]?.label}
                                </div>
                                <Heading level={3} className="text-heading text-xl">{previewItem.name}</Heading>
                                <Caption className="text-caption">{previewItem.category}</Caption>
                            </div>
                        </div>
                        {previewItem.owned ? (
                            <div className="space-y-2">
                                <div className="w-full py-3 bg-success-light text-success font-heading font-black text-center rounded-2xl flex items-center justify-center gap-2">
                                    <Check size={16} /> Đã sở hữu
                                </div>
                                {/* UC-15: Equip / Unequip button */}
                                <button
                                    onClick={() => handleEquip(previewItem)}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-heading font-black text-sm border-2 transition-all ${equippedBySlot[previewItem.category] === previewItem.id
                                        ? 'bg-accent text-white border-accent'
                                        : 'bg-accent-light text-accent border-accent/30 hover:bg-accent hover:text-white'
                                        }`}
                                >
                                    <Wand2 size={16} />
                                    {equippedBySlot[previewItem.category] === previewItem.id ? '✓ Đang mặc' : 'Mặc vào nhân vật'}
                                </button>
                            </div>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleBuy(previewItem)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-heading font-black text-lg hover:bg-primary-dark border-b-4 border-primary-dark active:border-b-0 active:translate-y-1 transition-all"
                            >
                                <ShoppingCart size={18} /> Mua — {previewItem.price} {previewItem.currency === 'stars' ? '⭐' : '💰'}
                            </motion.button>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
