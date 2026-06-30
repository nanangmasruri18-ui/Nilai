import React, { useEffect, useState } from "react";
import {
  Users,
  Target,
  FileCheck,
  ClipboardList,
  FileSpreadsheet,
  AlertCircle,
  GraduationCap,
  CalendarCheck,
  ArrowRight
} from "lucide-react";
import { api, getAuthTeacher, getAuthUser } from "../utils/api";
import { Sekolah, Kelas, Mapel, GuruPengampu, Siswa, TujuanPembelajaran } from "../types";

interface TeacherDashboardProps {
  sekolah: Sekolah | null;
  setTab: (tab: string) => void;
}

export default function TeacherDashboard({ sekolah, setTab }: TeacherDashboardProps) {
  const [teacher, setTeacher] = useState<any>(getAuthTeacher());
  const user = getAuthUser();

  const [assignments, setAssignments] = useState<GuruPengampu[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [tpCount, setTpCount] = useState(0);
  const [classList, setClassList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeacherStats() {
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

        if (!currentTeacher) {
          setLoading(false);
          return;
        }

        const [gpRes, classRes, mapelRes, studentRes, tpRes] = await Promise.all([
          api.get("/api/guru_pengampu"),
          api.get("/api/kelas"),
          api.get("/api/mapel"),
          api.get("/api/siswa"),
          api.get("/api/tujuan_pembelajaran"),
        ]);

        const gpFiltered = (gpRes || []).filter((gp: GuruPengampu) => gp.guru_nip === currentTeacher.nip);
        setAssignments(gpFiltered);
        setClassList(classRes || []);
        setMapelList(mapelRes || []);

        // Calculate unique students under this teacher
        const assignedClassIds = gpFiltered.map((gp: GuruPengampu) => gp.kelas_id);
        const uniqueClassIds = Array.from(new Set(assignedClassIds));

        const myStudents = (studentRes || []).filter((s: Siswa) => uniqueClassIds.includes(s.kelas_id) && s.status_aktif);
        setStudentsCount(myStudents.length);

        // Calculate active TPs for assigned subjects
        const assignedMapelKodes = gpFiltered.map((gp: GuruPengampu) => gp.mapel_kode).filter(Boolean);
        const activeTps = (tpRes || []).filter(
          (tp: TujuanPembelajaran) =>
            assignedMapelKodes.includes(tp.mapel_kode) && tp.semester === (sekolah?.semester || 1)
        );
        setTpCount(activeTps.length);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data statistik guru.");
      } finally {
        setLoading(false);
      }
    }

    loadTeacherStats();
  }, [teacher?.nip, sekolah?.semester, sekolah?.id, user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-brand-600"></div>
        <p className="text-sm font-medium text-slate-500">Memuat statistik guru...</p>
      </div>
    );
  }

  // Group assignments
  const kelasAssignments = assignments.filter((gp) => gp.tipe === "kelas");
  const mapelAssignments = assignments.filter((gp) => gp.tipe === "mapel");

  return (
    <div id="teacher-dashboard-view" className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <span className="bg-brand-500/30 text-brand-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-400/20">
          {user?.role === "guru_kelas" ? "Guru Kelas" : "Guru Mata Pelajaran"}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold font-display mt-3">
          Selamat Datang Kembali, {teacher?.nama_guru || user?.nama_user}!
        </h2>
        <p className="text-sm text-brand-100 max-w-xl mt-1.5 leading-relaxed">
          Sistem penilaian Kurikulum Merdeka siap digunakan untuk membantu Anda melakukan evaluasi formatif dan sumatif secara akuntabel dan efisien.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Siswa Diampu</p>
            <h4 className="text-xl font-bold font-display text-slate-800 mt-1">{studentsCount} orang</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tujuan Pembelajaran</p>
            <h4 className="text-xl font-bold font-display text-slate-800 mt-1">{tpCount} TP aktif</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Kelas/Mapel Diampu</p>
            <h4 className="text-xl font-bold font-display text-slate-800 mt-1">{assignments.length} rombel</h4>
          </div>
        </div>
      </div>

      {/* Class/Subject Assignments Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: active assignments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="h-5 w-5 text-brand-600" />
            Daftar Kelas & Tugas Mengajar Anda
          </h3>

          <div className="space-y-3">
            {assignments.length > 0 ? (
              assignments.map((gp) => {
                const rombel = classList.find((k) => k.id === gp.kelas_id);
                const subject = gp.mapel_kode ? mapelList.find((m) => m.kode_mapel === gp.mapel_kode) : null;

                return (
                  <div
                    key={gp.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-brand-200 hover:bg-brand-50/20 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                          Kelas {rombel?.nama_rombel || gp.kelas_id}
                        </span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs text-slate-500">Tingkat {rombel?.tingkat}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-2">
                        {gp.tipe === "kelas" ? "Wali Kelas / Guru Kelas" : subject?.nama_mapel}
                      </h4>
                      {gp.mapel_kode && <p className="text-xs text-slate-400 font-mono mt-1">Kode: {gp.mapel_kode}</p>}
                    </div>

                    <button
                      onClick={() => setTab("rekap_nilai")}
                      className="p-2 text-slate-400 group-hover:text-brand-600 rounded-lg group-hover:bg-brand-50 transition-all"
                      title="Lihat Rekap Nilai"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-6 text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">Anda belum dikonfigurasi sebagai guru pengampu kelas atau mapel oleh Admin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick assessment shortcuts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold font-display text-slate-800 border-b border-slate-100 pb-3">
            Aksi Cepat Penilaian
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => setTab("nilai_formatif")}
              className="w-full flex items-center justify-between p-3 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <FileCheck className="h-4.5 w-4.5" />
                Input Nilai Formatif per TP
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTab("nilai_slm")}
              className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5" />
                Input Sumatif Lingkup Materi (SLM)
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTab("nilai_sas")}
              className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5" />
                Input Sumatif Akhir Semester (SAS)
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed mt-2">
            <strong>Catatan KKM Kurikulum Merdeka:</strong>
            <br />
            KKM (Kriteria Ketuntasan Minimal) atau KKTP diatur oleh Administrator per kelas dan mata pelajaran. Pastikan KKM terisi untuk menghitung status ketuntasan siswa pada lembar rekapitulasi.
          </div>
        </div>
      </div>
    </div>
  );
}
