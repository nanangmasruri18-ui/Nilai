import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { AuditLog } from "../types";
import { ShieldCheck, Search, Calendar, User, Terminal } from "lucide-react";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await api.get("/api/audit_logs");
        setLogs(res || []);
      } catch (err: any) {
        setError("Gagal memuat log audit aktivitas sistem.");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    return (
      log.username.toLowerCase().includes(s) ||
      log.aktivitas.toLowerCase().includes(s) ||
      log.ip_address.toLowerCase().includes(s)
    );
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-500" />
            Log Aktivitas Sistem (Audit Trails)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mencatat setiap tindakan penting yang dilakukan oleh pengguna terautentikasi dalam database.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari berdasarkan pengguna/aktivitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 transition-all bg-slate-50/50"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5 w-48">Waktu & Tanggal</th>
                <th className="px-6 py-3.5 w-52">Nama Pengguna (Aktor)</th>
                <th className="px-6 py-3.5">Detail Aktivitas</th>
                <th className="px-6 py-3.5 w-44 text-right">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Memuat data audit trails...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const date = new Date(log.timestamp);
                  const formattedDate = date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = date.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-mono text-slate-500 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="pl-5 text-[10px]">{formattedTime} WIB</div>
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-850">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>{log.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600 font-semibold leading-relaxed">
                        {log.aktivitas}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-500 text-[11px]">
                        {log.ip_address}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Tidak ditemukan log aktivitas yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
