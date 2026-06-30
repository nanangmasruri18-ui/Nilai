import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { User } from "../types";
import {
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Search,
  CheckCircle,
  XCircle,
  X,
  Save,
  AlertCircle,
  ShieldCheck
} from "lucide-react";

export default function DataUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_user: "",
    username: "",
    password: "",
    role: "guru_kelas" as User["role"],
    status_aktif: true,
  });

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/users");
      setUsers(res || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_user: "",
      username: "",
      password: "",
      role: "guru_kelas",
      status_aktif: true,
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingId(user.id);
    setFormData({
      nama_user: user.nama_user,
      username: user.username,
      password: "", // leave blank for no change
      role: user.role,
      status_aktif: user.status_aktif,
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, username: string) => {
    if (username === "admin") {
      setError("User Administrator utama tidak dapat dihapus.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setUserToDelete({ id, username });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      setSuccess(`User ${userToDelete.username} berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus user.");
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_user || !formData.username) {
      setError("Nama dan Username wajib diisi.");
      return;
    }
    if (!editingId && !formData.password) {
      setError("Password wajib diisi untuk pengguna baru.");
      return;
    }

    try {
      if (editingId) {
        // Edit existing
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password; // don't update password if empty
        await api.put(`/api/users/${editingId}`, payload);
        setSuccess("Data pengguna berhasil diperbarui.");
      } else {
        // Create new
        await api.post("/api/users", formData);
        setSuccess("Pengguna baru berhasil ditambahkan.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama_user.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          id="btn-add-user"
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Pengguna
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

      {/* Table List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Nama User</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Hak Akses / Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{u.nama_user}</td>
                    <td className="px-5 py-3.5 font-mono">{u.username}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : u.role === "guru_kelas"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {u.role === "admin"
                          ? "Administrator"
                          : u.role === "guru_kelas"
                          ? "Guru Kelas"
                          : "Guru Mapel"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 font-medium">
                        {u.status_aktif ? (
                          <>
                            <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                            <span className="text-emerald-700">Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4.5 w-4.5 text-red-400" />
                            <span className="text-red-600">Nonaktif</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit Pengguna"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u.id, u.username)}
                          disabled={u.username === "admin"}
                          title="Hapus Pengguna"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors disabled:opacity-30"
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
                    Tidak ada data pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-display text-sm">
                {editingId ? "Edit Akun Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap User</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso, S.Pd."
                  value={formData.nama_user}
                  onChange={(e) => setFormData({ ...formData, nama_user: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  disabled={editingId !== null && formData.username === "admin"}
                  placeholder="e.g. budisantoso"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {editingId ? "Ganti Password (Kosongkan jika tidak diubah)" : "Password Utama"}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder={editingId ? "••••••••" : "Masukkan password login"}
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hak Akses (Role)</label>
                <select
                  disabled={editingId !== null && formData.username === "admin"}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
                >
                  <option value="admin">Administrator</option>
                  <option value="guru_kelas">Guru Kelas</option>
                  <option value="guru_mapel">Guru Mata Pelajaran</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status Pengguna</label>
                <select
                  disabled={editingId !== null && formData.username === "admin"}
                  value={formData.status_aktif ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value === "true" })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
                >
                  <option value="true">Aktif (Dapat Login)</option>
                  <option value="false">Nonaktif (Blokir Akses)</option>
                </select>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-save-user"
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
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus Pengguna</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-slate-700">"{userToDelete.username}"</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Hapus Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
