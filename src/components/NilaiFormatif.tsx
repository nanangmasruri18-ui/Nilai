import React, { useState, useEffect } from "react";
import { api, getAuthTeacher, getAuthUser } from "../utils/api";
import { Kelas, Mapel, Siswa, TujuanPembelajaran, NilaiFormatif, GuruPengampu } from "../types";
import { Save, AlertCircle, ShieldCheck, HelpCircle } from "lucide-react";

export default function NilaiFormatifEditor() {
  const [teacher, setTeacher] = useState<any>(getAuthTeacher());
  const user = getAuthUser();

  const [classList, setClassList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [tpList, setTpList] = useState<TujuanPembelajaran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  // Selection states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [selectedTp, setSelectedTp] = useState("");

  // Grade inputs
  const [grades, setGrades] = useState<{ [nis: string]: string }>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [allMapels, setAllMapels] = useState<Mapel[]>([]);
  const [allGps, setAllGps] = useState<GuruPengampu[]>([]);

  // Fetch initial classes and mapels based on role
  useEffect(() => {
    async function loadSelections() {
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

        const [clRes, mRes, gpRes] = await Promise.all([
          api.get("/api/kelas"),
          api.get("/api/mapel"),
          api.get("/api/guru_pengampu"),
        ]);

        const safeCl = clRes || [];
        const safeM = mRes || [];
        const safeGp = gpRes || [];

        setAllMapels(safeM);
        setAllGps(safeGp);

        if (user?.role === "admin") {
          setClassList(safeCl);
          setMapelList(safeM);
          if (safeCl?.[0]) setSelectedClass(safeCl[0].id);
          if (safeM?.[0]) setSelectedMapel(safeM[0].kode_mapel);
        } else if (currentTeacher) {
          const myGp = safeGp.filter((gp: GuruPengampu) => gp.guru_nip === currentTeacher.nip);

          const myClassIds = myGp.map((gp: GuruPengampu) => gp.kelas_id);
          let assignedClassList = safeCl.filter((c: Kelas) => myClassIds.includes(c.id));
          
          // Fallback if no classes assigned, allow selecting all classes
          if (assignedClassList.length === 0) {
            assignedClassList = safeCl;
          }
          setClassList(assignedClassList);

          // Get mapels for first class
          if (assignedClassList?.[0]) {
            const firstClassId = assignedClassList[0].id;
            setSelectedClass(firstClassId);
            const activeGpForClass = myGp.filter((gp: GuruPengampu) => gp.kelas_id === firstClassId);
            const hasHomeroom = activeGpForClass.some((gp: GuruPengampu) => gp.tipe === "kelas") || user?.role === "guru_kelas";
            const classTingkat = assignedClassList[0].tingkat;

            if (hasHomeroom) {
              // Wali kelas can grade all subjects of this level (tingkat)
              const classMapels = safeM.filter((m: Mapel) => m.tingkat_kelas === classTingkat);
              setMapelList(classMapels);
              if (classMapels?.[0]) setSelectedMapel(classMapels[0].kode_mapel);
            } else {
              const myKodes = activeGpForClass.map((gp: GuruPengampu) => gp.mapel_kode).filter(Boolean);
              let classMapels = safeM.filter((m: Mapel) => myKodes.includes(m.kode_mapel));
              if (classMapels.length === 0) {
                classMapels = safeM.filter((m: Mapel) => m.tingkat_kelas === classTingkat);
              }
              setMapelList(classMapels);
              if (classMapels?.[0]) setSelectedMapel(classMapels[0].kode_mapel);
            }
          }
        }
      } catch (err: any) {
        setError("Gagal memuat parameter kelas dan mapel.");
      } finally {
        setLoading(false);
      }
    }

    loadSelections();
  }, [teacher?.nip, user?.role, user?.username, user?.id]);

  // Handle class selection changes to adjust available subjects (for teachers)
  const handleClassChange = (classId: string) => {
    const currentClassObj = classList.find((c) => c.id === selectedClass);
    const targetClass = classList.find((c) => c.id === classId);
    const tingkatChanged = currentClassObj && targetClass && currentClassObj.tingkat !== targetClass.tingkat;

    setSelectedClass(classId);

    if (!classId) {
      setSelectedMapel("");
      setSelectedTp("");
      setSiswaList([]);
      setGrades({});
      return;
    }

    let nextMapel = "";
    let nextMapelList: Mapel[] = [];

    if (user?.role === "admin") {
      nextMapelList = allMapels;
      nextMapel = allMapels?.[0]?.kode_mapel || "";
    } else if (teacher) {
      const myGp = allGps.filter((gp: GuruPengampu) => gp.guru_nip === teacher.nip && gp.kelas_id === classId);
      const hasHomeroom = myGp.some((gp: GuruPengampu) => gp.tipe === "kelas") || user?.role === "guru_kelas";
      const classTingkat = targetClass ? targetClass.tingkat : null;

      if (hasHomeroom) {
        nextMapelList = allMapels.filter((m: Mapel) => classTingkat === null || m.tingkat_kelas === classTingkat);
        nextMapel = nextMapelList?.[0]?.kode_mapel || "";
      } else {
        const myKodes = myGp.map((gp: GuruPengampu) => gp.mapel_kode).filter(Boolean);
        nextMapelList = allMapels.filter((m: Mapel) => myKodes.includes(m.kode_mapel));
        if (nextMapelList.length === 0 && classTingkat !== null) {
          nextMapelList = allMapels.filter((m: Mapel) => m.tingkat_kelas === classTingkat);
        }
        nextMapel = nextMapelList?.[0]?.kode_mapel || "";
      }
    }

    setMapelList(nextMapelList);

    if (nextMapel !== selectedMapel || tingkatChanged) {
      setSelectedMapel(nextMapel);
      setSelectedTp("");
      setSiswaList([]);
      setGrades({});
    }
  };

  // Fetch Tujuan Pembelajaran (TP) when subject selection changes
  useEffect(() => {
    async function loadTPs() {
      if (!selectedMapel) {
        setTpList([]);
        setSelectedTp("");
        return;
      }
      try {
        const res = await api.get("/api/tujuan_pembelajaran");
        const filteredTps = (res || []).filter((tp: TujuanPembelajaran) => tp.mapel_kode === selectedMapel);
        setTpList(filteredTps);
        if (filteredTps?.[0]) {
          setSelectedTp(filteredTps[0].id);
        } else {
          setSelectedTp("");
        }
      } catch (err) {
        setError("Gagal memuat Tujuan Pembelajaran.");
      }
    }
    loadTPs();
  }, [selectedMapel]);

  // Load students of class & load their existing Formative scores for selected TP
  useEffect(() => {
    async function loadStudentsAndScores() {
      if (!selectedClass || !selectedTp) {
        setSiswaList([]);
        setGrades({});
        return;
      }

      try {
        setLoading(true);
        setError("");
        // Load class students
        const allStudents = await api.get("/api/siswa");
        const classStudents = (allStudents || []).filter((s: Siswa) => s.kelas_id === selectedClass && s.status_aktif);
        setSiswaList(classStudents);

        // Load existing formative grades for this TP
        const existingGrades = await api.get(`/api/nilai_formatif/tp/${selectedTp}`);
        const gradeMap: { [nis: string]: string } = {};

        // Prepopulate inputs
        classStudents.forEach((s: Siswa) => {
          const scoreItem = (existingGrades || []).find((g: NilaiFormatif) => g.siswa_nis === s.nis);
          gradeMap[s.nis] = scoreItem ? String(scoreItem.nilai) : "";
        });

        setGrades(gradeMap);
      } catch (err: any) {
        setError("Gagal memuat lembar penilaian siswa.");
      } finally {
        setLoading(false);
      }
    }

    loadStudentsAndScores();
  }, [selectedClass, selectedTp]);

  const handleGradeChange = (nis: string, value: string) => {
    // Sanitize input to numbers between 0 and 100 or empty
    if (value === "") {
      setGrades((prev) => ({ ...prev, [nis]: "" }));
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setGrades((prev) => ({ ...prev, [nis]: String(num) }));
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTp) {
      setError("Harap pilih Tujuan Pembelajaran terlebih dahulu.");
      return;
    }

    // Convert grades state into an API payload
    const records = Object.keys(grades)
      .filter((nis) => grades[nis] !== "")
      .map((nis) => ({
        siswa_nis: nis,
        tp_id: selectedTp,
        nilai: parseInt(grades[nis]),
      }));

    if (records.length === 0) {
      setError("Silakan isi setidaknya satu nilai siswa sebelum menyimpan.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/api/nilai_formatif", { records });

      setSuccess(`Berhasil menyimpan ${records.length} nilai formatif siswa!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan nilai formatif.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pilih Kelas / Rombel</label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
          >
            <option value="">-- Pilih Rombel --</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.nama_rombel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pilih Mata Pelajaran</label>
          <select
            value={selectedMapel}
            onChange={(e) => {
              setSelectedMapel(e.target.value);
              setSelectedTp("");
              setSiswaList([]);
              setGrades({});
            }}
            disabled={!selectedClass}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
          >
            <option value="">-- Pilih Mata Pelajaran --</option>
            {mapelList.map((m) => (
              <option key={m.kode_mapel} value={m.kode_mapel}>
                {m.nama_mapel} ({m.kode_mapel})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pilih Tujuan Pembelajaran (TP)</label>
          <select
            value={selectedTp}
            onChange={(e) => setSelectedTp(e.target.value)}
            disabled={!selectedMapel || tpList.length === 0}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
          >
            {tpList.length === 0 ? (
              <option value="">-- Belum ada TP terdaftar --</option>
            ) : (
              tpList.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.kode_tp} - {tp.materi_pokok}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {/* Entry Sheet */}
      {selectedTp ? (
        <form onSubmit={handleSaveAll} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Header metadata */}
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lembar Penilaian Formatif</span>
              {tpList.find((t) => t.id === selectedTp) && (
                <p className="text-xs font-bold text-slate-800">
                  {tpList.find((t) => t.id === selectedTp)?.kode_tp}: {tpList.find((t) => t.id === selectedTp)?.deskripsi}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-2.5 py-1">
                {siswaList.length} Siswa Terdaftar
              </span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 w-32">NIS</th>
                  <th className="px-6 py-3">Nama Lengkap Siswa</th>
                  <th className="px-6 py-3 w-40 text-center">Nilai Formatif (0 - 100)</th>
                  <th className="px-6 py-3">Catatan Kompetensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {siswaList.map((s) => {
                  const val = grades[s.nis] || "";
                  const valNum = parseInt(val) || 0;
                  return (
                    <tr key={s.nis} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-slate-600">{s.nis}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{s.nama_lengkap}</td>
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Belum Diisi"
                          value={val}
                          onChange={(e) => handleGradeChange(s.nis, e.target.value)}
                          className="w-24 text-center text-xs font-bold font-mono px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100 transition-all mx-auto"
                        />
                      </td>
                      <td className="px-6 py-3">
                        {val === "" ? (
                          <span className="text-slate-400 italic text-[11px]">Belum diinput</span>
                        ) : valNum >= 70 ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Tuntas - Menguasai Kompetensi TP
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            Perlu Bimbingan / Remedial
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {siswaList.map((s) => {
              const val = grades[s.nis] || "";
              const valNum = parseInt(val) || 0;
              return (
                <div key={s.nis} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-sm">{s.nama_lengkap}</p>
                      <p className="font-mono text-[10px] text-slate-500">NIS: {s.nis}</p>
                    </div>
                    <div>
                      {val === "" ? (
                        <span className="text-slate-400 italic text-[10px] block text-right">Belum diinput</span>
                      ) : valNum >= 70 ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold inline-block">
                          Tuntas - Menguasai
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[9px] font-bold inline-block">
                          Perlu Bimbingan
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Nilai Formatif:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Input nilai..."
                      value={val}
                      onChange={(e) => handleGradeChange(s.nis, e.target.value)}
                      className="w-full text-center text-sm font-bold font-mono px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 text-center sm:text-left">
              <HelpCircle className="h-4 w-4 shrink-0" />
              Nilai otomatis disimpan ke database lokal dan direkap untuk nilai rapor akhir.
            </span>
            <button
              id="btn-save-formatif"
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4.5 w-4.5" />
              {saving ? "Menyimpan..." : "Simpan Semua Nilai Formatif"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          <HelpCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <h4 className="font-semibold text-slate-600">Pilih Parameter Penilaian</h4>
          <p className="text-xs max-w-sm mx-auto mt-1">
            Harap tentukan Kelas, Mata Pelajaran, dan Tujuan Pembelajaran (TP) aktif di atas untuk membuka lembar input nilai formatif.
          </p>
        </div>
      )}
    </div>
  );
}
