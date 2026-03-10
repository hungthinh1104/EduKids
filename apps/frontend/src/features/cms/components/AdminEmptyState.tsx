interface AdminEmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

export function AdminEmptyState({ 
  icon = '📭', 
  title = 'Không có dữ liệu', 
  description = 'Chưa có mục nào được tìm thấy hoặc tạo mới trong hệ thống.' 
}: AdminEmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 border-dashed m-1">
      <div className="text-6xl mb-6 opacity-80 hover:scale-110 transition-transform cursor-default">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}
