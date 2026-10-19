import { User } from '@/types/user';
import { LeaveRequest } from '@/types/leave';
import { GatePass } from '@/types/gatePass';
import { AttendanceConfirm } from '@/types/attendance';

export type DocumentScope = 'my' | 'approver' | 'all';

/**
 * Check if the user is Admin or Board of Directors (Ban Giám Đốc)
 * Admin and BOD have supreme authority to see and approve all company requests.
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
 * Filter Leave Requests based on user permissions:
 * - Regular employee: Strictly can only see their own requests.
 * - Team Leader & Department Head (Tổ trưởng, Trưởng bộ phận): Can see all requests of employees in their department + their own.
 * - Admin & Ban Giám Đốc: Can see all requests across the entire company.
 */
export function filterUserLeaves(
  leaves: LeaveRequest[],
  user: User | null,
  scope: DocumentScope = 'all'
): LeaveRequest[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  // 1. Regular users strictly only see their own requests
  if (!isApproverRole(user)) {
    return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
  }

  // 2. Admin & Ban Giám Đốc can see all company requests
  if (isSuperAdminOrBOD(user)) {
    if (scope === 'my') {
      return leaves.filter((l) => l.employeeId.toLowerCase() === uid);
    }
    if (scope === 'approver') {
      return leaves.filter((l) => l.status === 'pending' && l.employeeId.toLowerCase() !== uid);
    }
    return leaves; // All company
  }

  // 3. Team Leader (Tổ trưởng) & Department Head (Trưởng bộ phận)
  // "tổ trưởng, trưởng bộ phận có thể thấy và xem đơn của nhân viên bộ phận mình"
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
 * - Regular employee: Strictly can only see their own gate passes.
 * - Team Leader & Department Head: Can see all gate passes of employees in their department + their own.
 * - Admin & Ban Giám Đốc: Can see all gate passes across the entire company.
 * - Security: Can access security gate scanning tab.
 */
export function filterUserGatePasses(
  passes: GatePass[],
  user: User | null,
  scope: DocumentScope = 'all'
): GatePass[] {
  if (!user) return [];
  const uid = user.id.toLowerCase();

  if (user.role === 'security' && scope === 'all') {
    return passes;
  }

  // 1. Regular employees strictly only see their own gate passes
  if (!isApproverRole(user)) {
    return passes.filter((p) => p.employeeId.toLowerCase() === uid);
  }

  // 2. Admin & Ban Giám Đốc can see all
  if (isSuperAdminOrBOD(user)) {
    if (scope === 'my') return passes.filter((p) => p.employeeId.toLowerCase() === uid);
    if (scope === 'approver') return passes.filter((p) => p.status === 'pending' && p.employeeId.toLowerCase() !== uid);
    return passes;
  }

  // 3. Team Leader & Department Head
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

  // 1. Regular employees strictly only see their own
  if (!isApproverRole(user)) {
    return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
  }

  // 2. Admin & Ban Giám Đốc can see all
  if (isSuperAdminOrBOD(user)) {
    if (scope === 'my') return attendances.filter((a) => a.employeeId.toLowerCase() === uid);
    if (scope === 'approver') return attendances.filter((a) => a.status === 'pending' && a.employeeId.toLowerCase() !== uid);
    return attendances;
  }

  // 3. Team Leader & Department Head
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
