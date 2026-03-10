import { ReactNode } from 'react';

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-600/20 transition-all font-medium"
        >
          {actionButton.icon}
          <span>{actionButton.label}</span>
        </button>
      )}
    </div>
  );
}
