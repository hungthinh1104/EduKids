import { ReactNode } from 'react';
import { Heading, Body, Caption } from '@/shared/components/Typography';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

export function AdminPageHeader({ title, description, actionButton }: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary-light/55 via-card to-accent-light/40 p-5 md:flex-row md:items-center md:p-6 shadow-sm">
      <div>
        <Caption className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary-light/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
          CMS Admin
        </Caption>
        <Heading level={2} className="text-heading text-3xl">{title}</Heading>
        {description && <Body className="text-body mt-1">{description}</Body>}
      </div>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-6 py-3 font-heading font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
        >
          {actionButton.icon}
          <span>{actionButton.label}</span>
        </button>
      )}
    </div>
  );
}
