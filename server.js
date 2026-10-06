var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_config2 = require("dotenv/config");
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_url = require("url");

// database.ts
var import_config = require("dotenv/config");
var import_pg = require("pg");
var DATABASE_URL = process.env.DATABASE_URL;
var pool = DATABASE_URL ? new import_pg.Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : void 0
}) : null;
async function initializeDatabase(initialState) {
  if (!pool) {
    throw new Error("DATABASE_URL is required to start the application.");
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const result = await pool.query(
    "SELECT state FROM app_state WHERE id = 1"
  );
  if (result.rowCount === 0) {
    await pool.query(
      "INSERT INTO app_state (id, state) VALUES (1, $1::jsonb)",
      [JSON.stringify(initialState)]
    );
    return initialState;
  }
  return result.rows[0].state;
}
async function persistDatabase(state) {
  if (!pool) {
    throw new Error("DATABASE_URL is required to persist application data.");
  }
  await pool.query(
    "UPDATE app_state SET state = $1::jsonb, updated_at = NOW() WHERE id = 1",
    [JSON.stringify(state)]
  );
}
async function closeDatabase() {
  if (!pool) {
    return;
  }
  await pool.end();
}

// auth.ts
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}
function authenticateUser(users, username, password) {
  const normalizedUsername = String(username ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");
  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }
  return users.find((user) => {
    const currentUsername = String(user?.username ?? "").trim().toLowerCase();
    const currentPassword = String(user?.password ?? "");
    return currentUsername === normalizedUsername && currentPassword === normalizedPassword;
  }) ?? null;
}

