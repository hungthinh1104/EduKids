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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-50/50"
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-transparent'
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
