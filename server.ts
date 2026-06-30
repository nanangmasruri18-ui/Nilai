import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { dbService, User } from "./src/db/db_service.js";

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "merdeka_sd_secret_key_987654";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: "admin" | "guru_kelas" | "guru_mapel";
    nama_user: string;
  };
}

const app = express();
const PORT = 3000;

app.use(express.json());

// =====================================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================================
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(410).json({ message: "Sesi Anda telah berakhir, silakan login kembali." });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: "Token tidak valid atau kedaluwarsa." });
      return;
    }
    req.user = decoded as AuthenticatedRequest["user"];
    next();
  });
};

// ROLE AUTHORIZATION MIDDLEWARE
const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Hak akses tidak memadai untuk melakukan aksi ini." });
      return;
    }
    next();
  };
};

// =====================================================================
// AUTH API
// =====================================================================
app.post("/api/auth/login", (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Username dan password wajib diisi." });
    return;
  }

  try {
    const user = dbService.getUserByUsername(username);

    if (!user || !user.status_aktif) {
      res.status(401).json({ message: "Akun tidak ditemukan atau tidak aktif." });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: "Kombinasi username atau password salah." });
      return;
    }

    // Sign Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        nama_user: user.nama_user,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Retrieve corresponding teacher data if roles are teachers
    let teacherInfo = null;
    if (user.role !== "admin") {
      teacherInfo = dbService.getGuru().find((g) => g.user_id === user.id) || null;
    }

    // Add Audit Log
    dbService.addLog(
      { id: user.id, username: user.username },
      `User ${user.username} (${user.role}) berhasil login ke sistem`,
      req.ip || "127.0.0.1"
    );

    res.json({
      token,
      user: {
        id: user.id,
        nama_user: user.nama_user,
        username: user.username,
        role: user.role,
      },
      teacher: teacherInfo,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Terjadi kesalahan server internal." });
  }
});

app.post("/api/auth/logout", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user) {
    dbService.addLog(req.user, `User ${req.user.username} logout dari sistem`, req.ip || "127.0.0.1");
  }
  res.json({ success: true, message: "Berhasil logout." });
});

// =====================================================================
// DATA SEKOLAH API
// =====================================================================
app.get("/api/sekolah", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getSekolah());
});

