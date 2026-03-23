import { motion } from 'framer-motion';
import { Check, ShoppingCart, Lock, Wand2 } from 'lucide-react';
import { ShopItem } from '@/features/learning/api/gamification.api';

interface ItemCardProps {
    item: ShopItem;
    onBuy: (item: ShopItem) => void;
    onPreview: (item: ShopItem) => void;
    stars: number;
    coins: number;
}

export function ItemCard({ item, onBuy, onPreview, stars, coins }: ItemCardProps) {
    const canAfford = item.currency === 'stars' ? stars >= item.price : coins >= item.price;

    return (
        <motion.div
            whileHover={!item.owned ? { scale: 1.04, y: -5 } : { scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative bg-card border-2 rounded-2xl overflow-hidden cursor-pointer
        ${item.owned ? 'border-success shadow-md shadow-success/20' : 'border-border hover:border-primary/50 shadow-lg'}
        `}
            onClick={() => onPreview(item)}
        >
            {/* Category badge */}
            <div className="absolute top-2 left-2 text-[10px] font-heading font-black px-2 py-0.5 rounded-full border bg-background text-caption border-border">
                {item.category}
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
            >
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain" />
                ) : (
                    <motion.span className="text-5xl select-none">🛍️</motion.span>
                )}
            </div>

            <div className="p-3">
                <div className="font-heading font-black text-heading text-sm mb-2 truncate">{item.name}</div>

                {/* Price + CTA */}
                {item.owned ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onPreview(item);
                        }}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs font-heading font-bold py-2 rounded-xl border transition-all ${
                            item.isEquipped
                                ? 'bg-accent text-white border-accent'
                                : 'bg-success-light text-success border-success/20 hover:bg-accent-light hover:text-accent hover:border-accent/30'
                        }`}
                    >
                        {item.isEquipped ? <Check size={12} /> : <Wand2 size={12} />}
                        {item.isEquipped ? 'Đang mặc' : 'Trang bị'}
                    </button>
                ) : (
                    <motion.button
                        whileTap={!canAfford ? { x: [-4, 4, -3, 3, -2, 2, 0] } : { scale: 0.95 }}
                        onClick={(event) => {
                            event.stopPropagation();
                            onBuy(item);
                        }}
                        disabled={!canAfford}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-heading font-black transition-all
              ${canAfford
                                ? 'bg-primary text-white hover:bg-primary-dark active:scale-95 border-b-2 border-primary-dark'
                                : 'bg-background text-caption border border-border cursor-not-allowed'}`}
                    >
                        {canAfford ? <ShoppingCart size={12} /> : <Lock size={12} />}
                        {item.price}
                        {item.currency === 'stars' ? ' ⭐' : ' 💰'}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
