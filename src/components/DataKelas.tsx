import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Kelas, Guru } from "../types";
import { Plus, Edit2, Trash2, Search, X, Save, AlertCircle, ShieldCheck } from "lucide-react";

export default function DataKelas() {
  const [classList, setClassList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    tingkat: 4,
    nama_rombel: "",
    tahun_pelajaran: "2025/2026",
    wali_kelas_nip: "",
  });

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{ id: string; nama_rombel: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kRes, gRes] = await Promise.all([api.get("/api/kelas"), api.get("/api/guru")]);
      setClassList(kRes || []);
      setGuruList((gRes || []).filter((g: Guru) => g.status === "Aktif"));
    } catch (err: any) {
      setError(err.message || "Gagal memuat data rombel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      id: "",
      tingkat: 4,
      nama_rombel: "",
      tahun_pelajaran: "2025/2026",
      wali_kelas_nip: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (k: Kelas) => {
    setEditingId(k.id);
    setFormData({
      id: k.id,
      tingkat: k.tingkat,
      nama_rombel: k.nama_rombel,
      tahun_pelajaran: k.tahun_pelajaran,
      wali_kelas_nip: k.wali_kelas_nip || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, nama: string) => {
    setClassToDelete({ id, nama_rombel: nama });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await api.delete(`/api/kelas/${classToDelete.id}`);
      setSuccess(`Kelas "${classToDelete.nama_rombel}" berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setClassToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus kelas.");
      setShowDeleteModal(false);
      setClassToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.nama_rombel) {
      setError("ID Kelas dan Nama Rombel wajib diisi.");
      return;
    }

    const payload = {
      ...formData,
      wali_kelas_nip: formData.wali_kelas_nip || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/kelas/${editingId}`, payload);
        setSuccess("Kelas berhasil diperbarui.");
      } else {
        await api.post("/api/kelas", payload);
        setSuccess("Kelas baru berhasil ditambahkan.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kelas.");
    }
  };

  const filteredClass = classList.filter(
    (k) =>
      k.nama_rombel.toLowerCase().includes(search.toLowerCase()) ||
      k.id.toLowerCase().includes(search.toLowerCase()) ||
      k.tahun_pelajaran.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas, rombel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          id="btn-add-kelas"
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Kelas/Rombel
        </button>
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
                <th className="px-5 py-3">ID Kelas</th>
                <th className="px-5 py-3">Tingkat</th>
                <th className="px-5 py-3">Nama Rombel</th>
                <th className="px-5 py-3">Tahun Pelajaran</th>
                <th className="px-5 py-3">Wali Kelas</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat data rombel...
                  </td>
                </tr>
              ) : filteredClass.length > 0 ? (
                filteredClass.map((k) => {
                  const wali = guruList.find((g) => g.nip === k.wali_kelas_nip);
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-600">{k.id}</td>
                      <td className="px-5 py-3.5">Tingkat {k.tingkat}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-850">{k.nama_rombel}</td>
                      <td className="px-5 py-3.5 font-mono">{k.tahun_pelajaran}</td>
                      <td className="px-5 py-3.5">
                        {wali ? (
                          <span className="font-semibold text-slate-800">{wali.nama_guru}</span>
                        ) : (
                          <span className="text-red-400 italic font-medium">Belum Ditentukan</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(k)}
                            title="Edit Kelas"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(k.id, k.nama_rombel)}
                            title="Hapus Kelas"
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
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada data rombel ditemukan.
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
                {editingId ? "Edit Kelas Rombel" : "Tambah Rombel Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ID Kelas (Unik)</label>
                <input
                  type="text"
                  required
                  disabled={editingId !== null}
                  placeholder="e.g. K01, K02"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Kelas</label>
                <select
                  value={formData.tingkat}
                  onChange={(e) => setFormData({ ...formData, tingkat: parseInt(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  {[1, 2, 3, 4, 5, 6].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Kelas {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Rombel / Kelas</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4-A, 4-B, VB"
                  value={formData.nama_rombel}
                  onChange={(e) => setFormData({ ...formData, nama_rombel: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025/2026"
                  value={formData.tahun_pelajaran}
                  onChange={(e) => setFormData({ ...formData, tahun_pelajaran: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Wali Kelas (Homeroom)</label>
                <select
                  value={formData.wali_kelas_nip}
                  onChange={(e) => setFormData({ ...formData, wali_kelas_nip: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {guruList.map((g) => (
                    <option key={g.nip} value={g.nip}>
                      {g.nama_guru}
                    </option>
                  ))}
                </select>
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
                  id="btn-save-kelas"
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
      {showDeleteModal && classToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Kelas</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus kelas/rombel <strong className="text-slate-700">"{classToDelete.nama_rombel}"</strong>? Tindakan ini akan menghapus semua konfigurasi mapel & penilaian yang terikat dan tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setClassToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Hapus Kelas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
