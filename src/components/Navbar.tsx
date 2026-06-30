import React from "react";
import { LogOut, User, School, Calendar, LogIn } from "lucide-react";
import { Sekolah } from "../types";

interface NavbarProps {
  sekolah: Sekolah | null;
  currentUser: { nama_user: string; role: string; username: string } | null;
  onLogout: () => void;
}

export default function Navbar({ sekolah, currentUser, onLogout }: NavbarProps) {
  const formatRole = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "guru_kelas":
        return "Guru Kelas (Wali Kelas)";
      case "guru_mapel":
        return "Guru Mata Pelajaran";
      default:
        return role;
    }
  };

  return (
    <header id="app-navbar" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* School Name & Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <School className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-slate-900 leading-tight">
                {sekolah?.nama_sekolah || "SD Negeri Merdeka"}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                NPSN: {sekolah?.npsn || "20102030"}
              </p>
            </div>
          </div>

          {/* Academic Info & User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Academic Info Banner */}
            {sekolah && (
              <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>
                  TA: <strong>{sekolah.tahun_pelajaran}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Semester: <strong>{sekolah.semester === 1 ? "1 (Ganjil)" : "2 (Genap)"}</strong>
                </span>
              </div>
            )}

            {/* Profile Dropdown / Card */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{currentUser.nama_user}</div>
                  <div className="text-[10px] text-brand-600 font-medium tracking-wide uppercase mt-0.5">
                    {formatRole(currentUser.role)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                    <User className="h-5 w-5" />
                  </div>

                  <button
                    id="btn-logout"
                    onClick={onLogout}
                    title="Logout"
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
