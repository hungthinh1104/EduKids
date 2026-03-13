'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Caption, Heading, Body } from '@/shared/components/Typography';

interface LearningModeShellProps {
  backHref: string;
  progressCurrent: number;
  progressTotal: number;
  title: string;
  subtitle?: string;
  progressFromClass?: string;
  progressToClass?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  contentMaxWidthClass?: string;
}

export function LearningModeShell({
  backHref,
  progressCurrent,
  progressTotal,
  title,
  subtitle,
  progressFromClass = 'from-primary',
  progressToClass = 'to-accent',
  children,
  headerRight,
  contentMaxWidthClass = 'max-w-lg',
}: LearningModeShellProps) {
  const safeTotal = Math.max(progressTotal, 1);
  const ratio = Math.min(Math.max(progressCurrent / safeTotal, 0), 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light/40 via-background to-background pb-20 md:pb-8">
      <div className="sticky top-0 z-30 bg-card/85 backdrop-blur-xl border-b border-border/80">
        <div className="max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3 md:gap-4">
          <Link href={backHref}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border hover:border-primary transition-colors"
            >
              <X size={14} className="text-body" />
            </motion.div>
          </Link>

          <div className="flex-1 h-3.5 bg-background rounded-full border border-border overflow-hidden">
            <motion.div
              animate={{ width: `${ratio * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${progressFromClass} ${progressToClass} rounded-full`}
            />
          </div>

          <Caption className="text-caption text-sm font-black whitespace-nowrap tabular-nums min-w-[48px] text-right">
            {progressCurrent}/{progressTotal}
          </Caption>
        </div>
      </div>

      <div className={`${contentMaxWidthClass} mx-auto px-4 md:px-6 pt-6`}>
        <div className="mb-6 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Heading level={3} className="text-heading text-xl">{title}</Heading>
              {subtitle && <Body className="text-body text-sm mt-1">{subtitle}</Body>}
            </div>
            {headerRight}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

interface ModeStatePanelProps {
  title: string;
  description: string;
  emoji?: string;
}

export function ModeStatePanel({ title, description, emoji = '📚' }: ModeStatePanelProps) {
  return (
    <div className="text-center py-14 rounded-3xl border border-dashed border-border/80 bg-card/70">
      <div className="text-4xl mb-3">{emoji}</div>
      <Heading level={4} className="text-heading text-lg mb-1">{title}</Heading>
      <Caption className="text-caption">{description}</Caption>
    </div>
  );
}
