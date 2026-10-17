export interface EmailConfig {
  provider: 'smtp' | 'resend' | 'gmail';
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  senderName?: string;
  senderEmail?: string;
  resendApiKey?: string;
  isEnabled: boolean;
  portalBaseUrl?: string; // Ví dụ: https://longkhai-portal.vercel.app
}

export interface SendEmailPayload {
  toEmail: string;
  managerName?: string;
  type: 'leave' | 'gate_pass';
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
