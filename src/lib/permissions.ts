import { User } from '@/types/user';
import { LeaveRequest } from '@/types/leave';
import { GatePass } from '@/types/gatePass';
import { AttendanceConfirm } from '@/types/attendance';

export type DocumentScope = 'my' | 'approver' | 'all';

/**
 * Check if the user is Admin or Board of Directors (Ban Giám Đốc)
 * Admin and BOD have supreme authority to see and oversee company requests.
 */
export function isSuperAdminOrBOD(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if ((user.role as string) === 'bod') return true;
  const dept = (user.department || '').toLowerCase();
  if (dept.includes('ban giám đốc') || dept.includes('ban giam doc')) return true;
  const pos = (user.position || '').toLowerCase();
  if (pos.includes('giám đốc') || pos.includes('giam doc')) return true;
  return false;
}

/**
 * Check if the user has an approver/manager role (Admin, BOD, Manager/Trưởng bộ phận, Team Leader/Tổ trưởng)
 */
export function isApproverRole(roleOrUser?: string | User | null): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'string') {
    return (
      roleOrUser === 'admin' ||
      roleOrUser === 'manager' ||
      roleOrUser === 'team_leader' ||
      roleOrUser === 'bod'
    );
  }
  if (isSuperAdminOrBOD(roleOrUser)) return true;
  return roleOrUser.role === 'manager' || roleOrUser.role === 'team_leader';
}

/**
 * Check if two department strings belong to the same unit
 */
export function isSameDepartment(deptA?: string, deptB?: string): boolean {
  if (!deptA || !deptB) return false;
  const cleanA = deptA.trim().toLowerCase();
  const cleanB = deptB.trim().toLowerCase();
  return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

/**
 * Check if the user is a Security Guard / An ninh
 */
export function isSecurityRole(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'security') return true;
  const dept = (user.department || '').toLowerCase();
  if (dept.includes('bảo vệ') || dept.includes('bao ve') || dept.includes('an ninh')) return true;
  const pos = (user.position || '').toLowerCase();
  if (pos.includes('bảo vệ') || pos.includes('bao ve')) return true;
  return false;
}

/**
 * Check if the user is IT personnel (Bộ phận CNTT / IT)
 */
export function isITStaff(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'it') return true;
  if (user.id === '2265' || user.id === 'ADMIN01') return true;
  const dept = (user.department || '').toLowerCase();
  if (dept.includes('it') || dept.includes('công nghệ thông tin') || dept.includes('cong nghe thong tin') || dept.includes('cntt')) return true;
  const pos = (user.position || '').toLowerCase();
  if (pos.includes('it') || pos.includes('cntt') || pos.includes('công nghệ thông tin') || pos.includes('quản trị viên cntt')) return true;
  return false;
}

/**
 * Check if the user is Accountant (Kế toán)
 */
export function isAccountantStaff(user?: User | null): boolean {
  if (!user) return false;
  if (user.role === 'accountant') return true;
  const dept = (user.department || '').toLowerCase();
  if (dept.includes('kế toán') || dept.includes('ke toan')) return true;
  const pos = (user.position || '').toLowerCase();
  if (pos.includes('kế toán') || pos.includes('ke toan')) return true;
  return false;
}

/**
 * Check if the user is Economic Staff / Phụ trách cắt cơm (Nhân viên kinh tế)
 */
export function isEconomicStaff(user?: User | null): boolean {
  if (!user) return false;
  if ((user.role as string) === 'economic') return true;
  const pos = (user.position || '').toLowerCase();
  if (pos.includes('kinh tế') || pos.includes('kinh te') || pos.includes('cắt cơm') || pos.includes('cat com')) return true;
  return false;
}

/**
 * Check if the user is assigned as an Economic Staff / Meal cutting coordinator across the system
 */
export function isAssignedEconomicStaff(
  user?: User | null,
  allUsers?: User[],
  leaves?: LeaveRequest[]
): boolean {
  if (!user) return false;
  if (isEconomicStaff(user)) return true;
  const uid = user.id.toLowerCase();
  if (allUsers && allUsers.some((u) => u.economicStaffId?.toLowerCase() === uid)) return true;
  if (leaves && leaves.some((l) => l.steps?.some((s) => s.roleRequired === 'economic' && s.approverId?.toLowerCase() === uid))) return true;
  return false;
}

/**
 * Filter Leave Requests based on user permissions:
 * - Regular employee: Strictly can only see their own requests.
 * - Economic staff (Nhân viên kinh tế): Can see requests assigned to them for cutting meals once approved by Manager.
 * - Team Leader & Department Head (Tổ trưởng, Trưởng bộ phận): Can see all requests of employees in their department + their own.
 * - Admin & Ban Giám Đốc: Can see all requests across the entire company.
 */
