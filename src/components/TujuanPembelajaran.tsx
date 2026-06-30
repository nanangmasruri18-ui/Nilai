import React, { useState, useEffect } from "react";
import { api, getAuthTeacher, getAuthUser } from "../utils/api";
import { TujuanPembelajaran, Mapel, GuruPengampu, Kelas } from "../types";
import { Plus, Trash2, Save, X, AlertCircle, ShieldCheck, BookOpen, Pencil } from "lucide-react";

export default function TujuanPembelajaranEditor() {
  const [teacher, setTeacher] = useState<any>(getAuthTeacher());
  const user = getAuthUser();

  const [tpList, setTpList] = useState<TujuanPembelajaran[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filterMapel, setFilterMapel] = useState("all");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tpToDelete, setTpToDelete] = useState<{ id: string; kode_tp: string; materi_pokok: string } | null>(null);
  const [editingTpId, setEditingTpId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kode_tp: "",
    mapel_kode: "",
    deskripsi: "",
    semester: 1,
    materi_pokok: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);

      let currentTeacher = teacher;
      if (!currentTeacher && user && user.role !== "admin") {
        const teachers = await api.get("/api/guru");
        currentTeacher = (teachers || []).find((g: any) => g.user_id === user.id) || null;
        if (currentTeacher) {
          setTeacher(currentTeacher);
          localStorage.setItem("merdeka_assessment_teacher", JSON.stringify(currentTeacher));
        }
      }

      const [tpRes, mRes, gpRes, kRes] = await Promise.all([
        api.get("/api/tujuan_pembelajaran"),
        api.get("/api/mapel"),
        api.get("/api/guru_pengampu"),
        api.get("/api/kelas"),
      ]);

      const safeTpRes = Array.isArray(tpRes) ? tpRes : [];
      const safeMRes = Array.isArray(mRes) ? mRes : [];
      const safeGpRes = Array.isArray(gpRes) ? gpRes : [];
      const safeKRes = Array.isArray(kRes) ? kRes : [];

      let allowedMapelKodes: string[] = [];

      if (user?.role === "admin") {
        // Admins can see all subjects
        setMapelList(safeMRes);
        setTpList(safeTpRes);
      } else {
        // It's a teacher (guru_kelas or guru_mapel)
        let filteredM: Mapel[] = [];
        if (currentTeacher) {
          const myGp = safeGpRes.filter((gp: GuruPengampu) => gp.guru_nip === currentTeacher.nip);
          const hasKelasGp = myGp.some((gp: GuruPengampu) => gp.tipe === "kelas");

          if (hasKelasGp) {
            // Get actual tingkat of assigned classes
            const myClassIds = myGp.filter((gp: GuruPengampu) => gp.tipe === "kelas").map((gp: GuruPengampu) => gp.kelas_id);
            const myClasses = safeKRes.filter((c: Kelas) => myClassIds.includes(c.id));
            const myTingkatList = myClasses.map((c: Kelas) => c.tingkat);

            // Allow mapels that correspond to the teacher's class levels (tingkat)
            filteredM = safeMRes.filter((m: Mapel) => myTingkatList.includes(m.tingkat_kelas));
            allowedMapelKodes = filteredM.map((m: Mapel) => m.kode_mapel);
          } else {
            // If only specific mapel GP
            allowedMapelKodes = myGp.map((gp: GuruPengampu) => gp.mapel_kode).filter(Boolean) as string[];
            filteredM = safeMRes.filter((m: Mapel) => allowedMapelKodes.includes(m.kode_mapel));
          }
        }

        // Fallback to all mapels if no assignments or teacher record is not found/not assigned yet
        if (filteredM.length === 0) {
          filteredM = safeMRes;
          allowedMapelKodes = safeMRes.map((m: Mapel) => m.kode_mapel);
        }

        setMapelList(filteredM);

        const filteredTps = safeTpRes.filter(
          (tp: TujuanPembelajaran) => allowedMapelKodes.includes(tp.mapel_kode)
        );
        setTpList(filteredTps);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat Tujuan Pembelajaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacher?.nip, user?.role, user?.username, user?.id]);

  const openAddModal = () => {
    if (mapelList.length === 0) {
      setError("Tidak ada Mata Pelajaran yang tersedia untuk akun Anda.");
      return;
    }
    setEditingTpId(null);
    setFormData({
      kode_tp: "",
      mapel_kode: mapelList[0]?.kode_mapel || "",
      deskripsi: "",
      semester: 1,
      materi_pokok: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (tp: TujuanPembelajaran) => {
    setEditingTpId(tp.id || null);
    setFormData({
      kode_tp: tp.kode_tp,
      mapel_kode: tp.mapel_kode,
      deskripsi: tp.deskripsi,
      semester: tp.semester,
      materi_pokok: tp.materi_pokok,
    });
    setError("");
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, kode_tp: string, materi_pokok: string) => {
    setTpToDelete({ id, kode_tp, materi_pokok });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tpToDelete) return;
    try {
      await api.delete(`/api/tujuan_pembelajaran/${tpToDelete.id}`);
      setSuccess(`Tujuan Pembelajaran "${tpToDelete.kode_tp}" berhasil dihapus.`);
      setTimeout(() => setSuccess(""), 3000);
      setShowDeleteModal(false);
      setTpToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus TP.");
      setShowDeleteModal(false);
      setTpToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode_tp || !formData.deskripsi || !formData.materi_pokok) {
      setError("Semua field wajib diisi.");
      return;
    }

    try {
      const selectedM = mapelList.find((m) => m.kode_mapel === formData.mapel_kode);
      const payload = {
        ...formData,
        kelas: selectedM ? selectedM.tingkat_kelas : 1,
        fase: selectedM ? selectedM.fase : "A",
      };

      if (editingTpId) {
        await api.put(`/api/tujuan_pembelajaran/${editingTpId}`, payload);
        setSuccess("Tujuan Pembelajaran berhasil diperbarui.");
      } else {
        await api.post("/api/tujuan_pembelajaran", payload);
        setSuccess("Tujuan Pembelajaran baru berhasil ditambahkan.");
      }
      setTimeout(() => setSuccess(""), 3000);
      setShowModal(false);
      setEditingTpId(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan TP.");
    }
  };

  // Precomputed values with proper typings to avoid ts compile errors on implicit unknown types
  const uniqueClasses: string[] = Array.from(new Set(tpList.map((tp) => String(tp.kelas || "1"))))
    .map((item) => String(item))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const filteredTps = tpList.filter((tp) => {
    if (filterMapel !== "all" && tp.mapel_kode !== filterMapel) return false;
    if (filterKelas !== "all" && String(tp.kelas) !== filterKelas) return false;
    if (filterSemester !== "all" && String(tp.semester) !== filterSemester) return false;
    return true;
  });

  // Explicit typing for grouped representation
  const groupedTps: Record<string, Record<string, TujuanPembelajaran[]>> = filteredTps.reduce(
    (acc: Record<string, Record<string, TujuanPembelajaran[]>>, tp) => {
      const mk = tp.mapel_kode;
      const kls = String(tp.kelas || "1");
      if (!acc[mk]) acc[mk] = {};
      if (!acc[mk][kls]) acc[mk][kls] = [];
      acc[mk][kls].push(tp);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tujuan Pembelajaran (TP)</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Definisikan kompetensi minimal per bab materi ajar Kurikulum Merdeka</p>
        </div>

        <button
          id="btn-add-tp"
          onClick={openAddModal}
          disabled={mapelList.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah Kompetensi TP
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mata Pelajaran</label>
          <select
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {mapelList.map((m) => (
              <option key={m.kode_mapel} value={m.kode_mapel}>
                {m.nama_mapel} ({m.kode_mapel})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tingkat Kelas</label>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700"
          >
            <option value="all">Semua Kelas</option>
            {uniqueClasses.map((kls) => (
              <option key={kls} value={kls}>
                Kelas {kls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-medium text-slate-700"
          >
            <option value="all">Semua Semester</option>
            <option value="1">Semester 1 (Ganjil)</option>
            <option value="2">Semester 2 (Genap)</option>
          </select>
        </div>
      </div>

      {/* Main TP list grouped by subject & class */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
            Memuat data Tujuan Pembelajaran...
          </div>
        ) : Object.keys(groupedTps).length > 0 ? (
            Object.entries(groupedTps).map(([mapelKode, classesObj]) => {
              const mapel = mapelList.find((m) => m.kode_mapel === mapelKode);
              return (
                <div key={mapelKode} className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4">
                  {/* Subject Header */}
                  <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-xl border border-brand-100 shadow-xs">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {mapel ? mapel.nama_mapel : mapelKode}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-medium">
                        <span>Kode: {mapelKode}</span>
                        <span>•</span>
                        <span>Fase {mapel?.fase || "A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-groups by Kelas */}
                  <div className="space-y-6">
                    {Object.entries(classesObj)
                      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                      .map(([kelas, tps]) => {
                        const sortedTps = [...tps].sort((a, b) => a.kode_tp.localeCompare(b.kode_tp, undefined, { numeric: true, sensitivity: 'base' }));
                        return (
                          <div key={`${mapelKode}-${kelas}`} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-brand-700 px-2.5 py-0.5 bg-brand-50 border border-brand-100 rounded-full uppercase tracking-wider">
                                Kelas {kelas}
                              </span>
                              <div className="h-[1px] bg-slate-200/80 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {sortedTps.map((tp, idx) => (
                                <div
                                  key={`${tp.id || "tp"}-${idx}`}
                                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all duration-200 relative group"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                      <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded">
                                        {tp.kode_tp}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                        Semester {tp.semester}
                                      </span>
                                    </div>

                                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1" title={tp.materi_pokok}>
                                      Materi: {tp.materi_pokok}
                                    </h5>

                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed italic">
                                      "{tp.deskripsi}"
                                    </p>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openEditModal(tp)}
                                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                      title="Edit TP"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(tp.id, tp.kode_tp, tp.materi_pokok)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Hapus TP"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-400">
            <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs">Tidak ada Tujuan Pembelajaran yang cocok dengan kriteria filter.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 font-display text-sm">
                {editingTpId ? "Edit Tujuan Pembelajaran" : "Tambah Tujuan Pembelajaran"}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingTpId(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mata Pelajaran</label>
                <select
                  value={formData.mapel_kode}
                  onChange={(e) => setFormData({ ...formData, mapel_kode: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  {mapelList.map((m, idx) => (
                    <option key={`${m.kode_mapel || "mapel"}-${idx}`} value={m.kode_mapel}>
                      {m.nama_mapel} ({m.kode_mapel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode TP (Unik)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TP-M1, TP-B1"
                    value={formData.kode_tp}
                    onChange={(e) => setFormData({ ...formData, kode_tp: e.target.value.toUpperCase() })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lingkup / Materi Pokok</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operasi Bilangan Pecahan"
                  value={formData.materi_pokok}
                  onChange={(e) => setFormData({ ...formData, materi_pokok: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi Kompetensi Kunci</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Mampu menghitung penjumlahan dan pengurangan pecahan biasa dengan penyebut berbeda"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTpId(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-save-tp"
                  type="submit"
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Simpan TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tpToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 font-display">Konfirmasi Hapus TP</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus Tujuan Pembelajaran <strong className="text-slate-700">"{tpToDelete.kode_tp}"</strong> ({tpToDelete.materi_pokok})? Semua nilai formatif dan sumatif yang terikat akan ikut terhapus secara permanen.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTpToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
