import { Search } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface AdminSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  filterOptions?: FilterOption[];
}

export function AdminSearchBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Tìm kiếm...',
  statusFilter,
  onStatusFilterChange,
  filterOptions
}: AdminSearchBarProps) {
  return (
    <div className="mb-6 rounded-2xl border border-border/70 bg-card/90 p-4 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-caption" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/70 py-3 pl-12 pr-4 text-body outline-none transition-all placeholder:text-caption focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25"
          />
        </div>

        {/* Filters */}
        {filterOptions && onStatusFilterChange && statusFilter && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar items-center">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusFilterChange(opt.value)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  statusFilter === opt.value
                    ? 'bg-primary text-white border border-primary shadow-sm'
                    : 'bg-background text-body hover:bg-card hover:text-primary border border-border/70 hover:border-primary/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
