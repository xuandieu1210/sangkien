import express from 'express';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import { closeDatabase, initializeDatabase, persistDatabase } from './database.js';
import { authenticateUser, sanitizeUser } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessions = new Map<string, string>();

const AVAILABLE_PERMISSIONS = [
  { code: 'view_dashboard', name: 'Xem tổng quan' },
  { code: 'view_innovations', name: 'Xem sáng kiến' },
  { code: 'view_rounds', name: 'Xem đợt xét' },
  { code: 'view_repository', name: 'Tra cứu sáng kiến' },
  { code: 'submit_innovation', name: 'Nộp sáng kiến' },
  { code: 'manage_users', name: 'Quản lý người dùng' },
  { code: 'manage_departments', name: 'Quản lý đơn vị' },
  { code: 'manage_councils', name: 'Quản lý hội đồng' },
  { code: 'manage_rounds', name: 'Tạo, sửa, duyệt và xóa đợt xét' },
  { code: 'manage_assignments', name: 'Phân công chấm' },
  { code: 'score_assigned', name: 'Chấm sáng kiến được giao' },
  { code: 'view_all_scores', name: 'Xem toàn bộ điểm trong phạm vi' },
  { code: 'manage_criteria', name: 'Quản lý bộ tiêu chí' },
  { code: 'manage_ranking', name: 'Quản lý quy tắc xếp loại' },
  { code: 'manage_fields', name: 'Quản lý lĩnh vực' },
  { code: 'view_audit', name: 'Xem nhật ký hệ thống' },
];

const DEFAULT_ROLE_CATALOG = [
  { code: 'ADMIN', name: 'ADMIN toàn hệ thống', description: 'Toàn quyền trên mọi đơn vị và cấu hình.', permissions: ['*'], protected: true },
  { code: 'WARD_ADMIN', name: 'ADMIN xã/phường', description: 'Quản trị trong phạm vi xã/phường và đơn vị con.', permissions: ['view_dashboard', 'view_innovations', 'view_rounds', 'manage_users', 'manage_departments', 'manage_councils', 'manage_rounds', 'manage_assignments', 'view_all_scores', 'submit_innovation', 'view_repository', 'view_audit'], protected: true },
  { code: 'MANAGER', name: 'Quản lý đơn vị', description: 'Theo dõi hoạt động và hồ sơ của đơn vị.', permissions: ['view_dashboard', 'view_innovations', 'view_rounds', 'view_repository'], protected: true },
  { code: 'SECRETARY', name: 'Thư ký hội đồng', description: 'Theo dõi hồ sơ và nghiệp vụ hội đồng.', permissions: ['view_dashboard', 'view_innovations', 'view_rounds', 'view_repository', 'view_audit'], protected: true },
  { code: 'COUNCIL_CHAIR', name: 'Chủ tịch hội đồng', description: 'Theo dõi toàn bộ điểm trong hội đồng được phân công.', permissions: ['view_dashboard', 'view_innovations', 'view_rounds', 'view_all_scores', 'view_repository'], protected: true },
  { code: 'COUNCIL_MEMBER', name: 'Thành viên hội đồng', description: 'Chấm các sáng kiến được phân công.', permissions: ['view_dashboard', 'view_innovations', 'view_rounds', 'score_assigned', 'view_repository'], protected: true },
  { code: 'SUBMITTER', name: 'Người nộp sáng kiến', description: 'Nộp sáng kiến trong phạm vi đơn vị.', permissions: ['view_dashboard', 'view_innovations', 'submit_innovation', 'view_repository'], protected: true },
];

