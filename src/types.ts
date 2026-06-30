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
  semester: number;
}

export interface User {
  id: string;
  nama_user: string;
  username: string;
  role: "admin" | "guru_kelas" | "guru_mapel";
  status_aktif: boolean;
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
  id: string;
  tingkat: number;
  nama_rombel: string;
  tahun_pelajaran: string;
  wali_kelas_nip: string | null;
}

export interface Siswa {
  nis: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string;
  tanggal_lahir: string;
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
  mapel_kode: string | null;
  tipe: "kelas" | "mapel";
}

export interface TujuanPembelajaran {
  id: string;
  kode_tp: string;
  mapel_kode: string;
  fase: "A" | "B" | "C";
  kelas: number;
  semester: number;
  materi_pokok: string;
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
  tanggal?: string;
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

export interface RekapItem {
  nis: string;
  nisn: string;
  nama_siswa: string;
  kelas_id: string;
  nama_kelas: string;
  mapel_kode: string;
  nama_mapel: string;
  avg_formatif: number;
  avg_slm: number;
  nilai_sas: number;
  nilai_akhir: number;
  kkm: number;
  status_ketuntasan: "Tuntas" | "Belum Tuntas";
  tp_scores?: Record<string, number>;
  slm_scores?: Record<string, number>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  username: string;
  aktivitas: string;
  ip_address: string;
}
