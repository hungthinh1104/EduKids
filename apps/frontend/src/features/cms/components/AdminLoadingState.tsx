export function AdminLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-3xl m-1 backdrop-blur-sm">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
      </div>
      <p className="text-gray-500 font-medium animate-pulse tracking-wide">Đang định tuyến dữ liệu...</p>
    </div>
  );
}
