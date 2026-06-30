import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { GuruPengampu, Guru, Kelas, Mapel } from "../types";
import { Plus, Trash2, Save, X, AlertCircle, ShieldCheck } from "lucide-react";

export default function GuruPengampuEditor() {
  const [gpList, setGpList] = useState<GuruPengampu[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [classList, setClassList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gpToDelete, setGpToDelete] = useState<{ id: string; guru_nama: string; kelas_nama: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    guru_nip: "",
    kelas_id: "",
    mapel_kode: "",
    tipe: "kelas" as GuruPengampu["tipe"],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [gpRes, gRes, cRes, mRes] = await Promise.all([
        api.get("/api/guru_pengampu"),
        api.get("/api/guru"),
        api.get("/api/kelas"),
        api.get("/api/mapel"),
      ]);
      setGpList(gpRes || []);
      setGuruList((gRes || []).filter((g: Guru) => g.status === "Aktif"));
      setClassList(cRes || []);
      setMapelList(mRes || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat tugas mengajar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormData({
      guru_nip: guruList[0]?.nip || "",
      kelas_id: classList[0]?.id || "",
      mapel_kode: "", // empty for "kelas" type
      tipe: "kelas",
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, guruNama: string, kelasNama: string) => {
    setGpToDelete({ id, guru_nama: guruNama, kelas_nama: kelasNama });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!gpToDelete) return;
    try {
      await api.delete(`/api/guru_pengampu/${gpToDelete.id}`);
      setSuccess(`Tugas pengajaran untuk guru "${gpToDelete.guru_nama}" di "${gpToDelete.kelas_nama}" berhasil dibatalkan.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setGpToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal membatalkan tugas mengajar.");
      setShowDeleteModal(false);
      setGpToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guru_nip || !formData.kelas_id) {
      setError("Guru dan Kelas wajib dipilih.");
      return;
    }
    if (formData.tipe === "mapel" && !formData.mapel_kode) {
      setError("Pilih Mata Pelajaran untuk tugas mengajar tipe Mapel.");
      return;
    }

    const payload = {
      ...formData,
      mapel_kode: formData.tipe === "kelas" ? null : formData.mapel_kode,
    };

    try {
      await api.post("/api/guru_pengampu", payload);
      setSuccess("Tugas mengajar berhasil ditambahkan.");
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal memetakan tugas mengajar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <button
          id="btn-add-pengampu"
          onClick={openAddModal}
          disabled={guruList.length === 0 || classList.length === 0}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Tugas Mengajar Guru
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
                <th className="px-5 py-3">Pendidik (Guru)</th>
                <th className="px-5 py-3">Kelas Rombel</th>
                <th className="px-5 py-3">Tipe Tugas</th>
                <th className="px-5 py-3">Mata Pelajaran (Jika Guru Mapel)</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                    Memuat data tugas mengajar...
                  </td>
                </tr>
              ) : gpList.length > 0 ? (
                gpList.map((gp) => {
                  const guru = guruList.find((g) => g.nip === gp.guru_nip);
                  const rombel = classList.find((c) => c.id === gp.kelas_id);
                  const mapel = gp.mapel_kode ? mapelList.find((m) => m.kode_mapel === gp.mapel_kode) : null;

                  return (
                    <tr key={gp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {guru ? guru.nama_guru : gp.guru_nip}
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">NIP: {gp.guru_nip}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-700">
                        Kelas {rombel ? rombel.nama_rombel : gp.kelas_id}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            gp.tipe === "kelas"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {gp.tipe === "kelas" ? "Guru Kelas" : "Guru Mapel"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">
                        {gp.tipe === "mapel" ? (
                          mapel ? (
                            <span>{mapel.nama_mapel} ({gp.mapel_kode})</span>
                          ) : (
                            <span className="text-red-400">{gp.mapel_kode}</span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">N/A (Akses Penuh Kelas)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteClick(gp.id, guru ? guru.nama_guru : gp.guru_nip, rombel ? `Kelas ${rombel.nama_rombel}` : `Kelas ${gp.kelas_id}`)}
                          title="Hapus Penugasan"
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
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Belum ada data penugasan mengajar terdaftar.
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
              <h3 className="font-bold text-slate-800 font-display text-sm">Tambah Tugas Mengajar</h3>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Guru</label>
                <select
                  value={formData.guru_nip}
                  onChange={(e) => setFormData({ ...formData, guru_nip: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  {guruList.map((g) => (
                    <option key={g.nip} value={g.nip}>
                      {g.nama_guru} (NIP: {g.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Penugasan</label>
                <select
                  value={formData.tipe}
                  onChange={(e) => setFormData({ ...formData, tipe: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  <option value="kelas">Guru Kelas (Wali Kelas / Akses Penuh)</option>
                  <option value="mapel">Guru Bidang Studi / Mata Pelajaran</option>
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
                      Kelas {c.nama_rombel}
                    </option>
                  ))}
                </select>
              </div>

              {formData.tipe === "mapel" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Mata Pelajaran</label>
                  <select
                    value={formData.mapel_kode}
                    onChange={(e) => setFormData({ ...formData, mapel_kode: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapelList.map((m) => (
                      <option key={m.kode_mapel} value={m.kode_mapel}>
                        {m.nama_mapel} ({m.kode_mapel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-save-pengampu"
                  type="submit"
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && gpToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 font-display">Konfirmasi Batalkan Penugasan</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin membatalkan tugas mengajar guru <strong className="text-slate-700">"{gpToDelete.guru_nama}"</strong> di <strong className="text-slate-700">{gpToDelete.kelas_nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGpToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Ya, Batalkan Penugasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
