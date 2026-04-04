import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Heading } from '@/shared/components/Typography';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function AdminModal({ isOpen, onClose, title, children, maxWidth = '2xl' }: AdminModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.dataset.adminModalOpen = 'true';
    } else {
      document.body.style.overflow = 'unset';
      delete document.body.dataset.adminModalOpen;
    }
    return () => {
      document.body.style.overflow = 'unset';
      delete document.body.dataset.adminModalOpen;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 shadow-2xl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Window */}
      <div 
        className={`relative w-full ${maxWidthMap[maxWidth]} bg-card rounded-3xl border border-border/70 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 bg-background/70 px-6 py-4 md:px-8 md:py-5 rounded-t-3xl">
          <Heading level={3} className="text-heading text-xl md:text-2xl">{title}</Heading>
          <button 
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent p-2 text-caption shadow-sm transition-all hover:border-border/70 hover:bg-card hover:text-body"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
