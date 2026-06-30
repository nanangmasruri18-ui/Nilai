import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { KKM, Mapel, Kelas } from "../types";
import { Plus, Trash2, Save, X, AlertCircle, ShieldCheck } from "lucide-react";

export default function DataKKM() {
  const [kkmList, setKkmList] = useState<KKM[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [classList, setClassList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  
  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kkmToDelete, setKkmToDelete] = useState<{ id: string; mapel_kode: string; nama_rombel: string } | null>(null);

  const [formData, setFormData] = useState({
    mapel_kode: "",
    kelas_id: "",
    nilai_kkm: 70,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [kRes, mRes, clRes] = await Promise.all([
        api.get("/api/kkm"),
        api.get("/api/mapel"),
        api.get("/api/kelas"),
      ]);
      setKkmList(kRes || []);
      setMapelList(mRes || []);
      setClassList(clRes || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat KKM.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormData({
      mapel_kode: mapelList[0]?.kode_mapel || "",
      kelas_id: classList[0]?.id || "",
      nilai_kkm: 70,
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, mapel_kode: string, nama_rombel: string) => {
    setKkmToDelete({ id, mapel_kode, nama_rombel });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!kkmToDelete) return;
    try {
      await api.delete(`/api/kkm/${kkmToDelete.id}`);
      setSuccess(`Nilai KKM untuk mapel "${kkmToDelete.mapel_kode}" di "${kkmToDelete.nama_rombel}" berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setKkmToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus KKM.");
      setShowDeleteModal(false);
      setKkmToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nilai_kkm < 0 || formData.nilai_kkm > 100) {
      setError("Nilai KKM harus di antara 0 - 100.");
      return;
    }

    try {
      await api.post("/api/kkm", formData);
      setSuccess("Aturan KKM berhasil dikonfigurasi.");
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan KKM.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <button
          id="btn-add-kkm"
          onClick={openAddModal}
          disabled={mapelList.length === 0 || classList.length === 0}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="h-4.5 w-4.5" />
          Atur Nilai KKM Baru
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
                <th className="px-5 py-3">Mata Pelajaran</th>
                <th className="px-5 py-3">Rombel Kelas</th>
                <th className="px-5 py-3 font-mono">Nilai KKM (Standar Tuntas)</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat KKM...
                  </td>
                </tr>
              ) : kkmList.length > 0 ? (
                kkmList.map((k) => {
                  const subject = mapelList.find((m) => m.kode_mapel === k.mapel_kode);
                  const rombel = classList.find((c) => c.id === k.kelas_id);
                  return (
                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {subject ? subject.nama_mapel : k.mapel_kode}
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{k.mapel_kode}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold font-mono text-[10px]">
                          Kelas {rombel ? rombel.nama_rombel : k.kelas_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-brand-600 text-sm">{k.nilai_kkm}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteClick(k.id, subject ? subject.nama_mapel : k.mapel_kode, rombel ? `Kelas ${rombel.nama_rombel}` : `Kelas ${k.kelas_id}`)}
                          title="Hapus KKM"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Tidak ada KKM khusus terdaftar. Batas default sistem adalah 70.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-display text-sm">Atur Nilai KKM Baru</h3>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Mata Pelajaran</label>
                <select
                  value={formData.mapel_kode}
                  onChange={(e) => setFormData({ ...formData, mapel_kode: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  {mapelList.map((m) => (
                    <option key={m.kode_mapel} value={m.kode_mapel}>
                      {m.nama_mapel} ({m.kode_mapel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Kelas / Rombel</label>
                <select
                  value={formData.kelas_id}
                  onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.nama_rombel} (Tingkat {c.tingkat})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nilai KKM (0 - 100)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={formData.nilai_kkm}
                  onChange={(e) => setFormData({ ...formData, nilai_kkm: parseInt(e.target.value) || 0 })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-mono"
                />
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
                  id="btn-save-kkm"
                  type="submit"
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && kkmToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800">Konfirmasi Hapus KKM</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus aturan batas KKM untuk mata pelajaran <strong className="text-slate-700">"{kkmToDelete.mapel_kode}"</strong> pada <strong className="text-slate-700">{kkmToDelete.nama_rombel}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setKkmToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Hapus KKM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
