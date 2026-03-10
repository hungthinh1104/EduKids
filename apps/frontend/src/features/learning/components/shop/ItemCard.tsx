import { motion } from 'framer-motion';
import { Check, ShoppingCart, Lock } from 'lucide-react';
import { ShopItem } from '@/features/learning/api/gamification.api';
import { RARITY_STYLE } from './constants';

interface ItemCardProps {
    item: ShopItem;
    onBuy: (item: ShopItem) => void;
    onPreview: (item: ShopItem) => void;
    stars: number;
    coins: number;
}

export function ItemCard({ item, onBuy, onPreview, stars, coins }: ItemCardProps) {
    const rarity = RARITY_STYLE[item.rarity] ?? RARITY_STYLE.common;
    const canAfford = item.currency === 'stars' ? stars >= item.price : coins >= item.price;

    return (
        <motion.div
            whileHover={!item.owned ? { scale: 1.04, y: -5 } : { scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative bg-card border-2 rounded-2xl overflow-hidden cursor-pointer
        ${item.owned ? 'border-success shadow-md shadow-success/20' : `border-border hover:border-primary/50 shadow-lg ${rarity.glow}`}`}
        >
            {/* Rarity badge */}
            <div className={`absolute top-2 left-2 text-[10px] font-heading font-black px-2 py-0.5 rounded-full border ${rarity.cls}`}>
                {rarity.label}
            </div>

            {/* Owned badge */}
            {item.owned && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow">
                    <Check size={12} className="text-white" />
                </div>
            )}

            {/* Item emoji */}
            <div
                className="flex items-center justify-center pt-8 pb-3 bg-gradient-to-b from-background to-transparent"
                onClick={() => onPreview(item)}
            >
                <motion.span
                    animate={item.rarity === 'legendary' ? { rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-6xl select-none"
                >
                    {item.emoji}
                </motion.span>
            </div>

            <div className="p-3">
                <div className="font-heading font-black text-heading text-sm mb-2 truncate">{item.name}</div>

                {/* Price + CTA */}
                {item.owned ? (
                    <div className="flex items-center justify-center gap-1.5 text-success text-xs font-heading font-bold py-2 bg-success-light rounded-xl">
                        <Check size={12} /> Đã có
                    </div>
                ) : (
                    <button
                        onClick={() => onBuy(item)}
                        disabled={!canAfford}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-heading font-black transition-all
              ${canAfford
                                ? 'bg-primary text-white hover:bg-primary-dark active:scale-95 border-b-2 border-primary-dark'
                                : 'bg-background text-caption border border-border cursor-not-allowed'}`}
                    >
                        {canAfford ? <ShoppingCart size={12} /> : <Lock size={12} />}
                        {item.price}
                        {item.currency === 'stars' ? ' ⭐' : ' 💰'}
                    </button>
                )}
            </div>
        </motion.div>
    );
}
