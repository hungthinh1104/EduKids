import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Heading } from '@/shared/components/Typography';

interface LoadingScreenProps {
    text?: string;
}

export function LoadingScreen({ text = "Đang tải..." }: LoadingScreenProps) {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 w-full">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                <Loader2 size={48} className="text-primary" />
            </motion.div>
            <Heading level={4} className="text-secondary animate-pulse text-xl">
                {text}
            </Heading>
        </div>
    );
}
