import { Body } from '@/shared/components/Typography';

export function AdminLoadingState() {
  return (
    <div className="m-1 flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card/80 py-24 backdrop-blur-sm shadow-sm">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-border/60"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin"></div>
      </div>
      <Body className="animate-pulse font-medium tracking-wide text-caption">Đang định tuyến dữ liệu...</Body>
    </div>
  );
}
