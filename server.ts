import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock database store
let db = {
  users: [
    { id: 'u-admin', username: 'admin', fullName: 'Nguyễn Văn Quản Trị Huyện', email: 'admin@huyen.gov.vn', phone: '0901234567', departmentId: 'd-1', position: 'Trưởng phòng CNTT Huyện', isActive: true, roles: ['ADMIN', 'MANAGER'], createdAt: new Date().toISOString() },
    { id: 'u-ward-admin', username: 'admin_xaa', fullName: 'Phạm Văn Quản Trị Xã A', email: 'adminxaa@sangkien.gov.vn', phone: '0909999999', departmentId: 'd-3', position: 'Chủ tịch / Quản trị Sáng kiến Xã A', isActive: true, roles: ['WARD_ADMIN', 'MANAGER'], createdAt: new Date().toISOString() },
    { id: 'u-secretary', username: 'thu_ky', fullName: 'Trần Thị Thư Ký', email: 'thuky@sangkien.gov.vn', phone: '0902345678', departmentId: 'd-1', position: 'Chuyên viên tổng hợp', isActive: true, roles: ['SECRETARY', 'MANAGER'], createdAt: new Date().toISOString() },
    { id: 'u-chair', username: 'chu_tich', fullName: 'GS.TS Lê Văn Chủ Tịch', email: 'chutich@sangkien.gov.vn', phone: '0903456789', departmentId: 'd-2', position: 'Viện trưởng', isActive: true, roles: ['COUNCIL_CHAIR', 'COUNCIL_MEMBER'], createdAt: new Date().toISOString() },
    { id: 'u-member1', username: 'thanh_vien_1', fullName: 'PGS.TS Phạm Văn Thành Viên 1', email: 'tv1@sangkien.gov.vn', phone: '0904567890', departmentId: 'd-2', position: 'Trưởng khoa', isActive: true, roles: ['COUNCIL_MEMBER'], createdAt: new Date().toISOString() },
    { id: 'u-member2', username: 'thanh_vien_2', fullName: 'ThS. Hoàng Thị Thành Viên 2', email: 'tv2@sangkien.gov.vn', phone: '0905678901', departmentId: 'd-3', position: 'Giảng viên chính', isActive: true, roles: ['COUNCIL_MEMBER'], createdAt: new Date().toISOString() },
    { id: 'u-author1', username: 'tac_gia_1', fullName: 'Đỗ Văn Sáng - Cán bộ Xã A', email: 'tacgia1@sangkien.gov.vn', phone: '0906789012', departmentId: 'd-3', position: 'Công chức Xã A', isActive: true, roles: ['SUBMITTER'], createdAt: new Date().toISOString() },
    { id: 'u-author2', username: 'tac_gia_2', fullName: 'Lê Thị Hà - Cán bộ Xã A', email: 'tacgia2@sangkien.gov.vn', phone: '0907890123', departmentId: 'd-3', position: 'Địa chính Xã A', isActive: true, roles: ['SUBMITTER'], createdAt: new Date().toISOString() },
    { id: 'u-author3', username: 'tac_gia_3', fullName: 'Trần Minh Quân - Cán bộ Xã A', email: 'tacgia3@sangkien.gov.vn', phone: '0908901234', departmentId: 'd-3', position: 'Tư pháp Xã A', isActive: true, roles: ['SUBMITTER'], createdAt: new Date().toISOString() },
  ],
  departments: [
    { id: 'd-1', parentId: null, code: 'UBND-HUYEN', name: 'UBND Quận / Huyện', type: 'COQUAN_CAP_HUYEN', isActive: true },
    { id: 'd-2', parentId: 'd-1', code: 'PKH', name: 'Phòng Khoa học & Công nghệ', type: 'PHONG_BAN_HUYEN', isActive: true },
    { id: 'd-3', parentId: null, code: 'XP-A', name: 'UBND Xã Phường A', type: 'XA_PHUONG', isActive: true },
    { id: 'd-4', parentId: null, code: 'XP-B', name: 'UBND Xã Phường B', type: 'XA_PHUONG', isActive: true },
  ],
  councils: [
    {
      id: 'c-1',
      code: 'HD-2026-HUYEN',
      name: 'Hội đồng Khoa học Công nghệ Cấp Huyện năm 2026',
      decisionNumber: '128/QĐ-SK',
      decisionDate: '2026-01-15',
      establishingAuthority: 'Chủ tịch UBND Huyện',
      field: 'Khoa học công nghệ & Cải cách hành chính',
      description: 'Hội đồng xét duyệt cấp huyện và liên xã.',
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
      description: 'Áp dụng chung cho cấp huyện và xã phường.',
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
      name: 'Đợt xét sáng kiến Quý I năm 2026 (Cấp Huyện)',
      year: 2026,
      departmentId: 'd-1',
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

function calculateRank(score: number) {
  for (const rule of db.rankingRules) {
    if (score >= rule.minScore && (rule.maxScore === 100 ? score <= 100 : score < rule.maxScore)) {
      return rule.rankName;
    }
  }
  return 'Chưa đạt';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // --- USERS ---
  app.get('/api/users', (req, res) => res.json(db.users));
  app.post('/api/users', (req, res) => {
    const newUser = { id: 'u-' + Date.now(), createdAt: new Date().toISOString(), ...req.body };
    db.users.push(newUser);
    res.status(201).json(newUser);
  });
  app.put('/api/users/:id', (req, res) => {
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.users[idx] = { ...db.users[idx], ...req.body };
    res.json(db.users[idx]);
  });
  app.delete('/api/users/:id', (req, res) => {
    db.users = db.users.filter(u => u.id !== req.params.id);
    res.json({ success: true });
  });

  // --- DEPARTMENTS ---
  app.get('/api/departments', (req, res) => res.json(db.departments));
  app.post('/api/departments', (req, res) => {
    const newDept = { id: 'd-' + Date.now(), ...req.body };
    db.departments.push(newDept);
    res.status(201).json(newDept);
  });
  app.put('/api/departments/:id', (req, res) => {
    const idx = db.departments.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.departments[idx] = { ...db.departments[idx], ...req.body };
    res.json(db.departments[idx]);
  });
  app.delete('/api/departments/:id', (req, res) => {
    db.departments = db.departments.filter(d => d.id !== req.params.id);
    res.json({ success: true });
  });

  // --- COUNCILS ---
  app.get('/api/councils', (req, res) => {
    const councilsWithMembers = db.councils.map(c => ({
      ...c,
      members: db.councilMembers.filter(cm => cm.councilId === c.id).map(cm => ({
        ...cm,
        user: db.users.find(u => u.id === cm.userId)
      }))
    }));
    res.json(councilsWithMembers);
  });
  app.post('/api/councils', (req, res) => {
    const councilId = 'c-' + Date.now();
    const newCouncil = { id: councilId, createdAt: new Date().toISOString(), ...req.body };
    db.councils.push(newCouncil);
    res.status(201).json(newCouncil);
  });
  app.put('/api/councils/:id', (req, res) => {
    const idx = db.councils.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.councils[idx] = { ...db.councils[idx], ...req.body };
    res.json(db.councils[idx]);
  });
  app.delete('/api/councils/:id', (req, res) => {
    db.councils = db.councils.filter(c => c.id !== req.params.id);
    db.councilMembers = db.councilMembers.filter(cm => cm.councilId !== req.params.id);
    res.json({ success: true });
  });
  app.post('/api/councils/:id/members', (req, res) => {
    const newMember = { id: 'cm-' + Date.now(), councilId: req.params.id, ...req.body, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true };
    db.councilMembers.push(newMember);
    res.status(201).json(newMember);
  });
  app.delete('/api/councils/:id/members/:memberId', (req, res) => {
    db.councilMembers = db.councilMembers.filter(cm => cm.id !== req.params.memberId);
    res.json({ success: true });
  });

  // --- CRITERIA SETS & CRITERIA CRUD ---
  app.get('/api/criteria-sets', (req, res) => {
    const sets = db.criteriaSets.map(cs => ({ ...cs, criteria: db.criteria.filter(c => c.criteriaSetId === cs.id) }));
    res.json(sets);
  });
  app.post('/api/criteria-sets', (req, res) => {
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
    const csId = req.params.id;
    db.criteriaSets = db.criteriaSets.filter(cs => cs.id !== csId);
    db.criteria = db.criteria.filter(c => c.criteriaSetId !== csId);
    res.json({ success: true });
  });

  // --- RANKING RULES ---
  app.get('/api/ranking-rules', (req, res) => res.json(db.rankingRules));
  app.post('/api/ranking-rules', (req, res) => {
    const newRule = { id: 'rr-' + Date.now(), ...req.body };
    db.rankingRules.push(newRule);
    res.status(201).json(newRule);
  });
  app.put('/api/ranking-rules/:id', (req, res) => {
    const idx = db.rankingRules.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db.rankingRules[idx] = { ...db.rankingRules[idx], ...req.body };
    res.json(db.rankingRules[idx]);
  });
  app.delete('/api/ranking-rules/:id', (req, res) => {
    db.rankingRules = db.rankingRules.filter(r => r.id !== req.params.id);
    res.json({ success: true });
  });

  // --- EVALUATION ROUNDS ---
  app.get('/api/evaluation-rounds', (req, res) => {
    const { departmentId } = req.query;
    let rounds = db.evaluationRounds;
    if (departmentId) {
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
    const roundId = 'er-' + Date.now();
    const newRound = { id: roundId, status: 'SCORING', isScoringFinalized: false, createdAt: new Date().toISOString(), ...req.body };
    db.evaluationRounds.push(newRound);
    res.status(201).json(newRound);
  });

  app.post('/api/evaluation-rounds/:id/finalize-scoring', (req, res) => {
    const round = db.evaluationRounds.find(er => er.id === req.params.id);
    if (!round) return res.status(404).json({ error: 'Not found' });
    round.isScoringFinalized = true;
    round.status = 'COUNCIL_REVIEW';
    res.json({ success: true, message: 'Đã chốt dữ liệu chấm cho đơn vị thành công!' });
  });

  // --- INNOVATIONS (WITH UP TO 3 AUTHORS AND REAL FILE ATTACHMENTS) ---
  app.get('/api/innovations', (req, res) => {
    const innovations = db.innovations.map(inv => {
      const sheets = db.scoringSheets.filter(ss => ss.innovationId === inv.id && ss.status === 'SUBMITTED');
      const avgScore = sheets.length > 0 ? sheets.reduce((acc, curr) => acc + curr.totalScore, 0) / sheets.length : null;
      const rank = avgScore !== null ? calculateRank(avgScore) : 'Chưa chấm';
      return {
        ...inv,
        evaluationRound: db.evaluationRounds.find(er => er.id === inv.evaluationRoundId),
        submitter: db.users.find(u => u.id === inv.submitterId),
        authors: db.innovationAuthors.filter(ia => ia.innovationId === inv.id),
        attachments: db.innovationAttachments.filter(att => att.innovationId === inv.id),
        averageScore: avgScore !== null ? Number(avgScore.toFixed(2)) : null,
        rankResult: rank
      };
    });
    res.json(innovations);
  });

  app.post('/api/innovations', (req, res) => {
    const { authors, attachments, ...invData } = req.body;
    if (authors && Array.isArray(authors) && authors.length > 3) {
      return res.status(400).json({ error: 'Mỗi sáng kiến tối đa 3 tác giả!' });
    }
    const invId = 'inv-' + Date.now();
    const newInv = { id: invId, code: `SK-${Math.floor(100 + Math.random()*900)}`, status: 'SUBMITTED', createdAt: new Date().toISOString(), ...invData };
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
          uploadedBy: req.body.submitterId || 'u-author1',
          uploadedAt: new Date().toISOString()
        });
      });
    }

    res.status(201).json(newInv);
  });

  // --- SCORING ---
  app.get('/api/scoring-assignments', (req, res) => {
    const assignments = db.scoringAssignments.map(sa => ({
      ...sa,
      innovation: db.innovations.find(i => i.id === sa.innovationId),
      user: db.users.find(u => u.id === sa.userId),
      evaluationRound: db.evaluationRounds.find(er => er.id === sa.evaluationRoundId)
    }));
    res.json(assignments);
  });

  app.get('/api/scoring-sheets', (req, res) => {
    const sheets = db.scoringSheets.map(ss => ({
      ...ss,
      details: db.scoringDetails.filter(sd => sd.scoringSheetId === ss.id),
      innovation: db.innovations.find(i => i.id === ss.innovationId),
      user: db.users.find(u => u.id === ss.userId)
    }));
    res.json(sheets);
  });

  app.post('/api/scoring-sheets', (req, res) => {
    const { assignmentId, innovationId, evaluationRoundId, userId, details, generalComment, recommendation, status } = req.body;
    const round = db.evaluationRounds.find(er => er.id === evaluationRoundId);
    if (round?.isScoringFinalized) return res.status(400).json({ error: 'Đợt xét đã chốt dữ liệu!' });

    let calculatedTotal = 0;
    if (details && Array.isArray(details)) {
      for (const d of details) {
        calculatedTotal += Number(d.score);
      }
    }

    const existingSheetIdx = db.scoringSheets.findIndex(ss => ss.assignmentId === assignmentId && ss.userId === userId);
    let sheetId = 'ss-' + Date.now();
    if (existingSheetIdx !== -1) {
      sheetId = db.scoringSheets[existingSheetIdx].id;
      db.scoringSheets[existingSheetIdx] = { ...db.scoringSheets[existingSheetIdx], totalScore: calculatedTotal, generalComment, recommendation, status: status || 'DRAFT', updatedAt: new Date().toISOString() };
      db.scoringDetails = db.scoringDetails.filter(sd => sd.scoringSheetId !== sheetId);
    } else {
      db.scoringSheets.push({ id: sheetId, assignmentId, innovationId, evaluationRoundId, userId, totalScore: calculatedTotal, generalComment, recommendation, status: status || 'DRAFT', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    if (details && Array.isArray(details)) {
      details.forEach((d: any, idx: number) => {
        db.scoringDetails.push({ id: 'sd-' + Date.now() + '-' + idx, scoringSheetId: sheetId, criteriaId: d.criteriaId, score: d.score, comment: d.comment || '' });
      });
    }

    res.json({ success: true, totalScore: calculatedTotal, rank: calculateRank(calculatedTotal) });
  });

  app.get('/api/dashboard/stats', (req, res) => {
    res.json({
      totalInnovations: db.innovations.length,
      recognized: db.innovations.filter(i => i.status === 'RECOGNIZED').length,
      totalCouncils: db.councils.length,
      totalUsers: db.users.length,
      totalDepartments: db.departments.length
    });
  });

  app.get('/api/audit-logs', (req, res) => res.json(db.auditLogs));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: false } });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'dist', 'index.html')); });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => { console.log(`Server running at http://0.0.0.0:${port}`); });
}

startServer();
