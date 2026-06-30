-- =====================================================================
-- DATABASE SCHEMA: SISTEM PENILAIAN SISWA SD KURIKULUM MERDEKA
-- =====================================================================

-- 1. Table Sekolah
CREATE TABLE sekolah (
    id INT PRIMARY KEY DEFAULT 1,
    nama_sekolah VARCHAR(100) NOT NULL,
    npsn VARCHAR(20) NOT NULL,
    alamat TEXT NOT NULL,
    kecamatan VARCHAR(50) NOT NULL,
    kabupaten_kota VARCHAR(50) NOT NULL,
    provinsi VARCHAR(50) NOT NULL,
    nama_kepala_sekolah VARCHAR(100) NOT NULL,
    tahun_pelajaran VARCHAR(20) NOT NULL, -- e.g., '2025/2026'
    semester INT NOT NULL DEFAULT 1 -- 1 = Ganjil, 2 = Genap
);

-- 2. Table Roles
CREATE TABLE roles (
    id VARCHAR(20) PRIMARY KEY, -- e.g., 'admin', 'guru_kelas', 'guru_mapel'
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Table Users
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    nama_user VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL REFERENCES roles(id),
    status_aktif BOOLEAN DEFAULT TRUE NOT NULL
);

-- 4. Table Guru
CREATE TABLE guru (
    nip VARCHAR(50) PRIMARY KEY,
    nama_guru VARCHAR(100) NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL, -- 'Laki-laki' | 'Perempuan'
    jabatan VARCHAR(100) NOT NULL,
    nomor_hp VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Aktif', -- 'Aktif' | 'Nonaktif'
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Table Kelas (Rombel)
CREATE TABLE kelas (
    id VARCHAR(20) PRIMARY KEY, -- e.g., 'K01', 'K02'
    tingkat INT NOT NULL, -- 1, 2, 3, 4, 5, 6
    nama_rombel VARCHAR(50) NOT NULL, -- e.g., '4A', '4B'
    tahun_pelajaran VARCHAR(20) NOT NULL,
    wali_kelas_nip VARCHAR(50) REFERENCES guru(nip) ON DELETE SET NULL
);

-- 6. Table Siswa
CREATE TABLE siswa (
    nis VARCHAR(20) PRIMARY KEY,
    nisn VARCHAR(20) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL, -- 'L' | 'P'
    tempat_lahir VARCHAR(50) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    nama_orang_tua VARCHAR(100) NOT NULL,
    kelas_id VARCHAR(20) NOT NULL REFERENCES kelas(id) ON DELETE RESTRICT,
    status_aktif BOOLEAN DEFAULT TRUE NOT NULL
);

-- 7. Table Mata Pelajaran (Mapel)
CREATE TABLE mapel (
    kode_mapel VARCHAR(20) PRIMARY KEY, -- e.g., 'M01', 'M02'
    nama_mapel VARCHAR(100) NOT NULL,
    fase VARCHAR(5) NOT NULL, -- 'A' | 'B' | 'C'
    tingkat_kelas INT NOT NULL -- 1 - 6
);

-- 8. Table Guru Pengampu
CREATE TABLE guru_pengampu (
    id VARCHAR(50) PRIMARY KEY,
    guru_nip VARCHAR(50) NOT NULL REFERENCES guru(nip) ON DELETE CASCADE,
    kelas_id VARCHAR(20) NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    mapel_kode VARCHAR(20) REFERENCES mapel(kode_mapel) ON DELETE CASCADE, -- Nullable for Guru Kelas
    tipe VARCHAR(20) NOT NULL -- 'kelas' | 'mapel'
);

-- 9. Table Tujuan Pembelajaran (TP)
CREATE TABLE tujuan_pembelajaran (
    id VARCHAR(50) PRIMARY KEY,
    kode_tp VARCHAR(50) NOT NULL, -- e.g., 'TP1', 'TP2'
    mapel_kode VARCHAR(20) NOT NULL REFERENCES mapel(kode_mapel) ON DELETE CASCADE,
    fase VARCHAR(5) NOT NULL, -- 'A', 'B', 'C'
    kelas INT NOT NULL,
    semester INT NOT NULL, -- 1 | 2
    deskripsi TEXT NOT NULL
);

-- 10. Table KKM
CREATE TABLE kkm (
    id VARCHAR(50) PRIMARY KEY,
    mapel_kode VARCHAR(20) NOT NULL REFERENCES mapel(kode_mapel) ON DELETE CASCADE,
    kelas_id VARCHAR(20) NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    nilai_kkm INT NOT NULL DEFAULT 70
);

-- 11. Table Bobot Penilaian
CREATE TABLE bobot_penilaian (
    id INT PRIMARY KEY DEFAULT 1,
    formatif_pct INT NOT NULL DEFAULT 40, -- 40%
    slm_pct INT NOT NULL DEFAULT 30,      -- 30%
    sas_pct INT NOT NULL DEFAULT 30,      -- 30%
    CONSTRAINT chk_total_100 CHECK (formatif_pct + slm_pct + sas_pct = 100)
);

-- 12. Table Nilai Formatif (per TP)
CREATE TABLE nilai_formatif (
    id VARCHAR(50) PRIMARY KEY,
    mapel_kode VARCHAR(20) NOT NULL REFERENCES mapel(kode_mapel) ON DELETE CASCADE,
    kelas_id VARCHAR(20) NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    tp_id VARCHAR(50) NOT NULL REFERENCES tujuan_pembelajaran(id) ON DELETE CASCADE,
    siswa_nis VARCHAR(20) NOT NULL REFERENCES siswa(nis) ON DELETE CASCADE,
    nilai INT NOT NULL CHECK (nilai >= 0 AND nilai <= 100)
);

-- 13. Table Nilai Sumatif Lingkup Materi (SLM)
CREATE TABLE nilai_slm (
    id VARCHAR(50) PRIMARY KEY,
    mapel_kode VARCHAR(20) NOT NULL REFERENCES mapel(kode_mapel) ON DELETE CASCADE,
    kelas_id VARCHAR(20) NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    lingkup_materi VARCHAR(100) NOT NULL, -- e.g., 'Pecahan', 'Gaya Magnet'
    tanggal DATE NOT NULL,
    siswa_nis VARCHAR(20) NOT NULL REFERENCES siswa(nis) ON DELETE CASCADE,
    nilai INT NOT NULL CHECK (nilai >= 0 AND nilai <= 100)
);

-- 14. Table Nilai Sumatif Akhir Semester (SAS)
CREATE TABLE nilai_sas (
    id VARCHAR(50) PRIMARY KEY,
    mapel_kode VARCHAR(20) NOT NULL REFERENCES mapel(kode_mapel) ON DELETE CASCADE,
    kelas_id VARCHAR(20) NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    semester INT NOT NULL, -- 1 | 2
    siswa_nis VARCHAR(20) NOT NULL REFERENCES siswa(nis) ON DELETE CASCADE,
    nilai INT NOT NULL CHECK (nilai >= 0 AND nilai <= 100)
);

-- 15. Table Audit Log Aktivitas Pengguna
CREATE TABLE audit_log (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    username VARCHAR(50) NOT NULL,
    aktivitas TEXT NOT NULL,
    ip_address VARCHAR(50)
);

-- 16. View/Computed Table: Rekap Nilai (Logical Representation)
-- Diimplementasikan secara dinamis di server untuk rekapitulasi data:
-- - NIS, Nama Siswa, Kelas, Mapel
-- - Rata-rata Formatif per Mapel
-- - Rata-rata SLM per Mapel
-- - Nilai SAS per Mapel
-- - Nilai Akhir: (Rata Formatif * Bobot Formatif) + (Rata SLM * Bobot SLM) + (SAS * Bobot SAS)
-- - KKM, Status Ketuntasan: (Nilai Akhir >= KKM) ? 'Tuntas' : 'Belum Tuntas'
