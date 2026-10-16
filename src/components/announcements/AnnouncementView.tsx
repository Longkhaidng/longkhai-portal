'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  Announcement,
  AnnouncementCategory,
  ANNOUNCEMENT_CATEGORY_LABELS,
} from '@/types/announcement';
import {
  Bell,
  Plus,
  Search,
  Pin,
  Calendar,
  User,
  Tag,
  FileText,
  Bookmark,
  Share2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function AnnouncementView() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    storage.getAnnouncements()
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(announcements[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new announcement
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<AnnouncementCategory>('cong_ty');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(false);

  const canPost = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'ehs';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newId = `ANN-${String(announcements.length + 1).padStart(3, '0')}`;
    const newAnn: Announcement = {
      id: newId,
      title: newTitle,
      category: newCategory,
      summary: newSummary,
      contentMarkdown: newContent,
      authorName: currentUser.name,
      authorId: currentUser.id,
      isPinned: newIsPinned,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newAnn, ...announcements];
    storage.saveAnnouncements(updated, { id: currentUser.id, name: currentUser.name });
    setAnnouncements(updated);
    setSelectedItem(newAnn);
    setShowCreateModal(false);

    // Reset
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewIsPinned(false);
  };

  const filtered = announcements.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.contentMarkdown.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Thông Báo & Nội Quy Nhà Máy
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cập nhật quy định, chính sách phúc lợi, lịch kiểm tra và tin tức nội bộ (Markdown)
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng thông báo mới</span>
          </button>
        )}
      </div>

      {/* Filter by Category & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Tất cả
          </button>
          {Object.entries(ANNOUNCEMENT_CATEGORY_LABELS).map(([catKey, val]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === catKey
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {val.title}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thông báo..."
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 2-column layout: Article list & Detail reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Announcements list (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
              Không có bài viết thông báo nào phù hợp.
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/80 shadow-xs ring-1 ring-purple-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        ANNOUNCEMENT_CATEGORY_LABELS[item.category]?.color
                      }`}
                    >
                      {ANNOUNCEMENT_CATEGORY_LABELS[item.category]?.title}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      {item.isPinned && (
                        <span className="text-amber-500 flex items-center gap-0.5 font-bold" title="Đã ghim">
                          <Pin className="w-3.5 h-3.5 fill-amber-500" />
                        </span>
                      )}
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {item.summary}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Markdown Reader (7 cols) */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      ANNOUNCEMENT_CATEGORY_LABELS[selectedItem.category]?.color
                    }`}
                  >
                    {ANNOUNCEMENT_CATEGORY_LABELS[selectedItem.category]?.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    &bull; Đăng ngày {formatDate(selectedItem.publishedAt)} bởi <b>{selectedItem.authorName}</b>
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {selectedItem.title}
                </h2>
              </div>

              {/* Markdown Content Viewer */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap">
                {selectedItem.contentMarkdown}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
              Chọn một thông báo ở danh sách bên trái để xem nội dung chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Post New Announcement */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Đăng Thông Báo / Nội Quy Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề thông báo:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Quy định về an toàn điện và vận hành cẩu trục..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chuyên mục:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AnnouncementCategory)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {Object.entries(ANNOUNCEMENT_CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={newIsPinned}
                      onChange={(e) => setNewIsPinned(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>Ghim lên đầu trang (Quan trọng)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tóm tắt ngắn:
                </label>
                <input
                  type="text"
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Tóm tắt 1-2 câu nội dung cốt lõi..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung đầy đủ (Hỗ trợ định dạng Markdown):
                </label>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="### 1. NỘI DUNG CHÍNH&#10;- Điều 1...&#10;- Điều 2..."
                  className="w-full p-3 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
                >
                  Xuất bản bài viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
