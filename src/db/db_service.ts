import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// =====================================================================
// TYPED ARCHITECTURE FOR DATABASE ENTITIES
// =====================================================================

export interface Sekolah {
  id: number;
  nama_sekolah: string;
  npsn: string;
  alamat: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  nama_kepala_sekolah: string;
  tahun_pelajaran: string;
  semester: number; // 1 = Ganjil, 2 = Genap
}

export interface User {
  id: string;
  nama_user: string;
  username: string;
  passwordHash: string;
  role: "admin" | "guru_kelas" | "guru_mapel";
  status_aktif: boolean;
}

export interface Role {
  id: string;
  name: string;
}

export interface Guru {
  nip: string;
  nama_guru: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  jabatan: string;
  nomor_hp: string;
  status: "Aktif" | "Nonaktif";
  user_id: string | null;
}

export interface Kelas {
  id: string; // e.g. "K01"
  tingkat: number; // 1 - 6
  nama_rombel: string; // e.g. "4A", "4B"
  tahun_pelajaran: string;
  wali_kelas_nip: string | null;
}

export interface Siswa {
  nis: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string;
  tanggal_lahir: string; // YYYY-MM-DD
  nama_orang_tua: string;
  kelas_id: string;
  status_aktif: boolean;
}

export interface Mapel {
  kode_mapel: string;
  nama_mapel: string;
  fase: "A" | "B" | "C";
  tingkat_kelas: number;
}

export interface GuruPengampu {
  id: string;
  guru_nip: string;
  kelas_id: string;
  mapel_kode: string | null; // null if Guru Kelas (diampu wali kelas)
  tipe: "kelas" | "mapel";
}

export interface TujuanPembelajaran {
  id: string;
  kode_tp: string;
  mapel_kode: string;
  fase: "A" | "B" | "C";
  kelas: number;
  semester: number;
  deskripsi: string;
}

export interface KKM {
  id: string;
  mapel_kode: string;
  kelas_id: string;
  nilai_kkm: number;
}

export interface BobotPenilaian {
  id: number;
  formatif_pct: number;
  slm_pct: number;
  sas_pct: number;
}

export interface NilaiFormatif {
  id: string;
  mapel_kode: string;
  kelas_id: string;
  tp_id: string;
  siswa_nis: string;
  nilai: number;
}

export interface NilaiSLM {
  id: string;
  mapel_kode: string;
  kelas_id: string;
  lingkup_materi?: string;
  tanggal?: string; // YYYY-MM-DD
  siswa_nis: string;
  nilai: number;
  tp_id?: string;
}

export interface NilaiSAS {
  id: string;
  mapel_kode: string;
  kelas_id: string;
  semester: number;
  siswa_nis: string;
  nilai: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  username: string;
  aktivitas: string;
  ip_address: string;
}

// Database JSON Schema
export interface DatabaseSchema {
  sekolah: Sekolah;
  users: User[];
  roles: Role[];
  guru: Guru[];
  kelas: Kelas[];
  siswa: Siswa[];
  mapel: Mapel[];
  guru_pengampu: GuruPengampu[];
  tujuan_pembelajaran: TujuanPembelajaran[];
  kkm: KKM[];
  bobot_penilaian: BobotPenilaian;
  nilai_formatif: NilaiFormatif[];
  nilai_slm: NilaiSLM[];
  nilai_sas: NilaiSAS[];
  audit_log: AuditLog[];
}

// File path for database store
const STORE_PATH = path.join(process.cwd(), "src", "db", "db_store.json");

