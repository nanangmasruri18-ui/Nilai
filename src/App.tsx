import React, { useState, useEffect } from "react";
import { api, getAuthUser, setAuthSession, clearAuthSession } from "./utils/api";
import { Sekolah } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Components
import AdminDashboard from "./components/AdminDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import DataSekolah from "./components/DataSekolah";
import DataUser from "./components/DataUser";
import DataGuru from "./components/DataGuru";
import DataKelas from "./components/DataKelas";
import DataSiswa from "./components/DataSiswa";
import DataMapel from "./components/DataMapel";
import DataKKM from "./components/DataKKM";
import BobotPenilaian from "./components/BobotPenilaian";
import GuruPengampu from "./components/GuruPengampu";
import TujuanPembelajaran from "./components/TujuanPembelajaran";
import NilaiFormatif from "./components/NilaiFormatif";
import NilaiSumatifLM from "./components/NilaiSumatifLM";
import NilaiSumatifAS from "./components/NilaiSumatifAS";
import RekapNilai from "./components/RekapNilai";
import AuditLogs from "./components/AuditLogs";

import { School, KeyRound, AlertCircle, Menu, X, ShieldCheck } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [currentTab, setTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [loadingApp, setLoadingApp] = useState(true);

  // Verify authentication on mount
  useEffect(() => {
    async function initApp() {
      const activeUser = getAuthUser();
      if (activeUser) {
        setUser(activeUser);
        try {
          // Load active school profile
          const data = await api.get("/api/sekolah");
          if (data) setSekolah(data);
        } catch (e) {
          // Token might be expired
          clearAuthSession();
          setUser(null);
        }
      }
      setLoadingApp(false);
    }
    initApp();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setAuthError("Harap isi username dan password.");
      return;
    }

    try {
      setAuthError("");
      setAuthLoading(true);

      const res = await api.post("/api/auth/login", { username, password });
      if (res && res.token) {
        setAuthSession(res.token, res.user, res.teacher || res.guru);

        setUser(res.user);

        // Fetch school info
        const info = await api.get("/api/sekolah");
        if (info) setSekolah(info);

        setTab("dashboard");
      }
    } catch (err: any) {
      setAuthError(err.message || "Username atau password salah.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setSekolah(null);
    setTab("dashboard");
    setUsername("");
    setPassword("");
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"></div>
        <p className="text-xs font-semibold text-slate-500 mt-3">Sistem Penilaian Kurikulum Merdeka sedang memuat...</p>
      </div>
    );
  }

  // Render Login Screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex p-3.5 bg-brand-600 text-white rounded-2xl shadow-md mx-auto">
            <School className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-bold font-display text-slate-900 tracking-tight leading-none">
            SIPENAS Kurikulum Merdeka
          </h2>
          <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto">
            Sistem Penilaian & Rekapitulasi Hasil Belajar Siswa Sekolah Dasar Berbasis Role
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-slate-200 shadow-xl rounded-2xl sm:px-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username Pengguna</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    required
                    placeholder="Masukkan username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kata Sandi (Password)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-600 flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                id="btn-login"
                type="submit"
                disabled={authLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {authLoading ? "Mengotentikasi..." : "Masuk ke Sistem"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-[10px] text-slate-400 font-mono">
              <p className="font-semibold text-slate-500 uppercase tracking-wider">Kredensial Default Uji Coba:</p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 font-bold">Admin:</span> admin / admin123
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Guru Kls:</span> bu_gita / guru123
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Guru Mapel:</span> pak_budi / guru123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render current active tab content
  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return user.role === "admin" ? <AdminDashboard sekolah={sekolah} /> : <TeacherDashboard sekolah={sekolah} setTab={setTab} />;
      case "sekolah":
        return <DataSekolah onUpdateSekolah={(updated) => setSekolah(updated)} />;
      case "users":
        return <DataUser />;
      case "guru":
        return <DataGuru />;
      case "kelas":
        return <DataKelas />;
      case "siswa":
        return <DataSiswa />;
      case "mapel":
        return <DataMapel />;
      case "kkm":
        return <DataKKM />;
      case "bobot":
        return <BobotPenilaian />;
      case "pengampu":
        return <GuruPengampu />;
      case "tp":
        return <TujuanPembelajaran />;
      case "nilai_formatif":
        return <NilaiFormatif />;
      case "nilai_slm":
        return <NilaiSumatifLM />;
      case "nilai_sas":
        return <NilaiSumatifAS />;
      case "rekap_nilai":
        return <RekapNilai />;
      case "audit_log":
        return <AuditLogs />;
      default:
        return <div className="p-8 text-center text-slate-400 text-xs">Menu ini sedang dalam pengembangan.</div>;
    }
  };

  const pageTitles: { [key: string]: string } = {
    dashboard: "Dashboard Ringkasan",
    sekolah: "Profil & Informasi Sekolah",
    users: "Pengelolaan Hak Akses Pengguna",
    guru: "Registrasi Pendidik & Tenaga Kependidikan",
    kelas: "Pengelolaan Rombongan Belajar",
    siswa: "Direktori & Profil Siswa Aktif",
    mapel: "Daftar Mata Pelajaran Kurikulum Merdeka",
    kkm: "Konfigurasi Kriteria Ketuntasan Minimal (KKM)",
    bobot: "Bobot Komponen Penilaian Hasil Belajar",
    pengampu: "Penugasan & Pemetaan Guru Pengampu",
    tp: "Input Capaian & Tujuan Pembelajaran (TP)",
    nilai_formatif: "Lembar Input Penilaian Formatif",
    nilai_slm: "Lembar Input Sumatif Lingkup Materi (SLM)",
    nilai_sas: "Lembar Input Sumatif Akhir Semester (SAS)",
    rekap_nilai: "Rekapitulasi Capaian Hasil Belajar Siswa",
    audit_log: "Audit Aktivitas & Log Keamanan Sistem",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar sekolah={sekolah} currentUser={user} onLogout={handleLogout} />

      {/* Main Core Viewport */}
      <div className="flex flex-1 relative">
        <Sidebar currentTab={currentTab} setTab={setTab} role={user.role} />

        {/* Mobile Navbar Hamburger Toggle Button */}
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3 bg-brand-600 text-white rounded-full shadow-lg focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Overlay / Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-white h-full p-4 overflow-y-auto flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Menu SIPENAS</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sidebar as drawer contents */}
              <div className="flex-1 space-y-4">
                <div className="mb-4">
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utama</h3>
                  <button
                    onClick={() => { setTab("dashboard"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      currentTab === "dashboard" ? "bg-brand-50 text-brand-700" : "text-slate-600"
                    }`}
                  >
                    Dashboard
                  </button>
                </div>

                {user.role === "admin" && (
                  <div className="mb-4">
                    <h3 className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Master</h3>
                    <div className="space-y-1">
                      {["sekolah", "users", "guru", "kelas", "siswa", "mapel", "kkm", "bobot", "pengampu"].map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTab(t); setMobileMenuOpen(false); }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            currentTab === t ? "bg-brand-50 text-brand-700" : "text-slate-600"
                          }`}
                        >
                          {t === "sekolah" ? "Data Sekolah" : t === "users" ? "Data Pengguna" : t === "guru" ? "Data Guru" : t === "kelas" ? "Data Kelas/Rombel" : t === "siswa" ? "Data Siswa" : t === "mapel" ? "Data Mapel" : t === "kkm" ? "Nilai KKM" : t === "bobot" ? "Bobot Penilaian" : "Guru Pengampu"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kurikulum Merdeka</h3>
                  <button
                    onClick={() => { setTab("tp"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      currentTab === "tp" ? "bg-brand-50 text-brand-700" : "text-slate-600"
                    }`}
                  >
                    Tujuan Pembelajaran (TP)
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengolahan Nilai</h3>
                  <div className="space-y-1">
                    {["nilai_formatif", "nilai_slm", "nilai_sas"].map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTab(t); setMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          currentTab === t ? "bg-brand-50 text-brand-700" : "text-slate-600"
                        }`}
                      >
                        {t === "nilai_formatif" ? "Nilai Formatif" : t === "nilai_slm" ? "Sumatif Lingkup Materi" : "Sumatif Akhir Semester"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasil Belajar</h3>
                  <button
                    onClick={() => { setTab("rekap_nilai"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      currentTab === "rekap_nilai" ? "bg-brand-50 text-brand-700" : "text-slate-600"
                    }`}
                  >
                    Rekap Nilai & Laporan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 overflow-x-hidden print:bg-white print:p-0">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold font-display text-slate-800 tracking-tight">
                {pageTitles[currentTab] || "Sistem Penilaian"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Beranda &gt; {currentTab.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
