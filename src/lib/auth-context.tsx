'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CategoryPermission, UserRole, CATEGORY_DEFINITIONS } from '@/types/user';
import { storage } from './storage';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (employeeId: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
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
      const savedEmpId = localStorage.getItem(SESSION_KEY);
      if (savedEmpId) {
        const users = storage.getUsers();
        const found = users.find(
          (u) => u.id.toLowerCase() === savedEmpId.toLowerCase() && u.isActive
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
    loadSession();
  }, []);

  const login = async (
    employeeId: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanId = employeeId.trim();
    if (!cleanId) {
      return { success: false, message: 'Vui lòng nhập Mã số nhân viên.' };
    }
    if (!password) {
      return { success: false, message: 'Vui lòng nhập Mật khẩu.' };
    }

    const users = storage.getUsers();
    const user = users.find(
      (u) => u.id.toLowerCase() === cleanId.toLowerCase()
    );

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

  const hasPermission = (category: CategoryPermission): boolean => {
    if (!currentUser) return false;
    // Administrator always has access to everything
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.includes(category) ?? false;
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
