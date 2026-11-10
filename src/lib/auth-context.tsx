'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CategoryPermission, UserRole, CATEGORY_DEFINITIONS } from '@/types/user';
import { storage } from './storage';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (employeeId: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  hasPermission: (category: CategoryPermission) => boolean;
  isRole: (role: UserRole) => boolean;
  reloadCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'lk_portal_active_session_empid';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = () => {
    try {
      let savedEmpId = localStorage.getItem(SESSION_KEY);
      if (savedEmpId) {
        if (savedEmpId.toUpperCase() === 'ADMIN01') {
          savedEmpId = '2265';
          localStorage.setItem(SESSION_KEY, '2265');
        }
        const users = storage.getUsers();
        const found = users.find(
          (u) => u.id.toLowerCase() === savedEmpId!.toLowerCase() && u.isActive
        );
        if (found) {
          setCurrentUser(found);
        } else {
          localStorage.removeItem(SESSION_KEY);
          setCurrentUser(null);
        }
      }
    } catch (e) {
      console.warn('Failed to load auth session', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial sync from server on mount
    storage.syncFromServer().finally(() => {
      loadSession();
    });

    // 2. Periodic sync every 30s to keep cross-device data always fresh
    const intervalId = setInterval(() => {
      storage.syncFromServer();
    }, 30000);

    // 3. Immediately sync whenever user returns to the tab or unlocks their phone
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        storage.syncFromServer();
      }
    };
    const handleFocus = () => {
      storage.syncFromServer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = async (
    employeeId: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    const rawCleanId = employeeId.trim();
    if (!rawCleanId) {
      return { success: false, message: 'Vui lòng nhập Mã số nhân viên.' };
    }
    const cleanId = rawCleanId.toUpperCase() === 'ADMIN01' ? '2265' : rawCleanId;
    if (!password) {
      return { success: false, message: 'Vui lòng nhập Mật khẩu.' };
    }

    let users = storage.getUsers();
    let user = users.find(
      (u) => u.id.toLowerCase() === cleanId.toLowerCase()
    );

    // If not found in local cache, sync from server first!
    if (!user) {
      await storage.syncFromServer();
      users = storage.getUsers();
      user = users.find(
        (u) => u.id.toLowerCase() === cleanId.toLowerCase()
      );
    }

    if (!user) {
      return {
        success: false,
        message: `Mã nhân viên "${cleanId}" không tồn tại trong hệ thống. Vui lòng liên hệ Quản trị viên để được cấp tài khoản qua file Excel.`,
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ Phòng Nhân sự (HR).',
      };
    }

    // Password verification (Direct check or default fallback)
    const validPassword = user.password || 'LK@123456';
    if (password !== validPassword) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Mật khẩu mặc định do Admin cấp hoặc liên hệ để đặt lại.',
      };
    }

    // Login successful
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.id);

    storage.addAuditLog(
      'update',
      'auth',
      user.id,
      user.id,
      user.name,
      `Đăng nhập thành công vào Cổng thông tin (Mã NV: ${user.id})`
    );

    return {
      success: true,
      message: `Chào mừng ${user.name} (${user.position} - ${user.department})!`,
    };
  };

  const logout = () => {
    if (currentUser) {
      storage.addAuditLog(
        'update',
        'auth',
        currentUser.id,
        currentUser.id,
        currentUser.name,
        `Đăng xuất khỏi hệ thống`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Bạn chưa đăng nhập vào hệ thống.' };
    }

    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();

    if (!cleanOld) {
      return { success: false, message: 'Vui lòng nhập mật khẩu hiện tại.' };
    }

    if (!cleanNew) {
      return { success: false, message: 'Vui lòng nhập mật khẩu mới.' };
    }

    if (cleanNew.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự để đảm bảo an toàn.' };
    }

    const currentValidPassword = currentUser.password || 'LK@123456';
    if (cleanOld !== currentValidPassword) {
      return {
        success: false,
        message: 'Mật khẩu hiện tại không chính xác. Mật khẩu mặc định ban đầu là LK@123456 nếu bạn chưa từng đổi.',
      };
    }

    if (cleanNew === cleanOld) {
      return {
        success: false,
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      };
    }

    // Cập nhật người dùng trong danh sách lưu trữ
    const users = storage.getUsers();
    const userIndex = users.findIndex(
      (u) => u.id.toLowerCase() === currentUser.id.toLowerCase()
    );

    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy thông tin tài khoản người dùng trong hệ thống.' };
    }

    const updatedUser: User = {
      ...users[userIndex],
      password: cleanNew,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    storage.saveUsers(users, {
      id: currentUser.id,
      name: currentUser.name,
    });

    // Cập nhật state currentUser
    setCurrentUser(updatedUser);

    storage.addAuditLog(
      'update',
      'auth',
      currentUser.id,
      currentUser.id,
      currentUser.name,
      `Người dùng ${currentUser.name} (MSNV: ${currentUser.id}) đã tự đổi mật khẩu tài khoản thành công`
    );

    return {
      success: true,
      message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật và có hiệu lực ngay lập tức.',
    };
  };

  const hasPermission = (category: CategoryPermission): boolean => {
    if (!currentUser) return false;
    // Administrator always has access to everything
    if (currentUser.role === 'admin') return true;

    // Strict role-based & category-based permissions configured by Admin
    if (Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(category);
    }

    // Default fallback if permissions array is undefined
    const defaultPerms: CategoryPermission[] = [
      'dashboard',
      'leave',
      'attendance',
      'gate_pass',
      'overtime',
      'food_registration',
      'repair',
      'announcements',
    ];
    return defaultPerms.includes(category);
  };

  const isRole = (role: UserRole): boolean => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  const reloadCurrentUser = () => {
    loadSession();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        changePassword,
        hasPermission,
        isRole,
        reloadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
