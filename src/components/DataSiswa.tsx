import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Siswa, Kelas } from "../types";
import { Plus, Edit2, Trash2, Search, X, Save, AlertCircle, ShieldCheck, Filter, Upload, FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function DataSiswa() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [classList, setClassList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siswaToDelete, setSiswaToDelete] = useState<{ nis: string; nama_lengkap: string } | null>(null);

  // Excel upload states
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelError, setExcelError] = useState("");
  const [excelSuccessMsg, setExcelSuccessMsg] = useState("");
  const [importing, setImporting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingNis, setEditingNis] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nis: "",
    nisn: "",
    nama_lengkap: "",
    jenis_kelamin: "L" as Siswa["jenis_kelamin"],
    tempat_lahir: "",
    tanggal_lahir: "",
    nama_orang_tua: "",
    kelas_id: "",
    status_aktif: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, kRes] = await Promise.all([api.get("/api/siswa"), api.get("/api/kelas")]);
      setSiswaList(sRes || []);
      setClassList(kRes || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data siswa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingNis(null);
    setFormData({
      nis: "",
      nisn: "",
      nama_lengkap: "",
      jenis_kelamin: "L",
      tempat_lahir: "",
      tanggal_lahir: "",
      nama_orang_tua: "",
      kelas_id: classList[0]?.id || "",
      status_aktif: true,
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (s: Siswa) => {
    setEditingNis(s.nis);
    setFormData({
      nis: s.nis,
      nisn: s.nisn,
      nama_lengkap: s.nama_lengkap,
      jenis_kelamin: s.jenis_kelamin,
      tempat_lahir: s.tempat_lahir,
      tanggal_lahir: s.tanggal_lahir,
      nama_orang_tua: s.nama_orang_tua,
      kelas_id: s.kelas_id,
      status_aktif: s.status_aktif,
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (nis: string, nama: string) => {
    setSiswaToDelete({ nis, nama_lengkap: nama });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!siswaToDelete) return;
    try {
      await api.delete(`/api/siswa/${siswaToDelete.nis}`);
      setSuccess(`Data siswa "${siswaToDelete.nama_lengkap}" berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setSiswaToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus siswa.");
      setShowDeleteModal(false);
      setSiswaToDelete(null);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "NIS",
      "NISN",
      "Nama Lengkap",
      "Jenis Kelamin (L/P)",
      "Tempat Lahir",
      "Tanggal Lahir (YYYY-MM-DD)",
      "Nama Orang Tua",
      "Kelas Rombel (ID atau Nama)"
    ];
    
    const sampleKelas = classList[0]?.nama_rombel || "1A";
    const sampleKelas2 = classList[1]?.nama_rombel || "1B";

    const data = [
      headers,
      ["10001", "0123456789", "Ahmad Fauzi", "L", "Malang", "2015-05-12", "Sutrisno", sampleKelas],
      ["10002", "0123456790", "Siti Aminah", "P", "Malang", "2015-08-22", "Abdullah", sampleKelas2]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Siswa");
    
    XLSX.writeFile(workbook, "Template_Upload_Siswa.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelError("");
    setExcelSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];

        if (rawRows.length < 2) {
          throw new Error("File Excel kosong atau tidak memiliki baris data.");
        }

        const headers = rawRows[0].map((h: any) => String(h || "").trim().toLowerCase());
        
        const idxNis = headers.findIndex((h: string) => h.includes("nis") && !h.includes("nisn"));
        const idxNisn = headers.findIndex((h: string) => h.includes("nisn"));
        const idxNama = headers.findIndex((h: string) => (h.includes("nama") && h.includes("lengkap")) || h === "nama");
        const idxJk = headers.findIndex((h: string) => h.includes("kelamin") || h === "jk" || h === "jenis kelamin");
        const idxTempat = headers.findIndex((h: string) => h.includes("tempat"));
        const idxTanggal = headers.findIndex((h: string) => h.includes("tanggal") || h.includes("tgl"));
        const idxOrtu = headers.findIndex((h: string) => h.includes("orang tua") || h.includes("ortu") || h.includes("wali"));
        const idxKelas = headers.findIndex((h: string) => h.includes("kelas") || h.includes("rombel"));

        if (idxNis === -1 || idxNama === -1 || idxKelas === -1) {
          throw new Error("Format kolom tidak cocok. Pastikan terdapat kolom: 'NIS', 'Nama Lengkap', dan 'Kelas Rombel'.");
        }

        const parsed: any[] = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          
          const isEmpty = row.every((cell: any) => cell === null || cell === undefined || String(cell).trim() === "");
          if (isEmpty) continue;

          const nisVal = String(row[idxNis] || "").trim();
          const nameVal = String(row[idxNama] || "").trim();
          const kelasVal = String(row[idxKelas] || "").trim();

          if (!nisVal || !nameVal || !kelasVal) continue;

          parsed.push({
            nis: nisVal,
            nisn: idxNisn !== -1 ? String(row[idxNisn] || "").trim() : nisVal,
            nama_lengkap: nameVal,
            jenis_kelamin: idxJk !== -1 ? String(row[idxJk] || "").trim() : "L",
            tempat_lahir: idxTempat !== -1 ? String(row[idxTempat] || "").trim() : "Malang",
            tanggal_lahir: idxTanggal !== -1 ? String(row[idxTanggal] || "").trim() : "2015-01-01",
            nama_orang_tua: idxOrtu !== -1 ? String(row[idxOrtu] || "").trim() : "-",
            kelas_id: kelasVal,
            status_aktif: true
          });
        }

        if (parsed.length === 0) {
          throw new Error("Tidak ada data siswa valid yang dapat dibaca dari file Excel.");
        }

        setExcelData(parsed);
        setExcelSuccessMsg(`Berhasil membaca ${parsed.length} data siswa dari Excel. Silakan klik "Simpan ke Database" di bawah.`);
      } catch (err: any) {
        setExcelError(err.message || "Gagal memproses file Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const saveExcelData = async () => {
    if (excelData.length === 0) return;
    try {
      setImporting(true);
      setExcelError("");
      const res = await api.post("/api/siswa/bulk", { records: excelData });
      
      let msg = `Berhasil mengimpor ${res.success} siswa.`;
      if (res.errors && res.errors.length > 0) {
        msg += ` Gagal: ${res.errors.length} baris (NIP/NIS ganda).`;
        setExcelError(res.errors.join("\n"));
      } else {
        setShowExcelModal(false);
        setExcelData([]);
        setExcelSuccessMsg("");
      }
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 5000);
      loadData();
    } catch (err: any) {
      setExcelError(err.message || "Gagal mengimpor data ke server.");
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.nisn || !formData.nama_lengkap || !formData.kelas_id) {
      setError("NIS, NISN, Nama Lengkap, dan Kelas wajib diisi.");
      return;
    }

    try {
      if (editingNis) {
        await api.put(`/api/siswa/${editingNis}`, formData);
        setSuccess("Data siswa berhasil diperbarui.");
      } else {
        await api.post("/api/siswa", formData);
        setSuccess("Siswa baru berhasil ditambahkan.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data siswa.");
    }
  };

  const filteredSiswa = siswaList.filter((s) => {
    const matchesSearch =
      s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.nisn.includes(search) ||
      s.nama_orang_tua.toLowerCase().includes(search.toLowerCase());

    const matchesClass = selectedClassFilter === "" ? true : s.kelas_id === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan nama, NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Class Filter */}
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all appearance-none"
            >
              <option value="">Semua Kelas</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.nama_rombel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowExcelModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Upload className="h-4.5 w-4.5" />
            Upload Excel
          </button>
          <button
            id="btn-add-siswa"
            onClick={openAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">NIS</th>
                <th className="px-5 py-3">NISN</th>
                <th className="px-5 py-3">Nama Siswa</th>
                <th className="px-5 py-3">J.Kel</th>
                <th className="px-5 py-3">Tempat, Tgl Lahir</th>
                <th className="px-5 py-3">Orang Tua</th>
                <th className="px-5 py-3">Kelas</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredSiswa.length > 0 ? (
                filteredSiswa.map((s) => {
                  const currentClass = classList.find((c) => c.id === s.kelas_id);
                  return (
                    <tr key={s.nis} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-600">{s.nis}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{s.nisn}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{s.nama_lengkap}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-500">{s.jenis_kelamin}</td>
                      <td className="px-5 py-3.5">
                        {s.tempat_lahir}, {s.tanggal_lahir}
                      </td>
                      <td className="px-5 py-3.5">{s.nama_orang_tua}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold font-mono text-[10px]">
                          {currentClass ? currentClass.nama_rombel : s.kelas_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {s.status_aktif ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Mutasi
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(s)}
                            title="Edit Siswa"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s.nis, s.nama_lengkap)}
                            title="Hapus Siswa"
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-display text-sm">
                {editingNis ? "Edit Data Siswa" : "Tambah Siswa Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIS (Nomor Induk)</label>
                  <input
                    type="text"
                    required
                    disabled={editingNis !== null}
                    placeholder="e.g. 1001"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NISN (Nasional)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 012345678"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Fauzi"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                <select
                  value={formData.jenis_kelamin}
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Malang"
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joko Widodo"
                  value={formData.nama_orang_tua}
                  onChange={(e) => setFormData({ ...formData, nama_orang_tua: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kelas Rombel</label>
                  <select
                    value={formData.kelas_id}
                    onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                  >
                    {classList.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.nama_rombel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Keaktifan</label>
                  <select
                    value={formData.status_aktif ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value === "true" })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value="true">Aktif Belajar</option>
                    <option value="false">Mutasi / Keluar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-save-siswa"
                  type="submit"
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && siswaToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Siswa</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus data siswa <strong className="text-slate-700">"{siswaToDelete.nama_lengkap}"</strong> (NIS: {siswaToDelete.nis})? Semua catatan nilai siswa ini akan dihapus secara permanen.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSiswaToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 font-display text-sm">
                  Import Data Siswa via Excel
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelData([]);
                  setExcelError("");
                  setExcelSuccessMsg("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Instructions */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-1.5 text-amber-800 text-[11px] leading-relaxed">
                <span className="font-bold text-xs block">Panduan Penggunaan Template:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Unduh file template Excel terlebih dahulu agar format kolom sesuai.</li>
                  <li>Kolom wajib: <strong className="font-bold">NIS</strong>, <strong className="font-bold">Nama Lengkap</strong>, dan <strong className="font-bold">Kelas Rombel</strong>.</li>
                  <li>Kelas Rombel dapat diisi dengan nama rombel (misal: <strong>1A</strong> atau <strong>1B</strong>).</li>
                  <li>Format tanggal lahir harus berupa text/date <strong className="font-bold">YYYY-MM-DD</strong> (misal: 2015-05-12).</li>
                </ul>
              </div>

              {/* Template Download Button */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Belum punya template?</span>
                  <span className="text-[10px] text-slate-400 block">Gunakan file template Excel standar sekolah ini.</span>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template
                </button>
              </div>

              {/* File input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih File Excel (.xlsx / .xls)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-white transition-all relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">Klik atau seret file Excel ke sini untuk memuat</p>
                    <p className="text-[10px] text-slate-400">Pastikan format kolom sesuai template</p>
                  </div>
                </div>
              </div>

              {excelSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  {excelSuccessMsg}
                </div>
              )}

              {excelError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4.5 w-4.5" />
                    <span>Terjadi kesalahan / info validasi:</span>
                  </div>
                  <pre className="text-[10px] bg-red-100/50 p-2 rounded max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">
                    {excelError}
                  </pre>
                </div>
              )}

              {/* Parsed Rows Preview */}
              {excelData.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Pratinjau Data ({excelData.length} baris):</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-slate-50/50">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                          <th className="px-3 py-1.5 border-b border-slate-200">NIS</th>
                          <th className="px-3 py-1.5 border-b border-slate-200">Nama</th>
                          <th className="px-3 py-1.5 border-b border-slate-200">J.Kel</th>
                          <th className="px-3 py-1.5 border-b border-slate-200">Kelas Rombel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-600">
                        {excelData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-white bg-slate-50/30">
                            <td className="px-3 py-1 font-mono">{row.nis}</td>
                            <td className="px-3 py-1 font-medium text-slate-800">{row.nama_lengkap}</td>
                            <td className="px-3 py-1">{row.jenis_kelamin}</td>
                            <td className="px-3 py-1 font-mono">{row.kelas_id}</td>
                          </tr>
                        ))}
                        {excelData.length > 10 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-1.5 text-center text-[10px] text-slate-400 font-medium">
                              ... dan {excelData.length - 10} data siswa lainnya.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelData([]);
                  setExcelError("");
                  setExcelSuccessMsg("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveExcelData}
                disabled={excelData.length === 0 || importing}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                {importing ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-white"></div>
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan ke Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
