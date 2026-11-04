'use client';

import React, { useState, useRef } from 'react';
import { WebIntegration } from '@/types/user';
import {
  Globe,
  RotateCw,
  ExternalLink,
  ArrowLeft,
  Maximize2,
  ShieldAlert,
} from 'lucide-react';

interface EmbeddedWebViewProps {
  site: WebIntegration;
  onBack: () => void;
}

export function EmbeddedWebView({ site, onBack }: EmbeddedWebViewProps) {
  const [iframeKey, setIframeKey] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenNewTab = () => {
    window.open(site.url, '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      {/* Top Controls Toolbar */}
      <div className="h-12 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3">
        {/* Left: Back button & Website Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Quay lại danh mục"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
              {site.title}
            </span>
          </div>
        </div>

        {/* Center: URL display badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-500 max-w-md truncate">
          <span className="text-emerald-500 font-bold">HTTPS:</span>
          <span className="truncate">{site.url}</span>
        </div>

        {/* Right: Actions (Refresh, Open in tab) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Tải lại trang"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenNewTab}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Mở sang tab mới"
          >
            <span>Mở tab mới</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-slate-950">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-500">Đang tải trang web tích hợp...</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={site.url}
          title={site.title}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="camera; microphone; geolocation; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        />

        {/* Fallback advice footer if external site restricts iframe */}
        <div className="absolute bottom-2 right-2 bg-slate-900/90 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/60 backdrop-blur-md flex items-center gap-2">
          <span className="text-slate-300">
            Nếu website không hiển thị do chính sách bảo mật máy chủ bên ngoài:
          </span>
          <button
            onClick={handleOpenNewTab}
            className="text-blue-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>Mở ngay trong tab mới</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
