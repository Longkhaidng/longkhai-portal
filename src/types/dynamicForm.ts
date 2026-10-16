export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'signature';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[]; // Dành cho select, radio, checkbox
  defaultValue?: string | number | boolean;
  description?: string;
}

export interface WorkflowRule {
  stepOrder: number;
  stepName: string;
  approverRole: string; // 'manager' | 'department_head' | 'director' | 'qa' | 'safety' ...
  canReject: boolean;
}

export interface DynamicFormSchema {
  id: string; // Mã biểu mẫu: FORM-5S, FORM-KAIZEN, FORM-INCIDENT...
  title: string;
  description: string;
  category: string; // Sản xuất, An toàn, Chất lượng, Hành chính...
  icon: string;
  allowedDepartments: string[]; // ['all'] hoặc ['Sản xuất', 'Bảo trì'...]
  fields: FormField[];
  workflow: WorkflowRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicFormSubmission {
  id: string; // SUB000001
  formId: string;
  formTitle: string;
  employeeId: string;
  employeeName: string;
  department: string;
  data: Record<string, any>; // Lưu giá trị theo field.id
  status: 'pending' | 'approved' | 'rejected';
  currentStepIndex: number;
  approvalHistory: {
    stepName: string;
    approverId?: string;
    approverName?: string;
    action: 'approved' | 'rejected';
    comment?: string;
    date: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
