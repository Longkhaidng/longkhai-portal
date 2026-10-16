'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { WebIntegration } from '@/types/user';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Power,
  Monitor,
  BarChart,
  Camera,
  FileText,
  Database,
  LayoutGrid,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const ICON_LIST = [
  { name: 'Globe', label: 'Trang Web (Globe)', icon: Globe },
  { name: 'BarChart', label: 'Biểu đồ Báo cáo (BarChart)', icon: BarChart },
  { name: 'Monitor', label: 'Hệ thống Máy chủ (Monitor)', icon: Monitor },
  { name: 'Camera', label: 'Camera Giám Sát (Camera)', icon: Camera },
  { name: 'FileText', label: 'Văn bản / Tra Cứu (FileText)', icon: FileText },
  { name: 'Database', label: 'Cơ Sở Dữ Liệu (Database)', icon: Database },
  { name: 'LayoutGrid', label: 'Phần Mềm / Ứng Dụng (Grid)', icon: LayoutGrid },
];

export function WebIntegrationManagementView({
  onSelectSiteToView,
}: {
  onSelectSiteToView?: (site: WebIntegration) => void;
}) {
  const { currentUser } = useAuth();
  const [websites, setWebsites] = useState<WebIntegration[]>(() =>
    storage.getWebIntegrations()
  );
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WebIntegration | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Globe');
  const [displayMode, setDisplayMode] = useState<'embed' | 'new_tab'>('embed');
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'it';

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setIconName('Globe');
    setDisplayMode('embed');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: WebIntegration) => {
    setEditingItem(item);
    setTitle(item.title);
    setUrl(item.url);
    setDescription(item.description || '');
    setIconName(item.iconName || 'Globe');
    setDisplayMode(item.displayMode || 'embed');
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanTitle = title.trim();
    let cleanUrl = url.trim();

    if (!cleanTitle || !cleanUrl) {
      setFormError('Vui lòng nhập đầy đủ Tên chức năng và Đường dẫn website URL.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const now = new Date().toISOString();
    let updatedList: WebIntegration[];

    if (editingItem) {
      updatedList = websites.map((w) => {
        if (w.id === editingItem.id) {
          return {
            ...w,
            title: cleanTitle,
            url: cleanUrl,
            description: description.trim() || undefined,
            iconName,
            displayMode,
            updatedAt: now,
          };
        }
        return w;
      });
    } else {
      const newId = `WEB-${Date.now().toString().slice(-4)}`;
      const newItem: WebIntegration = {
        id: newId,
        title: cleanTitle,
        url: cleanUrl,
        description: description.trim() || undefined,
        iconName,
        displayMode,
        order: websites.length + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [...websites, newItem];
    }

    storage.saveWebIntegrations(updatedList, { id: currentUser.id, name: currentUser.name });
    setWebsites(updatedList);
    setShowModal(false);
  };

  const handleToggleActive = (id: string) => {
    if (!currentUser) return;
    const updated = websites.map((w) => {
      if (w.id === id) {
        return { ...w, isActive: !w.isActive, updatedAt: new Date().toISOString() };
      }
      return w;
    });
    storage.saveWebIntegrations(updated, { id: currentUser.id, name: currentUser.name });
    setWebsites(updated);
  };

  const handleDelete = (id: string, name: string) => {
    if (!currentUser) return;
    if (!confirm(`Bạn có chắc chắn muốn gỡ bỏ trang web "${name}" khỏi menu chức năng?`)) return;
    const updated = websites.filter((w) => w.id !== id);
    storage.saveWebIntegrations(updated, { id: currentUser.id, name: currentUser.name });
    setWebsites(updated);
  };

  const filtered = websites.filter((w) => {
    return (
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.url.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Tích Hợp Các Trang Website Vào Menu Chức Năng
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gắn các liên kết phần mềm nội bộ (ERP, PowerBI, MISA, Camera, Tra cứu luật...) trực tiếp lên menu Portal
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm website mới vào menu</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên website, đường link URL..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of integrated sites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((site) => {
          return (
            <div
              key={site.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                site.isActive
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {site.displayMode === 'embed' ? 'Nhúng iframe' : 'Mở tab mới'}
                    </span>
                    <button
                      onClick={() => handleToggleActive(site.id)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                        site.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                      }`}
                      title="Bật / Tắt menu này"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {site.title}
                  </h3>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                  >
                    <span className="truncate">{site.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5">
                    {site.description || 'Chưa có mô tả cho trang web này.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (onSelectSiteToView) {
                      onSelectSiteToView(site);
                    } else if (site.displayMode === 'new_tab') {
                      window.open(site.url, '_blank');
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <span>Mở xem trang</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(site)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(site.id, site.title)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 hover:text-rose-700"
                      title="Xóa bỏ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Add / Edit Web Integration */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Chỉnh Sửa Website Tích Hợp' : 'Thêm Website Mới Vào Menu'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị trên Menu:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Phần Mềm ERP, Báo Cáo PowerBI, Camera Xưởng..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Đường dẫn liên kết URL:
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://app.powerbi.com hoặc https://..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kiểu hiển thị khi người dùng bấm vào:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('embed')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      displayMode === 'embed'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nhúng trực tiếp (iframe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('new_tab')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all ${
                      displayMode === 'new_tab'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Mở trong Tab Mới
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chức năng:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú mục đích sử dụng trang web..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {editingItem ? 'Cập nhật website' : 'Thêm vào menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
