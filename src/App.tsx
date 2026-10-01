/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Calendar, Users, Award, BookOpen, 
  BarChart3, Settings, ShieldCheck, CheckCircle2, Clock, AlertCircle,
  Plus, Search, Filter, Eye, Edit, Trash2, Send, Lock, Unlock, 
  CheckSquare, UserCheck, FileCheck, Building2, Bell, LogOut, ChevronRight,
  TrendingUp, Layers, Check, X, AlertTriangle, RefreshCw, Key, UserPlus, UserMinus, Upload, Trophy, Paperclip
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [councils, setCouncils] = useState<any[]>([]);
  const [criteriaSets, setCriteriaSets] = useState<any[]>([]);
  const [evaluationRounds, setEvaluationRounds] = useState<any[]>([]);
  const [innovations, setInnovations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scoringSheets, setScoringSheets] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [rankingRules, setRankingRules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modal states
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
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
    field: 'Cải cách hành chính',
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
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, cRes, csRes, erRes, iRes, saRes, ssRes, statRes, rrRes, alRes] = await Promise.all([
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
      ]);

      setUsers(uRes);
      if (!currentUser && uRes.length > 0) setCurrentUser(uRes[0]);
      setDepartments(dRes);
      setCouncils(cRes);
      setCriteriaSets(csRes);
      setEvaluationRounds(erRes);
      setInnovations(iRes);
      setAssignments(saRes);
      setScoringSheets(ssRes);
      setDashboardStats(statRes);
      setRankingRules(rrRes);
      setAuditLogs(alRes);

      if (cRes.length > 0) setRoundForm(prev => ({ ...prev, councilId: cRes[0].id }));
      if (csRes.length > 0) setRoundForm(prev => ({ ...prev, criteriaSetId: csRes[0].id }));
      if (dRes.length > 0) setRoundForm(prev => ({ ...prev, departmentId: dRes[0].id }));
      if (erRes.length > 0) setInnovForm(prev => ({ ...prev, evaluationRoundId: erRes[0].id }));
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

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deptId = currentUser.roles?.includes('WARD_ADMIN') ? currentUser.departmentId : roundForm.departmentId;
      const payload = { ...roundForm, departmentId: deptId };

      const res = await fetch('/api/evaluation-rounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Lỗi tạo đợt');
      showNotification('Tạo đợt xét cho đơn vị thành công!', 'success');
      setShowCreateRoundModal(false);
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-700">
        <div className="text-center"><RefreshCw className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-3" /><p>Đang tải...</p></div>
      </div>
    );
  }

  const myDepartmentRounds = currentUser?.roles?.includes('WARD_ADMIN') 
    ? evaluationRounds.filter(er => er.departmentId === currentUser.departmentId)
    : evaluationRounds;

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
              <p className="text-xs text-slate-400">Phân quyền Quản trị Xã Phường & Huyện</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              className="bg-slate-800 text-sm font-semibold text-indigo-300 rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none"
              value={currentUser?.id}
              onChange={(e) => { const u = users.find(x => x.id === e.target.value); if (u) setCurrentUser(u); }}
            >
              {users.map(u => <option key={u.id} value={u.id} className="bg-slate-900 text-white">{u.fullName} ({u.roles.join(', ')})</option>)}
            </select>
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
            <SidebarItem icon={<Calendar className="w-4 h-4" />} label="3. Đợt xét (Xã & Huyện)" active={activeTab === 'rounds'} onClick={() => setActiveTab('rounds')} />
            <SidebarItem icon={<Users className="w-4 h-4" />} label="4. Hội đồng xét duyệt" active={activeTab === 'councils'} onClick={() => setActiveTab('councils')} />
            <SidebarItem icon={<CheckSquare className="w-4 h-4" />} label="5. Chấm điểm Hội đồng" active={activeTab === 'scoring'} onClick={() => setActiveTab('scoring')} />
            <SidebarItem icon={<Trophy className="w-4 h-4" />} label="6. Xếp loại & Thống kê" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
            <SidebarItem icon={<BookOpen className="w-4 h-4" />} label="7. Kho sáng kiến" active={activeTab === 'repository'} onClick={() => setActiveTab('repository')} />

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mt-6 mb-2">Quản trị</p>
            <SidebarItem icon={<Building2 className="w-4 h-4" />} label="8. Quản lý Đơn vị" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
            <SidebarItem icon={<Users className="w-4 h-4" />} label="9. Quản lý User (Admin Xã)" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={<CheckSquare className="w-4 h-4" />} label="10. Quản lý Bộ tiêu chí" active={activeTab === 'criteria'} onClick={() => setActiveTab('criteria')} />
            <SidebarItem icon={<Award className="w-4 h-4" />} label="11. Cấu hình Xếp loại" active={activeTab === 'ranking-config'} onClick={() => setActiveTab('ranking-config')} />
            <SidebarItem icon={<ShieldCheck className="w-4 h-4" />} label="12. Nhật ký Audit" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView stats={dashboardStats} evaluationRounds={myDepartmentRounds} innovations={innovations} />}
          {activeTab === 'innovations' && <InnovationsView innovations={innovations} onOpenCreate={() => setShowCreateInnovationModal(true)} />}
          {activeTab === 'rounds' && <RoundsView evaluationRounds={myDepartmentRounds} councils={councils} criteriaSets={criteriaSets} currentUser={currentUser} onOpenCreate={() => setShowCreateRoundModal(true)} onFinalize={handleFinalizeScoring} />}
          {activeTab === 'councils' && <CouncilsView councils={councils} users={users} onOpenAdd={() => { setEditingCouncil(null); setCouncilForm({code:'HD-2026', name:'Hội đồng mới', decisionNumber:'01/QĐ', decisionDate:'2026-01-01'}); setShowCouncilModal(true); }} onEdit={(c: any) => { setEditingCouncil(c); setCouncilForm(c); setShowCouncilModal(true); }} onDelete={handleDeleteCouncil} onOpenMembers={(c: any) => { setSelectedCouncilForMembers(c); setShowCouncilMembersModal(true); }} />}
          {activeTab === 'scoring' && <ScoringView evaluationRounds={myDepartmentRounds} assignments={assignments} currentUser={currentUser} councils={councils} scoringSheets={scoringSheets} onOpenScoring={openScoringModal} />}
          {activeTab === 'ranking' && <RankingView innovations={innovations} rankingRules={rankingRules} />}
          {activeTab === 'repository' && <RepositoryView innovations={innovations} />}
          
          {activeTab === 'ranking-config' && <RankingConfigView rankingRules={rankingRules} onOpenAdd={() => { setEditingRankingRule(null); setRankingForm({minScore: 80, maxScore: 90, rankName: 'Loại 2', badgeColor: 'bg-emerald-100 text-emerald-800'}); setShowRankingModal(true); }} onEdit={(r: any) => { setEditingRankingRule(r); setRankingForm(r); setShowRankingModal(true); }} onDelete={handleDeleteRankingRule} />}
          {activeTab === 'departments' && <DepartmentsView departments={departments} />}
          {activeTab === 'users' && <UsersManagementView users={users} departments={departments} />}
          {activeTab === 'criteria' && <CriteriaManagementView criteriaSets={criteriaSets} onOpenAdd={() => { setEditingCriteriaSet(null); setCriteriaSetForm({code:'TC-NEW', name:'Bộ tiêu chí mới', description:'', totalScore:100, criteria:[{code:'C1', name:'Tính mới', maxScore:50, weight:0.5, description:''}, {code:'C2', name:'Hiệu quả', maxScore:50, weight:0.5, description:''}]}); setShowCriteriaSetModal(true); }} onEdit={(cs: any) => { setEditingCriteriaSet(cs); setCriteriaSetForm(cs); setShowCriteriaSetModal(true); }} onDelete={handleDeleteCriteriaSet} />}
          {activeTab === 'admin' && <AdminView auditLogs={auditLogs} />}
        </main>
      </div>

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

      {/* Create Innovation Modal - With Max 3 Authors and Real File Uploads */}
      {showCreateInnovationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Nộp Sáng Kiến (Tối đa 3 tác giả & Đính kèm file)</h3>
            <form onSubmit={handleCreateInnovation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đợt xét</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={innovForm.evaluationRoundId} onChange={e => setInnovForm({...innovForm, evaluationRoundId: e.target.value})}>
                  {evaluationRounds.map(er => <option key={er.id} value={er.id}>{er.name} ({er.department?.name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên sáng kiến</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={innovForm.title} onChange={e => setInnovForm({...innovForm, title: e.target.value})} required placeholder="Nhập tiêu đề sáng kiến..." />
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
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Nộp hồ sơ sáng kiến</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateRoundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tạo Đợt Xét Mới cho Đơn vị / Xã Phường</h3>
            <form onSubmit={handleCreateRound} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Mã đợt</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={roundForm.code} onChange={e => setRoundForm({...roundForm, code: e.target.value})} required /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Tên đợt xét</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" value={roundForm.name} onChange={e => setRoundForm({...roundForm, name: e.target.value})} required /></div>
              {!currentUser?.roles?.includes('WARD_ADMIN') && (
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị / Xã Phường</label><select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={roundForm.departmentId} onChange={e => setRoundForm({...roundForm, departmentId: e.target.value})}>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Hội Đồng</label><select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={roundForm.councilId} onChange={e => setRoundForm({...roundForm, councilId: e.target.value})}>{councils.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Bộ Tiêu Chí</label><select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={roundForm.criteriaSetId} onChange={e => setRoundForm({...roundForm, criteriaSetId: e.target.value})}>{criteriaSets.map(cs => <option key={cs.id} value={cs.id}>{cs.name}</option>)}</select></div>
              </div>
              <div className="flex justify-end space-x-2 pt-4"><button type="button" onClick={() => setShowCreateRoundModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Tạo đợt xét</button></div>
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

function InnovationsView({ innovations, onOpenCreate }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Sáng kiến (Tối đa 3 tác giả & File đính kèm)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Hiển thị danh sách tác giả đầy đủ và các tài liệu đính kèm báo cáo.</p>
        </div>
        <button onClick={onOpenCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Nộp sáng kiến mới
        </button>
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
            {innovations.map((inv: any) => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoundsView({ evaluationRounds, councils, criteriaSets, currentUser, onOpenCreate, onFinalize }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Đợt xét Sáng kiến & Chốt dữ liệu đơn vị</h2>
          {currentUser?.roles?.includes('WARD_ADMIN') && <p className="text-xs text-indigo-600 font-medium">Bạn đang quản lý với tư cách Admin Xã Phường</p>}
        </div>
        <button onClick={onOpenCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Tạo đợt xét cho đơn vị</button>
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
            {!er.isScoringFinalized && (
              <div className="pt-2 border-t flex justify-end">
                <button onClick={() => onFinalize(er.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-700">
                  <Lock className="w-3.5 h-3.5" /> Chốt dữ liệu đợt xét của đơn vị
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CouncilsView({ councils, onOpenAdd, onOpenMembers, onEdit, onDelete }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Quản lý Hội đồng Xét duyệt</h2>
        <button onClick={onOpenAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Thêm Hội đồng</button>
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
              <button onClick={() => onEdit(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
              <button onClick={() => onDelete(c.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringView({ evaluationRounds, assignments, currentUser, councils, scoringSheets, onOpenScoring }: any) {
  const [selectedRoundId, setSelectedRoundId] = useState(evaluationRounds[0]?.id || '');
  const selectedRound = evaluationRounds.find((er: any) => er.id === selectedRoundId);
  const roundAssignments = assignments.filter((a: any) => a.evaluationRoundId === selectedRoundId && (a.userId === currentUser.id || currentUser.roles?.includes('ADMIN')));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Chấm điểm Hội đồng theo Đợt xét</h2>
        <select className="border rounded-xl px-3 py-1.5 text-sm font-semibold bg-white text-indigo-600" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
          {evaluationRounds.map((er: any) => <option key={er.id} value={er.id}>{er.name} ({er.department?.name})</option>)}
        </select>
      </div>
      {selectedRound?.isScoringFinalized && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 font-semibold">🔒 Đợt xét của đơn vị này đã chốt dữ liệu.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roundAssignments.map((asg: any) => {
          const sheet = scoringSheets.find((ss: any) => ss.assignmentId === asg.id && ss.userId === currentUser.id);
          return (
            <div key={asg.id} className="p-5 border rounded-2xl bg-white space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-slate-900">{asg.innovation?.title}</h3>
              {sheet && <p className="text-xs font-bold text-emerald-600">Đã chấm: {sheet.totalScore}đ</p>}
              <div className="pt-2 border-t flex justify-end">
                <button onClick={() => onOpenScoring(asg)} disabled={selectedRound?.isScoringFinalized} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">Chấm điểm</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingView({ innovations, rankingRules }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Xếp loại & Thống kê Điểm số</h2>
        <p className="text-xs text-slate-500 mt-0.5">Phân loại dựa trên cấu hình ngưỡng điểm động.</p>
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
            {innovations.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-4 font-semibold text-slate-900">{inv.title}</td>
                <td className="p-4">{inv.evaluationRound?.department?.name}</td>
                <td className="p-4 font-bold text-indigo-600">{inv.averageScore !== null ? `${inv.averageScore}đ` : 'Chưa có'}</td>
                <td className="p-4"><span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">{inv.rankResult}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RepositoryView({ innovations }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Kho Tra Cứu Sáng Kiến</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {innovations.map((inv: any) => (
          <div key={inv.id} className="p-5 border rounded-2xl bg-white space-y-2">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{inv.field}</span>
            <h3 className="text-base font-bold text-slate-900">{inv.title}</h3>
            <p className="text-xs text-slate-600">{inv.solutionDescription}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentsView({ departments }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Quản lý Đơn vị (Xã/Phường & Phòng ban)</h2>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-4">Mã</th><th className="p-4">Tên đơn vị / Xã phường</th><th className="p-4">Loại cơ cấu</th></tr></thead>
          <tbody className="divide-y text-sm text-slate-700">
            {departments.map((d: any) => (
              <tr key={d.id}><td className="p-4 font-mono">{d.code}</td><td className="p-4 font-semibold">{d.name}</td><td className="p-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{d.type}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersManagementView({ users, departments }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Quản lý Người dùng & Admin Xã Phường</h2>
        <p className="text-xs text-slate-500 mt-0.5">Mỗi xã phường có tài khoản Quản trị xã (WARD_ADMIN) độc lập.</p>
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-600 border-b"><th className="p-4">Họ tên</th><th className="p-4">Username</th><th className="p-4">Đơn vị</th><th className="p-4">Vai trò</th></tr></thead>
          <tbody className="divide-y text-sm text-slate-700">
            {users.map((u: any) => {
              const dept = departments.find((d: any) => d.id === u.departmentId);
              return (
                <tr key={u.id}>
                  <td className="p-4 font-semibold">{u.fullName}</td>
                  <td className="p-4 font-mono">@{u.username}</td>
                  <td className="p-4">{dept?.name || 'Cấp huyện'}</td>
                  <td className="p-4"><span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded">{u.roles.join(', ')}</span></td>
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
