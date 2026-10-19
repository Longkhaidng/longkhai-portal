'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  GitBranch,
  Cloud,
  Check,
  Copy,
  Key,
  FolderGit2,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export function DeploymentGuideView() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      step: '1',
      title: 'Tạo Repository trên GitHub',
      desc: 'Tạo 2 Repository (hoặc 1 Repo duy nhất) để chứa Mã nguồn và Dữ liệu JSON.',
      details: [
        '1. Đăng nhập tài khoản của bạn tại: https://github.com',
        '2. Bấm nút New (Màu xanh) để tạo Repository mới:',
        '   - Tên Repo mã nguồn: ví dụ "longkhai-portal"',
        '   - Chọn chế độ: Private (Bảo mật nội bộ công ty) hoặc Public',
        '   - Không tích chọn "Add a README file" nếu bạn muốn đẩy toàn bộ code từ máy tính lên.',
        '   - Bấm "Create repository".',
      ],
    },
    {
      step: '2',
      title: 'Đẩy Mã Nguồn Từ Máy Tính Lên GitHub',
      desc: 'Cách đẩy toàn bộ thư mục dự án D:\\CONG VIEC\\LONGKHAI_PORTAL lên GitHub.',
      commands: `# Mở PowerShell hoặc Git Bash tại thư mục: D:\\CONG VIEC\\LONGKHAI_PORTAL

# 1. Khởi tạo kho git (nếu chưa có)
git init

# 2. Thêm toàn bộ mã nguồn
git add .

# 3. Tạo commit đầu tiên
git commit -m "Khoi tao he thong Long Khai Portal Next.js 15"

# 4. Đổi nhánh chính sang main
git branch -M main

# 5. Liên kết tới GitHub Repository của bạn (thay username/repo bằng của bạn)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/longkhai-portal.git

# 6. Đẩy mã nguồn lên GitHub
git push -u origin main`,
    },
    {
      step: '3',
      title: 'Tạo GitHub Personal Access Token (PAT)',
      desc: 'Token này giúp website đọc & ghi trực tiếp các file JSON trên GitHub.',
      details: [
        '1. Truy cập: https://github.com/settings/tokens',
        '2. Chọn "Generate new token" -> "Generate new token (classic)"',
        '3. Đặt tên Note: "LongKhai Portal Data Access"',
        '4. Chọn Expiration: "No expiration" (hoặc 90 days tùy chính sách công ty)',
        '5. Tích chọn quyền: [x] repo (Full control of private repositories) bao gồm:',
        '   - repo:status',
        '   - repo_deployment',
        '   - public_repo (hoặc toàn bộ repo)',
        '6. Bấm "Generate token" ở cuối trang.',
        '7. SAO CHÉP MÃ TOKEN (bắt đầu bằng ghp_...) và lưu lại an toàn!',
      ],
    },
    {
      step: '4',
      title: 'Triển khai (Deploy) Lên Vercel Miễn Phí Trong 2 Phút',
      desc: 'Đưa website chạy trên mạng Internet cho toàn bộ nhân viên truy cập.',
      details: [
        '1. Truy cập https://vercel.com và đăng nhập bằng tài khoản GitHub của bạn.',
        '2. Chọn "Add New..." -> "Project".',
        '3. Tìm repository "longkhai-portal" và bấm "Import".',
        '4. Tại mục Environment Variables (Biến môi trường), thêm các biến sau:',
        '   - NEXT_PUBLIC_GITHUB_OWNER = <tên tài khoản GitHub của bạn>',
        '   - NEXT_PUBLIC_GITHUB_REPO = <tên repo, vd: longkhai-portal>',
        '   - NEXT_PUBLIC_GITHUB_BRANCH = main',
        '   - NEXT_PUBLIC_GITHUB_TOKEN = <mã token ghp_... vừa tạo ở Bước 3>',
        '5. Bấm nút "Deploy".',
        '6. Trong vòng 1 phút, Vercel sẽ cấp cho bạn tên miền truy cập miễn phí dạng:',
        '   https://longkhai-portal.vercel.app',
      ],
    },
    {
      step: '5',
      title: 'Đăng Nhập Và Tải File Excel Danh Sách Nhân Viên',
      desc: 'Khởi tạo tài khoản cho toàn bộ cán bộ công nhân viên trong nhà máy.',
      details: [
        '1. Truy cập vào website vừa deploy.',
        '2. Đăng nhập bằng tài khoản Quản trị viên khởi tạo:',
        '   - Tên đăng nhập: 2265',
        '   - Mật khẩu: admin@123',
        '3. Nhấp vào mục "Quản lý nhân viên & Phân quyền".',
        '4. Tải file Excel mẫu: "Tải file Excel mẫu (.xlsx)".',
        '5. Điền thông tin nhân viên theo các cột, sau đó bấm "Tải lên danh sách Excel".',
        '6. Kiểm tra lại phân quyền từng danh mục và lưu lại.',
        '7. Vào mục "Cài đặt & GitHub Data" bấm "Đẩy toàn bộ dữ liệu lên GitHub (Push)" để sao lưu toàn bộ file JSON lên GitHub Repo!',
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Hướng Dẫn Chi Tiết Triển Khai Website Lên GitHub & Vercel
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tài liệu hướng dẫn từng bước (Step-by-step) dành cho ban quản trị và bộ phận CNTT nhà máy Long Khai
        </p>
      </div>

      {/* Guide Steps */}
      <div className="space-y-5">
        {steps.map((st, i) => (
          <div
            key={st.step}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                {st.step}
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{st.desc}</p>
              </div>
            </div>

            {st.details && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                {st.details.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            )}

            {st.commands && (
              <div className="relative">
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                  {st.commands}
                </pre>
                <button
                  onClick={() => copyToClipboard(st.commands || '', i)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* GitHub Data Architecture Diagram */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-6 rounded-2xl border border-blue-900/40 text-white space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-blue-400" />
          <span>Cấu trúc lưu trữ dữ liệu JSON trên GitHub Repo</span>
        </h3>
        <pre className="text-xs font-mono text-blue-200/90 leading-relaxed overflow-x-auto bg-slate-950/60 p-4 rounded-xl border border-blue-900/50">
{`/company-data
│
├── pccc/
│   ├── devices.json                    # Danh mục toàn bộ thiết bị PCCC
│   └── 2026/
│       ├── FE26-000001.json            # Hồ sơ kiểm tra PCCC định kỳ
│       └── ...
├── leave-request/
│   └── 2026/
│       ├── LR26-000001.json            # Đơn xin nghỉ phép
│       └── ...
├── attendance/
│   └── 2026/
│       ├── ATT26-000001.json           # Phiếu xác nhận công vào - ra
│       └── ...
├── gate-pass/
│   └── 2026/
│       ├── GP26-000001.json            # Phiếu ra vào cổng & mã QR
│       └── ...
├── announcements/
│   └── announcements.json              # Thông báo, nội quy, chính sách
├── forms/
│   ├── forms.json                      # Cấu trúc các biểu mẫu động
│   └── submissions/
│       └── 2026/                       # Dữ liệu nộp biểu mẫu
└── settings/
    ├── users.json                      # Danh sách nhân viên & phân quyền
    ├── plugins.json                    # Cấu hình Bật/Tắt module mở rộng
    └── audit_logs.json                 # Nhật ký kiểm toán`}
        </pre>
      </div>
    </div>
  );
}
