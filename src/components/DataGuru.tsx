import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Guru, User } from "../types";
import { Plus, Edit2, Trash2, Search, X, Save, AlertCircle, ShieldCheck } from "lucide-react";

export default function DataGuru() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guruToDelete, setGuruToDelete] = useState<{ nip: string; nama_guru: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingNip, setEditingNip] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nip: "",
    nama_guru: "",
    jenis_kelamin: "Laki-laki" as Guru["jenis_kelamin"],
    jabatan: "",
    nomor_hp: "",
    status: "Aktif" as Guru["status"],
    user_id: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [gRes, uRes] = await Promise.all([api.get("/api/guru"), api.get("/api/users")]);
      setGuruList(gRes || []);
      setUsers((uRes || []).filter((u: User) => u.role !== "admin"));
    } catch (err: any) {
      setError(err.message || "Gagal memuat data pendidik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingNip(null);
    setFormData({
      nip: "",
      nama_guru: "",
      jenis_kelamin: "Laki-laki",
      jabatan: "",
      nomor_hp: "",
      status: "Aktif",
      user_id: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (g: Guru) => {
    setEditingNip(g.nip);
    setFormData({
      nip: g.nip,
      nama_guru: g.nama_guru,
      jenis_kelamin: g.jenis_kelamin,
      jabatan: g.jabatan,
      nomor_hp: g.nomor_hp,
      status: g.status,
      user_id: g.user_id || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (nip: string, nama: string) => {
    setGuruToDelete({ nip, nama_guru: nama });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!guruToDelete) return;
    try {
      await api.delete(`/api/guru/${guruToDelete.nip}`);
      setSuccess(`Data guru "${guruToDelete.nama_guru}" berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setGuruToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus data guru.");
      setShowDeleteModal(false);
      setGuruToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nip || !formData.nama_guru || !formData.jabatan) {
      setError("NIP, Nama, dan Jabatan wajib diisi.");
      return;
    }

    const payload = {
      ...formData,
      user_id: formData.user_id || null,
    };

    try {
      if (editingNip) {
        await api.put(`/api/guru/${editingNip}`, payload);
        setSuccess("Data guru berhasil diperbarui.");
      } else {
        await api.post("/api/guru", payload);
        setSuccess("Data guru baru berhasil ditambahkan.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data guru.");
    }
  };

  const filteredGuru = guruList.filter(
    (g) =>
      g.nama_guru.toLowerCase().includes(search.toLowerCase()) ||
      g.nip.includes(search) ||
      g.jabatan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari guru berdasarkan nama, NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          id="btn-add-guru"
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Data Guru
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
                <th className="px-5 py-3">NIP / NUPTK</th>
                <th className="px-5 py-3">Nama Lengkap</th>
                <th className="px-5 py-3">J.Kelamin</th>
                <th className="px-5 py-3">Jabatan</th>
                <th className="px-5 py-3">Kontak HP</th>
                <th className="px-5 py-3">Akun Pengguna</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat data guru...
                  </td>
                </tr>
              ) : filteredGuru.length > 0 ? (
                filteredGuru.map((g) => {
                  const linkedUser = users.find((u) => u.id === g.user_id);
                  return (
                    <tr key={g.nip} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-600">{g.nip}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{g.nama_guru}</td>
                      <td className="px-5 py-3.5">{g.jenis_kelamin}</td>
                      <td className="px-5 py-3.5">{g.jabatan}</td>
                      <td className="px-5 py-3.5 font-mono">{g.nomor_hp || "-"}</td>
                      <td className="px-5 py-3.5">
                        {linkedUser ? (
                          <span className="text-brand-700 font-semibold bg-brand-50 border border-brand-100 px-2 py-0.5 rounded text-[10px]">
                            {linkedUser.username}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum Taut</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(g)}
                            title="Edit Guru"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(g.nip, g.nama_guru)}
                            title="Hapus Guru"
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
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada data guru ditemukan.
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
                {editingNip ? "Edit Data Guru" : "Tambah Guru Baru"}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">NIP / NUPTK</label>
                <input
                  type="text"
                  required
                  disabled={editingNip !== null}
                  placeholder="e.g. 198501012010011001"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap Guru (Serta Gelar)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso, S.Pd."
                  value={formData.nama_guru}
                  onChange={(e) => setFormData({ ...formData, nama_guru: e.target.value })}
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
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guru Kelas IV-A / Guru Mapel Matematika"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor HP</label>
                <input
                  type="text"
                  placeholder="e.g. 0812345678"
                  value={formData.nomor_hp}
                  onChange={(e) => setFormData({ ...formData, nomor_hp: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tautkan dengan Akun Pengguna</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  <option value="">-- Belum Ditautkan --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_user} ({u.username} - {u.role})
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
                  id="btn-save-guru"
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
      {showDeleteModal && guruToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Guru</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus data guru <strong className="text-slate-700">"{guruToDelete.nama_guru}"</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGuruToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Hapus Guru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
