import React, { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  FolderDot,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { api } from "../utils/api";
import { Sekolah, RekapItem } from "../types";

interface AdminDashboardProps {
  sekolah: Sekolah | null;
}

export default function AdminDashboard({ sekolah }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    siswa: 0,
    guru: 0,
    kelas: 0,
    mapel: 0,
  });
  const [rekapList, setRekapList] = useState<RekapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setLoading(true);
        // Load data in parallel
        const [siswaRes, guruRes, kelasRes, mapelRes, rekapRes] = await Promise.all([
          api.get("/api/siswa"),
          api.get("/api/guru"),
          api.get("/api/kelas"),
          api.get("/api/mapel"),
          api.get("/api/rekap"),
        ]);

        setStats({
          siswa: Array.isArray(siswaRes) ? siswaRes.length : 0,
          guru: Array.isArray(guruRes) ? guruRes.length : 0,
          kelas: Array.isArray(kelasRes) ? kelasRes.length : 0,
          mapel: Array.isArray(mapelRes) ? mapelRes.length : 0,
        });

        setRekapList(rekapRes || []);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data statistik dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  // Compute stats from rekapList
  const totalRecords = rekapList.length;
  const tuntasRecords = rekapList.filter((r) => r.status_ketuntasan === "Tuntas").length;
  const belumTuntasRecords = totalRecords - tuntasRecords;
  const ketuntasanRate = totalRecords > 0 ? Math.round((tuntasRecords / totalRecords) * 100) : 0;
  const averageAll = totalRecords > 0 ? Math.round(rekapList.reduce((sum, r) => sum + r.nilai_akhir, 0) / totalRecords) : 0;

  // Process data for Chart 1: Ketuntasan per Mapel
  // Group by mapel name
  const mapelGroups: { [key: string]: { tuntas: number; total: number; sumAkhir: number } } = {};
  rekapList.forEach((r) => {
    if (!mapelGroups[r.nama_mapel]) {
      mapelGroups[r.nama_mapel] = { tuntas: 0, total: 0, sumAkhir: 0 };
    }
    mapelGroups[r.nama_mapel].total++;
    mapelGroups[r.nama_mapel].sumAkhir += r.nilai_akhir;
    if (r.status_ketuntasan === "Tuntas") {
      mapelGroups[r.nama_mapel].tuntas++;
    }
  });

  const chartDataMapel = Object.keys(mapelGroups).map((mName) => {
    const group = mapelGroups[mName];
    const avg = Math.round(group.sumAkhir / group.total);
    const pctTuntas = Math.round((group.tuntas / group.total) * 100);
    return {
      name: mName.length > 18 ? mName.substring(0, 15) + "..." : mName,
      "Tuntas (%)": pctTuntas,
      "Belum Tuntas (%)": 100 - pctTuntas,
      "Rata-rata Nilai": avg,
    };
  });

  const statCard = (title: string, value: string | number, sub: string, icon: React.ReactNode, colorClass: string) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-2 font-display">{value}</h4>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-brand-600"></div>
        <p className="text-sm font-medium text-slate-500">Memuat statistik dashboard...</p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
          Dashboard Administrator
        </h2>
        <p className="text-sm text-slate-500">
          Selamat datang di portal utama pengelolaan nilai Kurikulum Merdeka {sekolah?.nama_sekolah}.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCard("Total Guru", stats.guru, "Pendidik terdaftar", <GraduationCap className="h-6 w-6 text-indigo-600" />, "bg-indigo-50")}
        {statCard("Total Siswa", stats.siswa, "Siswa aktif", <Users className="h-6 w-6 text-sky-600" />, "bg-sky-50")}
        {statCard("Kelas/Rombel", stats.kelas, "Rombongan belajar", <FolderDot className="h-6 w-6 text-emerald-600" />, "bg-emerald-50")}
        {statCard("Mata Pelajaran", stats.mapel, "Kurikulum Merdeka", <BookOpen className="h-6 w-6 text-amber-600" />, "bg-amber-50")}
      </div>

      {/* Learning Analytics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 rounded-xl flex flex-col justify-between shadow-xs">
          <div>
            <Award className="h-7 w-7 opacity-80" />
            <h4 className="text-lg font-bold font-display mt-3">Persentase Ketuntasan</h4>
            <p className="text-xs text-brand-100 mt-1">Akumulasi seluruh penilaian siswa</p>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-display">{ketuntasanRate}%</span>
            <span className="text-xs text-brand-100">Siswa Tuntas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-emerald-50 rounded-full text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tuntas KKM</p>
            <h4 className="text-2xl font-bold font-display text-slate-800 mt-1">{tuntasRecords}</h4>
            <p className="text-xs text-slate-500 mt-0.5">Catatan nilai ≥ KKM</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 bg-red-50 rounded-full text-red-600">
            <XCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Tuntas</p>
            <h4 className="text-2xl font-bold font-display text-slate-800 mt-1">{belumTuntasRecords}</h4>
            <p className="text-xs text-slate-500 mt-0.5">Catatan nilai &lt; KKM</p>
          </div>
        </div>
      </div>

      {/* Recharts Graphics */}
      {rekapList.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Ketuntasan Belajar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">
                Grafik Ketuntasan Belajar per Mata Pelajaran (%)
              </h3>
              <p className="text-xs text-slate-400">Menampilkan tingkat ketuntasan KKM siswa per mata pelajaran</p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataMapel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px" }}
                    itemStyle={{ color: "#38abf8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="Tuntas (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Belum Tuntas (%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Nilai Rata-rata per Mapel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-800 font-display">
                  Grafik Nilai Rata-rata Hasil Belajar Siswa
                </h3>
              </div>
              <p className="text-xs text-slate-400">Rerata Nilai Akhir siswa per mata pelajaran semester aktif</p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartDataMapel} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea1e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea1e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "8px" }}
                    itemStyle={{ color: "#38abf8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="Rata-rata Nilai"
                    stroke="#0285c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAvg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <h4 className="font-semibold text-slate-700">Data Penilaian Belum Tersedia</h4>
          <p className="text-xs max-w-sm mx-auto mt-1">
            Silakan lengkapi TP (Tujuan Pembelajaran) dan input nilai formatif/sumatif terlebih dahulu melalui hak akses Guru Kelas atau Guru Mapel.
          </p>
        </div>
      )}
    </div>
  );
}
