'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function ApproveRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : '';
    const destination = params ? `/?${params}` : '/';
    window.location.replace(destination);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-semibold text-slate-300">
        Đang chuyển hướng về Cổng Thông Tin Long Khải...
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Vui lòng đăng nhập để phê duyệt hoặc từ chối đơn tại website.
      </p>
    </div>
  );
}

export default function QuickApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ApproveRedirectContent />
    </Suspense>
  );
}