export function filterUserLeaves(
  leaves: LeaveRequest[],
  user: User | null,
  scope: DocumentScope = 'all',
  allUsers?: User[]
): LeaveRequest[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  // 1. Economic staff (Nhân viên kinh tế / Phụ trách cắt cơm)
  const isEconomic =
    isEconomicStaff(user) ||
    leaves.some((l) => l.steps?.some((s) => s.roleRequired === 'economic' && s.approverId?.toLowerCase() === uid)) ||
    (allUsers && allUsers.some((u) => u.economicStaffId?.toLowerCase() === uid));

  if (isEconomic && !isSuperAdminOrBOD(user) && user.role !== 'manager') {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      // Only requests that reached economic staff's turn (Trưởng BP đã duyệt)
      return leaves.filter((l) => {
        if (l.status !== 'pending' || l.employeeId.toLowerCase() === uid) return false;
        const currentStep = l.steps[l.currentStepIndex];
        return currentStep?.roleRequired === 'economic' && (currentStep?.approverId?.toLowerCase() === uid || isEconomicStaff(user));
      });
    }
    // scope === 'all': requests assigned to economic staff + their own
    return leaves.filter((l) => {
      const isMine = l.employeeId.toLowerCase() === uid;
      const isAssigned = l.steps?.some((s) => s.roleRequired === 'economic' && (s.approverId?.toLowerCase() === uid || isEconomicStaff(user)));
      return isMine || isAssigned;
    });
  }

  // 2. HR & C&B roles can see all company leaves for timekeeping / payroll tracking
  if (user.role === 'hr' || user.role === 'cb') {
    if (scope === 'my') return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    return leaves;
  }

  // 3. Regular users strictly only see their own requests
  if (!isApproverRole(user)) {
    return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
  }

  // 3. Admin & Ban Giám Đốc can see all company requests
  if (isSuperAdminOrBOD(user)) {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return leaves.filter((l) => l.status === 'pending' && l.employeeId.toLowerCase() !== uid);
    }
    return leaves; // All company
  }

  // 4. Team Leader (Tổ trưởng) & Department Head (Trưởng bộ phận)
  if (user.role === 'manager' || user.role === 'team_leader') {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }

    if (scope === 'approver') {
      return leaves.filter((l) => {
        if (l.employeeId.toLowerCase() === uid) return false;
        const isMyDept = isSameDepartment(l.department, user.department);
        const isAssigned = l.steps?.some((s) => s.approverId?.toLowerCase() === uid);
        return l.status === 'pending' && (isMyDept || isAssigned);
      });
    }

    // scope === 'all': all requests of employees in their department + their own + assigned
    return leaves.filter((l) => {
      const isMine = l.employeeId.toLowerCase() === uid;
      const isMyDept = isSameDepartment(l.department, user.department);
      const isAssigned = l.steps?.some((s) => s.approverId?.toLowerCase() === uid);
      return isMine || isMyDept || isAssigned;
    });
  }

  return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
}

/**
 * Filter Gate Passes based on user permissions:
 * - Security (Bảo vệ): Can see all gate passes they are authorized to confirm / monitor across the company.
 * - Regular employee: Strictly can only see their own gate passes.
 * - Team Leader & Department Head: Can see all gate passes of employees in their department + their own.
 * - Admin & Ban Giám Đốc: Can see all gate passes across the entire company.
 */
export function filterUserGatePasses(
  passes: GatePass[],
  user: User | null,
  scope: DocumentScope = 'all'
): GatePass[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  // 1. Security role (Bảo vệ)
  if (isSecurityRole(user)) {
    if (scope === 'my') {
      return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return passes.filter(
        (p) => (p.status === 'approved' || p.status === 'departed') && p.employeeId.toLowerCase() !== uid
      );
    }
    return passes;
  }

  // HR & C&B roles can see all gate passes across company
  if (user.role === 'hr' || user.role === 'cb') {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    return passes;
  }

  // 2. Regular employees strictly only see their own gate passes
  if (!isApproverRole(user)) {
    return passes.filter((p) => p.employeeId.toLowerCase() === uid);
  }

  // 3. Admin & Ban Giám Đốc can see all
  if (isSuperAdminOrBOD(user)) {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    if (scope === 'approver') return passes.filter((p) => p.status === 'pending' && p.employeeId.toLowerCase() !== uid);
    return passes;
  }

  // 4. Team Leader & Department Head
  if (user.role === 'manager' || user.role === 'team_leader') {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);

    if (scope === 'approver') {
      return passes.filter((p) => {
        if (p.employeeId.toLowerCase() === uid) return false;
        const isMyDept = isSameDepartment(p.department, user.department);
        const isAssigned = p.managerApproverId?.toLowerCase() === uid;
        return p.status === 'pending' && (isMyDept || isAssigned);
      });
    }

    return passes.filter((p) => {
      const isMine = p.employeeId.toLowerCase() === uid;
      const isMyDept = isSameDepartment(p.department, user.department);
      const isAssigned = p.managerApproverId?.toLowerCase() === uid;
      return isMine || isMyDept || isAssigned;
    });
  }

  return passes.filter((p) => p.employeeId.toLowerCase() === uid);
}

