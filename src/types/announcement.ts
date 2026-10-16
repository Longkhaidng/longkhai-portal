export type AnnouncementCategory =
  | 'cong_ty'
  | 'noi_quy'
  | 'chinh_sach'
  | 'tin_tuc';

export interface Announcement {
  id: string; // ANN-001
  title: string;
  category: AnnouncementCategory;
  summary: string;
  contentMarkdown: string; // Nội dung Markdown đầy đủ
  authorName: string;
  authorId: string;
  isPinned: boolean;
  publishedAt: string;
  updatedAt: string;
  attachments?: {
    name: string;
    url: string;
    size?: string;
  }[];
}

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, { title: string; color: string }> = {
  cong_ty: { title: 'Thông báo công ty', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  noi_quy: { title: 'Nội quy nhà máy', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  chinh_sach: { title: 'Chính sách & Phúc lợi', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  tin_tuc: { title: 'Tin tức & Hoạt động', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
};