// Default initial state (Dummy Data in Indonesian context)
function getInitialData(): DatabaseSchema {
  // Pre-calculated bcrypt hashes for passwords:
  // "admin123" -> hash for admin
  // "guru123" -> hash for teachers
  const adminHash = bcrypt.hashSync("admin123", 10);
  const guruHash = bcrypt.hashSync("guru123", 10);

  return {
    sekolah: {
      id: 1,
      nama_sekolah: "SD Negeri Merdeka Malang",
      npsn: "20102030",
      alamat: "Jl. Pendidikan No. 45, Klojen",
      kecamatan: "Klojen",
      kabupaten_kota: "Malang",
      provinsi: "Jawa Timur",
      nama_kepala_sekolah: "Dr. H. Slamet Rahardjo, M.Pd.",
      tahun_pelajaran: "2025/2026",
      semester: 1,
    },
    roles: [
      { id: "admin", name: "Administrator" },
      { id: "guru_kelas", name: "Guru Kelas" },
      { id: "guru_mapel", name: "Guru Mata Pelajaran" },
    ],
    users: [
      {
        id: "U01",
        nama_user: "Admin Penilaian",
        username: "admin",
        passwordHash: adminHash,
        role: "admin",
        status_aktif: true,
      },
      {
        id: "U02",
        nama_user: "Budi Santoso, S.Pd.",
        username: "budi",
        passwordHash: guruHash,
        role: "guru_kelas",
        status_aktif: true,
      },
      {
        id: "U03",
        nama_user: "Siti Aminah, S.Pd.",
        username: "siti",
        passwordHash: guruHash,
        role: "guru_kelas",
        status_aktif: true,
      },
      {
        id: "U04",
        nama_user: "Dewi Lestari, S.Pd.",
        username: "dewi",
        passwordHash: guruHash,
        role: "guru_mapel",
        status_aktif: true,
      },
      {
        id: "U05",
        nama_user: "Eko Prasetyo, S.Pd.",
        username: "eko",
        passwordHash: guruHash,
        role: "guru_mapel",
        status_aktif: true,
      },
    ],
    guru: [
      {
        nip: "198501012010011001",
        nama_guru: "Budi Santoso, S.Pd.",
        jenis_kelamin: "Laki-laki",
        jabatan: "Guru Kelas IV-A",
        nomor_hp: "081234567890",
        status: "Aktif",
        user_id: "U02",
      },
      {
        nip: "198802022012012002",
        nama_guru: "Siti Aminah, S.Pd.",
        jenis_kelamin: "Perempuan",
        jabatan: "Guru Kelas IV-B",
        nomor_hp: "081345678901",
        status: "Aktif",
        user_id: "U03",
      },
      {
        nip: "199003032015031003",
        nama_guru: "Dewi Lestari, S.Pd.",
        jenis_kelamin: "Perempuan",
        jabatan: "Guru Mapel Matematika",
        nomor_hp: "081456789012",
        status: "Aktif",
        user_id: "U04",
      },
      {
        nip: "199204042018042004",
        nama_guru: "Eko Prasetyo, S.Pd.",
        jenis_kelamin: "Laki-laki",
        jabatan: "Guru Mapel IPAS",
        nomor_hp: "081567890123",
        status: "Aktif",
        user_id: "U05",
      },
    ],
    kelas: [
      {
        id: "K01",
        tingkat: 4,
        nama_rombel: "4-A",
        tahun_pelajaran: "2025/2026",
        wali_kelas_nip: "198501012010011001",
      },
      {
        id: "K02",
        tingkat: 4,
        nama_rombel: "4-B",
        tahun_pelajaran: "2025/2026",
        wali_kelas_nip: "198802022012012002",
      },
    ],
    siswa: [
      // Kelas 4-A
      {
        nis: "1001",
        nisn: "0123456789",
        nama_lengkap: "Ahmad Fauzi",
        jenis_kelamin: "L",
        tempat_lahir: "Malang",
        tanggal_lahir: "2016-05-12",
        nama_orang_tua: "Joko Widodo",
        kelas_id: "K01",
        status_aktif: true,
      },
      {
        nis: "1002",
        nisn: "0123456790",
        nama_lengkap: "Bunga Citra",
        jenis_kelamin: "P",
        tempat_lahir: "Malang",
        tanggal_lahir: "2016-08-20",
        nama_orang_tua: "Bambang Susilo",
        kelas_id: "K01",
        status_aktif: true,
      },
      {
        nis: "1003",
        nisn: "0123456791",
        nama_lengkap: "Candra Wijaya",
        jenis_kelamin: "L",
        tempat_lahir: "Malang",
        tanggal_lahir: "2016-02-15",
        nama_orang_tua: "Hermawan",
        kelas_id: "K01",
        status_aktif: true,
      },
      {
        nis: "1004",
        nisn: "0123456792",
        nama_lengkap: "Dina Mariana",
        jenis_kelamin: "P",
        tempat_lahir: "Surabaya",
        tanggal_lahir: "2016-11-05",
        nama_orang_tua: "Rudi Hartono",
        kelas_id: "K01",
        status_aktif: true,
      },
      {
        nis: "1005",
        nisn: "0123456793",
        nama_lengkap: "Ervan Kurniawan",
        jenis_kelamin: "L",
        tempat_lahir: "Batu",
        tanggal_lahir: "2016-04-30",
        nama_orang_tua: "Slamet Basuki",
        kelas_id: "K01",
        status_aktif: true,
      },
      // Kelas 4-B
      {
        nis: "1006",
        nisn: "0123456794",
        nama_lengkap: "Farhan Ali",
        jenis_kelamin: "L",
        tempat_lahir: "Malang",
        tanggal_lahir: "2016-01-10",
        nama_orang_tua: "Yusuf",
        kelas_id: "K02",
        status_aktif: true,
      },
      {
        nis: "1007",
        nisn: "0123456795",
        nama_lengkap: "Gita Gutawa",
        jenis_kelamin: "P",
        tempat_lahir: "Jakarta",
        tanggal_lahir: "2016-09-18",
        nama_orang_tua: "Erwin Gutawa",
        kelas_id: "K02",
        status_aktif: true,
      },
      {
        nis: "1008",
        nisn: "0123456796",
        nama_lengkap: "Hendra Setiawan",
        jenis_kelamin: "L",
        tempat_lahir: "Surakarta",
        tanggal_lahir: "2016-07-22",
        nama_orang_tua: "Wijaya",
        kelas_id: "K02",
        status_aktif: true,
      },
      {
        nis: "1009",
        nisn: "0123456797",
        nama_lengkap: "Indah Permata",
        jenis_kelamin: "P",
        tempat_lahir: "Malang",
        tanggal_lahir: "2016-03-03",
        nama_orang_tua: "Gunawan",
        kelas_id: "K02",
        status_aktif: true,
      },
      {
        nis: "1010",
        nisn: "0123456798",
        nama_lengkap: "Kevin Sanjaya",
        jenis_kelamin: "L",
        tempat_lahir: "Banyuwangi",
        tanggal_lahir: "2016-12-12",
        nama_orang_tua: "Herman Sanjaya",
        kelas_id: "K02",
        status_aktif: true,
      },
    ],
    mapel: [
      {
        kode_mapel: "M01",
        nama_mapel: "Matematika",
        fase: "B",
        tingkat_kelas: 4,
      },
      {
        kode_mapel: "M02",
        nama_mapel: "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
        fase: "B",
        tingkat_kelas: 4,
      },
      {
        kode_mapel: "M03",
        nama_mapel: "Bahasa Indonesia",
        fase: "B",
        tingkat_kelas: 4,
      },
    ],
    guru_pengampu: [
      // Guru Kelas Wali Kelas
      {
        id: "GP01",
        guru_nip: "198501012010011001",
        kelas_id: "K01",
        mapel_kode: null,
        tipe: "kelas",
      },
      {
        id: "GP02",
        guru_nip: "198802022012012002",
        kelas_id: "K02",
        mapel_kode: null,
        tipe: "kelas",
      },
      // Guru Mapel Matematika di 4A & 4B
      {
        id: "GP03",
        guru_nip: "199003032015031003",
        kelas_id: "K01",
        mapel_kode: "M01",
        tipe: "mapel",
      },
      {
        id: "GP04",
        guru_nip: "199003032015031003",
        kelas_id: "K02",
        mapel_kode: "M01",
        tipe: "mapel",
      },
      // Guru Mapel IPAS di 4A & 4B
      {
        id: "GP05",
        guru_nip: "199204042018042004",
        kelas_id: "K01",
        mapel_kode: "M02",
        tipe: "mapel",
      },
      {
        id: "GP06",
        guru_nip: "199204042018042004",
        kelas_id: "K02",
        mapel_kode: "M02",
        tipe: "mapel",
      },
    ],
    tujuan_pembelajaran: [
      // Matematika
      {
        id: "TP01",
        kode_tp: "TP4.1.1",
        mapel_kode: "M01",
        fase: "B",
        kelas: 4,
        semester: 1,
        deskripsi: "Peserta didik mampu mengidentifikasi, menulis, dan membandingkan pecahan sederhana dengan penyebut sama.",
      },
      {
        id: "TP02",
        kode_tp: "TP4.1.2",
        mapel_kode: "M01",
        fase: "B",
        kelas: 4,
        semester: 1,
        deskripsi: "Peserta didik mampu menyelesaikan operasi hitung pecahan (penjumlahan & pengurangan) berpenyebut sama.",
      },
      // IPAS
      {
        id: "TP03",
        kode_tp: "TP4.2.1",
        mapel_kode: "M02",
        fase: "B",
        kelas: 4,
        semester: 1,
        deskripsi: "Peserta didik mampu menganalisis bagian-bagian tubuh tumbuhan dan mendeskripsikan fungsinya.",
      },
      {
        id: "TP04",
        kode_tp: "TP4.2.2",
        mapel_kode: "M02",
        fase: "B",
        kelas: 4,
        semester: 1,
        deskripsi: "Peserta didik mampu menjelaskan proses fotosintesis pada tumbuhan hijau dan pentingnya bagi ekosistem.",
      },
      // Bahasa Indonesia
      {
        id: "TP05",
        kode_tp: "TP4.3.1",
        mapel_kode: "M03",
        fase: "B",
        kelas: 4,
        semester: 1,
        deskripsi: "Peserta didik memahami pesan dan informasi dari teks narasi yang dibaca atau didengar.",
      },
    ],
    kkm: [
      { id: "KKM01", mapel_kode: "M01", kelas_id: "K01", nilai_kkm: 70 },
      { id: "KKM02", mapel_kode: "M02", kelas_id: "K01", nilai_kkm: 72 },
      { id: "KKM03", mapel_kode: "M03", kelas_id: "K01", nilai_kkm: 75 },
      { id: "KKM04", mapel_kode: "M01", kelas_id: "K02", nilai_kkm: 70 },
      { id: "KKM05", mapel_kode: "M02", kelas_id: "K02", nilai_kkm: 72 },
      { id: "KKM06", mapel_kode: "M03", kelas_id: "K02", nilai_kkm: 75 },
    ],
    bobot_penilaian: {
      id: 1,
      formatif_pct: 40,
      slm_pct: 30,
      sas_pct: 30,
    },
    nilai_formatif: [
      // Ahmad Fauzi (1001) - Matematika (M01)
      { id: "NF001", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP01", siswa_nis: "1001", nilai: 85 },
      { id: "NF002", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP01", siswa_nis: "1001", nilai: 90 }, // Multiple Formatif for same TP is allowed
      { id: "NF003", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP02", siswa_nis: "1001", nilai: 80 },
      // Ahmad Fauzi (1001) - IPAS (M02)
      { id: "NF004", mapel_kode: "M02", kelas_id: "K01", tp_id: "TP03", siswa_nis: "1001", nilai: 75 },
      { id: "NF005", mapel_kode: "M02", kelas_id: "K01", tp_id: "TP04", siswa_nis: "1001", nilai: 88 },

      // Bunga Citra (1002) - Matematika (M01)
      { id: "NF006", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP01", siswa_nis: "1002", nilai: 65 },
      { id: "NF007", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP02", siswa_nis: "1002", nilai: 70 },
      // Bunga Citra (1002) - IPAS (M02)
      { id: "NF008", mapel_kode: "M02", kelas_id: "K01", tp_id: "TP03", siswa_nis: "1002", nilai: 80 },
      { id: "NF009", mapel_kode: "M02", kelas_id: "K01", tp_id: "TP04", siswa_nis: "1002", nilai: 82 },

      // Candra Wijaya (1003) - Matematika (M01)
      { id: "NF010", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP01", siswa_nis: "1003", nilai: 92 },
      { id: "NF011", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP02", siswa_nis: "1003", nilai: 88 },

      // Dina Mariana (1004) - Matematika (M01)
      { id: "NF012", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP01", siswa_nis: "1004", nilai: 74 },
      { id: "NF013", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP02", siswa_nis: "1004", nilai: 78 },

      // Ervan Kurniawan (1005) - Matematika (M01)
      { id: "NF014", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP01", siswa_nis: "1005", nilai: 80 },
      { id: "NF015", mapel_kode: "M01", kelas_id: "K01", tp_id: "TP02", siswa_nis: "1005", nilai: 82 },
    ],
    nilai_slm: [
      // Ahmad Fauzi (1001) - Matematika (M01)
      { id: "NS001", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Pecahan Senilai", tanggal: "2025-09-15", siswa_nis: "1001", nilai: 80 },
      { id: "NS002", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Operasi Pecahan", tanggal: "2025-10-10", siswa_nis: "1001", nilai: 85 },
      // Ahmad Fauzi (1001) - IPAS (M02)
      { id: "NS003", mapel_kode: "M02", kelas_id: "K01", lingkup_materi: "Tumbuhan Sumber Kehidupan", tanggal: "2025-09-22", siswa_nis: "1001", nilai: 78 },

      // Bunga Citra (1002) - Matematika (M01)
      { id: "NS004", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Pecahan Senilai", tanggal: "2025-09-15", siswa_nis: "1002", nilai: 60 },
      { id: "NS005", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Operasi Pecahan", tanggal: "2025-10-10", siswa_nis: "1002", nilai: 68 },

      // Candra Wijaya (1003) - Matematika (M01)
      { id: "NS006", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Pecahan Senilai", tanggal: "2025-09-15", siswa_nis: "1003", nilai: 90 },
      { id: "NS007", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Operasi Pecahan", tanggal: "2025-10-10", siswa_nis: "1003", nilai: 85 },

      // Dina Mariana (1004) - Matematika (M01)
      { id: "NS008", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Pecahan Senilai", tanggal: "2025-09-15", siswa_nis: "1004", nilai: 72 },
      { id: "NS009", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Operasi Pecahan", tanggal: "2025-10-10", siswa_nis: "1004", nilai: 75 },

      // Ervan Kurniawan (1005) - Matematika (M01)
      { id: "NS010", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Pecahan Senilai", tanggal: "2025-09-15", siswa_nis: "1005", nilai: 78 },
      { id: "NS011", mapel_kode: "M01", kelas_id: "K01", lingkup_materi: "Operasi Pecahan", tanggal: "2025-10-10", siswa_nis: "1005", nilai: 80 },
    ],
    nilai_sas: [
      // Ahmad Fauzi (1001)
      { id: "NA001", mapel_kode: "M01", kelas_id: "K01", semester: 1, siswa_nis: "1001", nilai: 90 },
      { id: "NA002", mapel_kode: "M02", kelas_id: "K01", semester: 1, siswa_nis: "1001", nilai: 82 },

      // Bunga Citra (1002)
      { id: "NA003", mapel_kode: "M01", kelas_id: "K01", semester: 1, siswa_nis: "1002", nilai: 65 },

      // Candra Wijaya (1003)
      { id: "NA004", mapel_kode: "M01", kelas_id: "K01", semester: 1, siswa_nis: "1003", nilai: 85 },

      // Dina Mariana (1004)
      { id: "NA005", mapel_kode: "M01", kelas_id: "K01", semester: 1, siswa_nis: "1004", nilai: 75 },

      // Ervan Kurniawan (1005)
      { id: "NA006", mapel_kode: "M01", kelas_id: "K01", semester: 1, siswa_nis: "1005", nilai: 80 },
    ],
    audit_log: [
      {
        id: "AL001",
        timestamp: new Date().toISOString(),
        user_id: "U01",
        username: "admin",
        aktivitas: "Inisialisasi sistem penilaian & data dummy sekolah dasar",
        ip_address: "127.0.0.1",
      },
    ],
  };
}

// Database Service Instance Manager
export class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      const dbDir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const fileContent = fs.readFileSync(STORE_PATH, "utf-8");
        return JSON.parse(fileContent) as DatabaseSchema;
      } else {
        const initial = getInitialData();
        fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
      }
    } catch (e) {
      console.error("Gagal membaca atau memuat database JSON, menggunakan data in-memory:", e);
      return getInitialData();
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Gagal menyimpan data ke file JSON:", e);
    }
  }

  // =====================================================================
  // AUDIT LOG MANAGEMENT
  // =====================================================================
  public addLog(user: { id: string | null; username: string }, aktivitas: string, ip: string = "127.0.0.1"): void {
    const log: AuditLog = {
      id: "AL_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      user_id: user.id,
      username: user.username,
      aktivitas,
      ip_address: ip,
    };
    this.data.audit_log.unshift(log); // newest first
    // Limit logs to last 500 records
    if (this.data.audit_log.length > 500) {
      this.data.audit_log = this.data.audit_log.slice(0, 500);
    }
    this.save();
  }

  public getLogs(): AuditLog[] {
    return this.data.audit_log;
  }

  // =====================================================================
  // SCHOOL DATA (SEKOLAH)
  // =====================================================================
  public getSekolah(): Sekolah {
    return this.data.sekolah;
  }

  public updateSekolah(sekolah: Partial<Sekolah>, actor: { id: string; username: string }): Sekolah {
    this.data.sekolah = { ...this.data.sekolah, ...sekolah, id: 1 };
    this.addLog(actor, `Memperbarui data sekolah: ${this.data.sekolah.nama_sekolah}`);
    this.save();
    return this.data.sekolah;
  }

  // =====================================================================
  // USER MANAGEMENT
  // =====================================================================
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: Omit<User, "id" | "passwordHash"> & { passwordText: string }, actor: { id: string; username: string }): User {
    // Check if username unique
    if (this.getUserByUsername(user.username)) {
      throw new Error(`Username "${user.username}" sudah digunakan.`);
    }

    const id = "U_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const passwordHash = bcrypt.hashSync(user.passwordText, 10);

    const newUser: User = {
      id,
      nama_user: user.nama_user,
      username: user.username.toLowerCase().trim(),
      passwordHash,
      role: user.role,
      status_aktif: user.status_aktif,
    };

    this.data.users.push(newUser);
    this.addLog(actor, `Menambahkan user baru: ${user.username} (${user.role})`);
    this.save();
    return newUser;
  }

  public updateUser(id: string, update: Partial<User> & { passwordText?: string }, actor: { id: string; username: string }): User {
    const userIndex = this.data.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User ID "${id}" tidak ditemukan.`);
    }

    const current = this.data.users[userIndex];

    // If username changes, verify uniqueness
    if (update.username && update.username.toLowerCase() !== current.username.toLowerCase()) {
      if (this.getUserByUsername(update.username)) {
        throw new Error(`Username "${update.username}" sudah digunakan.`);
      }
    }

    const updatedUser = { ...current };

    if (update.nama_user !== undefined) updatedUser.nama_user = update.nama_user;
    if (update.username !== undefined) updatedUser.username = update.username.toLowerCase().trim();
    if (update.role !== undefined) updatedUser.role = update.role as any;
    if (update.status_aktif !== undefined) updatedUser.status_aktif = update.status_aktif;
    if (update.passwordText) {
      updatedUser.passwordHash = bcrypt.hashSync(update.passwordText, 10);
    }

    this.data.users[userIndex] = updatedUser;
    this.addLog(actor, `Memperbarui data user: ${updatedUser.username} (ID: ${id})`);
    this.save();
    return updatedUser;
  }

  public deleteUser(id: string, actor: { id: string; username: string }): void {
    const user = this.getUserById(id);
    if (!user) throw new Error("User tidak ditemukan.");
    if (user.username === "admin") throw new Error("User Administrator utama tidak dapat dihapus.");

    // Unlink teacher if references this user
    this.data.guru = this.data.guru.map((g) => {
      if (g.user_id === id) {
        return { ...g, user_id: null };
      }
      return g;
    });

    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.addLog(actor, `Menghapus user: ${user.username} (ID: ${id})`);
    this.save();
  }

  // =====================================================================
  // GURU MANAGEMENT
  // =====================================================================
  public getGuru(): Guru[] {
    return this.data.guru;
  }

  public getGuruByNip(nip: string): Guru | undefined {
    return this.data.guru.find((g) => g.nip === nip);
  }

  public createGuru(guru: Guru, actor: { id: string; username: string }): Guru {
    if (this.getGuruByNip(guru.nip)) {
      throw new Error(`NIP "${guru.nip}" sudah terdaftar.`);
    }

    this.data.guru.push(guru);
    this.addLog(actor, `Menambahkan guru baru: ${guru.nama_guru} (NIP: ${guru.nip})`);
    this.save();
    return guru;
  }

  public updateGuru(nip: string, update: Partial<Guru>, actor: { id: string; username: string }): Guru {
    const idx = this.data.guru.findIndex((g) => g.nip === nip);
    if (idx === -1) throw new Error(`Guru NIP "${nip}" tidak ditemukan.`);

    const updated = { ...this.data.guru[idx], ...update, nip };
    this.data.guru[idx] = updated;

    this.addLog(actor, `Memperbarui data guru: ${updated.nama_guru} (NIP: ${nip})`);
    this.save();
    return updated;
  }

  public deleteGuru(nip: string, actor: { id: string; username: string }): void {
    const guru = this.getGuruByNip(nip);
    if (!guru) throw new Error("Guru tidak ditemukan.");

    // Relational checks and cascade
    // Set wali kelas NIP to null
    this.data.kelas = this.data.kelas.map((k) => {
      if (k.wali_kelas_nip === nip) {
        return { ...k, wali_kelas_nip: null };
      }
      return k;
    });

    // Delete guru pengampu linkages
    this.data.guru_pengampu = this.data.guru_pengampu.filter((gp) => gp.guru_nip !== nip);

    this.data.guru = this.data.guru.filter((g) => g.nip !== nip);
    this.addLog(actor, `Menghapus guru: ${guru.nama_guru} (NIP: ${nip})`);
    this.save();
  }

  // =====================================================================
  // KELAS MANAGEMENT
  // =====================================================================
  public getKelas(): Kelas[] {
    return this.data.kelas;
  }

  public getKelasById(id: string): Kelas | undefined {
    return this.data.kelas.find((k) => k.id === id);
  }

  public createKelas(kelas: Kelas, actor: { id: string; username: string }): Kelas {
    if (this.getKelasById(kelas.id)) {
      throw new Error(`Kode Kelas "${kelas.id}" sudah digunakan.`);
    }

    this.data.kelas.push(kelas);
    this.addLog(actor, `Menambahkan kelas baru: ${kelas.nama_rombel}`);
    this.save();
    return kelas;
  }

  public updateKelas(id: string, update: Partial<Kelas>, actor: { id: string; username: string }): Kelas {
    const idx = this.data.kelas.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error("Kelas tidak ditemukan.");

    const updated = { ...this.data.kelas[idx], ...update, id };
    this.data.kelas[idx] = updated;

    this.addLog(actor, `Memperbarui kelas: ${updated.nama_rombel}`);
    this.save();
    return updated;
  }

  public deleteKelas(id: string, actor: { id: string; username: string }): void {
    const kelas = this.getKelasById(id);
    if (!kelas) throw new Error("Kelas tidak ditemukan.");

    // Check if students exist in this class
    const hasStudents = this.data.siswa.some((s) => s.kelas_id === id);
    if (hasStudents) {
      throw new Error(`Kelas ${kelas.nama_rombel} tidak dapat dihapus karena masih memiliki siswa terdaftar.`);
    }

    // Cascade delete assignments, KKM, etc
    this.data.guru_pengampu = this.data.guru_pengampu.filter((gp) => gp.kelas_id !== id);
    this.data.kkm = this.data.kkm.filter((k) => k.kelas_id !== id);
    this.data.nilai_formatif = this.data.nilai_formatif.filter((n) => n.kelas_id !== id);
    this.data.nilai_slm = this.data.nilai_slm.filter((n) => n.kelas_id !== id);
    this.data.nilai_sas = this.data.nilai_sas.filter((n) => n.kelas_id !== id);

    this.data.kelas = this.data.kelas.filter((k) => k.id !== id);
    this.addLog(actor, `Menghapus kelas: ${kelas.nama_rombel}`);
    this.save();
  }

  // =====================================================================
  // SISWA MANAGEMENT
  // =====================================================================
  public getSiswa(): Siswa[] {
    return this.data.siswa;
  }

  public getSiswaByNis(nis: string): Siswa | undefined {
    return this.data.siswa.find((s) => s.nis === nis);
  }

  public createSiswa(siswa: Siswa, actor: { id: string; username: string }): Siswa {
    if (this.getSiswaByNis(siswa.nis)) {
      throw new Error(`Siswa dengan NIS "${siswa.nis}" sudah terdaftar.`);
    }
    // Verify class exists
    if (!this.getKelasById(siswa.kelas_id)) {
      throw new Error(`Kelas ID "${siswa.kelas_id}" tidak valid.`);
    }

    this.data.siswa.push(siswa);
    this.addLog(actor, `Menambahkan siswa baru: ${siswa.nama_lengkap} (NIS: ${siswa.nis})`);
    this.save();
    return siswa;
  }

  public createSiswaBulk(siswaList: any[], actor: { id: string; username: string }): { success: number; errors: string[] } {
    const errors: string[] = [];
    let success = 0;

    for (const siswa of siswaList) {
      try {
        if (!siswa.nis || !siswa.nisn || !siswa.nama_lengkap || !siswa.kelas_id) {
          throw new Error("NIS, NISN, Nama, dan Kelas Rombel wajib diisi.");
        }
        
        const nisStr = String(siswa.nis).trim();
        const nisnStr = String(siswa.nisn).trim();
        const kelasIdStr = String(siswa.kelas_id).trim();

        if (this.getSiswaByNis(nisStr)) {
          throw new Error(`Siswa dengan NIS "${nisStr}" sudah terdaftar.`);
        }
        
        // Let's do a case-insensitive check on Class name/ID if they supplied a name instead of ID
        let matchedKelas = this.getKelasById(kelasIdStr);
        if (!matchedKelas) {
          // Try to match by nama_rombel (e.g. "4A" or "Kelas 4A")
          const cleanName = kelasIdStr.toLowerCase().replace(/kelas\s*/g, "").trim();
          const found = this.data.kelas.find(
            (c) => c.nama_rombel.toLowerCase().trim() === cleanName || c.id.toLowerCase().trim() === kelasIdStr.toLowerCase()
          );
          if (found) {
            matchedKelas = found;
          }
        }

        if (!matchedKelas) {
          throw new Error(`Kelas "${kelasIdStr}" tidak ditemukan di sistem.`);
        }

        let jk: "L" | "P" = "L";
        const jkInput = String(siswa.jenis_kelamin || "").toUpperCase().trim();
        if (jkInput === "P" || jkInput === "PEREMPUAN") {
          jk = "P";
        }

        const newSiswa: Siswa = {
          nis: nisStr,
          nisn: nisnStr,
          nama_lengkap: String(siswa.nama_lengkap).trim(),
          jenis_kelamin: jk,
          tempat_lahir: String(siswa.tempat_lahir || "Malang").trim(),
          tanggal_lahir: String(siswa.tanggal_lahir || "2015-01-01").trim(),
          nama_orang_tua: String(siswa.nama_orang_tua || "-").trim(),
          kelas_id: matchedKelas.id,
          status_aktif: siswa.status_aktif !== undefined ? Boolean(siswa.status_aktif) : true,
        };

        this.data.siswa.push(newSiswa);
        success++;
      } catch (err: any) {
        errors.push(`Siswa ${siswa.nama_lengkap || ""} (NIS: ${siswa.nis || "-"}): ${err.message}`);
      }
    }

    if (success > 0) {
      this.addLog(actor, `Menambahkan ${success} siswa baru via bulk upload.`);
      this.save();
    }

    return { success, errors };
  }

  public updateSiswa(nis: string, update: Partial<Siswa>, actor: { id: string; username: string }): Siswa {
    const idx = this.data.siswa.findIndex((s) => s.nis === nis);
    if (idx === -1) throw new Error("Siswa tidak ditemukan.");

    if (update.kelas_id && !this.getKelasById(update.kelas_id)) {
      throw new Error(`Kelas ID "${update.kelas_id}" tidak valid.`);
    }

    const updated = { ...this.data.siswa[idx], ...update, nis };
    this.data.siswa[idx] = updated;

    this.addLog(actor, `Memperbarui data siswa: ${updated.nama_lengkap} (NIS: ${nis})`);
    this.save();
    return updated;
  }

  public deleteSiswa(nis: string, actor: { id: string; username: string }): void {
    const siswa = this.getSiswaByNis(nis);
    if (!siswa) throw new Error("Siswa tidak ditemukan.");

    // Cascade delete student grades
    this.data.nilai_formatif = this.data.nilai_formatif.filter((n) => n.siswa_nis !== nis);
    this.data.nilai_slm = this.data.nilai_slm.filter((n) => n.siswa_nis !== nis);
    this.data.nilai_sas = this.data.nilai_sas.filter((n) => n.siswa_nis !== nis);

    this.data.siswa = this.data.siswa.filter((s) => s.nis !== nis);
    this.addLog(actor, `Menghapus siswa: ${siswa.nama_lengkap} (NIS: ${nis})`);
    this.save();
  }

  // =====================================================================
  // MATA PELAJARAN (MAPEL)
  // =====================================================================
  public getMapel(): Mapel[] {
    return this.data.mapel;
  }

  public getMapelByKode(kode: string): Mapel | undefined {
    return this.data.mapel.find((m) => m.kode_mapel === kode);
  }

  public createMapel(mapel: Mapel, actor: { id: string; username: string }): Mapel {
    if (this.getMapelByKode(mapel.kode_mapel)) {
      throw new Error(`Mata Pelajaran dengan kode "${mapel.kode_mapel}" sudah ada.`);
    }

    this.data.mapel.push(mapel);
    this.addLog(actor, `Menambahkan mata pelajaran: ${mapel.nama_mapel} (Kode: ${mapel.kode_mapel})`);
    this.save();
    return mapel;
  }

  public updateMapel(kode: string, update: Partial<Mapel>, actor: { id: string; username: string }): Mapel {
    const idx = this.data.mapel.findIndex((m) => m.kode_mapel === kode);
    if (idx === -1) throw new Error("Mata pelajaran tidak ditemukan.");

    const updated = { ...this.data.mapel[idx], ...update, kode_mapel: kode };
    this.data.mapel[idx] = updated;

    this.addLog(actor, `Memperbarui mata pelajaran: ${updated.nama_mapel}`);
    this.save();
    return updated;
  }

  public deleteMapel(kode: string, actor: { id: string; username: string }): void {
    const mapel = this.getMapelByKode(kode);
    if (!mapel) throw new Error("Mata pelajaran tidak ditemukan.");

    // Cascade deletes
    this.data.guru_pengampu = this.data.guru_pengampu.filter((gp) => gp.mapel_kode !== kode);
    this.data.tujuan_pembelajaran = this.data.tujuan_pembelajaran.filter((tp) => tp.mapel_kode !== kode);
    this.data.kkm = this.data.kkm.filter((k) => k.mapel_kode !== kode);
    this.data.nilai_formatif = this.data.nilai_formatif.filter((n) => n.mapel_kode !== kode);
    this.data.nilai_slm = this.data.nilai_slm.filter((n) => n.mapel_kode !== kode);
    this.data.nilai_sas = this.data.nilai_sas.filter((n) => n.mapel_kode !== kode);

    this.data.mapel = this.data.mapel.filter((m) => m.kode_mapel !== kode);
    this.addLog(actor, `Menghapus mata pelajaran: ${mapel.nama_mapel}`);
    this.save();
  }

  // =====================================================================
  // GURU PENGAMPU (ASSIGNMENTS)
  // =====================================================================
  public getGuruPengampu(): GuruPengampu[] {
    return this.data.guru_pengampu;
  }

  public createGuruPengampu(gp: Omit<GuruPengampu, "id">, actor: { id: string; username: string }): GuruPengampu {
    const id = "GP_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const newGp: GuruPengampu = { ...gp, id };

    // Check duplicates
    const dup = this.data.guru_pengampu.find(
      (x) => x.guru_nip === gp.guru_nip && x.kelas_id === gp.kelas_id && x.mapel_kode === gp.mapel_kode && x.tipe === gp.tipe
    );
    if (dup) throw new Error("Pengampu kelas/mata pelajaran ini sudah dikonfigurasi.");

    this.data.guru_pengampu.push(newGp);
    this.addLog(actor, `Mengonfigurasi pengampu guru NIP ${gp.guru_nip} pada kelas ${gp.kelas_id}`);
    this.save();
    return newGp;
  }

  public deleteGuruPengampu(id: string, actor: { id: string; username: string }): void {
    const gp = this.data.guru_pengampu.find((x) => x.id === id);
    if (!gp) throw new Error("Pengaturan pengampu tidak ditemukan.");

    this.data.guru_pengampu = this.data.guru_pengampu.filter((x) => x.id !== id);
    this.addLog(actor, `Menghapus konfigurasi pengampu ID ${id}`);
    this.save();
  }

  // =====================================================================
  // KKM MANAGEMENT
  // =====================================================================
  public getKKM(): KKM[] {
    return this.data.kkm;
  }

  public createOrUpdateKKM(mapelKode: string, kelasId: string, nilai: number, actor: { id: string; username: string }): KKM {
    const idx = this.data.kkm.findIndex((k) => k.mapel_kode === mapelKode && k.kelas_id === kelasId);
    if (idx !== -1) {
      this.data.kkm[idx].nilai_kkm = nilai;
      this.addLog(actor, `Memperbarui KKM mapel ${mapelKode} kelas ${kelasId} menjadi ${nilai}`);
      this.save();
      return this.data.kkm[idx];
    } else {
      const newKkm: KKM = {
        id: "KKM_" + Date.now() + "_" + Math.floor(Math.random() * 100),
        mapel_kode: mapelKode,
        kelas_id: kelasId,
        nilai_kkm: nilai,
      };
      this.data.kkm.push(newKkm);
      this.addLog(actor, `Membuat KKM mapel ${mapelKode} kelas ${kelasId} sebesar ${nilai}`);
      this.save();
      return newKkm;
    }
  }

  public deleteKKM(id: string, actor: { id: string; username: string }): void {
    this.data.kkm = this.data.kkm.filter((k) => k.id !== id);
    this.addLog(actor, `Menghapus KKM ID ${id}`);
    this.save();
  }

  // =====================================================================
  // BOBOT PENILAIAN
  // =====================================================================
  public getBobot(): BobotPenilaian {
    return this.data.bobot_penilaian;
  }

  public updateBobot(bobot: BobotPenilaian, actor: { id: string; username: string }): BobotPenilaian {
    if (bobot.formatif_pct + bobot.slm_pct + bobot.sas_pct !== 100) {
      throw new Error("Total bobot harus tepat 100%.");
    }
    this.data.bobot_penilaian = { ...bobot, id: 1 };
    this.addLog(actor, `Memperbarui bobot penilaian: Formatif ${bobot.formatif_pct}%, SLM ${bobot.slm_pct}%, SAS ${bobot.sas_pct}%`);
    this.save();
    return this.data.bobot_penilaian;
  }

  // =====================================================================
  // TUJUAN PEMBELAJARAN (TP)
  // =====================================================================
  public getTP(): TujuanPembelajaran[] {
    return this.data.tujuan_pembelajaran;
  }

  public getTPById(id: string): TujuanPembelajaran | undefined {
    return this.data.tujuan_pembelajaran.find((tp) => tp.id === id);
  }

  public createTP(tp: Omit<TujuanPembelajaran, "id">, actor: { id: string; username: string }): TujuanPembelajaran {
    const id = "TP_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    
    // Auto-fill kelas and fase from Mapel if missing
    let kelas = tp.kelas;
    let fase = tp.fase;
    if (!kelas || !fase) {
      const foundMapel = this.data.mapel.find((m) => m.kode_mapel === tp.mapel_kode);
      if (foundMapel) {
        kelas = kelas || foundMapel.tingkat_kelas;
        fase = fase || foundMapel.fase;
      }
    }

    const newTp: TujuanPembelajaran = { 
      ...tp, 
      id,
      kelas: kelas || 1,
      fase: fase || "A"
    };

    this.data.tujuan_pembelajaran.push(newTp);
    this.addLog(actor, `Menambahkan TP ${tp.kode_tp} untuk Mapel ${tp.mapel_kode}`);
    this.save();
    return newTp;
  }

  public updateTP(id: string, update: Partial<TujuanPembelajaran>, actor: { id: string; username: string }): TujuanPembelajaran {
    const idx = this.data.tujuan_pembelajaran.findIndex((tp) => tp.id === id);
    if (idx === -1) throw new Error("TP tidak ditemukan.");

    const updated = { ...this.data.tujuan_pembelajaran[idx], ...update, id };
    this.data.tujuan_pembelajaran[idx] = updated;

    this.addLog(actor, `Memperbarui TP ${updated.kode_tp}`);
    this.save();
    return updated;
  }

  public deleteTP(id: string, actor: { id: string; username: string }): void {
    const tp = this.getTPById(id);
    if (!tp) throw new Error("TP tidak ditemukan.");

    // Cascade delete formatif grades associated with this TP
    this.data.nilai_formatif = this.data.nilai_formatif.filter((nf) => nf.tp_id !== id);

    this.data.tujuan_pembelajaran = this.data.tujuan_pembelajaran.filter((t) => t.id !== id);
    this.addLog(actor, `Menghapus TP: ${tp.kode_tp}`);
    this.save();
  }

  // =====================================================================
  // SCORING MODULE (NILAI FORMATIF, SLM, SAS)
  // =====================================================================
  public getNilaiFormatif(): NilaiFormatif[] {
    return this.data.nilai_formatif;
  }

  public saveNilaiFormatif(nf: Omit<NilaiFormatif, "id">, actor: { id: string; username: string }): NilaiFormatif {
    if (nf.nilai < 0 || nf.nilai > 100) throw new Error("Nilai harus berada di antara 0 - 100.");

    const idx = this.data.nilai_formatif.findIndex(
      (n) => n.siswa_nis === nf.siswa_nis && n.tp_id === nf.tp_id
    );

    if (idx !== -1) {
      this.data.nilai_formatif[idx].nilai = nf.nilai;
      this.save();
      return this.data.nilai_formatif[idx];
    } else {
      const id = "NF_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const item: NilaiFormatif = { ...nf, id };
      this.data.nilai_formatif.push(item);
      this.save();
      return item;
    }
  }

  public updateNilaiFormatif(id: string, nilai: number, actor: { id: string; username: string }): NilaiFormatif {
    if (nilai < 0 || nilai > 100) throw new Error("Nilai harus berada di antara 0 - 100.");
    const idx = this.data.nilai_formatif.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error("Nilai formatif tidak ditemukan.");
    this.data.nilai_formatif[idx].nilai = nilai;
    this.save();
    return this.data.nilai_formatif[idx];
  }

  public deleteNilaiFormatif(id: string, actor: { id: string; username: string }): void {
    this.data.nilai_formatif = this.data.nilai_formatif.filter((n) => n.id !== id);
    this.save();
  }

  // SLM Scores
  public getNilaiSLM(): NilaiSLM[] {
    return this.data.nilai_slm;
  }

  public saveNilaiSLM(ns: Omit<NilaiSLM, "id">, actor: { id: string; username: string }): NilaiSLM {
    if (ns.nilai < 0 || ns.nilai > 100) throw new Error("Nilai harus berada di antara 0 - 100.");

    const idx = this.data.nilai_slm.findIndex(
      (n) => n.siswa_nis === ns.siswa_nis && n.tp_id === ns.tp_id
    );

    if (idx !== -1) {
      this.data.nilai_slm[idx].nilai = ns.nilai;
      this.save();
      return this.data.nilai_slm[idx];
    } else {
      const id = "SLM_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const item: NilaiSLM = { ...ns, id };
      this.data.nilai_slm.push(item);
      this.save();
      return item;
    }
  }

  public updateNilaiSLM(id: string, nilai: number, actor: { id: string; username: string }): NilaiSLM {
    if (nilai < 0 || nilai > 100) throw new Error("Nilai harus berada di antara 0 - 100.");
    const idx = this.data.nilai_slm.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error("Nilai sumatif lingkup materi tidak ditemukan.");
    this.data.nilai_slm[idx].nilai = nilai;
    this.save();
    return this.data.nilai_slm[idx];
  }

  public deleteNilaiSLM(id: string, actor: { id: string; username: string }): void {
    this.data.nilai_slm = this.data.nilai_slm.filter((n) => n.id !== id);
    this.save();
  }

  // SAS Scores
  public getNilaiSAS(): NilaiSAS[] {
    return this.data.nilai_sas;
  }

  public saveNilaiSAS(nas: Omit<NilaiSAS, "id">, actor: { id: string; username: string }): NilaiSAS {
    if (nas.nilai < 0 || nas.nilai > 100) throw new Error("Nilai harus berada di antara 0 - 100.");

    // Check if there is already a SAS score for this student, mapel, kelas, semester.
    // SAS is usually one score per semester. If it already exists, overwrite it.
    const idx = this.data.nilai_sas.findIndex(
      (n) => n.siswa_nis === nas.siswa_nis && n.mapel_kode === nas.mapel_kode && n.kelas_id === nas.kelas_id && n.semester === nas.semester
    );

    if (idx !== -1) {
      this.data.nilai_sas[idx].nilai = nas.nilai;
      this.save();
      return this.data.nilai_sas[idx];
    } else {
      const id = "SAS_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const item: NilaiSAS = { ...nas, id };
      this.data.nilai_sas.push(item);
      this.save();
      return item;
    }
  }

  // =====================================================================
  // REKAP NILAI GENERATION (COMPUTED RELATIONAL VIEW)
  // =====================================================================
  public generateRekap(
    filters: {
      tahun_pelajaran?: string;
      semester?: number;
      kelas_id?: string;
      mapel_kode?: string;
      search_siswa?: string;
    } = {}
  ) {
    const { sekolah, siswa, kelas, mapel, kkm, bobot_penilaian, nilai_formatif, nilai_slm, nilai_sas, tujuan_pembelajaran } = this.data;

    const activeSemester = filters.semester || sekolah.semester;

    // Filter students by class if specified
    let filteredSiswa = siswa.filter((s) => s.status_aktif);
    if (filters.kelas_id) {
      filteredSiswa = filteredSiswa.filter((s) => s.kelas_id === filters.kelas_id);
    }
    if (filters.search_siswa) {
      const search = filters.search_siswa.toLowerCase();
      filteredSiswa = filteredSiswa.filter((s) => s.nama_lengkap.toLowerCase().includes(search) || s.nis.includes(search));
    }

    // Subjects
    let filteredMapel = mapel;
    if (filters.mapel_kode) {
      filteredMapel = mapel.filter((m) => m.kode_mapel === filters.mapel_kode);
    }

    const result: any[] = [];

    for (const student of filteredSiswa) {
      const currentKelas = kelas.find((k) => k.id === student.kelas_id);
      if (!currentKelas) continue;

      for (const subject of filteredMapel) {
        // Find TPs of this subject for the student's grade/tingkat and semester
        const tps = tujuan_pembelajaran.filter(
          (tp) => tp.mapel_kode === subject.kode_mapel && tp.kelas === currentKelas.tingkat && tp.semester === activeSemester
        );

        // Calculate average formatif per TP
        const formatifScores = nilai_formatif.filter(
          (nf) => nf.siswa_nis === student.nis && nf.mapel_kode === subject.kode_mapel && nf.kelas_id === student.kelas_id
        );

        let sumOfTPAverages = 0;
        let countTPsWithScores = 0;
        const tpScores: Record<string, number> = {};

        for (const tp of tps) {
          const scoresForTp = formatifScores.filter((fs) => fs.tp_id === tp.id);
          if (scoresForTp.length > 0) {
            const tpAvg = scoresForTp.reduce((sum, current) => sum + current.nilai, 0) / scoresForTp.length;
            sumOfTPAverages += tpAvg;
            countTPsWithScores++;
            tpScores[tp.id] = Number(tpAvg.toFixed(1));
          }
        }

        const avgFormatif = countTPsWithScores > 0 ? sumOfTPAverages / countTPsWithScores : 0;

        // Calculate average SLM
        const slmScores = nilai_slm.filter(
          (ns) => ns.siswa_nis === student.nis && ns.mapel_kode === subject.kode_mapel && ns.kelas_id === student.kelas_id
        );
        const avgSlm = slmScores.length > 0 ? slmScores.reduce((sum, current) => sum + current.nilai, 0) / slmScores.length : 0;

        const slmScoresMap: Record<string, number> = {};
        for (const ns of slmScores) {
          slmScoresMap[ns.tp_id] = ns.nilai;
        }

        // Get SAS score
        const sasRecord = nilai_sas.find(
          (ns) =>
            ns.siswa_nis === student.nis &&
            ns.mapel_kode === subject.kode_mapel &&
            ns.kelas_id === student.kelas_id &&
            ns.semester === activeSemester
        );
        const sasScore = sasRecord ? sasRecord.nilai : 0;

        // Calculate final score based on weights
        const wFormatif = bobot_penilaian.formatif_pct / 100;
        const wSlm = bobot_penilaian.slm_pct / 100;
        const wSas = bobot_penilaian.sas_pct / 100;

        const finalScore = Math.round(avgFormatif * wFormatif + avgSlm * wSlm + sasScore * wSas);

        // Get KKM for this subject and class
        const kkmRecord = kkm.find((k) => k.mapel_kode === subject.kode_mapel && k.kelas_id === student.kelas_id);
        const minPassing = kkmRecord ? kkmRecord.nilai_kkm : 70;

        const isPassing = finalScore >= minPassing;

        result.push({
          nis: student.nis,
          nisn: student.nisn,
          nama_siswa: student.nama_lengkap,
          kelas_id: student.kelas_id,
          nama_kelas: currentKelas.nama_rombel,
          mapel_kode: subject.kode_mapel,
          nama_mapel: subject.nama_mapel,
          avg_formatif: Number(avgFormatif.toFixed(1)),
          avg_slm: Number(avgSlm.toFixed(1)),
          nilai_sas: sasScore,
          nilai_akhir: finalScore,
          kkm: minPassing,
          status_ketuntasan: isPassing ? "Tuntas" : "Belum Tuntas",
          tp_scores: tpScores,
          slm_scores: slmScoresMap,
        });
      }
    }

    return result;
  }
}

// Export single shared DB service instance
export const dbService = new DatabaseService();
