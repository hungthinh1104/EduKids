import React from 'react';
import { motion, TargetAndTransition } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { Caption } from '@/shared/components/Typography';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  kidFriendly?: boolean;
}

const alertConfig = {
  success: {
    icon: CheckCircle2,
    colors: 'bg-success-light/40 border-success/30 text-success',
    buttonColors: 'bg-success text-white hover:bg-success-dark',
    iconColor: 'text-success',
    emoji: '🥳',
    animation: { y: [0, -8, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
  },
  error: {
    icon: AlertCircle,
    colors: 'bg-secondary-light/40 border-secondary/30 text-secondary',
    buttonColors: 'bg-secondary text-white hover:bg-secondary-dark',
    iconColor: 'text-secondary',
    emoji: '😢',
    animation: { x: [-3, 3, -3, 3, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 } }
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-warning-light/40 border-warning/30 text-warning-dark',
    buttonColors: 'bg-card border-warning/40 text-warning hover:bg-warning-light/50',
    iconColor: 'text-warning',
    emoji: '🤔',
    animation: { scale: [1, 1.1, 1], rotate: [0, 10, -10, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
  },
  info: {
    icon: Info,
    colors: 'bg-primary-light/40 border-primary/30 text-primary-dark',
    buttonColors: 'bg-primary text-white hover:bg-primary-dark',
    iconColor: 'text-primary',
    emoji: '👋',
    animation: { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as Record<AlertType, Record<string, any> & { animation?: TargetAndTransition }>;

export const Alert = ({
  type,
  title,
  message,
  action,
  onClose,
  className = '',
  kidFriendly = false,
}: AlertProps) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: [1, 0], scale: [1, 0.95] }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 flex items-start sm:items-center justify-between gap-3 shadow-sm ${config.colors} ${className}`}
      role="alert"
    >
      <div className="flex items-start sm:items-center gap-3 w-full">
        <motion.div animate={config.animation}>
            {kidFriendly ? (
              <span className="text-2xl" aria-hidden="true">{config.emoji}</span>
            ) : (
              <Icon className={`shrink-0 ${config.iconColor}`} size={24} />
            )}
        </motion.div>
        
        <div className="flex-1">
          {title && (
            <h4 className="font-heading font-bold text-sm mb-0.5">{title}</h4>
          )}
          <Caption className={`font-semibold text-sm ${title ? 'opacity-90' : ''}`}>
            {message}
          </Caption>
        </div>

        {action && (
          <div className="shrink-0 mt-3 sm:mt-0">
            {action}
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors ${config.iconColor}`}
          aria-label="Close alert"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};
