import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Mapel } from "../types";
import { Plus, Edit2, Trash2, Search, X, Save, AlertCircle, ShieldCheck } from "lucide-react";

export default function DataMapel() {
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingKode, setEditingKode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kode_mapel: "",
    nama_mapel: "",
    fase: "B" as Mapel["fase"],
    tingkat_kelas: 4,
  });

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mapelToDelete, setMapelToDelete] = useState<{ kode_mapel: string; nama_mapel: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/mapel");
      setMapelList(res || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat mata pelajaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingKode(null);
    setFormData({
      kode_mapel: "",
      nama_mapel: "",
      fase: "B",
      tingkat_kelas: 4,
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (m: Mapel) => {
    setEditingKode(m.kode_mapel);
    setFormData({
      kode_mapel: m.kode_mapel,
      nama_mapel: m.nama_mapel,
      fase: m.fase,
      tingkat_kelas: m.tingkat_kelas,
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (kode: string, nama: string) => {
    setMapelToDelete({ kode_mapel: kode, nama_mapel: nama });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mapelToDelete) return;
    try {
      await api.delete(`/api/mapel/${mapelToDelete.kode_mapel}`);
      setSuccess(`Mata pelajaran "${mapelToDelete.nama_mapel}" berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setMapelToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus mata pelajaran.");
      setShowDeleteModal(false);
      setMapelToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode_mapel || !formData.nama_mapel) {
      setError("Kode Mapel dan Nama Mapel wajib diisi.");
      return;
    }

    try {
      if (editingKode) {
        await api.put(`/api/mapel/${editingKode}`, formData);
        setSuccess("Mata pelajaran berhasil diperbarui.");
      } else {
        await api.post("/api/mapel", formData);
        setSuccess("Mata pelajaran baru berhasil ditambahkan.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan mata pelajaran.");
    }
  };

  const filteredMapel = mapelList.filter(
    (m) =>
      m.nama_mapel.toLowerCase().includes(search.toLowerCase()) ||
      m.kode_mapel.toLowerCase().includes(search.toLowerCase()) ||
      m.fase.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata pelajaran, kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          id="btn-add-mapel"
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Mapel
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
                <th className="px-5 py-3">Kode Mapel</th>
                <th className="px-5 py-3">Nama Mata Pelajaran</th>
                <th className="px-5 py-3">Fase</th>
                <th className="px-5 py-3">Peruntukan Tingkat Kelas</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat data mata pelajaran...
                  </td>
                </tr>
              ) : filteredMapel.length > 0 ? (
                filteredMapel.map((m) => (
                  <tr key={m.kode_mapel} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-600">{m.kode_mapel}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{m.nama_mapel}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-brand-50 border border-brand-100 text-brand-700 rounded text-[10px] font-bold">
                        Fase {m.fase}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">Kelas {m.tingkat_kelas}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          title="Edit Mapel"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(m.kode_mapel, m.nama_mapel)}
                          title="Hapus Mapel"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Tidak ada data mata pelajaran ditemukan.
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
                {editingKode ? "Edit Mata Pelajaran" : "Tambah Mapel Baru"}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Mapel (Unik)</label>
                <input
                  type="text"
                  required
                  disabled={editingKode !== null}
                  placeholder="e.g. M01, IPAS04"
                  value={formData.kode_mapel}
                  onChange={(e) => setFormData({ ...formData, kode_mapel: e.target.value.toUpperCase() })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Matematika / Bahasa Indonesia"
                  value={formData.nama_mapel}
                  onChange={(e) => setFormData({ ...formData, nama_mapel: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fase Perkembangan</label>
                <select
                  value={formData.fase}
                  onChange={(e) => setFormData({ ...formData, fase: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  <option value="A">Fase A (Kelas 1 - 2)</option>
                  <option value="B">Fase B (Kelas 3 - 4)</option>
                  <option value="C">Fase C (Kelas 5 - 6)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Kelas</label>
                <select
                  value={formData.tingkat_kelas}
                  onChange={(e) => setFormData({ ...formData, tingkat_kelas: parseInt(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  {[1, 2, 3, 4, 5, 6].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Kelas {lvl}
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
                  id="btn-save-mapel"
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
      {showDeleteModal && mapelToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Mapel</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus mata pelajaran <strong className="text-slate-700">"{mapelToDelete.nama_mapel}"</strong> (Kode: {mapelToDelete.kode_mapel})? Tindakan ini akan menghapus semua TP dan penilaian terikat dan tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMapelToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Hapus Mapel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
