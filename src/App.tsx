/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Calendar, Users, Award, BookOpen, 
  BarChart3, Settings, ShieldCheck, CheckCircle2, Clock, AlertCircle,
  Plus, Search, Filter, Eye, Edit, Trash2, Send, Lock, Unlock, Download,
  CheckSquare, UserCheck, FileCheck, Building2, Bell, LogOut, ChevronRight,
  TrendingUp, Layers, Check, X, AlertTriangle, RefreshCw, Key, UserPlus, UserMinus, Upload, Trophy, Paperclip
} from 'lucide-react';

async function readApiResponse(response: Response) {
  const body = await response.text();
  let data: any;
  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    throw new Error(`Phản hồi từ máy chủ không hợp lệ (HTTP ${response.status}). Hãy khởi động lại server rồi thử lại.`);
  }
  if (!response.ok) throw new Error(data?.error || `Yêu cầu thất bại (HTTP ${response.status}).`);
  if (data === null) throw new Error(`Máy chủ trả về nội dung rỗng (HTTP ${response.status}).`);
  return data;
}

const ROLE_PERMISSION_OPTIONS = [
  { code: 'view_dashboard', name: 'Xem tổng quan' },
  { code: 'view_innovations', name: 'Xem sáng kiến' },
  { code: 'view_rounds', name: 'Xem đợt xét' },
  { code: 'view_repository', name: 'Tra cứu sáng kiến' },
  { code: 'submit_innovation', name: 'Nộp sáng kiến' },
  { code: 'manage_users', name: 'Quản lý người dùng' },
  { code: 'manage_departments', name: 'Quản lý đơn vị' },
  { code: 'manage_councils', name: 'Quản lý hội đồng' },
  { code: 'manage_rounds', name: 'Quản lý đợt xét' },
  { code: 'manage_assignments', name: 'Phân công chấm' },
  { code: 'score_assigned', name: 'Chấm sáng kiến được giao' },
  { code: 'view_all_scores', name: 'Xem toàn bộ điểm trong phạm vi' },
  { code: 'manage_criteria', name: 'Quản lý bộ tiêu chí' },
  { code: 'manage_ranking', name: 'Quản lý quy tắc xếp loại' },
  { code: 'manage_fields', name: 'Quản lý lĩnh vực' },
  { code: 'view_audit', name: 'Xem nhật ký' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roleCatalog, setRoleCatalog] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [councils, setCouncils] = useState<any[]>([]);
  const [criteriaSets, setCriteriaSets] = useState<any[]>([]);
  const [evaluationRounds, setEvaluationRounds] = useState<any[]>([]);
  const [innovations, setInnovations] = useState<any[]>([]);
  const [innovationFields, setInnovationFields] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scoringSheets, setScoringSheets] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [rankingRules, setRankingRules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '123456' });
  const [loginError, setLoginError] = useState('');

  // Modal states
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [departmentForm, setDepartmentForm] = useState({ code: 'XP-A', name: 'UBND Xã Phường A', type: 'XA_PHUONG', parentId: '' });
  const [editingInnovationField, setEditingInnovationField] = useState<any>(null);
  const [showInnovationFieldModal, setShowInnovationFieldModal] = useState(false);
  const [innovationFieldForm, setInnovationFieldForm] = useState({ name: '' });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    username: 'user_new',
    password: '123456',
    fullName: 'Người dùng mới',
    email: '',
    phone: '',
    departmentId: '',
    position: '',
    roles: ['SUBMITTER'] as string[]
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ code: '', name: '', description: '', permissions: [] as string[] });
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const [editingRound, setEditingRound] = useState<any>(null);
  const [showCreateInnovationModal, setShowCreateInnovationModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [selectedInnovationForScoring, setSelectedInnovationForScoring] = useState<any>(null);

  const [showCouncilModal, setShowCouncilModal] = useState(false);
  const [editingCouncil, setEditingCouncil] = useState<any>(null);
  const [councilForm, setCouncilForm] = useState({ code: 'HD-2026', name: 'Hội đồng Khoa học', decisionNumber: '01/QĐ', decisionDate: '2026-01-01' });

  const [showCouncilMembersModal, setShowCouncilMembersModal] = useState(false);
  const [selectedCouncilForMembers, setSelectedCouncilForMembers] = useState<any>(null);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');

  // Criteria Set Modal
  const [showCriteriaSetModal, setShowCriteriaSetModal] = useState(false);
  const [editingCriteriaSet, setEditingCriteriaSet] = useState<any>(null);
  const [criteriaSetForm, setCriteriaSetForm] = useState({
    code: 'TC-2026-V1',
    name: 'Bộ tiêu chuẩn chấm sáng kiến chuẩn năm 2026',
    description: 'Áp dụng cho mọi lĩnh vực khoa học công nghệ và hành chính.',
    totalScore: 100,
    criteria: [
      { code: 'C1', name: 'Tính mới, tính sáng tạo', maxScore: 30, weight: 0.3, description: 'Giải pháp chưa từng được áp dụng.' },
      { code: 'C2', name: 'Khả năng áp dụng thực tiễn', maxScore: 20, weight: 0.2, description: 'Dễ dàng triển khai, chi phí hợp lý.' },
      { code: 'C3', name: 'Hiệu quả kinh tế - xã hội', maxScore: 30, weight: 0.3, description: 'Mang lại lợi ích thiết thực.' },
      { code: 'C4', name: 'Phạm vi ảnh hưởng và nhân rộng', maxScore: 20, weight: 0.2, description: 'Có tiềm năng nhân rộng.' }
    ]
  });

  // Ranking Rule Modal
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [editingRankingRule, setEditingRankingRule] = useState<any>(null);
  const [rankingForm, setRankingForm] = useState({ minScore: 90, maxScore: 100, rankName: 'Loại 1 (Xuất sắc)', badgeColor: 'bg-purple-100 text-purple-800' });

  const [roundForm, setRoundForm] = useState({
    code: 'DOT-XAI-2026',
    name: 'Đợt xét sáng kiến tại đơn vị',
    year: 2026,
    departmentId: '',
    councilId: '',
    criteriaSetId: '',
    description: 'Đợt xét'
  });

  const [innovForm, setInnovForm] = useState({
    evaluationRoundId: '',
    title: '',
    field: '',
    solutionDescription: '',
    applyingOrganization: 'UBND Xã Phường A',
    author2UserId: '',
    author3UserId: '',
    descriptionFile: null as File | null,
    reportFile: null as File | null
  });

  const [scoringFormDetails, setScoringFormDetails] = useState<Record<string, { score: number, comment: string }>>({});
  const [generalComment, setGeneralComment] = useState('');
  const [recommendation, setRecommendation] = useState('RECOGNIZED');

  useEffect(() => {
    fetch('/api/session').then(async response => {
      if (!response.ok) throw new Error('No active session');
      const data = await response.json();
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      await fetchAllData();
    }).catch(() => setLoading(false));
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, cRes, csRes, erRes, iRes, saRes, ssRes, statRes, rrRes, alRes, ifRes, rolesRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
        fetch('/api/councils').then(r => r.json()),
        fetch('/api/criteria-sets').then(r => r.json()),
        fetch('/api/evaluation-rounds').then(r => r.json()),
        fetch('/api/innovations').then(r => r.json()),
        fetch('/api/scoring-assignments').then(r => r.json()),
        fetch('/api/scoring-sheets').then(r => r.json()),
        fetch('/api/dashboard/stats').then(r => r.json()),
        fetch('/api/ranking-rules').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/innovation-fields').then(r => r.json()),
        fetch('/api/roles').then(r => r.json()),
      ]);

      setUsers(uRes);
      setDepartments(dRes);
      setCouncils(cRes);
      setCriteriaSets(csRes);
      setEvaluationRounds(erRes);
      setInnovations(iRes);
      setInnovationFields(ifRes);
      setRoleCatalog(rolesRes);
      setAssignments(saRes);
      setScoringSheets(ssRes);
      setDashboardStats(statRes);
      setRankingRules(rrRes);
      setAuditLogs(alRes);

      if (cRes.length > 0) setRoundForm(prev => ({ ...prev, councilId: cRes[0].id }));
      if (csRes.length > 0) setRoundForm(prev => ({ ...prev, criteriaSetId: csRes[0].id }));
      if (dRes.length > 0) setRoundForm(prev => ({ ...prev, departmentId: dRes[0].id }));
      const openRounds = erRes.filter((round: any) => round.status === 'SCORING' && !round.isScoringFinalized);
      setInnovForm(prev => ({
        ...prev,
        evaluationRoundId: openRounds.some((round: any) => round.id === prev.evaluationRoundId)
          ? prev.evaluationRoundId
          : openRounds[0]?.id || '',
      }));
      if (ifRes.length > 0) setInnovForm(prev => ({ ...prev, field: ifRes.some((field: any) => field.name === prev.field) ? prev.field : ifRes[0].name }));
    } catch (err) {
      console.error(err);
      showNotification('Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setLoginError('');
      await fetchAllData();
      showNotification('Đăng nhập thành công!', 'success');
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' }).catch(() => undefined);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDepartment ? `/api/departments/${editingDepartment.id}` : '/api/departments';
      const method = editingDepartment ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(departmentForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu đơn vị');
      showNotification('Lưu đơn vị thành công!', 'success');
      setShowDepartmentModal(false);
      setEditingDepartment(null);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Xóa đơn vị này?')) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa đơn vị thất bại');
      showNotification('Đã xóa đơn vị', 'success');
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleSaveInnovationField = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(editingInnovationField ? `/api/innovation-fields/${editingInnovationField.id}` : '/api/innovation-fields', {
        method: editingInnovationField ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(innovationFieldForm),
      });
      await readApiResponse(response);
      const fieldsResponse = await fetch('/api/innovation-fields');
      const fields = await readApiResponse(fieldsResponse);
      setInnovationFields(fields);
      setInnovForm(current => ({ ...current, field: fields.some((field: any) => field.name === current.field) ? current.field : fields[0]?.name || '' }));
      setShowInnovationFieldModal(false);
      setEditingInnovationField(null);
      showNotification('Đã lưu lĩnh vực.', 'success');
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleDeleteInnovationField = async (field: any) => {
    if (!confirm(`Xóa lĩnh vực "${field.name}"?`)) return;
    try {
      const response = await fetch(`/api/innovation-fields/${field.id}`, { method: 'DELETE' });
      await readApiResponse(response);
      const fieldsResponse = await fetch('/api/innovation-fields');
      const fields = await readApiResponse(fieldsResponse);
      setInnovationFields(fields);
      setInnovForm(current => ({ ...current, field: fields.some((item: any) => item.name === current.field) ? current.field : fields[0]?.name || '' }));
      showNotification('Đã xóa lĩnh vực.', 'success');
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = {
        ...userForm,
        roles: userForm.roles
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu người dùng');
      showNotification(editingUser ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!', 'success');
      setShowUserModal(false);
      setEditingUser(null);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleSaveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(editingRole ? `/api/roles/${editingRole.code}` : '/api/roles', {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      });
      await readApiResponse(response);
      const rolesResponse = await fetch('/api/roles');
      setRoleCatalog(await readApiResponse(rolesResponse));
      setShowRoleModal(false);
      setEditingRole(null);
      showNotification('Đã lưu vai trò và quyền.', 'success');
    } catch (error: any) { showNotification(error.message, 'error'); }
  };

  const handleDeleteRole = async (role: any) => {
    if (!confirm(`Xóa vai trò "${role.name}"?`)) return;
    try {
      const response = await fetch(`/api/roles/${role.code}`, { method: 'DELETE' });
      await readApiResponse(response);
      const rolesResponse = await fetch('/api/roles');
      setRoleCatalog(await readApiResponse(rolesResponse));
      showNotification('Đã xóa vai trò.', 'success');
    } catch (error: any) { showNotification(error.message, 'error'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Xóa người dùng này?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa người dùng thất bại');
      showNotification('Đã xóa người dùng', 'success');
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleSaveCriteriaSet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCriteriaSet ? `/api/criteria-sets/${editingCriteriaSet.id}` : '/api/criteria-sets';
      const method = editingCriteriaSet ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(criteriaSetForm) });
      if (!res.ok) throw new Error('Lỗi lưu bộ tiêu chí');
      showNotification('Lưu bộ tiêu chí thành công!', 'success');
      setShowCriteriaSetModal(false);
      setEditingCriteriaSet(null);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleDeleteCriteriaSet = async (id: string) => {
    if (!confirm('Xóa bộ tiêu chí này?')) return;
    await fetch(`/api/criteria-sets/${id}`, { method: 'DELETE' });
    showNotification('Đã xóa bộ tiêu chí', 'success');
    fetchAllData();
  };

  const handleSaveRankingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRankingRule ? `/api/ranking-rules/${editingRankingRule.id}` : '/api/ranking-rules';
      const method = editingRankingRule ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rankingForm) });
      if (!res.ok) throw new Error('Lỗi lưu quy tắc xếp loại');
      showNotification('Lưu quy tắc xếp loại thành công!', 'success');
      setShowRankingModal(false);
      setEditingRankingRule(null);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleDeleteRankingRule = async (id: string) => {
    if (!confirm('Xóa quy tắc này?')) return;
    await fetch(`/api/ranking-rules/${id}`, { method: 'DELETE' });
    showNotification('Đã xóa', 'success');
    fetchAllData();
  };

  const handleSaveCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCouncil ? `/api/councils/${editingCouncil.id}` : '/api/councils';
      const method = editingCouncil ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(councilForm) });
      if (!res.ok) throw new Error('Lỗi lưu hội đồng');
      showNotification('Lưu hội đồng thành công!', 'success');
      setShowCouncilModal(false);
      setEditingCouncil(null);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleDeleteCouncil = async (id: string) => {
    if (!confirm('Xóa hội đồng này?')) return;
    await fetch(`/api/councils/${id}`, { method: 'DELETE' });
    showNotification('Đã xóa', 'success');
    fetchAllData();
  };

  const handleAddCouncilMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouncilForMembers || !newMemberUserId) return;
    try {
      await fetch(`/api/councils/${selectedCouncilForMembers.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newMemberUserId, councilRole: newMemberRole })
      });
      showNotification('Thêm thành viên thành công!', 'success');
      setNewMemberUserId('');
      const cRes = await fetch('/api/councils').then(r => r.json());
      setCouncils(cRes);
      setSelectedCouncilForMembers(cRes.find((c: any) => c.id === selectedCouncilForMembers.id));
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleRemoveCouncilMember = async (councilId: string, memberId: string) => {
    if (!confirm('Xóa thành viên?')) return;
    try {
      await fetch(`/api/councils/${councilId}/members/${memberId}`, { method: 'DELETE' });
      showNotification('Đã xóa', 'success');
      const cRes = await fetch('/api/councils').then(r => r.json());
      setCouncils(cRes);
      setSelectedCouncilForMembers(cRes.find((c: any) => c.id === councilId));
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleFinalizeScoring = async (roundId: string) => {
    if (!confirm('Chốt dữ liệu chấm cho đợt xét này của đơn vị/xã phường?')) return;
    try {
      const res = await fetch(`/api/evaluation-rounds/${roundId}/finalize-scoring`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotification(data.message, 'success');
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleCreateScoringAssignment = async (payload: any) => {
    const innovationIds = payload.innovationIds || [payload.innovationId].filter(Boolean);
    const userIds = payload.userIds || [payload.userId].filter(Boolean);
    let created = 0;
    let skipped = 0;
    let excludedParticipants = 0;

    for (const innovationId of innovationIds) {
      const innovation = innovations.find((item: any) => item.id === innovationId);
      for (const userId of userIds) {
        const isParticipant = innovation?.submitterId === userId || innovation?.authors?.some((author: any) => author.userId === userId);
        if (isParticipant) {
          excludedParticipants++;
          continue;
        }

        const response = await fetch('/api/scoring-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evaluationRoundId: payload.evaluationRoundId,
            innovationId,
            userId,
            deadline: payload.deadline,
          })
        });
        if (response.status === 409) {
          await response.text();
          skipped++;
          continue;
        }
        await readApiResponse(response);
        created++;
      }
    }

    const assignmentRes = await fetch('/api/scoring-assignments');
    setAssignments(await readApiResponse(assignmentRes));
    const result = { created, skipped, excludedParticipants };
    showNotification(`Đã giao ${created} lượt; bỏ qua ${skipped} lượt trùng và ${excludedParticipants} lượt có tác giả/người nộp.`, 'success');
    return result;
  };

  const handleSaveRound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const editing = Boolean(editingRound);
      const payload = editing
        ? { code: roundForm.code, name: roundForm.name, year: roundForm.year, description: roundForm.description }
        : { ...roundForm, departmentId: currentUser.roles?.includes('ADMIN') ? roundForm.departmentId : currentUser.departmentId };
      const response = await fetch(editing ? `/api/evaluation-rounds/${editingRound.id}` : '/api/evaluation-rounds', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (editing ? 'Lỗi sửa đợt xét.' : 'Lỗi tạo đợt xét.'));
      showNotification(editing ? 'Đã cập nhật đợt xét.' : 'Tạo đợt xét cho đơn vị thành công!', 'success');
      setShowCreateRoundModal(false);
      setEditingRound(null);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleDeleteRound = async (round: any) => {
    if (!confirm(`Xóa đợt "${round.name}"? Toàn bộ sáng kiến, phân công và phiếu chấm trong đợt này cũng sẽ bị xóa.`)) return;
    try {
      const response = await fetch(`/api/evaluation-rounds/${round.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể xóa đợt xét.');
      showNotification('Đã xóa đợt xét và dữ liệu liên quan.', 'success');
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const handleCreateInnovation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authorsList = [
        { userId: currentUser.id, fullName: currentUser.fullName, organization: currentUser.position, isMainAuthor: true }
      ];

      if (innovForm.author2UserId) {
        const u2 = users.find(u => u.id === innovForm.author2UserId);
        if (u2) authorsList.push({ userId: u2.id, fullName: u2.fullName, organization: u2.position, isMainAuthor: false });
      }
      if (innovForm.author3UserId) {
        const u3 = users.find(u => u.id === innovForm.author3UserId);
        if (u3) authorsList.push({ userId: u3.id, fullName: u3.fullName, organization: u3.position, isMainAuthor: false });
      }

      if (authorsList.length > 3) {
        showNotification('Quy định: Mỗi sáng kiến tối đa 3 tác giả!', 'error');
        return;
      }

      const attachmentsList = [];
      if (innovForm.descriptionFile) {
        attachmentsList.push({
          fileName: innovForm.descriptionFile.name,
          originalFileName: innovForm.descriptionFile.name,
          fileSize: `${(innovForm.descriptionFile.size / (1024*1024)).toFixed(1)} MB`,
          fileType: innovForm.descriptionFile.name.split('.').pop()?.toUpperCase() || 'PDF'
        });
      } else {
        attachmentsList.push({ fileName: 'Mo_ta_sang_kien.pdf', originalFileName: 'Mo_ta_sang_kien.pdf', fileSize: '1.2 MB', fileType: 'PDF' });
      }

      if (innovForm.reportFile) {
        attachmentsList.push({
          fileName: innovForm.reportFile.name,
          originalFileName: innovForm.reportFile.name,
          fileSize: `${(innovForm.reportFile.size / (1024*1024)).toFixed(1)} MB`,
          fileType: innovForm.reportFile.name.split('.').pop()?.toUpperCase() || 'XLSX'
        });
      } else {
        attachmentsList.push({ fileName: 'Bao_cao_hieu_qua.xlsx', originalFileName: 'Bao_cao_hieu_qua.xlsx', fileSize: '1.8 MB', fileType: 'XLSX' });
      }

      const payload = {
        evaluationRoundId: innovForm.evaluationRoundId,
        title: innovForm.title,
        field: innovForm.field,
        solutionDescription: innovForm.solutionDescription,
        applyingOrganization: innovForm.applyingOrganization,
        submitterId: currentUser.id,
        authors: authorsList,
        attachments: attachmentsList
      };

      const res = await fetch('/api/innovations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi nộp hồ sơ');

      showNotification('Nộp sáng kiến, chọn 3 tác giả và đính kèm file thành công!', 'success');
      setShowCreateInnovationModal(false);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  const openScoringModal = (assignment: any) => {
    setSelectedInnovationForScoring(assignment);
    const round = evaluationRounds.find(er => er.id === assignment.evaluationRoundId);
    const critSet = criteriaSets.find(cs => cs.id === round?.criteriaSetId);
    const existingSheet = scoringSheets.find(ss => ss.assignmentId === assignment.id && ss.userId === currentUser.id);
    
    const initialDetails: Record<string, { score: number, comment: string }> = {};
    critSet?.criteria?.forEach((crit: any) => {
      const detail = existingSheet?.details?.find((d: any) => d.criteriaId === crit.id);
      initialDetails[crit.id] = {
        score: detail ? detail.score : Math.floor(crit.maxScore * 0.8),
        comment: detail ? detail.comment : 'Đạt.'
      };
    });

    setScoringFormDetails(initialDetails);
    setGeneralComment(existingSheet?.generalComment || 'Sáng kiến xuất sắc.');
    setRecommendation(existingSheet?.recommendation || 'RECOGNIZED');
    setShowScoringModal(true);
  };

  const handleSaveScoringSheet = async (isSubmit: boolean) => {
    if (!selectedInnovationForScoring) return;
    try {
      const detailsArray = Object.entries(scoringFormDetails).map(([criteriaId, val]) => ({
        criteriaId,
        score: Number(val.score),
        comment: val.comment
      }));

      const payload = {
        assignmentId: selectedInnovationForScoring.id,
        innovationId: selectedInnovationForScoring.innovationId,
        evaluationRoundId: selectedInnovationForScoring.evaluationRoundId,
        userId: currentUser.id,
        details: detailsArray,
        generalComment,
        recommendation,
        status: isSubmit ? 'SUBMITTED' : 'DRAFT'
      };

      const res = await fetch('/api/scoring-sheets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu phiếu');

      showNotification(isSubmit ? `Đã gửi phiếu! Điểm: ${data.totalScore}đ (${data.rank})` : 'Đã lưu nháp', 'success');
      setShowScoringModal(false);
      fetchAllData();
    } catch (err: any) { showNotification(err.message, 'error'); }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white"><Award className="w-7 h-7" /></div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Đăng nhập</h1>
          <p className="text-sm text-slate-400 text-center mb-6">Hệ thống Quản lý và Chấm Sáng Kiến</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                placeholder="123456"
                required
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {loginError}
              </div>
            )}

            <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
              {loading ? 'Đang tải...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400">
            Tài khoản demo: <span className="font-semibold text-slate-200">admin</span> / <span className="font-semibold text-slate-200">123456</span>
          </div>
        </div>
      </div>
    );
  }

  const hasCurrentPermission = (permission: string) => currentUser?.roles?.includes('ADMIN') || roleCatalog.some((role: any) => currentUser?.roles?.includes(role.code) && (role.permissions?.includes('*') || role.permissions?.includes(permission)));
  const myDepartmentRounds = evaluationRounds;
  const openInnovationRounds = evaluationRounds.filter((round: any) => round.status === 'SCORING' && !round.isScoringFinalized);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {notificationMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 ${
          notificationMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notificationMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-medium text-sm">{notificationMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md z-20 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-inner"><Award className="w-6 h-6" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight">HỆ THỐNG QUẢN LÝ VÀ CHẤM SÁNG KIẾN</h1>
              <p className="text-xs text-slate-400">Quản lý các xã, phường trực thuộc</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{currentUser.fullName}</p>
              <p className="text-[11px] text-slate-400">{currentUser.roles.join(', ')}</p>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        <aside className="w-64 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Nghiệp vụ</p>
            
            <SidebarItem icon={<LayoutDashboard className="w-4 h-4" />} label="1. Tổng quan" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={<FileText className="w-4 h-4" />} label="2. Sáng kiến (Tối đa 3 tác giả)" active={activeTab === 'innovations'} onClick={() => setActiveTab('innovations')} />
            <SidebarItem icon={<Calendar className="w-4 h-4" />} label="3. Đợt xét (Xã/Phường)" active={activeTab === 'rounds'} onClick={() => setActiveTab('rounds')} />
            <SidebarItem icon={<Users className="w-4 h-4" />} label="4. Hội đồng xét duyệt" active={activeTab === 'councils'} onClick={() => setActiveTab('councils')} />
            <SidebarItem icon={<CheckSquare className="w-4 h-4" />} label="5. Chấm điểm Hội đồng" active={activeTab === 'scoring'} onClick={() => setActiveTab('scoring')} />
            <SidebarItem icon={<Trophy className="w-4 h-4" />} label="6. Xếp loại & Thống kê" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
            <SidebarItem icon={<BookOpen className="w-4 h-4" />} label="7. Kho sáng kiến" active={activeTab === 'repository'} onClick={() => setActiveTab('repository')} />

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mt-6 mb-2">Quản trị</p>
            {hasCurrentPermission('manage_departments') && <SidebarItem icon={<Building2 className="w-4 h-4" />} label="8. Quản lý Đơn vị" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />}
            {hasCurrentPermission('manage_fields') && <SidebarItem icon={<Layers className="w-4 h-4" />} label="Quản lý lĩnh vực" active={activeTab === 'innovation-fields'} onClick={() => setActiveTab('innovation-fields')} />}
            {currentUser?.roles?.includes('ADMIN') && <SidebarItem icon={<ShieldCheck className="w-4 h-4" />} label="Vai trò & quyền" active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} />}
            {hasCurrentPermission('manage_users') && <SidebarItem icon={<Users className="w-4 h-4" />} label="9. Quản lý User" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />}
            {hasCurrentPermission('manage_criteria') && <SidebarItem icon={<CheckSquare className="w-4 h-4" />} label="10. Quản lý Bộ tiêu chí" active={activeTab === 'criteria'} onClick={() => setActiveTab('criteria')} />}
            {hasCurrentPermission('manage_ranking') && <SidebarItem icon={<Award className="w-4 h-4" />} label="11. Cấu hình Xếp loại" active={activeTab === 'ranking-config'} onClick={() => setActiveTab('ranking-config')} />}
            {hasCurrentPermission('view_audit') && <SidebarItem icon={<ShieldCheck className="w-4 h-4" />} label="12. Nhật ký Audit" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView stats={dashboardStats} evaluationRounds={myDepartmentRounds} innovations={innovations} />}
          {activeTab === 'innovations' && <InnovationsView innovations={innovations} evaluationRounds={evaluationRounds} canSubmit={hasCurrentPermission('submit_innovation')} onOpenCreate={() => setShowCreateInnovationModal(true)} />}
          {activeTab === 'rounds' && <RoundsView evaluationRounds={myDepartmentRounds} councils={councils} criteriaSets={criteriaSets} currentUser={currentUser} canManage={hasCurrentPermission('manage_rounds')} onOpenCreate={() => { setEditingRound(null); setRoundForm({ code: 'DOT-XAI-2026', name: 'Đợt xét sáng kiến tại đơn vị', year: 2026, departmentId: departments.find((department: any) => department.type === 'XA_PHUONG')?.id || '', councilId: councils[0]?.id || '', criteriaSetId: criteriaSets[0]?.id || '', description: 'Đợt xét' }); setShowCreateRoundModal(true); }} onEdit={(round: any) => { setEditingRound(round); setRoundForm({ code: round.code, name: round.name, year: round.year, departmentId: round.departmentId, councilId: round.councilId, criteriaSetId: round.criteriaSetId, description: round.description || '' }); setShowCreateRoundModal(true); }} onDelete={handleDeleteRound} onFinalize={handleFinalizeScoring} />}
          {activeTab === 'councils' && <CouncilsView councils={councils} users={users} canManage={hasCurrentPermission('manage_councils')} onOpenAdd={() => { setEditingCouncil(null); setCouncilForm({code:'HD-2026', name:'Hội đồng mới', decisionNumber:'01/QĐ', decisionDate:'2026-01-01'}); setShowCouncilModal(true); }} onEdit={(c: any) => { setEditingCouncil(c); setCouncilForm(c); setShowCouncilModal(true); }} onDelete={handleDeleteCouncil} onOpenMembers={(c: any) => { setSelectedCouncilForMembers(c); setShowCouncilMembersModal(true); }} />}
          {activeTab === 'scoring' && <ScoringView evaluationRounds={myDepartmentRounds} assignments={assignments} currentUser={currentUser} canManageAssignments={hasCurrentPermission('manage_assignments')} canViewAllScores={hasCurrentPermission('view_all_scores')} councils={councils} innovations={innovations} scoringSheets={scoringSheets} onOpenScoring={openScoringModal} onCreateAssignment={handleCreateScoringAssignment} onFinalize={handleFinalizeScoring} />}
          {activeTab === 'ranking' && <RankingView innovations={innovations} rankingRules={rankingRules} evaluationRounds={myDepartmentRounds} />}
          {activeTab === 'repository' && <RepositoryView innovations={innovations} />}
          
          {activeTab === 'ranking-config' && hasCurrentPermission('manage_ranking') && <RankingConfigView rankingRules={rankingRules} onOpenAdd={() => { setEditingRankingRule(null); setRankingForm({minScore: 80, maxScore: 90, rankName: 'Loại 2', badgeColor: 'bg-emerald-100 text-emerald-800'}); setShowRankingModal(true); }} onEdit={(r: any) => { setEditingRankingRule(r); setRankingForm(r); setShowRankingModal(true); }} onDelete={handleDeleteRankingRule} />}
          {activeTab === 'departments' && hasCurrentPermission('manage_departments') && <DepartmentsView departments={departments} canManage={hasCurrentPermission('manage_departments')} onOpenAdd={() => { setEditingDepartment(null); setDepartmentForm({ code: '', name: '', type: 'XA_PHUONG', parentId: '' }); setShowDepartmentModal(true); }} onEdit={(dept: any) => { setEditingDepartment(dept); setDepartmentForm({ code: dept.code, name: dept.name, type: dept.type, parentId: dept.parentId || '' }); setShowDepartmentModal(true); }} onDelete={handleDeleteDepartment} />}
          {activeTab === 'innovation-fields' && hasCurrentPermission('manage_fields') && <InnovationFieldsView fields={innovationFields} onAdd={() => { setEditingInnovationField(null); setInnovationFieldForm({ name: '' }); setShowInnovationFieldModal(true); }} onEdit={(field: any) => { setEditingInnovationField(field); setInnovationFieldForm({ name: field.name }); setShowInnovationFieldModal(true); }} onDelete={handleDeleteInnovationField} />}
          {activeTab === 'roles' && currentUser?.roles?.includes('ADMIN') && <RolesManagementView roles={roleCatalog} onAdd={() => { setEditingRole(null); setRoleForm({ code: '', name: '', description: '', permissions: [] }); setShowRoleModal(true); }} onEdit={(role: any) => { setEditingRole(role); setRoleForm({ code: role.code, name: role.name, description: role.description || '', permissions: role.permissions?.filter((permission: string) => permission !== '*') || [] }); setShowRoleModal(true); }} onDelete={handleDeleteRole} />}
          {activeTab === 'users' && hasCurrentPermission('manage_users') && <UsersManagementView users={users} departments={departments} roleCatalog={roleCatalog} onOpenAdd={() => { setEditingUser(null); setUserForm({ username: '', password: '123456', fullName: '', email: '', phone: '', departmentId: departments[0]?.id || '', position: '', roles: ['SUBMITTER'] }); setShowUserModal(true); }} onEdit={(user: any) => { setEditingUser(user); setUserForm({ username: user.username, password: user.password || '123456', fullName: user.fullName, email: user.email || '', phone: user.phone || '', departmentId: user.departmentId || '', position: user.position || '', roles: Array.isArray(user.roles) ? user.roles : [user.roles || 'SUBMITTER'] }); setShowUserModal(true); }} onDelete={handleDeleteUser} />}
          {activeTab === 'criteria' && hasCurrentPermission('manage_criteria') && <CriteriaManagementView criteriaSets={criteriaSets} onOpenAdd={() => { setEditingCriteriaSet(null); setCriteriaSetForm({code:'TC-NEW', name:'Bộ tiêu chí mới', description:'', totalScore:100, criteria:[{code:'C1', name:'Tính mới', maxScore:50, weight:0.5, description:''}, {code:'C2', name:'Hiệu quả', maxScore:50, weight:0.5, description:''}]}); setShowCriteriaSetModal(true); }} onEdit={(cs: any) => { setEditingCriteriaSet(cs); setCriteriaSetForm(cs); setShowCriteriaSetModal(true); }} onDelete={handleDeleteCriteriaSet} />}
          {activeTab === 'admin' && hasCurrentPermission('view_audit') && <AdminView auditLogs={auditLogs} />}
        </main>
      </div>

      {showDepartmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingDepartment ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}</h3>
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mã đơn vị</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={departmentForm.code} onChange={e => setDepartmentForm({ ...departmentForm, code: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên đơn vị</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={departmentForm.name} onChange={e => setDepartmentForm({ ...departmentForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Loại đơn vị</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={departmentForm.type} onChange={e => setDepartmentForm({ ...departmentForm, type: e.target.value, parentId: e.target.value === 'XA_PHUONG' ? '' : departmentForm.parentId })}>
                  <option value="XA_PHUONG">Xã / Phường</option>
                  <option value="PHONG_BAN_XA_PHUONG">Phòng thuộc xã / phường</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Xã / phường trực thuộc</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500" value={departmentForm.parentId} onChange={e => setDepartmentForm({ ...departmentForm, parentId: e.target.value })} disabled={departmentForm.type === 'XA_PHUONG'} required={departmentForm.type === 'PHONG_BAN_XA_PHUONG'}>
                  <option value="">{departmentForm.type === 'XA_PHUONG' ? 'Xã / phường là đơn vị gốc' : 'Chọn xã / phường quản lý phòng này'}</option>
                  {departments.filter((dept: any) => dept.id !== editingDepartment?.id && dept.type === 'XA_PHUONG').map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {departmentForm.type === 'PHONG_BAN_XA_PHUONG' && !departments.some((dept: any) => dept.type === 'XA_PHUONG') && <p className="mt-1 text-xs text-rose-600">Chưa có xã / phường. Hãy tạo xã / phường trước khi thêm phòng ban.</p>}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowDepartmentModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tên đăng nhập</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Họ tên</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.fullName} onChange={e => setUserForm({ ...userForm, fullName: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.departmentId} onChange={e => setUserForm({ ...userForm, departmentId: e.target.value })}>
                    <option value="">-- Chọn đơn vị --</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">Vai trò và quyền được cấp</p>
                  <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                    {roleCatalog.filter((role: any) => role.code !== 'ADMIN' || currentUser?.roles?.includes('ADMIN')).map((role: any) => <label key={role.code} className="flex items-start gap-2 text-xs text-slate-700">
                      <input type="checkbox" checked={userForm.roles.includes(role.code)} onChange={e => setUserForm({ ...userForm, roles: e.target.checked ? [...userForm.roles, role.code] : userForm.roles.filter((code: string) => code !== role.code) })} />
                      <span><strong>{role.name}</strong><span className="block text-slate-500">{role.description}</span></span>
                    </label>)}
                    {!roleCatalog.length && <p className="text-xs text-slate-500">Chưa có vai trò để chọn.</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chức vụ</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.position} onChange={e => setUserForm({ ...userForm, position: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {/* Criteria Set Modal */}
      {showCriteriaSetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingCriteriaSet ? 'Sửa Bộ tiêu chí' : 'Thêm Bộ tiêu chí Mới'}</h3>
            <form onSubmit={handleSaveCriteriaSet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mã bộ tiêu chí</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={criteriaSetForm.code} onChange={e => setCriteriaSetForm({...criteriaSetForm, code: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên bộ tiêu chí</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={criteriaSetForm.name} onChange={e => setCriteriaSetForm({...criteriaSetForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={criteriaSetForm.description} onChange={e => setCriteriaSetForm({...criteriaSetForm, description: e.target.value})}></textarea>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase">Danh sách tiêu chí thành phần (Tổng: {criteriaSetForm.totalScore}đ)</p>
                {criteriaSetForm.criteria.map((c, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" placeholder="Tên tiêu chí" className="flex-1 border rounded px-2 py-1 text-xs" value={c.name} onChange={e => {
                      const newC = [...criteriaSetForm.criteria];
                      newC[idx].name = e.target.value;
                      setCriteriaSetForm({...criteriaSetForm, criteria: newC});
                    }} />
                    <input type="number" placeholder="Điểm" className="w-20 border rounded px-2 py-1 text-xs text-right" value={c.maxScore} onChange={e => {
                      const val = Number(e.target.value);
                      const newC = [...criteriaSetForm.criteria];
                      newC[idx].maxScore = val;
                      setCriteriaSetForm({...criteriaSetForm, criteria: newC});
                    }} />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowCriteriaSetModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Lưu bộ tiêu chí</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ranking Rule Modal */}
      {showRankingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingRankingRule ? 'Sửa quy tắc xếp loại' : 'Thêm quy tắc xếp loại mới'}</h3>
            <form onSubmit={handleSaveRankingRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên loại (Ví dụ: Loại 1, Loại 2...)</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={rankingForm.rankName} onChange={e => setRankingForm({...rankingForm, rankName: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm tối thiểu (Min)</label>
                  <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2 text-sm" value={rankingForm.minScore} onChange={e => setRankingForm({...rankingForm, minScore: Number(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm tối đa (Max)</label>
                  <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2 text-sm" value={rankingForm.maxScore} onChange={e => setRankingForm({...rankingForm, maxScore: Number(e.target.value)})} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Màu nhãn (Tailwind)</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={rankingForm.badgeColor} onChange={e => setRankingForm({...rankingForm, badgeColor: e.target.value})} required />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowRankingModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInnovationFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleSaveInnovationField} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">{editingInnovationField ? 'Sửa lĩnh vực' : 'Thêm lĩnh vực'}</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Tên lĩnh vực</label>
              <input autoFocus className="w-full rounded-lg border px-3 py-2 text-sm" value={innovationFieldForm.name} onChange={e => setInnovationFieldForm({ name: e.target.value })} required />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowInnovationFieldModal(false); setEditingInnovationField(null); }} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Lưu</button>
            </div>
          </form>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleSaveRole} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">{editingRole ? 'Cấu hình vai trò' : 'Tạo vai trò'}</h3>
            {!editingRole && <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mã vai trò</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm uppercase" value={roleForm.code} onChange={e => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })} placeholder="VD: REVIEWER" required />
            </div>}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Tên vai trò</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mô tả</label>
              <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} />
            </div>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-600">Quyền được cấp</legend>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                {ROLE_PERMISSION_OPTIONS.map(permission => <label key={permission.code} className="flex items-start gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={roleForm.permissions.includes(permission.code)} onChange={e => setRoleForm({ ...roleForm, permissions: e.target.checked ? [...roleForm.permissions, permission.code] : roleForm.permissions.filter(code => code !== permission.code) })} />
                  {permission.name}
                </label>)}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowRoleModal(false); setEditingRole(null); }} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Lưu quyền</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Innovation Modal - With Max 3 Authors and Real File Uploads */}
      {showCreateInnovationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nộp Sáng Kiến (Tối đa 3 tác giả & Đính kèm file)</h3>
            <form onSubmit={handleCreateInnovation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đợt xét</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white disabled:bg-slate-100" value={innovForm.evaluationRoundId} onChange={e => setInnovForm({...innovForm, evaluationRoundId: e.target.value})} required disabled={!openInnovationRounds.length}>
                  <option value="">{openInnovationRounds.length ? 'Chọn đợt xét đang mở' : 'Hiện không có đợt xét đang mở'}</option>
                  {openInnovationRounds.map((er: any) => <option key={er.id} value={er.id}>{er.name} ({er.department?.name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên sáng kiến</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={innovForm.title} onChange={e => setInnovForm({...innovForm, title: e.target.value})} required placeholder="Nhập tiêu đề sáng kiến..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lĩnh vực</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={innovForm.field} onChange={e => setInnovForm({ ...innovForm, field: e.target.value })} required disabled={!innovationFields.length}>
                  <option value="">{innovationFields.length ? 'Chọn lĩnh vực' : 'Chưa có lĩnh vực được cấu hình'}</option>
                  {innovationFields.map((field: any) => <option key={field.id} value={field.name}>{field.name}</option>)}
                </select>
              </div>
              
              <div className="p-3 bg-slate-50 border rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase">Danh sách tác giả (Quy định: Tối đa 3 người)</p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">1. Tác giả chính (Mặc định)</label>
                  <input type="text" disabled className="w-full border bg-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800" value={`${currentUser?.fullName} (${currentUser?.position})`} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">2. Đồng tác giả thứ 2</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={innovForm.author2UserId} onChange={e => setInnovForm({...innovForm, author2UserId: e.target.value})}>
                    <option value="">-- Không chọn (hoặc chọn từ danh sách đơn vị) --</option>
                    {users.filter(u => u.id !== currentUser?.id).map(u => <option key={u.id} value={u.id}>{u.fullName} - {u.position}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">3. Đồng tác giả thứ 3</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={innovForm.author3UserId} onChange={e => setInnovForm({...innovForm, author3UserId: e.target.value})}>
                    <option value="">-- Không chọn (hoặc chọn từ danh sách đơn vị) --</option>
                    {users.filter(u => u.id !== currentUser?.id && u.id !== innovForm.author2UserId).map(u => <option key={u.id} value={u.id}>{u.fullName} - {u.position}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả chi tiết giải pháp</label>
                <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" value={innovForm.solutionDescription} onChange={e => setInnovForm({...innovForm, solutionDescription: e.target.value})} required placeholder="Nội dung giải pháp, tính mới, hiệu quả áp dụng..."></textarea>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <p className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5"><Paperclip className="w-4 h-4 text-indigo-600" /> Hồ sơ / File đính kèm</p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">File Mô tả sáng kiến (PDF / DOCX)</label>
                  <input type="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setInnovForm({...innovForm, descriptionFile: e.target.files[0]});
                    }
                  }} />
                  {innovForm.descriptionFile && <p className="text-[11px] text-emerald-600 mt-1 font-medium">Đã chọn: {innovForm.descriptionFile.name}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">File Báo cáo hiệu quả thực tế (XLSX / PDF)</label>
                  <input type="file" className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setInnovForm({...innovForm, reportFile: e.target.files[0]});
                    }
                  }} />
                  {innovForm.reportFile && <p className="text-[11px] text-emerald-600 mt-1 font-medium">Đã chọn: {innovForm.reportFile.name}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowCreateInnovationModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" disabled={!openInnovationRounds.length} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed">Nộp hồ sơ sáng kiến</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateRoundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingRound ? 'Sửa đợt xét' : 'Tạo Đợt Xét Mới cho Đơn vị / Xã Phường'}</h3>
            <form onSubmit={handleSaveRound} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Mã đợt</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={roundForm.code} onChange={e => setRoundForm({...roundForm, code: e.target.value})} required /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Tên đợt xét</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={roundForm.name} onChange={e => setRoundForm({...roundForm, name: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Năm</label><input type="number" min="2000" max="2100" className="w-full border rounded-lg px-3 py-2 text-sm" value={roundForm.year} onChange={e => setRoundForm({...roundForm, year: Number(e.target.value)})} required /></div>
                {!editingRound && currentUser?.roles?.includes('ADMIN') && (
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị / Xã Phường</label><select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={roundForm.departmentId} onChange={e => setRoundForm({...roundForm, departmentId: e.target.value})}>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                )}
              </div>
              {!editingRound && <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Hội Đồng</label><select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={roundForm.councilId} onChange={e => setRoundForm({...roundForm, councilId: e.target.value})} required>{councils.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Bộ Tiêu Chí</label><select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={roundForm.criteriaSetId} onChange={e => setRoundForm({...roundForm, criteriaSetId: e.target.value})} required>{criteriaSets.map(cs => <option key={cs.id} value={cs.id}>{cs.name}</option>)}</select></div>
              </div>
              }
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" value={roundForm.description} onChange={e => setRoundForm({...roundForm, description: e.target.value})} rows={2} /></div>
              <div className="flex justify-end space-x-2 pt-4"><button type="button" onClick={() => { setShowCreateRoundModal(false); setEditingRound(null); }} className="px-4 py-2 border rounded-lg text-sm">Hủy</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">{editingRound ? 'Lưu thay đổi' : 'Tạo đợt xét'}</button></div>
            </form>
          </div>
        </div>
      )}

      {showScoringModal && selectedInnovationForScoring && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chấm điểm Sáng kiến</h3>
            <div className="space-y-4">
              {(() => {
                const round = evaluationRounds.find(er => er.id === selectedInnovationForScoring.evaluationRoundId);
                const critSet = criteriaSets.find(cs => cs.id === round?.criteriaSetId);
                return critSet?.criteria?.map((crit: any) => (
                  <div key={crit.id} className="p-3 border rounded-xl bg-slate-50 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-800">{crit.name} (Tối đa: {crit.maxScore}đ)</span>
                    <input 
                      type="number" 
                      min="0" 
                      max={crit.maxScore} 
                      className="w-20 border rounded-lg px-2 py-1 text-right text-sm font-bold"
                      value={scoringFormDetails[crit.id]?.score || 0}
                      onChange={e => {
                        const val = Math.min(crit.maxScore, Math.max(0, Number(e.target.value)));
                        setScoringFormDetails({ ...scoringFormDetails, [crit.id]: { ...(scoringFormDetails[crit.id]||{}), score: val } });
                      }}
                    />
                  </div>
                ));
              })()}
              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={() => handleSaveScoringSheet(false)} className="px-4 py-2 border rounded-lg text-sm">Lưu nháp</button>
                <button onClick={() => handleSaveScoringSheet(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Gửi phiếu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCouncilMembersModal && selectedCouncilForMembers && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="text-lg font-bold text-slate-900">Quản lý Thành viên Hội đồng</h3>
              <button onClick={() => setShowCouncilMembersModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCouncilMember} className="p-4 bg-slate-50 rounded-xl border mb-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={newMemberUserId} onChange={e => setNewMemberUserId(e.target.value)} required>
                    <option value="">-- Chọn người dùng --</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName} ({u.position})</option>)}
                  </select>
                </div>
                <div>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}>
                    <option value="CHAIRMAN">Chủ tịch</option>
                    <option value="SECRETARY">Thư ký</option>
                    <option value="MEMBER">Ủy viên</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"><UserPlus className="w-4 h-4" /> Thêm</button></div>
            </form>
            <div className="border rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-3">Họ tên</th><th className="p-3">Vai trò</th><th className="p-3 text-right">Xóa</th></tr></thead>
                <tbody className="divide-y text-xs text-slate-700">
                  {selectedCouncilForMembers.members?.map((m: any) => (
                    <tr key={m.id}>
                      <td className="p-3 font-semibold">{m.user?.fullName}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">{m.councilRole}</span></td>
                      <td className="p-3 text-right"><button onClick={() => handleRemoveCouncilMember(selectedCouncilForMembers.id, m.id)} className="p-1 text-rose-600"><UserMinus className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCouncilModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingCouncil ? 'Sửa Hội đồng' : 'Thêm Hội đồng'}</h3>
            <form onSubmit={handleSaveCouncil} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Mã Hội đồng</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={councilForm.code} onChange={e => setCouncilForm({...councilForm, code: e.target.value})} required /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Tên Hội đồng</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={councilForm.name} onChange={e => setCouncilForm({...councilForm, name: e.target.value})} required /></div>
              <div className="flex justify-end space-x-2 pt-4"><button type="button" onClick={() => setShowCouncilModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Lưu</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-VIEWS ---

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
      <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function DashboardView({ stats, evaluationRounds, innovations }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Tổng quan Hệ thống</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Tổng số sáng kiến" value={stats.totalInnovations || 0} icon={<FileText className="w-6 h-6 text-indigo-600" />} bg="bg-indigo-50" />
        <StatCard title="Đơn vị / Xã phường" value={stats.totalDepartments || 0} icon={<Building2 className="w-6 h-6 text-emerald-600" />} bg="bg-emerald-50" />
        <StatCard title="Hội đồng xét duyệt" value={stats.totalCouncils || 0} icon={<Users className="w-6 h-6 text-amber-600" />} bg="bg-amber-50" />
        <StatCard title="Đã công nhận" value={stats.recognized || 0} icon={<Award className="w-6 h-6 text-purple-600" />} bg="bg-purple-50" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: any) {
  return (
    <div className="p-5 border rounded-2xl bg-white flex items-center justify-between shadow-xs">
      <div><p className="text-xs font-semibold text-slate-500 uppercase">{title}</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p></div>
      <div className={`p-3 rounded-2xl ${bg}`}>{icon}</div>
    </div>
  );
}

function InnovationsView({ innovations, evaluationRounds, canSubmit, onOpenCreate }: any) {
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [titleQuery, setTitleQuery] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const years: number[] = Array.from(new Set<number>(evaluationRounds.map((round: any) => Number(round.year)).filter((year: number) => Number.isFinite(year)))).sort((a: number, b: number) => b - a);
  const normalizeSearch = (value: any) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
  const filteredInnovations = innovations.filter((innovation: any) => {
    const round = evaluationRounds.find((item: any) => item.id === innovation.evaluationRoundId);
    const authors = [...(innovation.authors || []).map((author: any) => author.fullName), innovation.submitter?.fullName].filter(Boolean).join(' ');
    return (!selectedRoundId || innovation.evaluationRoundId === selectedRoundId) &&
      (!selectedYear || String(round?.year) === selectedYear) &&
      normalizeSearch(innovation.title).includes(normalizeSearch(titleQuery)) &&
      normalizeSearch(authors).includes(normalizeSearch(authorQuery));
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Sáng kiến (Tối đa 3 tác giả & File đính kèm)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Hiển thị danh sách tác giả đầy đủ và các tài liệu đính kèm báo cáo.</p>
        </div>
        {canSubmit && <button onClick={onOpenCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Nộp sáng kiến mới
        </button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
          <option value="">Tất cả đợt xét</option>
          {evaluationRounds.map((round: any) => <option key={round.id} value={round.id}>{round.name}</option>)}
        </select>
        <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
          <option value="">Tất cả năm</option>
          {years.map((year: number) => <option key={year} value={year}>{year}</option>)}
        </select>
        <label className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="min-w-0 w-full py-2 text-sm outline-none" value={titleQuery} onChange={e => setTitleQuery(e.target.value)} placeholder="Tìm tên sáng kiến" />
        </label>
        <label className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="min-w-0 w-full py-2 text-sm outline-none" value={authorQuery} onChange={e => setAuthorQuery(e.target.value)} placeholder="Tìm theo tác giả" />
        </label>
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b">
              <th className="p-4">Tiêu đề sáng kiến</th>
              <th className="p-4">Tác giả (Tối đa 3 người)</th>
              <th className="p-4">File đính kèm</th>
              <th className="p-4">Điểm TB & Xếp loại</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm text-slate-700">
            {filteredInnovations.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <span className="font-semibold text-slate-900 block">{inv.title}</span>
                  <span className="text-xs text-slate-400 font-mono">{inv.code} • {inv.field}</span>
                </td>
                <td className="p-4 text-xs space-y-1">
                  {inv.authors?.map((a: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <strong className={a.isMainAuthor ? 'text-indigo-900 font-bold' : ''}>{a.fullName}</strong>
                      {a.isMainAuthor && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">Chính</span>}
                    </div>
                  ))}
                </td>
                <td className="p-4 text-xs space-y-1">
                  {inv.attachments?.map((att: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                      <Paperclip className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="font-medium truncate max-w-[180px]">{att.fileName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({att.fileSize})</span>
                    </div>
                  ))}
                </td>
                <td className="p-4 font-bold text-indigo-600">
                  {inv.averageScore !== null ? `${inv.averageScore}đ` : 'Chưa chấm'}
                  <span className="block text-xs font-semibold text-purple-700">{inv.rankResult}</span>
                </td>
              </tr>
            ))}
            {!filteredInnovations.length && <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-500">Không tìm thấy sáng kiến phù hợp với bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesManagementView({ roles, onAdd, onEdit, onDelete }: any) {
  const permissionNames = new Map(ROLE_PERMISSION_OPTIONS.map(permission => [permission.code, permission.name]));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Vai trò & quyền</h2>
          <p className="mt-1 text-xs text-slate-500">Quyền cấu hình ở đây được kiểm tra lại tại API.</p>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Tạo vai trò</button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead><tr className="border-b bg-slate-50 text-xs font-semibold text-slate-600"><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Quyền</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y text-sm">
            {roles.map((role: any) => <tr key={role.code}>
              <td className="px-4 py-3 align-top"><p className="font-semibold text-slate-900">{role.name}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{role.code}</p><p className="mt-1 text-xs text-slate-500">{role.description}</p></td>
              <td className="px-4 py-3 align-top text-xs text-slate-700">{role.permissions?.includes('*') ? 'Toàn quyền' : role.permissions?.map((code: string) => permissionNames.get(code) || code).join(' · ') || 'Không có quyền'}</td>
              <td className="px-4 py-3 align-top"><div className="flex justify-end gap-2">
                {role.code !== 'ADMIN' && <button type="button" title="Sửa quyền" onClick={() => onEdit(role)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Edit className="h-4 w-4" /></button>}
                {!role.protected && <button type="button" title="Xóa vai trò" onClick={() => onDelete(role)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>}
              </div></td>
            </tr>)}
            {!roles.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">Chưa có vai trò.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InnovationFieldsView({ fields, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý lĩnh vực sáng kiến</h2>
          <p className="mt-1 text-xs text-slate-500">Lĩnh vực đang được sáng kiến sử dụng sẽ không thể xóa.</p>
        </div>
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="w-4 h-4" />Thêm lĩnh vực</button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left">
          <thead><tr className="border-b bg-slate-50 text-xs font-semibold text-slate-600"><th className="px-4 py-3">Tên lĩnh vực</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y text-sm">
            {fields.map((field: any) => <tr key={field.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{field.name}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-2">
                <button type="button" title="Sửa lĩnh vực" onClick={() => onEdit(field)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Edit className="w-4 h-4" /></button>
                <button type="button" title="Xóa lĩnh vực" onClick={() => onDelete(field)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>)}
            {!fields.length && <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">Chưa có lĩnh vực.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoundsView({ evaluationRounds, currentUser, canManage, onOpenCreate, onEdit, onDelete, onFinalize }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Đợt xét Sáng kiến & Chốt dữ liệu đơn vị</h2>
          {canManage && !currentUser?.roles?.includes('ADMIN') && <p className="text-xs text-indigo-600 font-medium">Bạn đang quản lý trong phạm vi đơn vị của mình</p>}
        </div>
        {canManage && <button onClick={onOpenCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Tạo đợt xét cho đơn vị</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evaluationRounds.map((er: any) => (
          <div key={er.id} className="p-5 border rounded-2xl bg-white space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{er.code}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${er.isScoringFinalized ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
                {er.isScoringFinalized ? 'Đã chốt dữ liệu đơn vị' : 'Đang trong thời gian chấm'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{er.name}</h3>
            <p className="text-xs text-slate-500">Đơn vị: <strong>{er.department?.name}</strong> • Hội đồng: {er.council?.name}</p>
            {canManage && (
              <div className="pt-2 border-t flex justify-end">
                <div className="flex flex-wrap justify-end gap-2">
                  {!er.isScoringFinalized && <>
                    <button onClick={() => onEdit(er)} className="px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-50"><Edit className="w-3.5 h-3.5 inline mr-1" />Sửa</button>
                    <button onClick={() => onFinalize(er.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700">
                      <Lock className="w-3.5 h-3.5" /> Duyệt dữ liệu
                    </button>
                  </>}
                  <button onClick={() => onDelete(er)} className="px-3 py-1.5 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 inline mr-1" />Xóa</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CouncilsView({ councils, canManage, onOpenAdd, onOpenMembers, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Quản lý Hội đồng Xét duyệt</h2>
        {canManage && <button onClick={onOpenAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Thêm Hội đồng</button>}
      </div>
      <div className="space-y-4">
        {councils.map((c: any) => (
          <div key={c.id} className="p-5 border rounded-2xl bg-white flex justify-between items-center shadow-xs">
            <div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-full">{c.code}</span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{c.name}</h3>
              <p className="text-xs text-slate-500">Thành viên: <strong className="text-indigo-600">{c.members?.length || 0} người</strong></p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => onOpenMembers(c)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1"><Users className="w-4 h-4" /> Thành viên</button>
              {canManage && <button onClick={() => onEdit(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>}
              {canManage && <button onClick={() => onDelete(c.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringView({ evaluationRounds, assignments, currentUser, canManageAssignments, canViewAllScores: roleCanViewAllScores, councils, innovations, scoringSheets, onOpenScoring, onCreateAssignment, onFinalize }: any) {
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedInnovationId, setSelectedInnovationId] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({ innovationIds: [] as string[], userIds: [] as string[], deadline: '' });
  const [assignmentError, setAssignmentError] = useState('');
  useEffect(() => {
    setSelectedRoundId((currentId: string) => {
      if (evaluationRounds.some((round: any) => round.id === currentId)) return currentId;
      const canViewAll = currentUser?.roles?.includes('ADMIN') || roleCanViewAllScores;
      const roundWithAssignments = evaluationRounds.find((round: any) =>
        assignments.some((assignment: any) =>
          assignment.evaluationRoundId === round.id && (canViewAll || assignment.userId === currentUser?.id)
        )
      );
      return roundWithAssignments?.id || evaluationRounds[0]?.id || '';
    });
  }, [evaluationRounds, assignments, currentUser?.id, currentUser?.roles]);

  const selectedRound = evaluationRounds.find((er: any) => er.id === selectedRoundId);
  const selectedCouncil = councils.find((council: any) => council.id === selectedRound?.councilId);
  const councilMembers = (selectedCouncil?.members || []).filter((member: any) => member.isActive !== false && member.user);
  const isAdmin = currentUser?.roles?.includes('ADMIN');
  const isCouncilChair = councilMembers.some((member: any) => member.userId === currentUser?.id && member.councilRole === 'CHAIRMAN');
  const canViewAllScores = isAdmin || roleCanViewAllScores || isCouncilChair;
  const allRoundInnovations = innovations.filter((innovation: any) => innovation.evaluationRoundId === selectedRoundId);
  const roundInnovations = allRoundInnovations.filter((innovation: any) =>
    (canViewAllScores || assignments.some((assignment: any) => assignment.evaluationRoundId === selectedRoundId && assignment.innovationId === innovation.id && assignment.userId === currentUser?.id))
  );
  const selectedInnovation = roundInnovations.find((innovation: any) => innovation.id === selectedInnovationId);
  const innovationAssignments = assignments.filter((assignment: any) =>
    assignment.evaluationRoundId === selectedRoundId &&
    assignment.innovationId === selectedInnovationId &&
    (canViewAllScores || assignment.userId === currentUser?.id)
  );
  const scoringRows = innovationAssignments.map((assignment: any) => ({
    assignment,
    sheet: scoringSheets.find((item: any) => item.assignmentId === assignment.id && item.userId === assignment.userId),
  }));
  const submittedScores = scoringRows.filter((row: any) => row.sheet?.status === 'SUBMITTED').map((row: any) => Number(row.sheet.totalScore));
  const averageScore = canViewAllScores && submittedScores.length
    ? Math.round(submittedScores.reduce((sum: number, score: number) => sum + score, 0) / submittedScores.length * 100) / 100
    : null;
  const ownSheet = scoringRows.find((row: any) => row.assignment.userId === currentUser?.id)?.sheet;
  const roundAssignments = assignments.filter((a: any) => a.evaluationRoundId === selectedRoundId && (a.userId === currentUser.id || currentUser.roles?.includes('ADMIN')));

  useEffect(() => {
    setAssignmentForm((current: any) => ({
      innovationIds: current.innovationIds.filter((id: string) => allRoundInnovations.some((innovation: any) => innovation.id === id)),
      userIds: current.userIds.filter((id: string) => councilMembers.some((member: any) => member.userId === id)),
      deadline: current.deadline,
    }));
  }, [selectedRoundId, innovations, councils]);

  useEffect(() => {
    setSelectedInnovationId((currentId: string) =>
      roundInnovations.some((innovation: any) => innovation.id === currentId)
        ? currentId
        : roundInnovations[0]?.id || ''
    );
  }, [selectedRoundId, innovations, assignments, currentUser?.id, currentUser?.roles]);

  const handleAssignmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAssignmentError('');
    if (!assignmentForm.innovationIds.length || !assignmentForm.userIds.length) {
      setAssignmentError('Hãy chọn ít nhất một sáng kiến và một thành viên hội đồng.');
      return;
    }
    try {
      await onCreateAssignment({
        ...assignmentForm,
        evaluationRoundId: selectedRoundId,
        assignedBy: currentUser.id,
      });
    } catch (error: any) {
      setAssignmentError(error.message);
    }
  };

  const handleQuickAssignment = async () => {
    setAssignmentError('');
    try {
      await onCreateAssignment({
        ...assignmentForm,
        evaluationRoundId: selectedRoundId,
        assignedBy: currentUser.id,
        innovationIds: allRoundInnovations.map((innovation: any) => innovation.id),
        userIds: councilMembers.map((member: any) => member.userId),
      });
    } catch (error: any) {
      setAssignmentError(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Chấm điểm Hội đồng theo Đợt xét</h2>
        <div className="flex items-center gap-2">
          <select className="border rounded-xl px-3 py-1.5 text-sm font-semibold bg-white text-indigo-600" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
            {!evaluationRounds.length && <option value="">Chưa có đợt xét</option>}
          {evaluationRounds.map((er: any) => <option key={er.id} value={er.id}>{er.name} ({er.department?.name})</option>)}
          </select>
          {canManageAssignments && <button type="button" onClick={() => onFinalize(selectedRoundId)} disabled={!selectedRoundId || selectedRound?.isScoringFinalized} className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed">{selectedRound?.isScoringFinalized ? 'Đã duyệt toàn đợt' : 'Duyệt dữ liệu toàn đợt'}</button>}
        </div>
      </div>
      {selectedRound?.isScoringFinalized && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 font-semibold">🔒 Đợt xét của đơn vị này đã chốt dữ liệu.</div>
      )}
      {canManageAssignments && (
        <form onSubmit={handleAssignmentSubmit} className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Phân công chấm</h3>
            <p className="text-xs text-slate-500 mt-1">Chọn sáng kiến và thành viên thuộc hội đồng của đợt xét đang mở.</p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">Sáng kiến ({assignmentForm.innovationIds.length} đã chọn)</span>
                <label className="flex items-center gap-2 text-xs text-indigo-700">
                  <input type="checkbox" checked={allRoundInnovations.length > 0 && assignmentForm.innovationIds.length === allRoundInnovations.length} onChange={e => setAssignmentForm({ ...assignmentForm, innovationIds: e.target.checked ? allRoundInnovations.map((innovation: any) => innovation.id) : [] })} disabled={!allRoundInnovations.length || selectedRound?.isScoringFinalized} />
                  Chọn tất cả
                </label>
              </div>
              <div className="max-h-48 divide-y overflow-y-auto">
                {allRoundInnovations.map((innovation: any) => <label key={innovation.id} className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-slate-50">
                  <input type="checkbox" className="mt-0.5" checked={assignmentForm.innovationIds.includes(innovation.id)} onChange={e => setAssignmentForm({ ...assignmentForm, innovationIds: e.target.checked ? [...assignmentForm.innovationIds, innovation.id] : assignmentForm.innovationIds.filter(id => id !== innovation.id) })} disabled={selectedRound?.isScoringFinalized} />
                  <span className="text-xs text-slate-700"><strong className="font-mono text-slate-500">{innovation.code}</strong> · {innovation.title}</span>
                </label>)}
                {!allRoundInnovations.length && <p className="px-3 py-5 text-center text-xs text-slate-500">Đợt này chưa có sáng kiến.</p>}
              </div>
            </section>
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-xs font-semibold text-slate-700">Thành viên hội đồng ({assignmentForm.userIds.length} đã chọn)</span>
                <label className="flex items-center gap-2 text-xs text-indigo-700">
                  <input type="checkbox" checked={councilMembers.length > 0 && assignmentForm.userIds.length === councilMembers.length} onChange={e => setAssignmentForm({ ...assignmentForm, userIds: e.target.checked ? councilMembers.map((member: any) => member.userId) : [] })} disabled={!councilMembers.length || selectedRound?.isScoringFinalized} />
                  Chọn tất cả
                </label>
              </div>
              <div className="max-h-48 divide-y overflow-y-auto">
                {councilMembers.map((member: any) => <label key={member.id} className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-slate-50">
                  <input type="checkbox" className="mt-0.5" checked={assignmentForm.userIds.includes(member.userId)} onChange={e => setAssignmentForm({ ...assignmentForm, userIds: e.target.checked ? [...assignmentForm.userIds, member.userId] : assignmentForm.userIds.filter(id => id !== member.userId) })} disabled={selectedRound?.isScoringFinalized} />
                  <span className="text-xs text-slate-700">{member.user.fullName} <span className="text-slate-500">({member.councilRole})</span></span>
                </label>)}
                {!councilMembers.length && <p className="px-3 py-5 text-center text-xs text-slate-500">Hội đồng chưa có thành viên.</p>}
              </div>
            </section>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <label htmlFor="assignment-deadline">Hạn chấm</label>
              <input id="assignment-deadline" type="date" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={assignmentForm.deadline} onChange={e => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })} disabled={selectedRound?.isScoringFinalized} />
              <span>{assignmentForm.innovationIds.length * assignmentForm.userIds.length} lượt trước khi loại tác giả và phân công trùng</span>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={!assignmentForm.innovationIds.length || !assignmentForm.userIds.length || selectedRound?.isScoringFinalized} className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400">Giao theo lựa chọn</button>
              <button type="button" onClick={handleQuickAssignment} disabled={!allRoundInnovations.length || !councilMembers.length || selectedRound?.isScoringFinalized} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">Giao nhanh toàn bộ</button>
            </div>
          </div>
          {assignmentError && <p className="text-xs text-rose-600">{assignmentError}</p>}
          <div className="flex justify-end">
            <div className="flex gap-2">
              <button type="submit" disabled={!assignmentForm.innovationId || !assignmentForm.userId || !eligibleCouncilMembers.length || selectedRound?.isScoringFinalized} className="px-4 py-2 border border-indigo-600 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed">Giao một người</button>
              <button type="button" onClick={handleQuickAssignment} disabled={!assignmentForm.innovationId || !eligibleCouncilMembers.length || selectedRound?.isScoringFinalized} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed">Giao nhanh cho cả hội đồng</button>
            </div>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.6fr)] gap-5 items-start">
        <section className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Sáng kiến trong đợt</h3>
            <p className="text-xs text-slate-500 mt-1">{roundInnovations.length} sáng kiến</p>
          </div>
          <div className="divide-y max-h-[70vh] overflow-y-auto">
            {roundInnovations.map((innovation: any) => {
              const assignmentCount = canViewAllScores ? assignments.filter((assignment: any) => assignment.evaluationRoundId === selectedRoundId && assignment.innovationId === innovation.id).length : null;
              const isSelected = innovation.id === selectedInnovationId;
              return <button key={innovation.id} type="button" onClick={() => setSelectedInnovationId(innovation.id)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}>
                <span className="block text-xs font-mono text-slate-500">{innovation.code}</span>
                <span className="block mt-1 text-sm font-semibold text-slate-900">{innovation.title}</span>
                {canViewAllScores && <span className="block mt-2 text-xs text-slate-500">Đã giao {assignmentCount} người chấm</span>}
              </button>;
            })}
            {!roundInnovations.length && <p className="px-4 py-8 text-center text-sm text-slate-500">{canViewAllScores ? 'Đợt này chưa có sáng kiến.' : 'Bạn chưa được phân công sáng kiến nào trong đợt này.'}</p>}
          </div>
        </section>

        <section className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          {selectedInnovation ? <>
            <div className="px-5 py-4 border-b bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-slate-500">{selectedInnovation.code}</p>
                <h3 className="mt-1 text-base font-bold text-slate-900">{selectedInnovation.title}</h3>
              </div>
              <div className="text-right">
                {canViewAllScores ? <>
                  <p className="text-xs text-slate-500">Điểm trung bình đã gửi ({submittedScores.length} phiếu)</p>
                  <p className="text-2xl font-bold text-indigo-700">{averageScore === null ? '--' : `${averageScore} điểm`}</p>
                </> : <>
                  <p className="text-xs text-slate-500">Điểm của tôi</p>
                  <p className="text-2xl font-bold text-indigo-700">{ownSheet ? `${ownSheet.totalScore} điểm` : '--'}</p>
                </>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b bg-white text-xs text-slate-500">{canViewAllScores && <th className="px-4 py-3 font-semibold">Thành viên hội đồng</th>}<th className="px-4 py-3 font-semibold">Trạng thái</th><th className="px-4 py-3 font-semibold">Điểm</th><th className="px-4 py-3 text-right font-semibold">Thao tác</th></tr></thead>
                <tbody className="divide-y">
                  {scoringRows.map(({ assignment, sheet }: any) => <tr key={assignment.id}>
                    {canViewAllScores && <td className="px-4 py-3 text-sm font-medium text-slate-800">{assignment.user?.fullName || assignment.userId}</td>}
                    <td className="px-4 py-3 text-xs">{sheet?.status === 'SUBMITTED' ? <span className="text-emerald-700 font-semibold">Đã gửi</span> : sheet ? <span className="text-amber-700 font-semibold">Bản nháp</span> : <span className="text-slate-500">Chưa chấm</span>}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{sheet ? `${sheet.totalScore} điểm` : '--'}</td>
                    <td className="px-4 py-3 text-right">{assignment.userId === currentUser.id && <button type="button" onClick={() => onOpenScoring(assignment)} disabled={selectedRound?.isScoringFinalized} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed">{sheet ? 'Sửa phiếu' : 'Chấm điểm'}</button>}</td>
                  </tr>)}
                  {!scoringRows.length && <tr><td colSpan={canViewAllScores ? 4 : 3} className="px-4 py-8 text-center text-sm text-slate-500">Chưa có phiếu chấm của bạn cho sáng kiến này.</td></tr>}
                </tbody>
              </table>
            </div>
          </> : <p className="px-5 py-12 text-center text-sm text-slate-500">Chọn sáng kiến bên trái để xem điểm hội đồng.</p>}
        </section>
      </div>
    </div>
  );
}

function RankingView({ innovations, rankingRules, evaluationRounds }: any) {
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const filteredInnovations = innovations.filter((innovation: any) => !selectedRoundId || innovation.evaluationRoundId === selectedRoundId);
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = filteredInnovations.map((innovation: any, index: number) => ({
      'STT': index + 1,
      'Mã sáng kiến': innovation.code || '',
      'Tên sáng kiến': innovation.title || '',
      'Đợt xét': innovation.evaluationRound?.name || '',
      'Năm': innovation.evaluationRound?.year || '',
      'Đơn vị': innovation.evaluationRound?.department?.name || '',
      'Điểm trung bình': innovation.averageScore ?? '',
      'Xếp loại': innovation.rankResult || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Xep loai');
    const selectedRound = evaluationRounds.find((round: any) => round.id === selectedRoundId);
    const suffix = selectedRound ? `-${selectedRound.code.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    XLSX.writeFile(workbook, `thong-ke-xep-loai${suffix}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Xếp loại & Thống kê Điểm số</h2>
          <p className="text-xs text-slate-500 mt-0.5">Phân loại dựa trên cấu hình ngưỡng điểm động. {filteredInnovations.length} sáng kiến.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
            <option value="">Tất cả đợt xét</option>
            {evaluationRounds.map((round: any) => <option key={round.id} value={round.id}>{round.name}</option>)}
          </select>
          <button type="button" onClick={exportToExcel} disabled={!filteredInnovations.length} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            <Download className="h-4 w-4" /> Xuất Excel
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {rankingRules.map((rr: any, idx: number) => (
          <div key={idx} className="p-4 border rounded-2xl bg-white text-center space-y-1 shadow-xs">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rr.badgeColor}`}>{rr.rankName}</span>
            <p className="text-xs text-slate-500 pt-2">{rr.minScore} - {rr.maxScore}đ</p>
          </div>
        ))}
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-4">Sáng kiến</th><th className="p-4">Đơn vị</th><th className="p-4">Điểm TB</th><th className="p-4">Xếp loại</th></tr></thead>
          <tbody className="divide-y text-sm text-slate-700">
            {filteredInnovations.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-4 font-semibold text-slate-900">{inv.title}</td>
                <td className="p-4">{inv.evaluationRound?.department?.name}</td>
                <td className="p-4 font-bold text-indigo-600">{inv.averageScore !== null ? `${inv.averageScore}đ` : 'Chưa có'}</td>
                <td className="p-4"><span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">{inv.rankResult}</span></td>
              </tr>
            ))}
            {!filteredInnovations.length && <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-500">Không có dữ liệu cho đợt xét này.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RepositoryView({ innovations }: any) {
  const [query, setQuery] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const fields = Array.from(new Set(innovations.map((innovation: any) => innovation.field).filter(Boolean))) as string[];
  const normalizeSearch = (value: any) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
  const filteredInnovations = innovations.filter((innovation: any) => {
    const authorNames = (innovation.authors || []).map((author: any) => author.fullName).join(' ');
    const searchableText = [innovation.title, innovation.field, innovation.solutionDescription, authorNames, innovation.submitter?.fullName].join(' ');
    return (!selectedField || innovation.field === selectedField) && normalizeSearch(searchableText).includes(normalizeSearch(query));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kho Tra Cứu Sáng Kiến</h2>
          <p className="mt-1 text-xs text-slate-500">{filteredInnovations.length} / {innovations.length} sáng kiến</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(260px,1fr)_220px] sm:w-auto">
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input className="min-w-0 w-full py-2 text-sm outline-none" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, tác giả, nội dung..." />
          </label>
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedField} onChange={e => setSelectedField(e.target.value)}>
            <option value="">Tất cả lĩnh vực</option>
            {fields.map(field => <option key={field} value={field}>{field}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInnovations.map((inv: any) => (
          <div key={inv.id} className="p-5 border rounded-2xl bg-white space-y-2">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{inv.field}</span>
            <h3 className="text-base font-bold text-slate-900">{inv.title}</h3>
            <p className="text-xs font-medium text-slate-500">Tác giả: {(inv.authors || []).map((author: any) => author.fullName).filter(Boolean).join(', ') || inv.submitter?.fullName || 'Chưa cập nhật'}</p>
            <p className="text-xs text-slate-600">{inv.solutionDescription}</p>
          </div>
        ))}
        {!filteredInnovations.length && <p className="col-span-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Không tìm thấy sáng kiến phù hợp.</p>}
      </div>
    </div>
  );
}

function DepartmentsView({ departments, canManage, onOpenAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Quản lý Xã/Phường và phòng trực thuộc</h2>
        {canManage && <button onClick={onOpenAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm đơn vị
        </button>}
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-4">Mã</th><th className="p-4">Tên đơn vị</th><th className="p-4">Đơn vị cấp trên</th><th className="p-4">Loại cơ cấu</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y text-sm text-slate-700">
            {departments.map((d: any) => (
              <tr key={d.id}>
                <td className="p-4 font-mono">{d.code}</td>
                <td className="p-4 font-semibold">{d.name}</td>
                <td className="p-4 text-slate-600">{departments.find((parent: any) => parent.id === d.parentId)?.name || 'Không có'}</td>
                <td className="p-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{{ XA_PHUONG: 'Xã / Phường', PHONG_BAN_XA_PHUONG: 'Phòng thuộc xã / phường' }[d.type as 'XA_PHUONG' | 'PHONG_BAN_XA_PHUONG'] || d.type}</span></td>
                {canManage && <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(d)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersManagementView({ users, departments, canManage = true, roleCatalog, onOpenAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Người dùng & Admin Xã Phường</h2>
          <p className="text-xs text-slate-500 mt-0.5">Mỗi xã phường có tài khoản Quản trị xã (WARD_ADMIN) độc lập.</p>
        </div>
        {canManage && <button onClick={onOpenAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm người dùng
        </button>}
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-4">Họ tên</th><th className="p-4">Username</th><th className="p-4">Đơn vị</th><th className="p-4">Vai trò</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y text-sm text-slate-700">
            {users.map((u: any) => {
              const dept = departments.find((d: any) => d.id === u.departmentId);
              return (
                <tr key={u.id}>
                  <td className="p-4 font-semibold">{u.fullName}</td>
                  <td className="p-4 font-mono">@{u.username}</td>
                  <td className="p-4">{dept?.name || 'Chưa gán đơn vị'}</td>
                  <td className="p-4"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">{u.roles.join(', ')}</span></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {canManage && <button onClick={() => onEdit(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>}
                      {canManage && <button onClick={() => onDelete(u.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CriteriaManagementView({ criteriaSets, onOpenAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Bộ Tiêu chí & Điểm số Thành phần</h2>
          <p className="text-xs text-slate-500 mt-0.5">Thêm, sửa, xóa bộ tiêu chí và các tiêu chí chi tiết cùng điểm số tối đa.</p>
        </div>
        <button onClick={onOpenAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm Bộ Tiêu chí
        </button>
      </div>
      <div className="space-y-4">
        {criteriaSets.map((cs: any) => (
          <div key={cs.id} className="p-5 border rounded-2xl bg-white space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{cs.code}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{cs.name}</h3>
                <p className="text-xs text-slate-500">{cs.description} • Tổng điểm: <strong>{cs.totalScore}đ</strong></p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => onEdit(cs)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => onDelete(cs.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase">Các tiêu chí thành phần và thang điểm:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cs.criteria?.map((crit: any) => (
                  <div key={crit.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs border">
                    <div>
                      <span className="font-bold text-slate-900">{crit.code}. {crit.name}</span>
                      <p className="text-slate-500">{crit.description}</p>
                    </div>
                    <span className="font-extrabold text-indigo-600 bg-white px-2.5 py-1 rounded border shadow-2xs">
                      Tối đa: {crit.maxScore}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminView({ auditLogs }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Nhật ký Audit Log</h2>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-3">Thời gian</th><th className="p-3">Hành động</th><th className="p-3">Chi tiết</th></tr></thead>
          <tbody className="divide-y text-xs text-slate-700 font-mono">
            {auditLogs.map((log: any) => (
              <tr key={log.id}><td className="p-3">{new Date(log.createdAt).toLocaleString('vi-VN')}</td><td className="p-3 font-semibold text-indigo-600">{log.action}</td><td className="p-3">{log.newValue}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankingConfigView({ rankingRules, onOpenAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Cấu hình Ngưỡng điểm Xếp loại</h2>
          <p className="text-xs text-slate-500 mt-0.5">Cấu hình chi tiết số điểm Min - Max cho từng loại.</p>
        </div>
        <button onClick={onOpenAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm quy tắc
        </button>
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-4">Tên loại</th><th className="p-4">Điểm Min</th><th className="p-4">Điểm Max</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y text-sm text-slate-700">
            {rankingRules.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.badgeColor}`}>{r.rankName}</span></td>
                <td className="p-4 font-mono font-semibold">{r.minScore}đ</td>
                <td className="p-4 font-mono font-semibold">{r.maxScore}đ</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => onEdit(r)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(r.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