// Mock database store
let db = {
  users: [
    { id: 'u-admin', username: 'admin', password: '123456', fullName: 'Nguyễn Văn Quản Trị Phường A', email: 'admin@sangkien.gov.vn', phone: '0901234567', departmentId: 'd-1', position: 'Quản trị hệ thống', isActive: true, roles: ['ADMIN', 'MANAGER'], createdAt: new Date().toISOString() },
    { id: 'u-ward-admin', username: 'admin_xaa', password: '123456', fullName: 'Phạm Văn Quản Trị Xã A', email: 'adminxaa@sangkien.gov.vn', phone: '0909999999', departmentId: 'd-3', position: 'Chủ tịch / Quản trị Sáng kiến Xã A', isActive: true, roles: ['WARD_ADMIN', 'MANAGER'], createdAt: new Date().toISOString() },
    { id: 'u-secretary', username: 'thu_ky', password: '123456', fullName: 'Trần Thị Thư Ký', email: 'thuky@sangkien.gov.vn', phone: '0902345678', departmentId: 'd-1', position: 'Chuyên viên tổng hợp', isActive: true, roles: ['SECRETARY', 'MANAGER'], createdAt: new Date().toISOString() },
    { id: 'u-chair', username: 'chu_tich', password: '123456', fullName: 'GS.TS Lê Văn Chủ Tịch', email: 'chutich@sangkien.gov.vn', phone: '0903456789', departmentId: 'd-2', position: 'Viện trưởng', isActive: true, roles: ['COUNCIL_CHAIR', 'COUNCIL_MEMBER'], createdAt: new Date().toISOString() },
    { id: 'u-member1', username: 'thanh_vien_1', password: '123456', fullName: 'PGS.TS Phạm Văn Thành Viên 1', email: 'tv1@sangkien.gov.vn', phone: '0904567890', departmentId: 'd-2', position: 'Trưởng khoa', isActive: true, roles: ['COUNCIL_MEMBER'], createdAt: new Date().toISOString() },
    { id: 'u-member2', username: 'thanh_vien_2', password: '123456', fullName: 'ThS. Hoàng Thị Thành Viên 2', email: 'tv2@sangkien.gov.vn', phone: '0905678901', departmentId: 'd-3', position: 'Giảng viên chính', isActive: true, roles: ['COUNCIL_MEMBER'], createdAt: new Date().toISOString() },
    { id: 'u-author1', username: 'tac_gia_1', password: '123456', fullName: 'Đỗ Văn Sáng - Cán bộ Xã A', email: 'tacgia1@sangkien.gov.vn', phone: '0906789012', departmentId: 'd-3', position: 'Công chức Xã A', isActive: true, roles: ['SUBMITTER'], createdAt: new Date().toISOString() },
    { id: 'u-author2', username: 'tac_gia_2', password: '123456', fullName: 'Lê Thị Hà - Cán bộ Xã A', email: 'tacgia2@sangkien.gov.vn', phone: '0907890123', departmentId: 'd-3', position: 'Địa chính Xã A', isActive: true, roles: ['SUBMITTER'], createdAt: new Date().toISOString() },
    { id: 'u-author3', username: 'tac_gia_3', password: '123456', fullName: 'Trần Minh Quân - Cán bộ Xã A', email: 'tacgia3@sangkien.gov.vn', phone: '0908901234', departmentId: 'd-3', position: 'Tư pháp Xã A', isActive: true, roles: ['SUBMITTER'], createdAt: new Date().toISOString() },
  ],
  roleCatalog: DEFAULT_ROLE_CATALOG,
  departments: [
    { id: 'd-1', parentId: 'd-3', code: 'VP-UBND-A', name: 'Văn phòng HĐND và UBND Phường A', type: 'PHONG_BAN_XA_PHUONG', isActive: true },
    { id: 'd-2', parentId: 'd-3', code: 'P-KT-A', name: 'Phòng Kinh tế, Hạ tầng và Đô thị Phường A', type: 'PHONG_BAN_XA_PHUONG', isActive: true },
    { id: 'd-3', parentId: null, code: 'XP-A', name: 'UBND Phường A', type: 'XA_PHUONG', isActive: true },
    { id: 'd-4', parentId: null, code: 'XP-B', name: 'UBND Phường B', type: 'XA_PHUONG', isActive: true },
  ],
  councils: [
    {
      id: 'c-1',
      code: 'HD-2026-XAA',
      name: 'Hội đồng xét duyệt sáng kiến Phường A năm 2026',
      decisionNumber: '128/QĐ-SK',
      decisionDate: '2026-01-15',
      establishingAuthority: 'Chủ tịch UBND Phường A',
      field: 'Khoa học công nghệ & Cải cách hành chính',
      description: 'Hội đồng xét duyệt sáng kiến thuộc Phường A.',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c-xa-a',
      code: 'HD-2026-XAA',
      name: 'Hội đồng Sáng kiến UBND Xã Phường A',
      decisionNumber: '05/QĐ-UBND-XAA',
      decisionDate: '2026-02-01',
      establishingAuthority: 'Chủ tịch UBND Xã A',
      field: 'Sáng kiến cơ sở Xã A',
      description: 'Hội đồng xét duyệt sáng kiến nội bộ Xã A.',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  councilMembers: [
    { id: 'cm-1', councilId: 'c-1', userId: 'u-chair', councilRole: 'CHAIRMAN', startDate: '2026-01-15', endDate: '2026-12-31', isActive: true },
    { id: 'cm-2', councilId: 'c-1', userId: 'u-secretary', councilRole: 'SECRETARY', startDate: '2026-01-15', endDate: '2026-12-31', isActive: true },
    { id: 'cm-3', councilId: 'c-1', userId: 'u-member1', councilRole: 'MEMBER', startDate: '2026-01-15', endDate: '2026-12-31', isActive: true },
    { id: 'cm-4', councilId: 'c-1', userId: 'u-member2', councilRole: 'MEMBER', startDate: '2026-01-15', endDate: '2026-12-31', isActive: true },
    // Xã A members
    { id: 'cm-5', councilId: 'c-xa-a', userId: 'u-ward-admin', councilRole: 'CHAIRMAN', startDate: '2026-02-01', endDate: '2026-12-31', isActive: true },
    { id: 'cm-6', councilId: 'c-xa-a', userId: 'u-member2', councilRole: 'MEMBER', startDate: '2026-02-01', endDate: '2026-12-31', isActive: true },
  ],
  criteriaSets: [
    {
      id: 'cs-1',
      version: 1,
      parentCriteriaSetId: null,
      code: 'TC-2026-V1',
      name: 'Bộ tiêu chuẩn chấm sáng kiến chuẩn năm 2026',
      description: 'Áp dụng cho các xã, phường và phòng chuyên môn trực thuộc.',
      totalScore: 100,
      isActive: true,
    }
  ],
  criteria: [
    { id: 'crit-1', criteriaSetId: 'cs-1', code: 'C1', name: 'Tính mới, tính sáng tạo', description: 'Giải pháp chưa từng áp dụng.', maxScore: 30, weight: 0.3, sortOrder: 1, isRequired: true, minimumRequiredScore: 15 },
    { id: 'crit-2', criteriaSetId: 'cs-1', code: 'C2', name: 'Khả năng áp dụng thực tiễn', description: 'Dễ triển khai.', maxScore: 20, weight: 0.2, sortOrder: 2, isRequired: true, minimumRequiredScore: 10 },
    { id: 'crit-3', criteriaSetId: 'cs-1', code: 'C3', name: 'Hiệu quả kinh tế - xã hội', description: 'Lợi ích thiết thực.', maxScore: 30, weight: 0.3, sortOrder: 3, isRequired: true, minimumRequiredScore: 15 },
    { id: 'crit-4', criteriaSetId: 'cs-1', code: 'C4', name: 'Phạm vi ảnh hưởng', description: 'Nhân rộng.', maxScore: 20, weight: 0.2, sortOrder: 4, isRequired: true, minimumRequiredScore: 8 },
  ],
  evaluationRounds: [
    {
      id: 'er-1',
      code: 'DOT-Q1-2026',
      name: 'Đợt xét sáng kiến Quý I năm 2026 của Phường A',
      year: 2026,
      departmentId: 'd-3',
      councilId: 'c-1',
      criteriaSetId: 'cs-1',
      status: 'SCORING',
      isScoringFinalized: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'er-xaa',
      code: 'DOT-XAA-2026',
      name: 'Đợt xét sáng kiến năm 2026 của UBND Xã Phường A',
      year: 2026,
      departmentId: 'd-3',
      councilId: 'c-xa-a',
      criteriaSetId: 'cs-1',
      status: 'SCORING',
      isScoringFinalized: false,
      createdAt: new Date().toISOString(),
    }
  ],
  innovationFields: [
    { id: 'field-admin', name: 'Cải cách hành chính', isActive: true },
    { id: 'field-digital', name: 'Chuyển đổi số', isActive: true },
    { id: 'field-education', name: 'Giáo dục và đào tạo', isActive: true },
    { id: 'field-health', name: 'Y tế và chăm sóc sức khỏe', isActive: true },
    { id: 'field-environment', name: 'Môi trường và đô thị', isActive: true },
    { id: 'field-other', name: 'Lĩnh vực khác', isActive: true },
  ],
  innovations: [
    {
      id: 'inv-1',
      evaluationRoundId: 'er-xaa',
      code: 'SK-XAA-001',
      title: 'Hệ thống số hóa thủ tục hộ tịch tại Xã Phường A',
      field: 'Cải cách hành chính',
      solutionDescription: 'Số hóa toàn bộ hồ sơ hộ tịch lưu trữ.',
      applyingOrganization: 'UBND Xã Phường A',
      submitterId: 'u-author1',
      status: 'SCORING',
      createdAt: new Date().toISOString(),
    }
  ],
  innovationAuthors: [
    { id: 'ia-1', innovationId: 'inv-1', userId: 'u-author1', fullName: 'Đỗ Văn Sáng - Cán bộ Xã A', organization: 'UBND Xã Phường A', isMainAuthor: true },
    { id: 'ia-2', innovationId: 'inv-1', userId: 'u-author2', fullName: 'Lê Thị Hà - Cán bộ Xã A', organization: 'UBND Xã Phường A', isMainAuthor: false },
    { id: 'ia-3', innovationId: 'inv-1', userId: 'u-author3', fullName: 'Trần Minh Quân - Cán bộ Xã A', organization: 'UBND Xã Phường A', isMainAuthor: false }
  ],
  innovationAttachments: [
    { id: 'att-1', innovationId: 'inv-1', fileName: 'Mo_ta_sang_kien_chinh_thuc.pdf', originalFileName: 'Mo_ta_sang_kien_chinh_thuc.pdf', fileSize: '2.4 MB', fileType: 'PDF', uploadedBy: 'u-author1', uploadedAt: new Date().toISOString() },
    { id: 'att-2', innovationId: 'inv-1', fileName: 'Bao_cao_hieu_qua_thuc_te.xlsx', originalFileName: 'Bao_cao_hieu_qua_thuc_te.xlsx', fileSize: '1.8 MB', fileType: 'XLSX', uploadedBy: 'u-author1', uploadedAt: new Date().toISOString() }
  ],
  scoringAssignments: [
    { id: 'sa-1', evaluationRoundId: 'er-xaa', innovationId: 'inv-1', userId: 'u-member2', assignedBy: 'u-ward-admin', assignedAt: new Date().toISOString(), deadline: '2026-03-30', status: 'IN_PROGRESS' }
  ],
  scoringSheets: [],
  scoringDetails: [],
  rankingRules: [
    { id: 'rr-1', minScore: 90, maxScore: 100, rankName: 'Loại 1 (Xuất sắc)', badgeColor: 'bg-purple-100 text-purple-800' },
    { id: 'rr-2', minScore: 80, maxScore: 90, rankName: 'Loại 2 (Giỏi)', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'rr-3', minScore: 70, maxScore: 80, rankName: 'Loại 3 (Khá)', badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'rr-4', minScore: 60, maxScore: 70, rankName: 'Khuyến khích', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'rr-5', minScore: 0, maxScore: 60, rankName: 'Chưa đạt', badgeColor: 'bg-rose-100 text-rose-800' },
  ],
  auditLogs: []
};

function migrateDepartmentHierarchy() {
  const departments = db.departments as any[];
  const original = JSON.stringify(db);
  let wards = departments.filter((department) => department.type === 'XA_PHUONG');
  if (wards.length === 0) {
    const ward = {
      id: 'd-3',
      parentId: null,
      code: 'XP-A',
      name: 'UBND Phường A',
      type: 'XA_PHUONG',
      isActive: true,
    };
    departments.push(ward);
    wards = [ward];
  }
  const defaultWard = wards.find((ward) => ward.id === 'd-3') || wards[0];

  for (const department of departments) {
    if (department.type === 'XA_PHUONG') {
      department.parentId = null;
      continue;
    }

    department.type = 'PHONG_BAN_XA_PHUONG';
    if (department.id === 'd-1') {
      department.code = 'VP-UBND-A';
      department.name = 'Văn phòng HĐND và UBND Phường A';
    } else if (department.id === 'd-2') {
      department.code = 'P-KT-A';
      department.name = 'Phòng Kinh tế, Hạ tầng và Đô thị Phường A';
    }

    const parent = departments.find((candidate) => candidate.id === department.parentId);
    if (!parent || parent.type !== 'XA_PHUONG') {
      department.parentId = defaultWard.id;
    }
  }

  const admin = (db.users as any[]).find((user) => user.id === 'u-admin');
  if (admin) {
    admin.fullName = 'Nguyễn Văn Quản Trị Phường A';
    admin.email = 'admin@sangkien.gov.vn';
    admin.position = 'Quản trị hệ thống';
  }

  const council = (db.councils as any[]).find((item) => item.id === 'c-1');
  if (council) {
    council.code = 'HD-2026-XAA';
    council.name = 'Hội đồng xét duyệt sáng kiến Phường A năm 2026';
    council.establishingAuthority = 'Chủ tịch UBND Phường A';
    council.description = 'Hội đồng xét duyệt sáng kiến thuộc Phường A.';
  }

  const criteriaSet = (db.criteriaSets as any[]).find((item) => item.id === 'cs-1');
  if (criteriaSet) criteriaSet.description = 'Áp dụng cho các xã, phường và phòng chuyên môn trực thuộc.';

  const round = (db.evaluationRounds as any[]).find((item) => item.id === 'er-1');
  if (round) {
    round.name = 'Đợt xét sáng kiến Quý I năm 2026 của Phường A';
    round.departmentId = defaultWard.id;
  }

  return original !== JSON.stringify(db);
}

function migrateInnovationFields() {
  const state = db as any;
  const existing = Array.isArray(state.innovationFields) ? state.innovationFields : [];
  const names = new Set(existing.map((field: any) => String(field.name).trim().toLocaleLowerCase('vi')));
  for (const name of new Set((db.innovations as any[]).map(innovation => innovation.field).filter(Boolean))) {
    const normalizedName = String(name).trim().toLocaleLowerCase('vi');
    if (names.has(normalizedName)) continue;
    existing.push({ id: `field-migrated-${existing.length + 1}`, name: String(name).trim(), isActive: true });
    names.add(normalizedName);
  }
  state.innovationFields = existing;
}

function migrateRoleCatalog() {
  const state = db as any;
  const existing = Array.isArray(state.roleCatalog) ? state.roleCatalog : [];
  const existingCodes = new Set(existing.map((role: any) => role.code));
  for (const defaultRole of DEFAULT_ROLE_CATALOG) {
    if (!existingCodes.has(defaultRole.code)) existing.push({ ...defaultRole, permissions: [...defaultRole.permissions] });
  }
  state.roleCatalog = existing;
}

function calculateRank(score: number) {
  for (const rule of db.rankingRules) {
    if (score >= rule.minScore && (rule.maxScore === 100 ? score <= 100 : score < rule.maxScore)) {
      return rule.rankName;
    }
  }
  return 'Chưa đạt';
}

function getDepartmentHierarchyError(type: string, parentId: string | null, departmentId?: string) {
  if (!['XA_PHUONG', 'PHONG_BAN_XA_PHUONG'].includes(type)) {
    return 'Loại đơn vị không hợp lệ.';
  }
  if (type === 'XA_PHUONG') {
    return parentId ? 'Xã / phường không có đơn vị cấp trên trong hệ thống này.' : null;
  }
  if (!parentId || parentId === departmentId) {
    return 'Phòng ban phải trực thuộc một xã / phường.';
  }
  const parent = db.departments.find((department: any) => department.id === parentId);
  return parent?.type === 'XA_PHUONG' ? null : 'Phòng ban chỉ được trực thuộc xã / phường.';
}

function getDepartmentScope(user: any) {
  if (user?.roles?.includes('ADMIN')) return new Set((db.departments as any[]).map(department => department.id));
  const scope = new Set<string>();
  if (!user?.departmentId) return scope;
  scope.add(user.departmentId);
  if (user.roles?.includes('WARD_ADMIN')) {
    let department = (db.departments as any[]).find(item => item.id === user.departmentId);
    while (department?.parentId) {
      department = (db.departments as any[]).find(item => item.id === department.parentId);
    }
    if (department?.type === 'XA_PHUONG') scope.add(department.id);
  }
  let foundChild = true;
  while (foundChild) {
    foundChild = false;
    for (const department of db.departments as any[]) {
      if (department.parentId && scope.has(department.parentId) && !scope.has(department.id)) {
        scope.add(department.id);
        foundChild = true;
      }
    }
  }
  return scope;
}

function isGlobalAdmin(user: any) {
  return Boolean(user?.roles?.includes('ADMIN'));
}

function hasPermission(user: any, permission: string) {
  if (isGlobalAdmin(user)) return true;
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  return ((db as any).roleCatalog as any[]).some(role =>
    userRoles.includes(role.code) && (role.permissions?.includes('*') || role.permissions?.includes(permission))
  );
}

function isUnitAdmin(user: any) {
  return isGlobalAdmin(user) || ['manage_users', 'manage_departments', 'manage_councils', 'manage_rounds', 'manage_assignments'].some(permission => hasPermission(user, permission));
}

function isCouncilChair(user: any, councilId: string) {
  return isGlobalAdmin(user) || db.councilMembers.some(member =>
    member.councilId === councilId && member.userId === user?.id && member.councilRole === 'CHAIRMAN' && member.isActive !== false
  );
}

function canAccessRound(user: any, round: any) {
  if (isGlobalAdmin(user)) return true;
  if (getDepartmentScope(user).has(round.departmentId) && ['view_rounds', 'manage_rounds', 'view_innovations', 'view_repository', 'submit_innovation', 'manage_assignments'].some(permission => hasPermission(user, permission))) return true;
  if (isCouncilChair(user, round.councilId)) return true;
  return db.scoringAssignments.some(assignment => assignment.evaluationRoundId === round.id && assignment.userId === user?.id);
}

function canManageRound(user: any, round: any) {
  return isGlobalAdmin(user) || (hasPermission(user, 'manage_rounds') && getDepartmentScope(user).has(round.departmentId));
}

function canManageCouncil(user: any, councilId: string) {
  if (isGlobalAdmin(user)) return true;
  if (!hasPermission(user, 'manage_councils')) return false;
  const scope = getDepartmentScope(user);
  const council = db.councils.find(item => item.id === councilId);
  const rounds = db.evaluationRounds.filter(round => round.councilId === councilId);
  if (rounds.length) return rounds.every(round => getDepartmentScope(user).has(round.departmentId));
  return Boolean(council?.departmentId && scope.has(council.departmentId));
}

async function startServer() {
  db = await initializeDatabase(db);
  if (migrateDepartmentHierarchy()) {
    await persistDatabase(db);
  }
  migrateInnovationFields();
  migrateRoleCatalog();
  await persistDatabase(db);

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400) {
        persistDatabase(db).catch((error) => console.error('Failed to persist PostgreSQL state:', error));
      }
    });
    next();
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = authenticateUser(db.users, username, password);

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const sessionId = randomBytes(32).toString('hex');
    sessions.set(sessionId, user.id);
    res.setHeader('Set-Cookie', `sk_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.json({ user: sanitizeUser(user) });
  });

  app.get('/api/session', (req, res) => {
    const sessionId = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('sk_session='))?.slice('sk_session='.length);
    const userId = sessionId ? sessions.get(sessionId) : null;
    const user = db.users.find(item => item.id === userId);
    if (!user) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.' });
    return res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/logout', (req, res) => {
    const sessionId = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('sk_session='))?.slice('sk_session='.length);
    if (sessionId) sessions.delete(sessionId);
    res.setHeader('Set-Cookie', 'sk_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    res.json({ success: true });
  });

  app.use('/api', (req, res, next) => {
    const sessionId = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('sk_session='))?.slice('sk_session='.length);
    const userId = sessionId ? sessions.get(sessionId) : null;
    const user = db.users.find(item => item.id === userId);
    if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
    (req as any).user = user;
    next();
  });

  app.get('/api/roles', (req, res) => res.json((db as any).roleCatalog));
  app.post('/api/roles', (req, res) => {
    if (!isGlobalAdmin((req as any).user)) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được quản lý vai trò.' });
    const { code, name, description, permissions } = req.body || {};
    const normalizedCode = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const normalizedName = String(name || '').trim();
    if (!normalizedCode || !normalizedName) return res.status(400).json({ error: 'Mã và tên vai trò là bắt buộc.' });
    if ((db as any).roleCatalog.some((role: any) => role.code === normalizedCode)) return res.status(409).json({ error: 'Mã vai trò đã tồn tại.' });
    const allowed = new Set(AVAILABLE_PERMISSIONS.map(permission => permission.code));
    const safePermissions = [...new Set((Array.isArray(permissions) ? permissions : []).filter((permission: string) => allowed.has(permission)))];
    if (safePermissions.includes('manage_roles')) return res.status(400).json({ error: 'Quản lý vai trò chỉ dành cho ADMIN toàn hệ thống.' });
    const role = { code: normalizedCode, name: normalizedName, description: String(description || '').trim(), permissions: safePermissions, protected: false };
    (db as any).roleCatalog.push(role);
    res.status(201).json(role);
  });
  app.put('/api/roles/:code', (req, res) => {
    if (!isGlobalAdmin((req as any).user)) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được quản lý vai trò.' });
    const role = (db as any).roleCatalog.find((item: any) => item.code === req.params.code);
    if (!role) return res.status(404).json({ error: 'Không tìm thấy vai trò.' });
    if (role.code === 'ADMIN') return res.status(403).json({ error: 'Không thể thay đổi quyền ADMIN toàn hệ thống.' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Tên vai trò là bắt buộc.' });
    const allowed = new Set(AVAILABLE_PERMISSIONS.map(permission => permission.code));
    const permissions = [...new Set((Array.isArray(req.body?.permissions) ? req.body.permissions : []).filter((permission: string) => allowed.has(permission)))];
    if (permissions.includes('manage_roles')) return res.status(400).json({ error: 'Quản lý vai trò chỉ dành cho ADMIN toàn hệ thống.' });
    role.name = name;
    role.description = String(req.body?.description || '').trim();
    role.permissions = permissions;
    res.json(role);
  });
  app.delete('/api/roles/:code', (req, res) => {
    if (!isGlobalAdmin((req as any).user)) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được quản lý vai trò.' });
    const roles = (db as any).roleCatalog;
    const role = roles.find((item: any) => item.code === req.params.code);
    if (!role) return res.status(404).json({ error: 'Không tìm thấy vai trò.' });
    if (role.protected || role.code === 'ADMIN') return res.status(403).json({ error: 'Không thể xóa vai trò hệ thống.' });
    if (db.users.some(user => user.roles.includes(role.code))) return res.status(409).json({ error: 'Vai trò đang được gán cho người dùng.' });
    (db as any).roleCatalog = roles.filter((item: any) => item.code !== role.code);
    res.json({ success: true });
  });

  // --- USERS ---
  app.get('/api/users', (req, res) => {
    const scope = getDepartmentScope((req as any).user);
    res.json(db.users.filter(user => scope.has(user.departmentId)).map((user: any) => sanitizeUser(user)));
  });
  app.post('/api/users', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'manage_users')) return res.status(403).json({ error: 'Bạn không có quyền tạo người dùng.' });
    const payload = req.body || {};
    const requestedRoles = Array.isArray(payload.roles) ? payload.roles : String(payload.roles || '').split(',').map((role: string) => role.trim());
    const knownRoles = new Set(((db as any).roleCatalog as any[]).map(role => role.code));
    if (requestedRoles.some((role: string) => !knownRoles.has(role))) return res.status(400).json({ error: 'Có vai trò không tồn tại.' });
    if (!getDepartmentScope(actor).has(payload.departmentId)) return res.status(403).json({ error: 'Không thể tạo người dùng ngoài phạm vi đơn vị.' });
    if (!isGlobalAdmin(actor) && requestedRoles.includes('ADMIN')) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được cấp quyền ADMIN.' });
    const newUser = {
      id: 'u-' + Date.now(),
      createdAt: new Date().toISOString(),
      password: payload.password || '123456',
      isActive: true,
      ...payload,
      roles: Array.isArray(payload.roles) ? payload.roles : (payload.roles ? payload.roles.split(',').map((r: string) => r.trim()).filter(Boolean) : ['SUBMITTER'])
    };
    db.users.push(newUser);
    res.status(201).json(sanitizeUser(newUser));
  });
  app.put('/api/users/:id', (req, res) => {
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const actor = (req as any).user;
    const scope = getDepartmentScope(actor);
    if (!hasPermission(actor, 'manage_users') || !scope.has(db.users[idx].departmentId)) return res.status(403).json({ error: 'Không có quyền sửa người dùng ngoài phạm vi đơn vị.' });
    if (!isGlobalAdmin(actor) && db.users[idx].roles?.includes('ADMIN')) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được sửa tài khoản ADMIN.' });
    const payload = req.body || {};
    const requestedRoles = Array.isArray(payload.roles) ? payload.roles : String(payload.roles || '').split(',').map((role: string) => role.trim());
    const knownRoles = new Set(((db as any).roleCatalog as any[]).map(role => role.code));
    if (requestedRoles.some((role: string) => !knownRoles.has(role))) return res.status(400).json({ error: 'Có vai trò không tồn tại.' });
    if (payload.departmentId && !scope.has(payload.departmentId)) return res.status(403).json({ error: 'Không thể chuyển người dùng ra ngoài phạm vi đơn vị.' });
    if (!isGlobalAdmin(actor) && requestedRoles.includes('ADMIN')) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được cấp quyền ADMIN.' });
    db.users[idx] = {
      ...db.users[idx],
      ...payload,
      roles: Array.isArray(payload.roles) ? payload.roles : (payload.roles ? payload.roles.split(',').map((r: string) => r.trim()).filter(Boolean) : db.users[idx].roles),
      password: payload.password || db.users[idx].password || '123456',
    };
    res.json(sanitizeUser(db.users[idx]));
  });
  app.delete('/api/users/:id', (req, res) => {
    const actor = (req as any).user;
    const target = db.users.find(user => user.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });
    if (!hasPermission(actor, 'manage_users') || !getDepartmentScope(actor).has(target.departmentId)) return res.status(403).json({ error: 'Không có quyền xóa người dùng ngoài phạm vi đơn vị.' });
    if (!isGlobalAdmin(actor) && target.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được xóa tài khoản ADMIN.' });
    db.users = db.users.filter(u => u.id !== req.params.id);
    res.json({ success: true });
  });

  // --- DEPARTMENTS ---
  app.get('/api/departments', (req, res) => {
    const scope = getDepartmentScope((req as any).user);
    res.json(db.departments.filter(department => scope.has(department.id)));
  });
  app.post('/api/departments', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'manage_departments')) return res.status(403).json({ error: 'Bạn không có quyền tạo đơn vị.' });
    const type = req.body?.type;
    const parentId = req.body?.parentId || null;
    if (type === 'XA_PHUONG' && !isGlobalAdmin(actor)) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được tạo xã / phường gốc.' });
    if (parentId && !getDepartmentScope(actor).has(parentId)) return res.status(403).json({ error: 'Đơn vị cấp trên nằm ngoài phạm vi quản lý.' });
    const hierarchyError = getDepartmentHierarchyError(type, parentId);
    if (hierarchyError) return res.status(400).json({ error: hierarchyError });
    const newDept = { ...req.body, id: 'd-' + Date.now(), parentId };
    db.departments.push(newDept);
    res.status(201).json(newDept);
  });
  app.put('/api/departments/:id', (req, res) => {
    const idx = db.departments.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const actor = (req as any).user;
    const scope = getDepartmentScope(actor);
    if (!hasPermission(actor, 'manage_departments') || !scope.has(req.params.id)) return res.status(403).json({ error: 'Không có quyền sửa đơn vị ngoài phạm vi quản lý.' });
    const current = db.departments[idx];
    const type = req.body?.type || current.type;
    if (type === 'XA_PHUONG' && current.type !== 'XA_PHUONG' && !isGlobalAdmin(actor)) return res.status(403).json({ error: 'Chỉ ADMIN toàn hệ thống được tạo đơn vị xã / phường gốc.' });
    const parentId = type === 'XA_PHUONG' ? null : (req.body?.parentId || current.parentId || null);
    const hierarchyError = getDepartmentHierarchyError(type, parentId, req.params.id);
    if (hierarchyError) return res.status(400).json({ error: hierarchyError });
    if (parentId && !scope.has(parentId)) return res.status(403).json({ error: 'Đơn vị cấp trên nằm ngoài phạm vi quản lý.' });
    if (type !== 'XA_PHUONG' && db.departments.some((department: any) => department.parentId === req.params.id)) {
      return res.status(400).json({ error: 'Hãy chuyển các phòng trực thuộc trước khi đổi loại đơn vị.' });
    }
    db.departments[idx] = { ...current, ...req.body, type, parentId };
    res.json(db.departments[idx]);
  });
  app.delete('/api/departments/:id', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'manage_departments') || !getDepartmentScope(actor).has(req.params.id)) return res.status(403).json({ error: 'Không có quyền xóa đơn vị ngoài phạm vi quản lý.' });
    if (db.departments.some((department: any) => department.parentId === req.params.id)) {
      return res.status(400).json({ error: 'Hãy chuyển đơn vị trực thuộc sang đơn vị khác trước khi xóa.' });
    }
    db.departments = db.departments.filter(d => d.id !== req.params.id);
    res.json({ success: true });
  });

  // --- COUNCILS ---
  app.get('/api/councils', (req, res) => {
    const actor = (req as any).user;
    const accessibleCouncilIds = new Set(db.evaluationRounds.filter(round => canAccessRound(actor, round)).map(round => round.councilId));
    const departmentScope = getDepartmentScope(actor);
    db.councils.forEach(council => {
      if (isGlobalAdmin(actor) || (council.departmentId && departmentScope.has(council.departmentId))) accessibleCouncilIds.add(council.id);
    });
    const councilsWithMembers = db.councils.filter(c => accessibleCouncilIds.has(c.id)).map(c => {
      const mayViewAllMembers = isGlobalAdmin(actor) || isCouncilChair(actor, c.id);
      const canManageMembers = canManageCouncil(actor, c.id);
      return {
        ...c,
        members: db.councilMembers.filter(cm => {
          if (cm.councilId !== c.id) return false;
          const member = db.users.find(user => user.id === cm.userId);
          return mayViewAllMembers || cm.userId === actor.id || (canManageMembers && departmentScope.has(member?.departmentId));
        }).map(cm => ({
          ...cm,
          user: sanitizeUser(db.users.find(u => u.id === cm.userId))
        }))
      };
    });
    res.json(councilsWithMembers);
  });
  app.post('/api/councils', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'manage_councils')) return res.status(403).json({ error: 'Bạn không có quyền tạo hội đồng.' });
    const councilId = 'c-' + Date.now();
    const departmentId = isGlobalAdmin(actor) ? (req.body?.departmentId || null) : actor.departmentId;
    if (departmentId && !getDepartmentScope(actor).has(departmentId)) return res.status(403).json({ error: 'Đơn vị hội đồng nằm ngoài phạm vi quản lý.' });
    const newCouncil = { ...req.body, id: councilId, departmentId, createdAt: new Date().toISOString() };
    db.councils.push(newCouncil);
    res.status(201).json(newCouncil);
  });
  app.put('/api/councils/:id', (req, res) => {
    const idx = db.councils.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const actor = (req as any).user;
    if (!canManageCouncil(actor, req.params.id)) return res.status(403).json({ error: 'Không có quyền sửa hội đồng ngoài phạm vi đơn vị.' });
    const departmentId = isGlobalAdmin(actor) ? (req.body?.departmentId ?? db.councils[idx].departmentId) : db.councils[idx].departmentId;
    db.councils[idx] = { ...db.councils[idx], ...req.body, departmentId };
    res.json(db.councils[idx]);
  });
  app.delete('/api/councils/:id', (req, res) => {
    const actor = (req as any).user;
    if (!canManageCouncil(actor, req.params.id)) return res.status(403).json({ error: 'Không có quyền xóa hội đồng ngoài phạm vi đơn vị.' });
    db.councils = db.councils.filter(c => c.id !== req.params.id);
    db.councilMembers = db.councilMembers.filter(cm => cm.councilId !== req.params.id);
    res.json({ success: true });
  });
  app.post('/api/councils/:id/members', (req, res) => {
    const actor = (req as any).user;
    if (!canManageCouncil(actor, req.params.id)) return res.status(403).json({ error: 'Không có quyền sửa thành viên hội đồng ngoài phạm vi đơn vị.' });
    if (!getDepartmentScope(actor).has(db.users.find(user => user.id === req.body?.userId)?.departmentId)) return res.status(403).json({ error: 'Thành viên phải thuộc phạm vi đơn vị quản lý.' });
    const newMember = { id: 'cm-' + Date.now(), councilId: req.params.id, ...req.body, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true };
    db.councilMembers.push(newMember);
    res.status(201).json(newMember);
  });
  app.delete('/api/councils/:id/members/:memberId', (req, res) => {
    const actor = (req as any).user;
    if (!canManageCouncil(actor, req.params.id)) return res.status(403).json({ error: 'Không có quyền sửa thành viên hội đồng ngoài phạm vi đơn vị.' });
    if (!db.councilMembers.some(member => member.id === req.params.memberId && member.councilId === req.params.id)) return res.status(404).json({ error: 'Không tìm thấy thành viên hội đồng.' });
    db.councilMembers = db.councilMembers.filter(cm => cm.id !== req.params.memberId);
    res.json({ success: true });
  });

  // --- CRITERIA SETS & CRITERIA CRUD ---
  app.get('/api/criteria-sets', (req, res) => {
    const sets = db.criteriaSets.map(cs => ({ ...cs, criteria: db.criteria.filter(c => c.criteriaSetId === cs.id) }));
    res.json(sets);
  });
  app.post('/api/criteria-sets', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_criteria')) return res.status(403).json({ error: 'Bạn không có quyền sửa bộ tiêu chí.' });
    const csId = 'cs-' + Date.now();
    const { criteria, ...data } = req.body;
    const newSet = { id: csId, version: 1, ...data };
    db.criteriaSets.push(newSet);

    if (criteria && Array.isArray(criteria)) {
      criteria.forEach((crit: any, idx: number) => {
        db.criteria.push({
          id: 'crit-' + Date.now() + '-' + idx,
          criteriaSetId: csId,
          code: crit.code || `C${idx+1}`,
          name: crit.name,
          description: crit.description || '',
          maxScore: Number(crit.maxScore) || 25,
          weight: Number(crit.weight) || 0.25,
          sortOrder: idx + 1,
          isRequired: true,
          minimumRequiredScore: Number(crit.minimumRequiredScore) || 10
        });
      });
    }
    res.status(201).json(newSet);
  });
  app.put('/api/criteria-sets/:id', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_criteria')) return res.status(403).json({ error: 'Bạn không có quyền sửa bộ tiêu chí.' });
    const csId = req.params.id;
    const idx = db.criteriaSets.findIndex(cs => cs.id === csId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const { criteria, ...data } = req.body;
    db.criteriaSets[idx] = { ...db.criteriaSets[idx], ...data };

    if (criteria && Array.isArray(criteria)) {
      db.criteria = db.criteria.filter(c => c.criteriaSetId !== csId);
      criteria.forEach((crit: any, idx: number) => {
        db.criteria.push({
          id: crit.id || 'crit-' + Date.now() + '-' + idx,
          criteriaSetId: csId,
          code: crit.code || `C${idx+1}`,
          name: crit.name,
          description: crit.description || '',
          maxScore: Number(crit.maxScore) || 25,
          weight: Number(crit.weight) || 0.25,
          sortOrder: idx + 1,
          isRequired: true,
          minimumRequiredScore: Number(crit.minimumRequiredScore) || 10
        });
      });
    }
    res.json(db.criteriaSets[idx]);
  });
  app.delete('/api/criteria-sets/:id', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_criteria')) return res.status(403).json({ error: 'Bạn không có quyền sửa bộ tiêu chí.' });
    const csId = req.params.id;
    db.criteriaSets = db.criteriaSets.filter(cs => cs.id !== csId);
    db.criteria = db.criteria.filter(c => c.criteriaSetId !== csId);
    res.json({ success: true });
  });

  // --- RANKING RULES ---
  app.get('/api/ranking-rules', (req, res) => res.json(db.rankingRules));
  app.post('/api/ranking-rules', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_ranking')) return res.status(403).json({ error: 'Bạn không có quyền sửa quy tắc xếp loại.' });
    const newRule = { id: 'rr-' + Date.now(), ...req.body };
    db.rankingRules.push(newRule);
    res.status(201).json(newRule);
  });
  app.put('/api/ranking-rules/:id', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_ranking')) return res.status(403).json({ error: 'Bạn không có quyền sửa quy tắc xếp loại.' });
    const idx = db.rankingRules.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.rankingRules[idx] = { ...db.rankingRules[idx], ...req.body };
    res.json(db.rankingRules[idx]);
  });
  app.delete('/api/ranking-rules/:id', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_ranking')) return res.status(403).json({ error: 'Bạn không có quyền sửa quy tắc xếp loại.' });
    db.rankingRules = db.rankingRules.filter(r => r.id !== req.params.id);
    res.json({ success: true });
  });

  // --- EVALUATION ROUNDS ---
  app.get('/api/evaluation-rounds', (req, res) => {
    const { departmentId } = req.query;
    const actor = (req as any).user;
    if (!hasPermission(actor, 'view_rounds') && !hasPermission(actor, 'manage_rounds') && !hasPermission(actor, 'score_assigned')) return res.json([]);
    let rounds = db.evaluationRounds.filter(round => canAccessRound(actor, round));
    if (departmentId) {
      if (!getDepartmentScope(actor).has(String(departmentId))) return res.status(403).json({ error: 'Đơn vị nằm ngoài phạm vi dữ liệu.' });
      rounds = rounds.filter(er => er.departmentId === departmentId);
    }
    const resRounds = rounds.map(er => ({
      ...er,
      council: db.councils.find(c => c.id === er.councilId),
      criteriaSet: db.criteriaSets.find(cs => cs.id === er.criteriaSetId),
      department: db.departments.find(d => d.id === er.departmentId)
    }));
    res.json(resRounds);
  });

  app.post('/api/evaluation-rounds', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'manage_rounds')) return res.status(403).json({ error: 'Bạn không có quyền tạo đợt xét.' });
    if (!getDepartmentScope(actor).has(req.body?.departmentId)) return res.status(403).json({ error: 'Không thể tạo đợt xét ngoài phạm vi đơn vị.' });
    const council = db.councils.find(item => item.id === req.body?.councilId);
    if (!council) return res.status(400).json({ error: 'Hội đồng không hợp lệ.' });
    if (!canManageCouncil(actor, council.id)) {
      return res.status(403).json({ error: 'Hội đồng nằm ngoài phạm vi quản lý.' });
    }
    const roundId = 'er-' + Date.now();
    const newRound = { id: roundId, status: 'SCORING', isScoringFinalized: false, createdAt: new Date().toISOString(), ...req.body };
    db.evaluationRounds.push(newRound);
    res.status(201).json(newRound);
  });

  app.put('/api/evaluation-rounds/:id', (req, res) => {
    const round = db.evaluationRounds.find(item => item.id === req.params.id);
    if (!round) return res.status(404).json({ error: 'Không tìm thấy đợt xét.' });
    const actor = (req as any).user;
    if (!canManageRound(actor, round)) return res.status(403).json({ error: 'Bạn không có quyền sửa đợt xét này.' });
    if (round.isScoringFinalized) return res.status(400).json({ error: 'Đợt đã duyệt, không thể sửa.' });

    const { code, name, year, description } = req.body || {};
    if (!code?.trim() || !name?.trim() || !Number.isFinite(Number(year))) {
      return res.status(400).json({ error: 'Mã, tên và năm đợt xét là bắt buộc.' });
    }
    Object.assign(round, { code: code.trim(), name: name.trim(), year: Number(year), description: description || '' });
    res.json(round);
  });

  app.delete('/api/evaluation-rounds/:id', (req, res) => {
    const roundIndex = db.evaluationRounds.findIndex(item => item.id === req.params.id);
    if (roundIndex === -1) return res.status(404).json({ error: 'Không tìm thấy đợt xét.' });
    const round = db.evaluationRounds[roundIndex];
    if (!canManageRound((req as any).user, round)) return res.status(403).json({ error: 'Bạn không có quyền xóa đợt xét này.' });

    const innovationIds = new Set(db.innovations.filter(item => item.evaluationRoundId === round.id).map(item => item.id));
    const sheetIds = new Set(db.scoringSheets.filter(item => item.evaluationRoundId === round.id).map(item => item.id));
    db.scoringDetails = db.scoringDetails.filter(detail => !sheetIds.has(detail.scoringSheetId));
    db.scoringSheets = db.scoringSheets.filter(sheet => !sheetIds.has(sheet.id));
    db.scoringAssignments = db.scoringAssignments.filter(assignment => assignment.evaluationRoundId !== round.id);
    db.innovationAuthors = db.innovationAuthors.filter(author => !innovationIds.has(author.innovationId));
    db.innovationAttachments = db.innovationAttachments.filter(attachment => !innovationIds.has(attachment.innovationId));
    db.innovations = db.innovations.filter(innovation => !innovationIds.has(innovation.id));
    db.evaluationRounds.splice(roundIndex, 1);
    res.json({ success: true, deletedInnovations: innovationIds.size, deletedSheets: sheetIds.size });
  });

  app.post('/api/evaluation-rounds/:id/finalize-scoring', (req, res) => {
    const round = db.evaluationRounds.find(er => er.id === req.params.id);
    if (!round) return res.status(404).json({ error: 'Not found' });
    if (!canManageRound((req as any).user, round)) return res.status(403).json({ error: 'Bạn không có quyền duyệt đợt xét này.' });
    round.isScoringFinalized = true;
    round.status = 'COUNCIL_REVIEW';
    res.json({ success: true, message: 'Đã chốt dữ liệu chấm cho đơn vị thành công!' });
  });

  app.get('/api/innovation-fields', (req, res) => {
    res.json((db as any).innovationFields.filter((field: any) => field.isActive !== false));
  });
  app.post('/api/innovation-fields', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_fields')) return res.status(403).json({ error: 'Bạn không có quyền quản lý lĩnh vực.' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Tên lĩnh vực không được để trống.' });
    if ((db as any).innovationFields.some((field: any) => field.name.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      return res.status(409).json({ error: 'Lĩnh vực này đã tồn tại.' });
    }
    const field = { id: 'field-' + Date.now(), name, isActive: true };
    (db as any).innovationFields.push(field);
    res.status(201).json(field);
  });
  app.put('/api/innovation-fields/:id', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_fields')) return res.status(403).json({ error: 'Bạn không có quyền quản lý lĩnh vực.' });
    const field = (db as any).innovationFields.find((item: any) => item.id === req.params.id);
    if (!field) return res.status(404).json({ error: 'Không tìm thấy lĩnh vực.' });
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Tên lĩnh vực không được để trống.' });
    if ((db as any).innovationFields.some((item: any) => item.id !== field.id && item.name.toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi'))) {
      return res.status(409).json({ error: 'Lĩnh vực này đã tồn tại.' });
    }
    const previousName = field.name;
    field.name = name;
    db.innovations.forEach(innovation => {
      if (innovation.field === previousName) innovation.field = name;
    });
    res.json(field);
  });
  app.delete('/api/innovation-fields/:id', (req, res) => {
    if (!hasPermission((req as any).user, 'manage_fields')) return res.status(403).json({ error: 'Bạn không có quyền quản lý lĩnh vực.' });
    const field = (db as any).innovationFields.find((item: any) => item.id === req.params.id);
    if (!field) return res.status(404).json({ error: 'Không tìm thấy lĩnh vực.' });
    if (db.innovations.some(innovation => innovation.field === field.name)) {
      return res.status(409).json({ error: 'Lĩnh vực đang được sáng kiến sử dụng, không thể xóa.' });
    }
    (db as any).innovationFields = (db as any).innovationFields.filter((item: any) => item.id !== field.id);
    res.json({ success: true });
  });

  // --- INNOVATIONS (WITH UP TO 3 AUTHORS AND REAL FILE ATTACHMENTS) ---
  app.get('/api/innovations', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'view_innovations') && !hasPermission(actor, 'view_repository')) return res.json([]);
    const scope = getDepartmentScope(actor);
    const innovations = db.innovations.filter(inv => {
      const round = db.evaluationRounds.find(item => item.id === inv.evaluationRoundId);
      const explicitlyAssigned = db.scoringAssignments.some(assignment => assignment.innovationId === inv.id && assignment.userId === actor.id);
      return round && (scope.has(round.departmentId) || isGlobalAdmin(actor) || isCouncilChair(actor, round.councilId) || explicitlyAssigned);
    }).map(inv => {
      const round = db.evaluationRounds.find(er => er.id === inv.evaluationRoundId);
      const mayViewAllScores = isGlobalAdmin(actor) || (hasPermission(actor, 'view_all_scores') && scope.has(round?.departmentId)) || isCouncilChair(actor, round?.councilId);
      const sheets = mayViewAllScores
        ? db.scoringSheets.filter(ss => ss.innovationId === inv.id && ss.status === 'SUBMITTED')
        : db.scoringSheets.filter(ss => ss.innovationId === inv.id && ss.userId === actor.id && ss.status === 'SUBMITTED');
      const avgScore = sheets.length > 0 ? sheets.reduce((acc, curr) => acc + curr.totalScore, 0) / sheets.length : null;
      const rank = avgScore !== null ? calculateRank(avgScore) : 'Chưa chấm';
      return {
        ...inv,
        evaluationRound: db.evaluationRounds.find(er => er.id === inv.evaluationRoundId),
        submitter: sanitizeUser(db.users.find(u => u.id === inv.submitterId)),
        authors: db.innovationAuthors.filter(ia => ia.innovationId === inv.id),
        attachments: db.innovationAttachments.filter(att => att.innovationId === inv.id),
        averageScore: mayViewAllScores && avgScore !== null ? Number(avgScore.toFixed(2)) : null,
        rankResult: mayViewAllScores ? rank : 'Chưa chấm'
      };
    });
    res.json(innovations);
  });

  app.post('/api/innovations', (req, res) => {
    const { authors, attachments, ...invData } = req.body;
    const actor = (req as any).user;
    if (!hasPermission(actor, 'submit_innovation')) return res.status(403).json({ error: 'Bạn không có quyền nộp sáng kiến.' });
    const round = db.evaluationRounds.find(item => item.id === invData.evaluationRoundId);
    if (!round || !getDepartmentScope(actor).has(round.departmentId)) return res.status(403).json({ error: 'Không thể nộp sáng kiến ngoài phạm vi đơn vị.' });
    if (round.status !== 'SCORING' || round.isScoringFinalized) return res.status(400).json({ error: 'Chỉ được nộp sáng kiến vào đợt đang mở.' });
    if (!(db as any).innovationFields.some((field: any) => field.name === invData.field && field.isActive !== false)) {
      return res.status(400).json({ error: 'Vui lòng chọn một lĩnh vực hợp lệ.' });
    }
    if (authors && Array.isArray(authors) && authors.length > 3) {
      return res.status(400).json({ error: 'Mỗi sáng kiến tối đa 3 tác giả!' });
    }
    const scope = getDepartmentScope(actor);
    if (authors?.some((author: any) => author.userId && !scope.has(db.users.find(user => user.id === author.userId)?.departmentId))) {
      return res.status(400).json({ error: 'Tác giả phải thuộc đơn vị của bạn hoặc đơn vị trực thuộc.' });
    }
    const invId = 'inv-' + Date.now();
    const newInv = { id: invId, code: `SK-${Math.floor(100 + Math.random()*900)}`, status: 'SUBMITTED', createdAt: new Date().toISOString(), ...invData, submitterId: actor.id };
    db.innovations.push(newInv);

    if (authors && Array.isArray(authors)) {
      authors.forEach((auth: any, idx: number) => {
        db.innovationAuthors.push({
          id: 'ia-' + Date.now() + '-' + idx,
          innovationId: invId,
          userId: auth.userId || null,
          fullName: auth.fullName,
          organization: auth.organization || '',
          isMainAuthor: idx === 0
        });
      });
    }

    if (attachments && Array.isArray(attachments)) {
      attachments.forEach((att: any, idx: number) => {
        db.innovationAttachments.push({
          id: 'att-' + Date.now() + '-' + idx,
          innovationId: invId,
          fileName: att.fileName || 'tai_lieu_dinh_kem.pdf',
          originalFileName: att.originalFileName || att.fileName || 'tai_lieu.pdf',
          fileSize: att.fileSize || '1.5 MB',
          fileType: att.fileType || 'PDF',
          uploadedBy: actor.id,
          uploadedAt: new Date().toISOString()
        });
      });
    }

    res.status(201).json(newInv);
  });

  // --- SCORING ---
  app.get('/api/scoring-assignments', (req, res) => {
    const actor = (req as any).user;
    const assignments = db.scoringAssignments.filter(assignment => {
      const round = db.evaluationRounds.find(item => item.id === assignment.evaluationRoundId);
      if (!round || !canAccessRound(actor, round)) return false;
      return isGlobalAdmin(actor) || (hasPermission(actor, 'view_all_scores') && getDepartmentScope(actor).has(round.departmentId)) || isCouncilChair(actor, round.councilId) || assignment.userId === actor.id;
    }).map(sa => ({
      ...sa,
      innovation: db.innovations.find(i => i.id === sa.innovationId),
      user: sanitizeUser(db.users.find(u => u.id === sa.userId)),
      evaluationRound: db.evaluationRounds.find(er => er.id === sa.evaluationRoundId)
    }));
    res.json(assignments);
  });

  const isInnovationParticipant = (innovation: any, userId: string) =>
    innovation.submitterId === userId ||
    db.innovationAuthors.some(author => author.innovationId === innovation.id && author.userId === userId);

  app.post('/api/scoring-assignments/bulk', (req, res) => {
    const { evaluationRoundId, innovationId, deadline } = req.body || {};
    const actor = (req as any).user;
    const round = db.evaluationRounds.find(er => er.id === evaluationRoundId);
    if (!round) return res.status(404).json({ error: 'Không tìm thấy đợt xét.' });
    if (!isGlobalAdmin(actor) && (!hasPermission(actor, 'manage_assignments') || !getDepartmentScope(actor).has(round.departmentId))) return res.status(403).json({ error: 'Bạn không có quyền phân công ngoài phạm vi đơn vị.' });
    if (round.isScoringFinalized) return res.status(400).json({ error: 'Đợt xét đã chốt, không thể phân công thêm.' });

    const innovation = db.innovations.find(item => item.id === innovationId);
    if (!innovation || innovation.evaluationRoundId !== evaluationRoundId) {
      return res.status(400).json({ error: 'Sáng kiến không thuộc đợt xét đã chọn.' });
    }

    const councilMembers = db.councilMembers.filter(member =>
      member.councilId === round.councilId && member.isActive !== false && !isInnovationParticipant(innovation, member.userId)
    );
    if (councilMembers.length === 0) {
      return res.status(400).json({ error: 'Không có thành viên hội đồng phù hợp để chấm sáng kiến này.' });
    }

    const newAssignments = councilMembers
      .filter(member => !db.scoringAssignments.some(assignment =>
        assignment.evaluationRoundId === evaluationRoundId && assignment.innovationId === innovationId && assignment.userId === member.userId
      ))
      .map((member, index) => ({
        id: `sa-${Date.now()}-${index}`,
        evaluationRoundId,
        innovationId,
        userId: member.userId,
        assignedBy: actor.id,
        assignedAt: new Date().toISOString(),
        deadline: deadline || null,
        status: 'ASSIGNED',
      }));

    db.scoringAssignments.push(...newAssignments);
    res.status(201).json({
      created: newAssignments.length,
      skipped: councilMembers.length - newAssignments.length,
      excludedParticipants: db.councilMembers.filter(member =>
        member.councilId === round.councilId && member.isActive !== false && isInnovationParticipant(innovation, member.userId)
      ).length,
      assignments: newAssignments,
    });
  });

  app.post('/api/scoring-assignments', (req, res) => {
    const { evaluationRoundId, deadline } = req.body || {};
    const innovationIds = [...new Set(req.body?.innovationIds || [req.body?.innovationId].filter(Boolean))];
    const userIds = [...new Set(req.body?.userIds || [req.body?.userId].filter(Boolean))];
    const actor = (req as any).user;
    const round = db.evaluationRounds.find(er => er.id === evaluationRoundId);
    if (!round) return res.status(404).json({ error: 'Không tìm thấy đợt xét.' });
    if (!isGlobalAdmin(actor) && (!hasPermission(actor, 'manage_assignments') || !getDepartmentScope(actor).has(round.departmentId))) return res.status(403).json({ error: 'Bạn không có quyền phân công ngoài phạm vi đơn vị.' });
    if (round.isScoringFinalized) return res.status(400).json({ error: 'Đợt xét đã chốt, không thể phân công thêm.' });
    if (!innovationIds.length || !userIds.length) return res.status(400).json({ error: 'Chọn ít nhất một sáng kiến và một thành viên.' });

    const selectedInnovations = innovationIds.map(innovationId => db.innovations.find(item => item.id === innovationId));
    if (selectedInnovations.some(innovation => !innovation || innovation.evaluationRoundId !== evaluationRoundId)) {
      return res.status(400).json({ error: 'Có sáng kiến không thuộc đợt xét đã chọn.' });
    }
    const councilMemberIds = new Set(db.councilMembers.filter(member =>
      member.councilId === round.councilId && member.isActive !== false
    ).map(member => member.userId));
    if (userIds.some(userId => !councilMemberIds.has(userId))) {
      return res.status(400).json({ error: 'Có người được chọn không thuộc hội đồng hoặc đã ngừng hoạt động.' });
    }

    const newAssignments: any[] = [];
    let skipped = 0;
    let excludedParticipants = 0;
    for (const innovation of selectedInnovations as any[]) {
      for (const userId of userIds) {
        if (isInnovationParticipant(innovation, userId)) {
          excludedParticipants++;
          continue;
        }
        const alreadyAssigned = db.scoringAssignments.some(assignment =>
          assignment.evaluationRoundId === evaluationRoundId && assignment.innovationId === innovation.id && assignment.userId === userId
        );
        if (alreadyAssigned) {
          skipped++;
          continue;
        }
        newAssignments.push({
          id: `sa-${Date.now()}-${newAssignments.length}`,
          evaluationRoundId,
          innovationId: innovation.id,
          userId,
          assignedBy: actor.id,
          assignedAt: new Date().toISOString(),
          deadline: deadline || null,
          status: 'ASSIGNED',
        });
      }
    }

    db.scoringAssignments.push(...newAssignments);
    res.status(201).json({ created: newAssignments.length, skipped, excludedParticipants, assignments: newAssignments });
  });

  app.get('/api/scoring-sheets', (req, res) => {
    const actor = (req as any).user;
    const sheets = db.scoringSheets.filter(sheet => {
      const round = db.evaluationRounds.find(item => item.id === sheet.evaluationRoundId);
      if (!round || !canAccessRound(actor, round)) return false;
      return isGlobalAdmin(actor) || (hasPermission(actor, 'view_all_scores') && getDepartmentScope(actor).has(round.departmentId)) || isCouncilChair(actor, round.councilId) || sheet.userId === actor.id;
    }).map(ss => ({
      ...ss,
      details: db.scoringDetails.filter(sd => sd.scoringSheetId === ss.id),
      innovation: db.innovations.find(i => i.id === ss.innovationId),
      user: sanitizeUser(db.users.find(u => u.id === ss.userId))
    }));
    res.json(sheets);
  });

  app.post('/api/scoring-sheets', (req, res) => {
    const { assignmentId, innovationId, evaluationRoundId, userId, details, generalComment, recommendation, status } = req.body;
    const actor = (req as any).user;
    if (!hasPermission(actor, 'score_assigned')) return res.status(403).json({ error: 'Vai trò của bạn không có quyền chấm điểm.' });
    const assignment = db.scoringAssignments.find(item => item.id === assignmentId);
    if (!assignment || assignment.userId !== actor.id) return res.status(403).json({ error: 'Chỉ người được phân công mới được lưu phiếu chấm của mình.' });
    if (assignment.innovationId !== innovationId || assignment.evaluationRoundId !== evaluationRoundId) return res.status(400).json({ error: 'Thông tin phân công không khớp.' });
    const round = db.evaluationRounds.find(er => er.id === evaluationRoundId);
    if (!round || !canAccessRound(actor, round)) return res.status(403).json({ error: 'Đợt xét nằm ngoài phạm vi dữ liệu.' });
    if (round?.isScoringFinalized) return res.status(400).json({ error: 'Đợt xét đã chốt dữ liệu!' });

    let calculatedTotal = 0;
    if (details && Array.isArray(details)) {
      for (const d of details) {
        calculatedTotal += Number(d.score);
      }
    }

    const existingSheetIdx = db.scoringSheets.findIndex(ss => ss.assignmentId === assignmentId && ss.userId === actor.id);
    let sheetId = 'ss-' + Date.now();
    if (existingSheetIdx !== -1) {
      sheetId = db.scoringSheets[existingSheetIdx].id;
      db.scoringSheets[existingSheetIdx] = { ...db.scoringSheets[existingSheetIdx], totalScore: calculatedTotal, generalComment, recommendation, status: status || 'DRAFT', updatedAt: new Date().toISOString() };
      db.scoringDetails = db.scoringDetails.filter(sd => sd.scoringSheetId !== sheetId);
    } else {
      db.scoringSheets.push({ id: sheetId, assignmentId, innovationId, evaluationRoundId, userId: actor.id, totalScore: calculatedTotal, generalComment, recommendation, status: status || 'DRAFT', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    if (details && Array.isArray(details)) {
      details.forEach((d: any, idx: number) => {
        db.scoringDetails.push({ id: 'sd-' + Date.now() + '-' + idx, scoringSheetId: sheetId, criteriaId: d.criteriaId, score: d.score, comment: d.comment || '' });
      });
    }

    res.json({ success: true, totalScore: calculatedTotal, rank: calculateRank(calculatedTotal) });
  });

  app.get('/api/dashboard/stats', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'view_dashboard')) return res.status(403).json({ error: 'Vai trò của bạn không có quyền xem tổng quan.' });
    const scope = getDepartmentScope(actor);
    const scopedRounds = db.evaluationRounds.filter(round => scope.has(round.departmentId));
    const roundIds = new Set(scopedRounds.map(round => round.id));
    const scopedInnovations = db.innovations.filter(innovation => roundIds.has(innovation.evaluationRoundId));
    const scopedCouncilIds = new Set(scopedRounds.map(round => round.councilId));
    res.json({
      totalInnovations: scopedInnovations.length,
      recognized: scopedInnovations.filter(i => i.status === 'RECOGNIZED').length,
      totalCouncils: db.councils.filter(council => scopedCouncilIds.has(council.id)).length,
      totalUsers: db.users.filter(user => scope.has(user.departmentId)).length,
      totalDepartments: scope.size
    });
  });

  app.get('/api/audit-logs', (req, res) => {
    const actor = (req as any).user;
    if (!hasPermission(actor, 'view_audit')) return res.status(403).json({ error: 'Vai trò của bạn không có quyền xem nhật ký.' });
    if (isGlobalAdmin(actor)) return res.json(db.auditLogs);
    const scope = getDepartmentScope(actor);
    res.json(db.auditLogs.filter((log: any) => scope.has(log.departmentId) || log.userId === actor.id));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: false } });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'dist', 'index.html')); });
  }

  const port = 3000;
  const server = app.listen(port, '0.0.0.0', () => { console.log(`Server running at http://0.0.0.0:${port}`); });
  const shutdown = async () => {
    await persistDatabase(db);
    await closeDatabase();
    server.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer();