/**
 * Filter Attendance Confirmations based on user permissions:
 * - Security (Bảo vệ): Can see all attendance slips that they are authorized to confirm / approve (Step 1).
 * - IT staff (Bộ phận CNTT): Can see slips requiring IT machine data updates (Step 3/4).
 * - Accountant (Kế toán): Can see slips requiring card fee recording (Step 3).
 * - Regular employee: Strictly can only see their own attendance confirmations.
 * - Team Leader & Department Head: Can see all attendance confirmations of employees in their department + their own.
 * - Admin & Ban Giám Đốc: Can see all attendance confirmations across the company.
 */
export function filterUserAttendances(
  attendances: AttendanceConfirm[],
  user: User | null,
  scope: DocumentScope = 'all'
): AttendanceConfirm[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  // 1. Security role (Bảo vệ)
  if (isSecurityRole(user)) {
    if (scope === 'my') {
      return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return attendances.filter((a) => {
        if (a.status !== 'pending' || a.employeeId.toLowerCase() === uid) return false;
        const currentStep = a.steps[a.currentStepIndex];
        return currentStep?.roleRequired === 'security' || currentStep?.approverId?.toLowerCase() === uid;
      });
    }
    return attendances;
  }

  // 2. IT staff (Bộ phận CNTT / IT)
  if (isITStaff(user) && !isSuperAdminOrBOD(user)) {
    if (scope === 'my') {
      return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return attendances.filter((a) => {
        if (a.status !== 'pending') return false;
        const currentStep = a.steps[a.currentStepIndex];
        return currentStep?.roleRequired === 'it';
      });
    }
    return attendances.filter((a) => {
      const isMine = a.employeeId.toLowerCase() === uid;
      const hasITStep = a.steps?.some((s) => s.roleRequired === 'it');
      return isMine || hasITStep;
    });
  }

  // 3. Accountant (Kế toán)
  if (isAccountantStaff(user) && !isSuperAdminOrBOD(user)) {
    if (scope === 'my') {
      return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return attendances.filter((a) => {
        if (a.status !== 'pending') return false;
        const currentStep = a.steps[a.currentStepIndex];
        const isAccStep = currentStep?.roleRequired === 'accountant';
        const isMyDeptPending =
          (user.role === 'manager' || user.role === 'team_leader') &&
          a.employeeId.toLowerCase() !== uid &&
          (isSameDepartment(a.department, user.department) || currentStep?.approverId?.toLowerCase() === uid);
        return isAccStep || isMyDeptPending;
      });
    }
    return attendances.filter((a) => {
      const isMine = a.employeeId.toLowerCase() === uid;
      const hasAccStep = a.steps?.some((s) => s.roleRequired === 'accountant');
      const isMyDept = (user.role === 'manager' || user.role === 'team_leader') && isSameDepartment(a.department, user.department);
      return isMine || hasAccStep || isMyDept;
    });
  }

  // 3.5. HR & C&B roles can see all attendance confirmations across company
  if (user.role === 'hr' || user.role === 'cb') {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    return attendances;
  }

  // 4. Regular employees strictly only see their own
  if (!isApproverRole(user)) {
    return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
  }

  // 5. Admin & Ban Giám Đốc can see all
  if (isSuperAdminOrBOD(user)) {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    if (scope === 'approver') return attendances.filter((a) => a.status === 'pending' && a.employeeId.toLowerCase() !== uid);
    return attendances;
  }

  // 6. Team Leader & Department Head
  if (user.role === 'manager' || user.role === 'team_leader') {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);

    if (scope === 'approver') {
      return attendances.filter((a) => {
        if (a.employeeId.toLowerCase() === uid) return false;
        const isMyDept = isSameDepartment(a.department, user.department);
        const isAssigned = a.steps?.some((s) => s.approverId?.toLowerCase() === uid);
        return a.status === 'pending' && (isMyDept || isAssigned);
      });
    }

    return attendances.filter((a) => {
      const isMine = a.employeeId.toLowerCase() === uid;
      const isMyDept = isSameDepartment(a.department, user.department);
      const isAssigned = a.steps?.some((s) => s.approverId?.toLowerCase() === uid);
      return isMine || isMyDept || isAssigned;
    });
  }

  return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
}
