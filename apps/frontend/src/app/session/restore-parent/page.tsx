'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Body } from '@/shared/components/Typography';
import { restoreParentSession } from '@/shared/utils/parent-session-handoff';

export default function RestoreParentSessionPage() {
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const nextPath = searchParams.get('next') || '/dashboard';
    const restoredRole = restoreParentSession();

    if (!restoredRole) {
      router.replace('/login');
      return;
    }

    window.location.replace(nextPath);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Body className="text-body">Đang quay lại khu vực phụ huynh...</Body>
    </div>
  );
}
