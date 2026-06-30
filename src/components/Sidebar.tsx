import React from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Target,
  FileCheck,
  ClipboardList,
  ShieldAlert,
  FolderDot,
  Gauge,
  KeyRound,
  FileSpreadsheet
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  role: "admin" | "guru_kelas" | "guru_mapel" | null;
}

export default function Sidebar({ currentTab, setTab, role }: SidebarProps) {
  const isAdmin = role === "admin";

  const renderNavSection = (title: string, children: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  const navItem = (id: string, label: string, icon: React.ReactNode) => {
    const isActive = currentTab === id;
    return (
      <button
        id={`nav-item-${id}`}
        key={id}
        onClick={() => setTab(id)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
          isActive
            ? "bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-500 rounded-l-none"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span className={`${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-500"}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <aside id="sidebar-navigation" className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4 overflow-y-auto">
      {/* Navigation Groups */}
      <div className="flex-1">
        {renderNavSection(
          "Utama",
          <>
            {navItem("dashboard", "Dashboard", <LayoutDashboard className="h-4 w-4" />)}
          </>
        )}

        {isAdmin &&
          renderNavSection(
            "Data Master",
            <>
              {navItem("sekolah", "Data Sekolah", <Settings className="h-4 w-4" />)}
              {navItem("users", "Data Pengguna", <KeyRound className="h-4 w-4" />)}
              {navItem("guru", "Data Guru", <GraduationCap className="h-4 w-4" />)}
              {navItem("kelas", "Data Kelas/Rombel", <FolderDot className="h-4 w-4" />)}
              {navItem("siswa", "Data Siswa", <Users className="h-4 w-4" />)}
              {navItem("mapel", "Data Mapel", <BookOpen className="h-4 w-4" />)}
              {navItem("kkm", "Nilai KKM", <Target className="h-4 w-4" />)}
              {navItem("bobot", "Bobot Penilaian", <Gauge className="h-4 w-4" />)}
              {navItem("pengampu", "Guru Pengampu", <CalendarDays className="h-4 w-4" />)}
            </>
          )}

        {renderNavSection(
          "Kurikulum Merdeka",
          <>
            {navItem("tp", "Tujuan Pembelajaran (TP)", <Target className="h-4 w-4" />)}
          </>
        )}

        {renderNavSection(
          "Pengolahan Nilai",
          <>
            {navItem("nilai_formatif", "Nilai Formatif", <FileCheck className="h-4 w-4" />)}
            {navItem("nilai_slm", "Sumatif Lingkup Materi", <ClipboardList className="h-4 w-4" />)}
            {navItem("nilai_sas", "Sumatif Akhir Semester", <FileSpreadsheet className="h-4 w-4" />)}
          </>
        )}

        {renderNavSection(
          "Hasil Belajar",
          <>
            {navItem("rekap_nilai", "Rekap Nilai & Laporan", <FileSpreadsheet className="h-4 w-4" />)}
          </>
        )}

        {isAdmin &&
          renderNavSection(
            "Sistem",
            <>
              {navItem("audit_log", "Log Aktivitas", <ShieldAlert className="h-4 w-4" />)}
            </>
          )}
      </div>

      <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono text-center">
        Versi Kurikulum Merdeka v1.0
      </div>
    </aside>
  );
}