// server.ts
var import_meta = {};
var __dirname = import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
var db = {
  users: [
    { id: "u-admin", username: "admin", password: "123456", fullName: "Nguy\u1EC5n V\u0103n Qu\u1EA3n Tr\u1ECB Ph\u01B0\u1EDDng A", email: "admin@sangkien.gov.vn", phone: "0901234567", departmentId: "d-1", position: "Qu\u1EA3n tr\u1ECB h\u1EC7 th\u1ED1ng", isActive: true, roles: ["ADMIN", "MANAGER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-ward-admin", username: "admin_xaa", password: "123456", fullName: "Ph\u1EA1m V\u0103n Qu\u1EA3n Tr\u1ECB X\xE3 A", email: "adminxaa@sangkien.gov.vn", phone: "0909999999", departmentId: "d-3", position: "Ch\u1EE7 t\u1ECBch / Qu\u1EA3n tr\u1ECB S\xE1ng ki\u1EBFn X\xE3 A", isActive: true, roles: ["WARD_ADMIN", "MANAGER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-secretary", username: "thu_ky", password: "123456", fullName: "Tr\u1EA7n Th\u1ECB Th\u01B0 K\xFD", email: "thuky@sangkien.gov.vn", phone: "0902345678", departmentId: "d-1", position: "Chuy\xEAn vi\xEAn t\u1ED5ng h\u1EE3p", isActive: true, roles: ["SECRETARY", "MANAGER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-chair", username: "chu_tich", password: "123456", fullName: "GS.TS L\xEA V\u0103n Ch\u1EE7 T\u1ECBch", email: "chutich@sangkien.gov.vn", phone: "0903456789", departmentId: "d-2", position: "Vi\u1EC7n tr\u01B0\u1EDFng", isActive: true, roles: ["COUNCIL_CHAIR", "COUNCIL_MEMBER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-member1", username: "thanh_vien_1", password: "123456", fullName: "PGS.TS Ph\u1EA1m V\u0103n Th\xE0nh Vi\xEAn 1", email: "tv1@sangkien.gov.vn", phone: "0904567890", departmentId: "d-2", position: "Tr\u01B0\u1EDFng khoa", isActive: true, roles: ["COUNCIL_MEMBER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-member2", username: "thanh_vien_2", password: "123456", fullName: "ThS. Ho\xE0ng Th\u1ECB Th\xE0nh Vi\xEAn 2", email: "tv2@sangkien.gov.vn", phone: "0905678901", departmentId: "d-3", position: "Gi\u1EA3ng vi\xEAn ch\xEDnh", isActive: true, roles: ["COUNCIL_MEMBER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-author1", username: "tac_gia_1", password: "123456", fullName: "\u0110\u1ED7 V\u0103n S\xE1ng - C\xE1n b\u1ED9 X\xE3 A", email: "tacgia1@sangkien.gov.vn", phone: "0906789012", departmentId: "d-3", position: "C\xF4ng ch\u1EE9c X\xE3 A", isActive: true, roles: ["SUBMITTER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-author2", username: "tac_gia_2", password: "123456", fullName: "L\xEA Th\u1ECB H\xE0 - C\xE1n b\u1ED9 X\xE3 A", email: "tacgia2@sangkien.gov.vn", phone: "0907890123", departmentId: "d-3", position: "\u0110\u1ECBa ch\xEDnh X\xE3 A", isActive: true, roles: ["SUBMITTER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "u-author3", username: "tac_gia_3", password: "123456", fullName: "Tr\u1EA7n Minh Qu\xE2n - C\xE1n b\u1ED9 X\xE3 A", email: "tacgia3@sangkien.gov.vn", phone: "0908901234", departmentId: "d-3", position: "T\u01B0 ph\xE1p X\xE3 A", isActive: true, roles: ["SUBMITTER"], createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ],
  departments: [
    { id: "d-1", parentId: "d-3", code: "VP-UBND-A", name: "V\u0103n ph\xF2ng H\u0110ND v\xE0 UBND Ph\u01B0\u1EDDng A", type: "PHONG_BAN_XA_PHUONG", isActive: true },
    { id: "d-2", parentId: "d-3", code: "P-KT-A", name: "Ph\xF2ng Kinh t\u1EBF, H\u1EA1 t\u1EA7ng v\xE0 \u0110\xF4 th\u1ECB Ph\u01B0\u1EDDng A", type: "PHONG_BAN_XA_PHUONG", isActive: true },
    { id: "d-3", parentId: null, code: "XP-A", name: "UBND Ph\u01B0\u1EDDng A", type: "XA_PHUONG", isActive: true },
    { id: "d-4", parentId: null, code: "XP-B", name: "UBND Ph\u01B0\u1EDDng B", type: "XA_PHUONG", isActive: true }
  ],
  councils: [
    {
      id: "c-1",
      code: "HD-2026-XAA",
      name: "H\u1ED9i \u0111\u1ED3ng x\xE9t duy\u1EC7t s\xE1ng ki\u1EBFn Ph\u01B0\u1EDDng A n\u0103m 2026",
      decisionNumber: "128/Q\u0110-SK",
      decisionDate: "2026-01-15",
      establishingAuthority: "Ch\u1EE7 t\u1ECBch UBND Ph\u01B0\u1EDDng A",
      field: "Khoa h\u1ECDc c\xF4ng ngh\u1EC7 & C\u1EA3i c\xE1ch h\xE0nh ch\xEDnh",
      description: "H\u1ED9i \u0111\u1ED3ng x\xE9t duy\u1EC7t s\xE1ng ki\u1EBFn thu\u1ED9c Ph\u01B0\u1EDDng A.",
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "c-xa-a",
      code: "HD-2026-XAA",
      name: "H\u1ED9i \u0111\u1ED3ng S\xE1ng ki\u1EBFn UBND X\xE3 Ph\u01B0\u1EDDng A",
      decisionNumber: "05/Q\u0110-UBND-XAA",
      decisionDate: "2026-02-01",
      establishingAuthority: "Ch\u1EE7 t\u1ECBch UBND X\xE3 A",
      field: "S\xE1ng ki\u1EBFn c\u01A1 s\u1EDF X\xE3 A",
      description: "H\u1ED9i \u0111\u1ED3ng x\xE9t duy\u1EC7t s\xE1ng ki\u1EBFn n\u1ED9i b\u1ED9 X\xE3 A.",
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  councilMembers: [
    { id: "cm-1", councilId: "c-1", userId: "u-chair", councilRole: "CHAIRMAN", startDate: "2026-01-15", endDate: "2026-12-31", isActive: true },
    { id: "cm-2", councilId: "c-1", userId: "u-secretary", councilRole: "SECRETARY", startDate: "2026-01-15", endDate: "2026-12-31", isActive: true },
    { id: "cm-3", councilId: "c-1", userId: "u-member1", councilRole: "MEMBER", startDate: "2026-01-15", endDate: "2026-12-31", isActive: true },
    { id: "cm-4", councilId: "c-1", userId: "u-member2", councilRole: "MEMBER", startDate: "2026-01-15", endDate: "2026-12-31", isActive: true },
    // Xã A members
    { id: "cm-5", councilId: "c-xa-a", userId: "u-ward-admin", councilRole: "CHAIRMAN", startDate: "2026-02-01", endDate: "2026-12-31", isActive: true },
    { id: "cm-6", councilId: "c-xa-a", userId: "u-member2", councilRole: "MEMBER", startDate: "2026-02-01", endDate: "2026-12-31", isActive: true }
  ],
  criteriaSets: [
    {
      id: "cs-1",
      version: 1,
      parentCriteriaSetId: null,
      code: "TC-2026-V1",
      name: "B\u1ED9 ti\xEAu chu\u1EA9n ch\u1EA5m s\xE1ng ki\u1EBFn chu\u1EA9n n\u0103m 2026",
      description: "\xC1p d\u1EE5ng cho c\xE1c x\xE3, ph\u01B0\u1EDDng v\xE0 ph\xF2ng chuy\xEAn m\xF4n tr\u1EF1c thu\u1ED9c.",
      totalScore: 100,
      isActive: true
    }
  ],
  criteria: [
    { id: "crit-1", criteriaSetId: "cs-1", code: "C1", name: "T\xEDnh m\u1EDBi, t\xEDnh s\xE1ng t\u1EA1o", description: "Gi\u1EA3i ph\xE1p ch\u01B0a t\u1EEBng \xE1p d\u1EE5ng.", maxScore: 30, weight: 0.3, sortOrder: 1, isRequired: true, minimumRequiredScore: 15 },
    { id: "crit-2", criteriaSetId: "cs-1", code: "C2", name: "Kh\u1EA3 n\u0103ng \xE1p d\u1EE5ng th\u1EF1c ti\u1EC5n", description: "D\u1EC5 tri\u1EC3n khai.", maxScore: 20, weight: 0.2, sortOrder: 2, isRequired: true, minimumRequiredScore: 10 },
    { id: "crit-3", criteriaSetId: "cs-1", code: "C3", name: "Hi\u1EC7u qu\u1EA3 kinh t\u1EBF - x\xE3 h\u1ED9i", description: "L\u1EE3i \xEDch thi\u1EBFt th\u1EF1c.", maxScore: 30, weight: 0.3, sortOrder: 3, isRequired: true, minimumRequiredScore: 15 },
    { id: "crit-4", criteriaSetId: "cs-1", code: "C4", name: "Ph\u1EA1m vi \u1EA3nh h\u01B0\u1EDFng", description: "Nh\xE2n r\u1ED9ng.", maxScore: 20, weight: 0.2, sortOrder: 4, isRequired: true, minimumRequiredScore: 8 }
  ],
  evaluationRounds: [
    {
      id: "er-1",
      code: "DOT-Q1-2026",
      name: "\u0110\u1EE3t x\xE9t s\xE1ng ki\u1EBFn Qu\xFD I n\u0103m 2026 c\u1EE7a Ph\u01B0\u1EDDng A",
      year: 2026,
      departmentId: "d-3",
      councilId: "c-1",
      criteriaSetId: "cs-1",
      status: "SCORING",
      isScoringFinalized: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "er-xaa",
      code: "DOT-XAA-2026",
      name: "\u0110\u1EE3t x\xE9t s\xE1ng ki\u1EBFn n\u0103m 2026 c\u1EE7a UBND X\xE3 Ph\u01B0\u1EDDng A",
      year: 2026,
      departmentId: "d-3",
      councilId: "c-xa-a",
      criteriaSetId: "cs-1",
      status: "SCORING",
      isScoringFinalized: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  innovations: [
    {
      id: "inv-1",
      evaluationRoundId: "er-xaa",
      code: "SK-XAA-001",
      title: "H\u1EC7 th\u1ED1ng s\u1ED1 h\xF3a th\u1EE7 t\u1EE5c h\u1ED9 t\u1ECBch t\u1EA1i X\xE3 Ph\u01B0\u1EDDng A",
      field: "C\u1EA3i c\xE1ch h\xE0nh ch\xEDnh",
      solutionDescription: "S\u1ED1 h\xF3a to\xE0n b\u1ED9 h\u1ED3 s\u01A1 h\u1ED9 t\u1ECBch l\u01B0u tr\u1EEF.",
      applyingOrganization: "UBND X\xE3 Ph\u01B0\u1EDDng A",
      submitterId: "u-author1",
      status: "SCORING",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  innovationAuthors: [
    { id: "ia-1", innovationId: "inv-1", userId: "u-author1", fullName: "\u0110\u1ED7 V\u0103n S\xE1ng - C\xE1n b\u1ED9 X\xE3 A", organization: "UBND X\xE3 Ph\u01B0\u1EDDng A", isMainAuthor: true },
    { id: "ia-2", innovationId: "inv-1", userId: "u-author2", fullName: "L\xEA Th\u1ECB H\xE0 - C\xE1n b\u1ED9 X\xE3 A", organization: "UBND X\xE3 Ph\u01B0\u1EDDng A", isMainAuthor: false },
    { id: "ia-3", innovationId: "inv-1", userId: "u-author3", fullName: "Tr\u1EA7n Minh Qu\xE2n - C\xE1n b\u1ED9 X\xE3 A", organization: "UBND X\xE3 Ph\u01B0\u1EDDng A", isMainAuthor: false }
  ],
  innovationAttachments: [
    { id: "att-1", innovationId: "inv-1", fileName: "Mo_ta_sang_kien_chinh_thuc.pdf", originalFileName: "Mo_ta_sang_kien_chinh_thuc.pdf", fileSize: "2.4 MB", fileType: "PDF", uploadedBy: "u-author1", uploadedAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "att-2", innovationId: "inv-1", fileName: "Bao_cao_hieu_qua_thuc_te.xlsx", originalFileName: "Bao_cao_hieu_qua_thuc_te.xlsx", fileSize: "1.8 MB", fileType: "XLSX", uploadedBy: "u-author1", uploadedAt: (/* @__PURE__ */ new Date()).toISOString() }
  ],
  scoringAssignments: [
    { id: "sa-1", evaluationRoundId: "er-xaa", innovationId: "inv-1", userId: "u-member2", assignedBy: "u-ward-admin", assignedAt: (/* @__PURE__ */ new Date()).toISOString(), deadline: "2026-03-30", status: "IN_PROGRESS" }
  ],
  scoringSheets: [],
  scoringDetails: [],
  rankingRules: [
    { id: "rr-1", minScore: 90, maxScore: 100, rankName: "Lo\u1EA1i 1 (Xu\u1EA5t s\u1EAFc)", badgeColor: "bg-purple-100 text-purple-800" },
    { id: "rr-2", minScore: 80, maxScore: 90, rankName: "Lo\u1EA1i 2 (Gi\u1ECFi)", badgeColor: "bg-emerald-100 text-emerald-800" },
    { id: "rr-3", minScore: 70, maxScore: 80, rankName: "Lo\u1EA1i 3 (Kh\xE1)", badgeColor: "bg-blue-100 text-blue-800" },
    { id: "rr-4", minScore: 60, maxScore: 70, rankName: "Khuy\u1EBFn kh\xEDch", badgeColor: "bg-amber-100 text-amber-800" },
    { id: "rr-5", minScore: 0, maxScore: 60, rankName: "Ch\u01B0a \u0111\u1EA1t", badgeColor: "bg-rose-100 text-rose-800" }
  ],
  auditLogs: []
};
function migrateDepartmentHierarchy() {
  const departments = db.departments;
  const original = JSON.stringify(db);
  let wards = departments.filter((department) => department.type === "XA_PHUONG");
  if (wards.length === 0) {
    const ward = {
      id: "d-3",
      parentId: null,
      code: "XP-A",
      name: "UBND Ph\u01B0\u1EDDng A",
      type: "XA_PHUONG",
      isActive: true
    };
    departments.push(ward);
    wards = [ward];
  }
  const defaultWard = wards.find((ward) => ward.id === "d-3") || wards[0];
  for (const department of departments) {
    if (department.type === "XA_PHUONG") {
      department.parentId = null;
      continue;
    }
    department.type = "PHONG_BAN_XA_PHUONG";
    if (department.id === "d-1") {
      department.code = "VP-UBND-A";
      department.name = "V\u0103n ph\xF2ng H\u0110ND v\xE0 UBND Ph\u01B0\u1EDDng A";
    } else if (department.id === "d-2") {
      department.code = "P-KT-A";
      department.name = "Ph\xF2ng Kinh t\u1EBF, H\u1EA1 t\u1EA7ng v\xE0 \u0110\xF4 th\u1ECB Ph\u01B0\u1EDDng A";
    }
    const parent = departments.find((candidate) => candidate.id === department.parentId);
    if (!parent || parent.type !== "XA_PHUONG") {
      department.parentId = defaultWard.id;
    }
  }
  const admin = db.users.find((user) => user.id === "u-admin");
  if (admin) {
    admin.fullName = "Nguy\u1EC5n V\u0103n Qu\u1EA3n Tr\u1ECB Ph\u01B0\u1EDDng A";
    admin.email = "admin@sangkien.gov.vn";
    admin.position = "Qu\u1EA3n tr\u1ECB h\u1EC7 th\u1ED1ng";
  }
  const council = db.councils.find((item) => item.id === "c-1");
  if (council) {
    council.code = "HD-2026-XAA";
    council.name = "H\u1ED9i \u0111\u1ED3ng x\xE9t duy\u1EC7t s\xE1ng ki\u1EBFn Ph\u01B0\u1EDDng A n\u0103m 2026";
    council.establishingAuthority = "Ch\u1EE7 t\u1ECBch UBND Ph\u01B0\u1EDDng A";
    council.description = "H\u1ED9i \u0111\u1ED3ng x\xE9t duy\u1EC7t s\xE1ng ki\u1EBFn thu\u1ED9c Ph\u01B0\u1EDDng A.";
  }
  const criteriaSet = db.criteriaSets.find((item) => item.id === "cs-1");
  if (criteriaSet) criteriaSet.description = "\xC1p d\u1EE5ng cho c\xE1c x\xE3, ph\u01B0\u1EDDng v\xE0 ph\xF2ng chuy\xEAn m\xF4n tr\u1EF1c thu\u1ED9c.";
  const round = db.evaluationRounds.find((item) => item.id === "er-1");
  if (round) {
    round.name = "\u0110\u1EE3t x\xE9t s\xE1ng ki\u1EBFn Qu\xFD I n\u0103m 2026 c\u1EE7a Ph\u01B0\u1EDDng A";
    round.departmentId = defaultWard.id;
  }
  return original !== JSON.stringify(db);
}
function calculateRank(score) {
  for (const rule of db.rankingRules) {
    if (score >= rule.minScore && (rule.maxScore === 100 ? score <= 100 : score < rule.maxScore)) {
      return rule.rankName;
    }
  }
  return "Ch\u01B0a \u0111\u1EA1t";
}
async function startServer() {
  db = await initializeDatabase(db);
  if (migrateDepartmentHierarchy()) {
    await persistDatabase(db);
  }
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use((req, res, next) => {
    res.on("finish", () => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && res.statusCode < 400) {
        persistDatabase(db).catch((error) => console.error("Failed to persist PostgreSQL state:", error));
      }
    });
    next();
  });
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};
    const user = authenticateUser(db.users, username, password);
    if (!user) {
      return res.status(401).json({ error: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng." });
    }
    return res.json({ user: sanitizeUser(user) });
  });
  app.get("/api/users", (req, res) => res.json(db.users.map((user) => sanitizeUser(user))));
  app.post("/api/users", (req, res) => {
    const payload = req.body || {};
    const newUser = {
      id: "u-" + Date.now(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      password: payload.password || "123456",
      isActive: true,
      ...payload,
      roles: Array.isArray(payload.roles) ? payload.roles : payload.roles ? payload.roles.split(",").map((r) => r.trim()).filter(Boolean) : ["SUBMITTER"]
    };
    db.users.push(newUser);
    res.status(201).json(sanitizeUser(newUser));
  });
  app.put("/api/users/:id", (req, res) => {
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const payload = req.body || {};
    db.users[idx] = {
      ...db.users[idx],
      ...payload,
      roles: Array.isArray(payload.roles) ? payload.roles : payload.roles ? payload.roles.split(",").map((r) => r.trim()).filter(Boolean) : db.users[idx].roles,
      password: payload.password || db.users[idx].password || "123456"
    };
    res.json(sanitizeUser(db.users[idx]));
  });
  app.delete("/api/users/:id", (req, res) => {
    db.users = db.users.filter((u) => u.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/departments", (req, res) => res.json(db.departments));
  app.post("/api/departments", (req, res) => {
    const parentId = req.body?.parentId || null;
    if (parentId && !db.departments.some((department) => department.id === parentId)) {
      return res.status(400).json({ error: "\u0110\u01A1n v\u1ECB c\u1EA5p tr\xEAn kh\xF4ng t\u1ED3n t\u1EA1i." });
    }
    const newDept = { id: "d-" + Date.now(), ...req.body, parentId };
    db.departments.push(newDept);
    res.status(201).json(newDept);
  });
  app.put("/api/departments/:id", (req, res) => {
    const idx = db.departments.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const parentId = req.body?.parentId || null;
    if (parentId === req.params.id || parentId && !db.departments.some((department) => department.id === parentId)) {
      return res.status(400).json({ error: "\u0110\u01A1n v\u1ECB c\u1EA5p tr\xEAn kh\xF4ng h\u1EE3p l\u1EC7." });
    }
    db.departments[idx] = { ...db.departments[idx], ...req.body, parentId };
    res.json(db.departments[idx]);
  });
  app.delete("/api/departments/:id", (req, res) => {
    if (db.departments.some((department) => department.parentId === req.params.id)) {
      return res.status(400).json({ error: "H\xE3y chuy\u1EC3n \u0111\u01A1n v\u1ECB tr\u1EF1c thu\u1ED9c sang \u0111\u01A1n v\u1ECB kh\xE1c tr\u01B0\u1EDBc khi x\xF3a." });
    }
    db.departments = db.departments.filter((d) => d.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/councils", (req, res) => {
    const councilsWithMembers = db.councils.map((c) => ({
      ...c,
      members: db.councilMembers.filter((cm) => cm.councilId === c.id).map((cm) => ({
        ...cm,
        user: db.users.find((u) => u.id === cm.userId)
      }))
    }));
    res.json(councilsWithMembers);
  });
  app.post("/api/councils", (req, res) => {
    const councilId = "c-" + Date.now();
    const newCouncil = { id: councilId, createdAt: (/* @__PURE__ */ new Date()).toISOString(), ...req.body };
    db.councils.push(newCouncil);
    res.status(201).json(newCouncil);
  });
  app.put("/api/councils/:id", (req, res) => {
    const idx = db.councils.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.councils[idx] = { ...db.councils[idx], ...req.body };
    res.json(db.councils[idx]);
  });
  app.delete("/api/councils/:id", (req, res) => {
    db.councils = db.councils.filter((c) => c.id !== req.params.id);
    db.councilMembers = db.councilMembers.filter((cm) => cm.councilId !== req.params.id);
    res.json({ success: true });
  });
  app.post("/api/councils/:id/members", (req, res) => {
    const newMember = { id: "cm-" + Date.now(), councilId: req.params.id, ...req.body, startDate: "2026-01-01", endDate: "2026-12-31", isActive: true };
    db.councilMembers.push(newMember);
    res.status(201).json(newMember);
  });
  app.delete("/api/councils/:id/members/:memberId", (req, res) => {
    db.councilMembers = db.councilMembers.filter((cm) => cm.id !== req.params.memberId);
    res.json({ success: true });
  });
  app.get("/api/criteria-sets", (req, res) => {
    const sets = db.criteriaSets.map((cs) => ({ ...cs, criteria: db.criteria.filter((c) => c.criteriaSetId === cs.id) }));
    res.json(sets);
  });
  app.post("/api/criteria-sets", (req, res) => {
    const csId = "cs-" + Date.now();
    const { criteria, ...data } = req.body;
    const newSet = { id: csId, version: 1, ...data };
    db.criteriaSets.push(newSet);
    if (criteria && Array.isArray(criteria)) {
      criteria.forEach((crit, idx) => {
        db.criteria.push({
          id: "crit-" + Date.now() + "-" + idx,
          criteriaSetId: csId,
          code: crit.code || `C${idx + 1}`,
          name: crit.name,
          description: crit.description || "",
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
  app.put("/api/criteria-sets/:id", (req, res) => {
    const csId = req.params.id;
    const idx = db.criteriaSets.findIndex((cs) => cs.id === csId);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const { criteria, ...data } = req.body;
    db.criteriaSets[idx] = { ...db.criteriaSets[idx], ...data };
    if (criteria && Array.isArray(criteria)) {
      db.criteria = db.criteria.filter((c) => c.criteriaSetId !== csId);
      criteria.forEach((crit, idx2) => {
        db.criteria.push({
          id: crit.id || "crit-" + Date.now() + "-" + idx2,
          criteriaSetId: csId,
          code: crit.code || `C${idx2 + 1}`,
          name: crit.name,
          description: crit.description || "",
          maxScore: Number(crit.maxScore) || 25,
          weight: Number(crit.weight) || 0.25,
          sortOrder: idx2 + 1,
          isRequired: true,
          minimumRequiredScore: Number(crit.minimumRequiredScore) || 10
        });
      });
    }
    res.json(db.criteriaSets[idx]);
  });
  app.delete("/api/criteria-sets/:id", (req, res) => {
    const csId = req.params.id;
    db.criteriaSets = db.criteriaSets.filter((cs) => cs.id !== csId);
    db.criteria = db.criteria.filter((c) => c.criteriaSetId !== csId);
    res.json({ success: true });
  });
  app.get("/api/ranking-rules", (req, res) => res.json(db.rankingRules));
  app.post("/api/ranking-rules", (req, res) => {
    const newRule = { id: "rr-" + Date.now(), ...req.body };
    db.rankingRules.push(newRule);
    res.status(201).json(newRule);
  });
  app.put("/api/ranking-rules/:id", (req, res) => {
    const idx = db.rankingRules.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.rankingRules[idx] = { ...db.rankingRules[idx], ...req.body };
    res.json(db.rankingRules[idx]);
  });
  app.delete("/api/ranking-rules/:id", (req, res) => {
    db.rankingRules = db.rankingRules.filter((r) => r.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/evaluation-rounds", (req, res) => {
    const { departmentId } = req.query;
    let rounds = db.evaluationRounds;
    if (departmentId) {
      rounds = rounds.filter((er) => er.departmentId === departmentId);
    }
    const resRounds = rounds.map((er) => ({
      ...er,
      council: db.councils.find((c) => c.id === er.councilId),
      criteriaSet: db.criteriaSets.find((cs) => cs.id === er.criteriaSetId),
      department: db.departments.find((d) => d.id === er.departmentId)
    }));
    res.json(resRounds);
  });
  app.post("/api/evaluation-rounds", (req, res) => {
    const roundId = "er-" + Date.now();
    const newRound = { id: roundId, status: "SCORING", isScoringFinalized: false, createdAt: (/* @__PURE__ */ new Date()).toISOString(), ...req.body };
    db.evaluationRounds.push(newRound);
    res.status(201).json(newRound);
  });
  app.post("/api/evaluation-rounds/:id/finalize-scoring", (req, res) => {
    const round = db.evaluationRounds.find((er) => er.id === req.params.id);
    if (!round) return res.status(404).json({ error: "Not found" });
    round.isScoringFinalized = true;
    round.status = "COUNCIL_REVIEW";
    res.json({ success: true, message: "\u0110\xE3 ch\u1ED1t d\u1EEF li\u1EC7u ch\u1EA5m cho \u0111\u01A1n v\u1ECB th\xE0nh c\xF4ng!" });
  });
  app.get("/api/innovations", (req, res) => {
    const innovations = db.innovations.map((inv) => {
      const sheets = db.scoringSheets.filter((ss) => ss.innovationId === inv.id && ss.status === "SUBMITTED");
      const avgScore = sheets.length > 0 ? sheets.reduce((acc, curr) => acc + curr.totalScore, 0) / sheets.length : null;
      const rank = avgScore !== null ? calculateRank(avgScore) : "Ch\u01B0a ch\u1EA5m";
      return {
        ...inv,
        evaluationRound: db.evaluationRounds.find((er) => er.id === inv.evaluationRoundId),
        submitter: db.users.find((u) => u.id === inv.submitterId),
        authors: db.innovationAuthors.filter((ia) => ia.innovationId === inv.id),
        attachments: db.innovationAttachments.filter((att) => att.innovationId === inv.id),
        averageScore: avgScore !== null ? Number(avgScore.toFixed(2)) : null,
        rankResult: rank
      };
    });
    res.json(innovations);
  });
  app.post("/api/innovations", (req, res) => {
    const { authors, attachments, ...invData } = req.body;
    if (authors && Array.isArray(authors) && authors.length > 3) {
      return res.status(400).json({ error: "M\u1ED7i s\xE1ng ki\u1EBFn t\u1ED1i \u0111a 3 t\xE1c gi\u1EA3!" });
    }
    const invId = "inv-" + Date.now();
    const newInv = { id: invId, code: `SK-${Math.floor(100 + Math.random() * 900)}`, status: "SUBMITTED", createdAt: (/* @__PURE__ */ new Date()).toISOString(), ...invData };
    db.innovations.push(newInv);
    if (authors && Array.isArray(authors)) {
      authors.forEach((auth, idx) => {
        db.innovationAuthors.push({
          id: "ia-" + Date.now() + "-" + idx,
          innovationId: invId,
          userId: auth.userId || null,
          fullName: auth.fullName,
          organization: auth.organization || "",
          isMainAuthor: idx === 0
        });
      });
    }
    if (attachments && Array.isArray(attachments)) {
      attachments.forEach((att, idx) => {
        db.innovationAttachments.push({
          id: "att-" + Date.now() + "-" + idx,
          innovationId: invId,
          fileName: att.fileName || "tai_lieu_dinh_kem.pdf",
          originalFileName: att.originalFileName || att.fileName || "tai_lieu.pdf",
          fileSize: att.fileSize || "1.5 MB",
          fileType: att.fileType || "PDF",
          uploadedBy: req.body.submitterId || "u-author1",
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
    }
    res.status(201).json(newInv);
  });
  app.get("/api/scoring-assignments", (req, res) => {
    const assignments = db.scoringAssignments.map((sa) => ({
      ...sa,
      innovation: db.innovations.find((i) => i.id === sa.innovationId),
      user: db.users.find((u) => u.id === sa.userId),
      evaluationRound: db.evaluationRounds.find((er) => er.id === sa.evaluationRoundId)
    }));
    res.json(assignments);
  });
  app.get("/api/scoring-sheets", (req, res) => {
    const sheets = db.scoringSheets.map((ss) => ({
      ...ss,
      details: db.scoringDetails.filter((sd) => sd.scoringSheetId === ss.id),
      innovation: db.innovations.find((i) => i.id === ss.innovationId),
      user: db.users.find((u) => u.id === ss.userId)
    }));
    res.json(sheets);
  });
  app.post("/api/scoring-sheets", (req, res) => {
    const { assignmentId, innovationId, evaluationRoundId, userId, details, generalComment, recommendation, status } = req.body;
    const round = db.evaluationRounds.find((er) => er.id === evaluationRoundId);
    if (round?.isScoringFinalized) return res.status(400).json({ error: "\u0110\u1EE3t x\xE9t \u0111\xE3 ch\u1ED1t d\u1EEF li\u1EC7u!" });
    let calculatedTotal = 0;
    if (details && Array.isArray(details)) {
      for (const d of details) {
        calculatedTotal += Number(d.score);
      }
    }
    const existingSheetIdx = db.scoringSheets.findIndex((ss) => ss.assignmentId === assignmentId && ss.userId === userId);
    let sheetId = "ss-" + Date.now();
    if (existingSheetIdx !== -1) {
      sheetId = db.scoringSheets[existingSheetIdx].id;
      db.scoringSheets[existingSheetIdx] = { ...db.scoringSheets[existingSheetIdx], totalScore: calculatedTotal, generalComment, recommendation, status: status || "DRAFT", updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      db.scoringDetails = db.scoringDetails.filter((sd) => sd.scoringSheetId !== sheetId);
    } else {
      db.scoringSheets.push({ id: sheetId, assignmentId, innovationId, evaluationRoundId, userId, totalScore: calculatedTotal, generalComment, recommendation, status: status || "DRAFT", submittedAt: (/* @__PURE__ */ new Date()).toISOString(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (details && Array.isArray(details)) {
      details.forEach((d, idx) => {
        db.scoringDetails.push({ id: "sd-" + Date.now() + "-" + idx, scoringSheetId: sheetId, criteriaId: d.criteriaId, score: d.score, comment: d.comment || "" });
      });
    }
    res.json({ success: true, totalScore: calculatedTotal, rank: calculateRank(calculatedTotal) });
  });
  app.get("/api/dashboard/stats", (req, res) => {
    res.json({
      totalInnovations: db.innovations.length,
      recognized: db.innovations.filter((i) => i.status === "RECOGNIZED").length,
      totalCouncils: db.councils.length,
      totalUsers: db.users.length,
      totalDepartments: db.departments.length
    });
  });
  app.get("/api/audit-logs", (req, res) => res.json(db.auditLogs));
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({ server: { middlewareMode: true, hmr: false } });
    app.use(vite.middlewares);
  } else {
    app.use(import_express.default.static(import_path.default.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(__dirname, "dist", "index.html"));
    });
  }
  const port = 3e3;
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
  const shutdown = async () => {
    await persistDatabase(db);
    await closeDatabase();
    server.close();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
startServer();
