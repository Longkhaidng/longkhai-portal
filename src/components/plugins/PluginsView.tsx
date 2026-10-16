'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { PluginModule } from '@/types/plugin';
import {
  Boxes,
  ShieldAlert,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Truck,
  Award,
  Leaf,
  HeartHandshake,
  CheckCircle2,
  Power,
  Search,
  Filter,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldAlert,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Truck,
  Award,
  Leaf,
  HeartHandshake,
  CheckCircle2,
};

export function PluginsView() {
  const { currentUser } = useAuth();
  const [plugins, setPlugins] = useState<PluginModule[]>(() => storage.getPlugins());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isAdmin = currentUser?.role === 'admin';

  const handleTogglePlugin = (id: string) => {
    if (!isAdmin || !currentUser) {
      alert('Chỉ Quản trị viên mới có quyền Bật / Tắt tiện ích mở rộng!');
      return;
    }

    const updated = plugins.map((p) => {
      if (p.id === id) {
        return { ...p, isEnabled: !p.isEnabled };
      }
      return p;
    });

    storage.savePlugins(updated, { id: currentUser.id, name: currentUser.name });
    setPlugins(updated);
  };

  const filtered = plugins.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Trung Tâm Tiện Ích Mở Rộng (Plugin Registry)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kiến trúc module độc lập cho phép mở rộng hệ thống chuẩn ISO, 5S, Kaizen, CAPA mà không thay đổi cấu trúc nền tảng
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên module, chuẩn ISO, 5S, Kaizen..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả nhóm nghiệp vụ</option>
            <option value="safety">An toàn & Môi trường (Safety & Environment)</option>
            <option value="quality">Quản lý chất lượng & 5S (Quality & ISO)</option>
            <option value="operations">Sản xuất & Cải tiến Kaizen (Operations)</option>
            <option value="management">Quản trị & Chuỗi cung ứng (Management)</option>
          </select>
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Boxes;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                item.isEnabled
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    <Icon className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => handleTogglePlugin(item.id)}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                      item.isEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                    title={isAdmin ? 'Nhấp để Bật/Tắt module' : 'Chỉ Admin mới có thể đổi'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{item.isEnabled ? 'Đang bật' : 'Đang tắt'}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {item.code} &bull; v{item.version}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Tác giả: <b>{item.author}</b></span>
                <span className="capitalize">{item.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
