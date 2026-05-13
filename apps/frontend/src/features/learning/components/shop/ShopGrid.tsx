import { motion, AnimatePresence } from 'framer-motion';
import { ShopItem } from '@/features/learning/api/gamification.api';
import { ItemCard } from './ItemCard';

interface ShopGridProps {
    filteredItems: ShopItem[];
    handleBuy: (item: ShopItem) => void;
    setPreviewItem: (item: ShopItem) => void;
    stars: number;
    coins: number;
}

export function ShopGrid({ filteredItems, handleBuy, setPreviewItem, stars, coins }: ShopGridProps) {
    return (
        <motion.div
            layout
            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4"
        >
            <AnimatePresence mode="popLayout">
                {filteredItems.map((item, i) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: i * 0.04 }}
                    >
                        <ItemCard item={item} onBuy={handleBuy} onPreview={setPreviewItem} stars={stars} coins={coins} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}
