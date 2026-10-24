export interface EmailConfig {
  provider: 'smtp' | 'resend' | 'gmail' | 'google_relay';
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  senderName?: string;
  senderEmail?: string;
  resendApiKey?: string;
  googleScriptUrl?: string; // Web App URL của Google Apps Script
  isEnabled: boolean;
  portalBaseUrl?: string; // Ví dụ: https://longkhai-portal.vercel.app
  bodEmails?: string[]; // Email Ban Giám Đốc nhận thông báo
}

export interface SendEmailPayload {
  toEmail: string;
  managerName?: string;
  type: 'leave' | 'gate_pass' | 'attendance' | 'repair' | 'stationery' | 'general';
  docId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position?: string;
  details: {
    title: string;
    items: { label: string; value: string }[];
  };
}