app.put(
  "/api/sekolah",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateSekolah(req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// USER CRUD API (ADMIN ONLY)
// =====================================================================
app.get("/api/users", authenticateToken, authorizeRoles("admin"), (req: Request, res: Response): void => {
  const list = dbService.getUsers().map(({ passwordHash, ...rest }) => rest);
  res.json(list);
});

app.post(
  "/api/users",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { password, ...userData } = req.body;
      const created = dbService.createUser({ ...userData, passwordText: password }, req.user);
      const { passwordHash, ...safeUser } = created;
      res.status(201).json(safeUser);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/users/:id",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { password, ...updateData } = req.body;
      const toUpdate = { ...updateData };
      if (password) {
        toUpdate.passwordText = password;
      }
      const updated = dbService.updateUser(req.params.id, toUpdate, req.user);
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/users/:id",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteUser(req.params.id, req.user);
      res.json({ success: true, message: "User berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// GURU CRUD API (ADMIN ONLY)
// =====================================================================
app.get("/api/guru", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getGuru());
});

app.post(
  "/api/guru",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const created = dbService.createGuru(req.body, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/guru/:nip",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateGuru(req.params.nip, req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/guru/:nip",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteGuru(req.params.nip, req.user);
      res.json({ success: true, message: "Data guru berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// KELAS CRUD API (ADMIN ONLY)
// =====================================================================
app.get("/api/kelas", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getKelas());
});

app.post(
  "/api/kelas",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const created = dbService.createKelas(req.body, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/kelas/:id",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateKelas(req.params.id, req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/kelas/:id",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteKelas(req.params.id, req.user);
      res.json({ success: true, message: "Kelas berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// SISWA CRUD API (ADMIN ONLY FOR MODIFICATION)
// =====================================================================
app.get("/api/siswa", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getSiswa());
});

app.post(
  "/api/siswa",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const created = dbService.createSiswa(req.body, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.post(
  "/api/siswa/bulk",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const result = dbService.createSiswaBulk(req.body.records, req.user);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/siswa/:nis",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateSiswa(req.params.nis, req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/siswa/:nis",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteSiswa(req.params.nis, req.user);
      res.json({ success: true, message: "Data siswa berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// MATA PELAJARAN CRUD API (ADMIN ONLY)
// =====================================================================
app.get("/api/mapel", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getMapel());
});

app.post(
  "/api/mapel",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const created = dbService.createMapel(req.body, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/mapel/:kode",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateMapel(req.params.kode, req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/mapel/:kode",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteMapel(req.params.kode, req.user);
      res.json({ success: true, message: "Mata pelajaran berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// GURU PENGAMPU API (ADMIN ONLY)
// =====================================================================
app.get("/api/guru_pengampu", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getGuruPengampu());
});

app.post(
  "/api/guru_pengampu",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const created = dbService.createGuruPengampu(req.body, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/guru_pengampu/:id",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteGuruPengampu(req.params.id, req.user);
      res.json({ success: true, message: "Pengaturan pengampu berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// KKM API
// =====================================================================
app.get("/api/kkm", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getKKM());
});

app.post(
  "/api/kkm",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { mapel_kode, kelas_id, nilai_kkm } = req.body;
      const created = dbService.createOrUpdateKKM(mapel_kode, kelas_id, parseInt(nilai_kkm), req.user);
      res.json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/kkm/:id",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteKKM(req.params.id, req.user);
      res.json({ success: true, message: "KKM berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// BOBOT PENILAIAN API
// =====================================================================
app.get("/api/bobot", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getBobot());
});

app.put(
  "/api/bobot",
  authenticateToken,
  authorizeRoles("admin"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateBobot(req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// TUJUAN PEMBELAJARAN (TP) API
// =====================================================================
app.get("/api/tujuan_pembelajaran", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getTP());
});

app.post(
  "/api/tujuan_pembelajaran",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const created = dbService.createTP(req.body, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/tujuan_pembelajaran/:id",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateTP(req.params.id, req.body, req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/tujuan_pembelajaran/:id",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteTP(req.params.id, req.user);
      res.json({ success: true, message: "TP berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// GRADES (PENILAIAN) API
// =====================================================================

// Formatif
app.get("/api/nilai/formatif", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getNilaiFormatif());
});

app.post(
  "/api/nilai/formatif",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { nilai, ...rest } = req.body;
      const created = dbService.saveNilaiFormatif({ ...rest, nilai: parseInt(nilai) }, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/nilai/formatif/:id",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateNilaiFormatif(req.params.id, parseInt(req.body.nilai), req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/nilai/formatif/:id",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteNilaiFormatif(req.params.id, req.user);
      res.json({ success: true, message: "Nilai formatif berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// SLM (Sumatif Lingkup Materi)
app.get("/api/nilai/slm", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getNilaiSLM());
});

app.post(
  "/api/nilai/slm",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { nilai, ...rest } = req.body;
      const created = dbService.saveNilaiSLM({ ...rest, nilai: parseInt(nilai) }, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.put(
  "/api/nilai/slm/:id",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const updated = dbService.updateNilaiSLM(req.params.id, parseInt(req.body.nilai), req.user);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.delete(
  "/api/nilai/slm/:id",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      dbService.deleteNilaiSLM(req.params.id, req.user);
      res.json({ success: true, message: "Nilai sumatif lingkup materi berhasil dihapus." });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// SAS (Sumatif Akhir Semester)
app.get("/api/nilai/sas", authenticateToken, (req: Request, res: Response): void => {
  res.json(dbService.getNilaiSAS());
});

app.post(
  "/api/nilai/sas",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { nilai, ...rest } = req.body;
      const created = dbService.saveNilaiSAS({ ...rest, nilai: parseInt(nilai) }, req.user);
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// HELPER BULK AND FILTERING API ENDPOINTS FOR GRADES
// =====================================================================
app.get("/api/nilai_formatif/tp/:tp_id", authenticateToken, (req: Request, res: Response): void => {
  const filtered = dbService.getNilaiFormatif().filter((n) => n.tp_id === req.params.tp_id);
  res.json(filtered);
});

app.post(
  "/api/nilai_formatif",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { records } = req.body;
      if (!Array.isArray(records)) {
        res.status(400).json({ message: "Records must be an array." });
        return;
      }
      const results = records.map((rec) => {
        const student = dbService.getSiswa().find((s) => s.nis === rec.siswa_nis);
        const tp = dbService.getTP().find((t) => t.id === rec.tp_id);
        return dbService.saveNilaiFormatif({
          siswa_nis: rec.siswa_nis,
          tp_id: rec.tp_id,
          nilai: parseInt(rec.nilai),
          kelas_id: student?.kelas_id || "K01",
          mapel_kode: tp?.mapel_kode || "M01",
        }, req.user!);
      });
      dbService.addLog(req.user, `Input massal nilai formatif TP ID ${records[0]?.tp_id || ""}`, req.ip || "127.0.0.1");
      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.get("/api/nilai_sumatif_lm/tp/:tp_id", authenticateToken, (req: Request, res: Response): void => {
  const filtered = dbService.getNilaiSLM().filter((n) => n.tp_id === req.params.tp_id);
  res.json(filtered);
});

app.post(
  "/api/nilai_sumatif_lm",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { records } = req.body;
      if (!Array.isArray(records)) {
        res.status(400).json({ message: "Records must be an array." });
        return;
      }
      const results = records.map((rec) => {
        const student = dbService.getSiswa().find((s) => s.nis === rec.siswa_nis);
        const tp = dbService.getTP().find((t) => t.id === rec.tp_id);
        return dbService.saveNilaiSLM({
          siswa_nis: rec.siswa_nis,
          tp_id: rec.tp_id,
          nilai: parseInt(rec.nilai),
          kelas_id: student?.kelas_id || "K01",
          mapel_kode: tp?.mapel_kode || "M01",
        }, req.user!);
      });
      dbService.addLog(req.user, `Input massal nilai sumatif lingkup materi TP ID ${records[0]?.tp_id || ""}`, req.ip || "127.0.0.1");
      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

app.get("/api/nilai_sumatif_sas/mapel/:mapel_kode", authenticateToken, (req: Request, res: Response): void => {
  const filtered = dbService.getNilaiSAS().filter((n) => n.mapel_kode === req.params.mapel_kode);
  res.json(filtered);
});

app.post(
  "/api/nilai_sumatif_sas",
  authenticateToken,
  authorizeRoles("admin", "guru_kelas", "guru_mapel"),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) return;
      const { records } = req.body;
      if (!Array.isArray(records)) {
        res.status(400).json({ message: "Records must be an array." });
        return;
      }
      const activeSekolah = dbService.getSekolah();
      const results = records.map((rec) => {
        const student = dbService.getSiswa().find((s) => s.nis === rec.siswa_nis);
        return dbService.saveNilaiSAS({
          siswa_nis: rec.siswa_nis,
          mapel_kode: rec.mapel_kode,
          kelas_id: student?.kelas_id || "K01",
          nilai: parseInt(rec.nilai),
          semester: activeSekolah.semester,
        }, req.user!);
      });
      dbService.addLog(req.user, `Input massal nilai SAS mapel ${records[0]?.mapel_kode || ""}`, req.ip || "127.0.0.1");
      res.json(results);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  }
);

// =====================================================================
// REKAP NILAI (REPORTS / QUERIES)
// =====================================================================
app.get("/api/rekap", authenticateToken, (req: Request, res: Response): void => {
  const { kelas_id, mapel_kode, search_siswa, semester } = req.query;

  const filters: any = {};
  if (kelas_id) filters.kelas_id = kelas_id as string;
  if (mapel_kode) filters.mapel_kode = mapel_kode as string;
  if (search_siswa) filters.search_siswa = search_siswa as string;
  if (semester) filters.semester = parseInt(semester as string);

  try {
    const rekap = dbService.generateRekap(filters);
    res.json(rekap);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// =====================================================================
// AUDIT LOGS (ADMIN ONLY)
// =====================================================================
app.get(
  "/api/audit_logs",
  authenticateToken,
  authorizeRoles("admin"),
  (req: Request, res: Response): void => {
    res.json(dbService.getLogs());
  }
);

// =====================================================================
// VITE DEV SERVER & PRODUCTION ROUTING
// =====================================================================
async function start() {
  // Initialize dbService with Supabase before starting up the server
  try {
    await dbService.initialize();
  } catch (err) {
    console.error("[SERVER] Gagal menginisialisasi database Supabase pada startup:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Explicitly disable HMR to prevent WebSocket connection failures
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

start();
