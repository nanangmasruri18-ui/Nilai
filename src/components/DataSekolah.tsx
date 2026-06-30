import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Sekolah } from "../types";
import { Save, RefreshCw, Landmark, Calendar, ShieldCheck, AlertCircle } from "lucide-react";

interface DataSekolahProps {
  onUpdateSekolah: (updated: Sekolah) => void;
}

export default function DataSekolah({ onUpdateSekolah }: DataSekolahProps) {
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSekolah() {
      try {
        const res = await api.get("/api/sekolah");
        setSekolah(res);
      } catch (err: any) {
        setError("Gagal memuat profil sekolah.");
      } finally {
        setLoading(false);
      }
    }
    loadSekolah();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!sekolah) return;
    const { name, value } = e.target;
    setSekolah({
      ...sekolah,
      [name]: name === "semester" ? parseInt(value) : value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolah) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await api.put("/api/sekolah", sekolah);
      setSekolah(updated);
      onUpdateSekolah(updated);
      setSuccess("Profil sekolah berhasil disimpan!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
        <p className="text-xs text-slate-500">Memuat profil sekolah...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-4xl shadow-xs">
      {/* Title */}
      <div className="border-b border-slate-100 pb-4 mb-6 flex items-center gap-3">
        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 font-display">Identitas Sekolah Dasar</h2>
          <p className="text-xs text-slate-400">Konfigurasi profile, NPSN, kepala sekolah, tahun pelajaran, dan semester aktif</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600 font-semibold flex items-center gap-2 animate-pulse">
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

      {sekolah && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Sekolah</label>
              <input
                type="text"
                name="nama_sekolah"
                value={sekolah.nama_sekolah}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">NPSN</label>
              <input
                type="text"
                name="npsn"
                value={sekolah.npsn}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Sekolah</label>
              <textarea
                name="alamat"
                value={sekolah.alamat}
                onChange={handleChange}
                required
                rows={2}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kecamatan</label>
              <input
                type="text"
                name="kecamatan"
                value={sekolah.kecamatan}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                name="kabupaten_kota"
                value={sekolah.kabupaten_kota}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Provinsi</label>
              <input
                type="text"
                name="provinsi"
                value={sekolah.provinsi}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                name="nama_kepala_sekolah"
                value={sekolah.nama_kepala_sekolah}
                onChange={handleChange}
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-5">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-4">
              <Calendar className="h-4 w-4 text-brand-600" />
              Tahun Ajaran & Semester Aktif Kurikulum
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  name="tahun_pelajaran"
                  value={sekolah.tahun_pelajaran}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 2025/2026"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Semester Aktif</label>
                <select
                  name="semester"
                  value={sekolah.semester}
                  onChange={handleChange}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-all"
                >
                  <option value={1}>Semester 1 (Ganjil)</option>
                  <option value={2}>Semester 2 (Genap)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="btn-save-sekolah"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
