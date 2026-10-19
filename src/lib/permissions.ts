import { User } from '@/types/user';
import { LeaveRequest } from '@/types/leave';
import { GatePass } from '@/types/gatePass';
import { AttendanceConfirm } from '@/types/attendance';

export type DocumentScope = 'my' | 'approver' | 'all';

/**
 * Check if the user has an approver/manager role (Admin, Manager, Team Leader)
 */
export function isApproverRole(role?: string): boolean {
  return role === 'admin' || role === 'manager' || role === 'team_leader';
}

/**
 * Filter Leave Requests based on user permissions:
 * - Regular employee: Strictly can only see their own requests.
 * - Approver (Team Leader, Manager, Admin): Can see their own requests and requests they are authorized to approve.
 */
export function filterUserLeaves(
  leaves: LeaveRequest[],
  user: User | null,
  scope: DocumentScope = 'my'
): LeaveRequest[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  // Regular users (employees, hr, security, accountant...) strictly only see their own requests
  if (!isApproverRole(user.role)) {
    return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
  }

  // Admin / Ban Giám Đốc
  if (user.role === 'admin') {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return leaves.filter((l) => l.status === 'pending' && l.employeeId.toLowerCase() !== uid);
    }
    return leaves;
  }

  // Department Head / Manager (Trưởng bộ phận)
  if (user.role === 'manager') {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }
    const userDept = user.department?.trim().toLowerCase();
    return leaves.filter((l) => {
      const isMine = l.employeeId.toLowerCase() === uid;
      if (scope === 'approver' && isMine) return false;
      const isMyDept = Boolean(userDept && l.department?.trim().toLowerCase() === userDept);
      const isAssigned = l.steps?.some((s) => s.approverId?.toLowerCase() === uid);
      return isMine || isMyDept || isAssigned;
    });
  }

  // Team Leader (Tổ trưởng)
  if (user.role === 'team_leader') {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }
    return leaves.filter((l) => {
      const isMine = l.employeeId.toLowerCase() === uid;
      if (scope === 'approver' && isMine) return false;
      const isAssigned = l.steps?.some((s) => s.approverId?.toLowerCase() === uid);
      return isMine || isAssigned;
    });
  }

  return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
}

/**
 * Filter Gate Passes based on user permissions:
 * - Regular employee: Strictly can only see their own gate passes.
 * - Approver: Can view their own + subordinate gate passes to approve.
 */
export function filterUserGatePasses(
  passes: GatePass[],
  user: User | null,
  scope: DocumentScope = 'my'
): GatePass[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  if (user.role === 'security' && scope === 'all') {
    return passes;
  }

  if (!isApproverRole(user.role)) {
    return passes.filter((p) => p.employeeId.toLowerCase() === uid);
  }

  if (user.role === 'admin') {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    if (scope === 'approver') return passes.filter((p) => p.status === 'pending' && p.employeeId.toLowerCase() !== uid);
    return passes;
  }

  if (user.role === 'manager') {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    const userDept = user.department?.trim().toLowerCase();
    return passes.filter((p) => {
      const isMine = p.employeeId.toLowerCase() === uid;
      if (scope === 'approver' && isMine) return false;
      const isMyDept = Boolean(userDept && p.department?.trim().toLowerCase() === userDept);
      const isAssigned = p.managerApproverId?.toLowerCase() === uid;
      return isMine || isMyDept || isAssigned;
    });
  }

  if (user.role === 'team_leader') {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    return passes.filter((p) => {
      const isMine = p.employeeId.toLowerCase() === uid;
      if (scope === 'approver' && isMine) return false;
      return isMine || p.managerApproverId?.toLowerCase() === uid;
    });
  }

  return passes.filter((p) => p.employeeId.toLowerCase() === uid);
}

/**
 * Filter Attendance Confirmations based on user permissions:
 * - Regular employee: Strictly can only see their own attendance confirmations.
 * - Approver: Can view their own + subordinate confirmations to approve.
 */
export function filterUserAttendances(
  attendances: AttendanceConfirm[],
  user: User | null,
  scope: DocumentScope = 'my'
): AttendanceConfirm[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  if (!isApproverRole(user.role)) {
    return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
  }

  if (user.role === 'admin') {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    if (scope === 'approver') return attendances.filter((a) => a.status === 'pending' && a.employeeId.toLowerCase() !== uid);
    return attendances;
  }

  if (user.role === 'manager') {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    const userDept = user.department?.trim().toLowerCase();
    return attendances.filter((a) => {
      const isMine = a.employeeId.toLowerCase() === uid;
      if (scope === 'approver' && isMine) return false;
      const isMyDept = Boolean(userDept && a.department?.trim().toLowerCase() === userDept);
      const isAssigned = a.steps?.some((s) => s.approverId?.toLowerCase() === uid);
      return isMine || isMyDept || isAssigned;
    });
  }

  if (user.role === 'team_leader') {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    return attendances.filter((a) => {
      const isMine = a.employeeId.toLowerCase() === uid;
      if (scope === 'approver' && isMine) return false;
      const isAssigned = a.steps?.some((s) => s.approverId?.toLowerCase() === uid);
      return isMine || isAssigned;
    });
  }

  return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
}
