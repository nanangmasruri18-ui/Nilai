import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { BobotPenilaian } from "../types";
import { Save, RefreshCw, Gauge, ShieldCheck, AlertCircle } from "lucide-react";

export default function BobotPenilaianEditor() {
  const [bobot, setBobot] = useState<BobotPenilaian | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadBobot() {
      try {
        const res = await api.get("/api/bobot");
        setBobot(res);
      } catch (err: any) {
        setError("Gagal memuat konfigurasi bobot.");
      } finally {
        setLoading(false);
      }
    }
    loadBobot();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!bobot) return;
    const { name, value } = e.target;
    const val = parseInt(value) || 0;
    setBobot({
      ...bobot,
      [name]: val,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bobot) return;

    const total = bobot.formatif_pct + bobot.slm_pct + bobot.sas_pct;
    if (total !== 100) {
      setError(`Jumlah total bobot saat ini adalah ${total}%. Total bobot penilaian harus tepat 100%.`);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await api.put("/api/bobot", bobot);
      setBobot(updated);
      setSuccess("Bobot penilaian berhasil diperbarui!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui bobot.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
        <p className="text-xs text-slate-500">Memuat konfigurasi bobot...</p>
      </div>
    );
  }

  const currentTotal = bobot ? bobot.formatif_pct + bobot.slm_pct + bobot.sas_pct : 0;
  const isTotalValid = currentTotal === 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl shadow-xs">
      <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Gauge className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 font-display">Bobot Perhitungan Nilai Akhir</h2>
          <p className="text-xs text-slate-400">Tentukan kontribusi persentase komponen nilai untuk Nilai Akhir rapor</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {bobot && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            {/* Formatif */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800">1. Penilaian Formatif</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 leading-relaxed">
                  Rerata nilai tugas harian, diskusi kelompok, kuis, atau portofolio per Tujuan Pembelajaran (TP)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="formatif_pct"
                  min={0}
                  max={100}
                  value={bobot.formatif_pct}
                  onChange={handleChange}
                  required
                  className="w-16 text-center text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 font-semibold"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            {/* Sumatif Lingkup Materi (SLM) */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800">2. Sumatif Lingkup Materi (SLM)</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 leading-relaxed">
                  Rerata penilaian ulangan/tes tertulis setelah menyelesaikan satu lingkup materi bab pembahasan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="slm_pct"
                  min={0}
                  max={100}
                  value={bobot.slm_pct}
                  onChange={handleChange}
                  required
                  className="w-16 text-center text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 font-semibold"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            {/* Sumatif Akhir Semester (SAS) */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800">3. Sumatif Akhir Semester (SAS)</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 leading-relaxed">
                  Ulangan akhir semester berupa penilaian sumatif menyeluruh di penghujung tahun pembelajaran
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="sas_pct"
                  min={0}
                  max={100}
                  value={bobot.sas_pct}
                  onChange={handleChange}
                  required
                  className="w-16 text-center text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 font-semibold"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Sum tracker banner */}
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              isTotalValid
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-amber-50 border border-amber-100 text-amber-700"
            }`}
          >
            <span>Total Akumulasi Bobot:</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono">{currentTotal}%</span>
              <span>{isTotalValid ? "(Mencapai 100% - Valid)" : "(Harus Tepat 100%)"}</span>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              id="btn-save-bobot"
              type="submit"
              disabled={saving || !isTotalValid}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Bobot Penilaian"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
