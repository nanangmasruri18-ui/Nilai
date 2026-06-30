import React, { useState, useEffect } from "react";
import { api, getAuthTeacher, getAuthUser } from "../utils/api";
import { Kelas, Mapel, RekapItem, GuruPengampu, Guru } from "../types";
import { Download, Printer, Filter, ShieldAlert, CheckCircle2, XCircle, FileSpreadsheet, Eye, GraduationCap, BookOpen, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

export default function RekapNilai() {
  const [teacher, setTeacher] = useState<any>(getAuthTeacher());
  const user = getAuthUser();

  const [classList, setClassList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [rekapList, setRekapList] = useState<RekapItem[]>([]);
  const [tpList, setTpList] = useState<any[]>([]);
  const [sekolah, setSekolah] = useState<any>(null);
  const [gpList, setGpList] = useState<GuruPengampu[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);

  // Selection filters
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

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

        const [clRes, mRes, gpRes, tpRes, sekRes, gRes] = await Promise.all([
          api.get("/api/kelas"),
          api.get("/api/mapel"),
          api.get("/api/guru_pengampu"),
          api.get("/api/tujuan_pembelajaran"),
          api.get("/api/sekolah"),
          api.get("/api/guru"),
        ]);

        setTpList(tpRes || []);
        setSekolah(sekRes || null);
        setGpList(gpRes || []);
        setGuruList(gRes || []);

        if (user?.role === "admin") {
          setClassList(clRes || []);
          setMapelList(mRes || []);
          if (clRes?.[0]) setSelectedClass(clRes[0].id);
          if (mRes?.[0]) setSelectedMapel(mRes[0].kode_mapel);
        } else if (currentTeacher) {
          const myGp = (gpRes || []).filter((gp: GuruPengampu) => gp.guru_nip === currentTeacher.nip);
          const myClassIds = myGp.map((gp: GuruPengampu) => gp.kelas_id);
          let assignedClassList = (clRes || []).filter((c: Kelas) => myClassIds.includes(c.id));
          if (assignedClassList.length === 0) {
            assignedClassList = clRes || [];
          }
          setClassList(assignedClassList);

          if (assignedClassList?.[0]) {
            setSelectedClass(assignedClassList[0].id);
            const activeGpForClass = myGp.filter((gp: GuruPengampu) => gp.kelas_id === assignedClassList[0].id);
            const hasHomeroom = activeGpForClass.some((gp: GuruPengampu) => gp.tipe === "kelas");

            if (hasHomeroom) {
              setMapelList(mRes || []);
              if (mRes?.[0]) setSelectedMapel(mRes[0].kode_mapel);
            } else {
              const myKodes = activeGpForClass.map((gp: GuruPengampu) => gp.mapel_kode).filter(Boolean);
              const classMapels = (mRes || []).filter((m: Mapel) => myKodes.includes(m.kode_mapel));
              setMapelList(classMapels);
              if (classMapels?.[0]) setSelectedMapel(classMapels[0].kode_mapel);
            }
          }
        }
      } catch (err: any) {
        setError("Gagal memuat filter rombel.");
      } finally {
        setLoading(false);
      }
    }

    loadSelections();
  }, [teacher?.nip, user?.role, user?.username, user?.id]);

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    setSelectedMapel("");
    setRekapList([]);

    if (user?.role === "admin") {
      const mRes = await api.get("/api/mapel");
      if (mRes?.[0]) setSelectedMapel(mRes[0].kode_mapel);
    } else if (teacher) {
      const gpRes = await api.get("/api/guru_pengampu");
      const mRes = await api.get("/api/mapel");

      const myGp = (gpRes || []).filter((gp: GuruPengampu) => gp.guru_nip === teacher.nip && gp.kelas_id === classId);
      const hasHomeroom = myGp.some((gp: GuruPengampu) => gp.tipe === "kelas");

      if (hasHomeroom) {
        setMapelList(mRes || []);
        if (mRes?.[0]) setSelectedMapel(mRes[0].kode_mapel);
      } else {
        const myKodes = myGp.map((gp: GuruPengampu) => gp.mapel_kode).filter(Boolean);
        const classMapels = (mRes || []).filter((m: Mapel) => myKodes.includes(m.kode_mapel));
        setMapelList(classMapels);
        if (classMapels?.[0]) setSelectedMapel(classMapels[0].kode_mapel);
      }
    }
  };

  useEffect(() => {
    async function fetchRekap() {
      if (!selectedClass || !selectedMapel) {
        setRekapList([]);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/rekap?kelas_id=${selectedClass}&mapel_kode=${selectedMapel}`);
        setRekapList(res || []);
      } catch (err: any) {
        setError("Gagal menghitung rekapitulasi nilai rapor.");
      } finally {
        setLoading(false);
      }
    }
    fetchRekap();
  }, [selectedClass, selectedMapel]);

  // Statistics calculation
  const totalStudents = rekapList.length;
  const tuntasCount = rekapList.filter((r) => r.status_ketuntasan === "Tuntas").length;
  const tuntasPct = totalStudents > 0 ? Math.round((tuntasCount / totalStudents) * 100) : 0;

  const validScores = rekapList.map((r) => r.nilai_akhir);
  const classAvg = validScores.length > 0 ? Math.round(validScores.reduce((sum, n) => sum + n, 0) / validScores.length) : 0;
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;

  const currentClassObj = classList.find((c) => c.id === selectedClass);
  const activeSemester = sekolah?.semester || 1;
  const activeTps = currentClassObj
    ? tpList
        .filter(
          (tp) =>
            tp.mapel_kode === selectedMapel &&
            tp.kelas === currentClassObj.tingkat &&
            tp.semester === activeSemester
        )
        .sort((a, b) => a.kode_tp.localeCompare(b.kode_tp, undefined, { numeric: true, sensitivity: 'base' }))
    : [];

  const normalizeMateriPokok = (text: string): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  };

  // Get unique TPs representing unique Lingkup Materi (LMs)
  const activeLMs = activeTps.reduce((acc: any[], current) => {
    const exists = acc.some(
      (item) => normalizeMateriPokok(item.materi_pokok) === normalizeMateriPokok(current.materi_pokok)
    );
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);

  const getSlmScoreForLm = (r: RekapItem, lm: any): string | number => {
    if (!r.slm_scores) return "-";
    if (r.slm_scores[lm.id] !== undefined) {
      return r.slm_scores[lm.id];
    }
    const normalizedLm = normalizeMateriPokok(lm.materi_pokok);
    const matchingTpId = Object.keys(r.slm_scores).find((tpId) => {
      const tpObj = tpList.find((t) => t.id === tpId);
      return tpObj && normalizeMateriPokok(tpObj.materi_pokok) === normalizedLm;
    });
    if (matchingTpId && r.slm_scores[matchingTpId] !== undefined) {
      return r.slm_scores[matchingTpId];
    }
    return "-";
  };

  const buildPdfDoc = () => {
    const isLandscape = (activeTps.length + activeLMs.length) > 3;
    const orientation = isLandscape ? "landscape" : "portrait";
    const pdfWidth = isLandscape ? 330 : 215;
    const pdfHeight = isLandscape ? 215 : 330;

    // Find the teacher for the current class and subject
    const matchedGp = gpList.find(
      (gp) => gp.kelas_id === selectedClass && gp.mapel_kode === selectedMapel && gp.tipe === "mapel"
    ) || gpList.find(
      (gp) => gp.kelas_id === selectedClass && gp.tipe === "kelas"
    );

    const assignedTeacher = matchedGp 
      ? guruList.find((g) => g.nip === matchedGp.guru_nip)
      : null;

    const finalTeacherName = assignedTeacher?.nama_guru || teacher?.nama_guru || user?.username || "_________________________";
    const finalTeacherNip = assignedTeacher?.nip || teacher?.nip || "____________________";
    const teacherRoleText = matchedGp 
      ? (matchedGp.tipe === "mapel" ? "Guru Mata Pelajaran" : "Guru Kelas")
      : (["PAI", "PJOK"].includes(selectedMapel) ? "Guru Mata Pelajaran" : "Guru Kelas");

    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: [215, 330], // Indonesian F4 standard is 215x330mm
    });

    // 1. School Header (Kop Surat)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    const line1 = `PEMERINTAH KABUPATEN/KOTA ${(sekolah?.kabupaten_kota || "KOTA MALANG").toUpperCase()}`;
    const line2 = `DINAS PENDIDIKAN`;
    const line3 = `${(sekolah?.nama_sekolah || "SDN NEGERI").toUpperCase()}`;
    const line4 = `NPSN : ${sekolah?.npsn || "________________"} | Alamat : ${sekolah?.alamat || "________________"}`;

    pdf.text(line1, pdfWidth / 2, 12, { align: "center" });
    pdf.text(line2, pdfWidth / 2, 17, { align: "center" });
    pdf.text(line3, pdfWidth / 2, 22, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(line4, pdfWidth / 2, 27, { align: "center" });

    // Draw standard Excel-like double border below Kop Surat
    pdf.setLineWidth(0.8);
    pdf.line(10, 30, pdfWidth - 10, 30);
    pdf.setLineWidth(0.2);
    pdf.line(10, 31, pdfWidth - 10, 31);

    // 2. Document Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("FORMAT PENILAIAN SISWA", pdfWidth / 2, 39, { align: "center" });
    pdf.setFontSize(12);
    pdf.text(`Tahun Pelajaran ${sekolah?.tahun_pelajaran || "2025/2026"}`, pdfWidth / 2, 45, { align: "center" });

    // 3. Metadata details (Class, Subject, Semester, Teacher)
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const classText = `Kelas: ${classList.find((c) => c.id === selectedClass)?.nama_rombel || "-"}`;
    const mapelText = `Mata Pelajaran: ${mapelList.find((m) => m.kode_mapel === selectedMapel)?.nama_mapel || "-"}`;
    const semText = `Semester: ${sekolah?.semester || 1} (${sekolah?.semester === 1 ? "Ganjil" : "Genap"})`;
    const teacherText = `Guru: ${finalTeacherName}`;

    pdf.text(classText, 10, 53);
    pdf.text(mapelText, 10, 58);
    pdf.text(semText, pdfWidth - 10, 53, { align: "right" });
    pdf.text(teacherText, pdfWidth - 10, 58, { align: "right" });

    // 4. Multi-row Excel header style
    const head = [
      [
        { content: "No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "NIS", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Nama Siswa", rowSpan: 2, styles: { halign: "left", valign: "middle" } },
        { content: "Formatif", colSpan: activeTps.length + 1, styles: { halign: "center" } },
        { content: "Sumatif LM", colSpan: activeLMs.length + 1, styles: { halign: "center" } },
        { content: "Sumatif AS", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Nilai Akhir", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "KKM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Ketuntasan", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      ],
      [
        ...activeTps.map(tp => ({ content: tp.kode_tp, styles: { halign: "center" } })),
        { content: "Rata Formatif", styles: { halign: "center" } },
        ...activeLMs.map((lm, idx) => ({ content: `LM ${idx + 1}`, styles: { halign: "center" } })),
        { content: "Rata SLM", styles: { halign: "center" } }
      ]
    ];

    // Map body cells
    const body = rekapList.map((r, index) => {
      const nisVal = r.siswa_nis || r.nis || "";
      const namaVal = r.nama_lengkap || r.nama_siswa || "";
      const formatifAvgVal = r.rata_formatif !== undefined ? r.rata_formatif : (r.avg_formatif ?? "-");
      const slmAvgVal = r.rata_slm !== undefined ? r.rata_slm : (r.avg_slm ?? "-");
      const sasVal = r.nilai_sas !== undefined && r.nilai_sas !== null ? r.nilai_sas : "-";
      
      const tpScores = activeTps.map(tp => {
        const score = r.tp_scores?.[tp.id];
        return score !== undefined && score !== null ? score : "-";
      });

      const lmScores = activeLMs.map(lm => {
        return getSlmScoreForLm(r, lm);
      });

      return [
        index + 1,
        nisVal,
        namaVal,
        ...tpScores,
        formatifAvgVal,
        ...lmScores,
        slmAvgVal,
        sasVal,
        r.nilai_akhir,
        r.kkm,
        r.status_ketuntasan
      ];
    });

    autoTable(pdf, {
      startY: 64,
      head: head,
      body: body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: (activeTps.length + activeLMs.length) > 6 ? 8 : 10,
        textColor: [0, 0, 0],
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
        cellPadding: 2.5,
        halign: "center", // standard Excel center alignment
      },
      headStyles: {
        fillColor: [240, 240, 240], // Light grey background
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [100, 100, 100],
        lineWidth: 0.2,
      },
      columnStyles: {
        2: { halign: "left", fontStyle: "bold" }, // Name column left aligned and bold
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5, // Thick outer border
      margin: { top: 10, bottom: 10, left: 10, right: 10 },
      didParseCell: (data) => {
        // Highlight Red/Green for ketuntasan
        if (data.section === "body" && data.column.index === data.table.columns.length - 1) {
          if (data.cell.text[0] === "Belum Tuntas") {
            data.cell.styles.textColor = [180, 0, 0];
          } else if (data.cell.text[0] === "Tuntas") {
            data.cell.styles.textColor = [0, 100, 0];
          }
        }
      }
    });

    const finalY = (pdf as any).lastAutoTable.finalY || 100;
    let currentY = finalY + 12;

    if (currentY + 60 > pdfHeight - 10) {
      pdf.addPage();
      currentY = 15;
    }

    // 5. Statistics Area (Bagian Rekapitulasi)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`Jumlah Siswa : ${totalStudents}`, 10, currentY);
    pdf.text(`Nilai Tertinggi : ${highestScore}`, 10, currentY + 6);
    pdf.text(`Nilai Terendah : ${lowestScore}`, 10, currentY + 12);
    pdf.text(`Rata-rata Kelas : ${classAvg}`, 10, currentY + 18);

    // 6. Signatures Area
    const signatureY = currentY + 28;
    const colWidth = (pdfWidth - 20) / 2;

    // Left Signature: Kepala Sekolah
    pdf.setFont("helvetica", "normal");
    pdf.text("Mengetahui,", 10 + colWidth / 2, signatureY, { align: "center" });
    pdf.text(`Kepala ${sekolah?.nama_sekolah || "Sekolah Dasar"}`, 10 + colWidth / 2, signatureY + 5, { align: "center" });
    
    pdf.setFont("helvetica", "bold");
    pdf.text(sekolah?.nama_kepala_sekolah || "_________________________", 10 + colWidth / 2, signatureY + 25, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("NIP. 197805122005011002", 10 + colWidth / 2, signatureY + 29, { align: "center" });

    // Right Signature: Guru Kelas / Mapel
    pdf.setFontSize(10);
    const placeDate = `${sekolah?.kabupaten_kota || "Malang"}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
    pdf.text(placeDate, 10 + colWidth + colWidth / 2, signatureY, { align: "center" });
    
    pdf.text(teacherRoleText, 10 + colWidth + colWidth / 2, signatureY + 5, { align: "center" });
    
    pdf.setFont("helvetica", "bold");
    pdf.text(finalTeacherName, 10 + colWidth + colWidth / 2, signatureY + 25, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`NIP. ${finalTeacherNip}`, 10 + colWidth + colWidth / 2, signatureY + 29, { align: "center" });

    return pdf;
  };

  const handlePreviewPdf = () => {
    try {
      if (rekapList.length === 0) return;
      setError("");

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }

      const pdf = buildPdfDoc();
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (err: any) {
      console.error("PDF preview generation failed:", err);
      setError("Gagal menghasilkan pratinjau PDF: " + (err.message || err));
    }
  };

  const handleDownloadPdf = () => {
    try {
      if (rekapList.length === 0) return;
      setError("");
      setDownloadingPdf(true);

      const pdf = buildPdfDoc();
      const cl = classList.find((c) => c.id === selectedClass);
      const mp = mapelList.find((m) => m.kode_mapel === selectedMapel);
      const filename = `Rekap_Nilai_Kelas_${cl?.nama_rombel || selectedClass}_${mp?.nama_mapel || selectedMapel}.pdf`;
      pdf.save(filename);
    } catch (err: any) {
      console.error("PDF download failed:", err);
      setError("Gagal mengunduh berkas PDF: " + (err.message || err));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      if (rekapList.length === 0) return;
      setError("");

      const pdf = buildPdfDoc();
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        }, 100);
      };
    } catch (err: any) {
      console.error("PDF printing failed:", err);
      setError("Gagal mencetak berkas PDF: " + (err.message || err));
    }
  };

  const handleExportExcel = () => {
    if (rekapList.length === 0) return;
    const cl = classList.find((c) => c.id === selectedClass);
    const mp = mapelList.find((m) => m.kode_mapel === selectedMapel);

    const excelData = rekapList.map((r, index) => {
      const nisVal = r.siswa_nis || r.nis;
      const namaVal = r.nama_lengkap || r.nama_siswa;
      const formatifAvgVal = r.rata_formatif !== undefined ? r.rata_formatif : r.avg_formatif;
      const slmAvgVal = r.rata_slm !== undefined ? r.rata_slm : r.avg_slm;

      const row: any = {
        No: index + 1,
        NIS: nisVal,
        "Nama Siswa": namaVal,
      };

      // Add individual TP scores to excel row
      activeTps.forEach((tp) => {
        row[tp.kode_tp] = r.tp_scores?.[tp.id] ?? "-";
      });

      row["Rata Formatif"] = formatifAvgVal || 0;

      // Add individual LM scores to excel row
      activeLMs.forEach((lm, idx) => {
        row[`LM ${idx + 1} (${lm.materi_pokok})`] = getSlmScoreForLm(r, lm);
      });

      row["Rata Sumatif LM"] = slmAvgVal || 0;
      row["Sumatif AS (SAS)"] = r.nilai_sas || 0;
      row["Nilai Akhir"] = r.nilai_akhir;
      row["KKM"] = r.kkm;
      row["Status Ketuntasan"] = r.status_ketuntasan;

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");

    // Write file
    XLSX.writeFile(wb, `Rekap_Nilai_Kelas_${cl?.nama_rombel || selectedClass}_${mp?.nama_mapel || selectedMapel}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-end gap-5 print:hidden">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-brand-600" />
              <span>Rombongan Belajar (Kelas)</span>
            </label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all appearance-none cursor-pointer font-medium text-slate-700 shadow-2xs"
              >
                <option value="">-- Pilih Rombel Kelas --</option>
                {classList.map((c, index) => (
                  <option key={c.id || `class-${index}`} value={c.id}>
                    Kelas {c.nama_rombel}
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <GraduationCap className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-600" />
              <span>Mata Pelajaran (Mapel)</span>
            </label>
            <div className="relative">
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                disabled={!selectedClass}
                className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 font-medium text-slate-700 shadow-2xs"
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {mapelList.map((m, index) => (
                  <option key={m.kode_mapel || `mapel-${index}`} value={m.kode_mapel}>
                    {m.nama_mapel} ({m.kode_mapel})
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Export/Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={rekapList.length === 0 || downloadingPdf}
            className="flex items-center justify-center gap-1.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Ekspor ke format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
            Excel
          </button>

          <button
            onClick={handlePreviewPdf}
            disabled={rekapList.length === 0 || downloadingPdf}
            className="flex items-center justify-center gap-1.5 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Pratinjau tampilan PDF cetak Excel"
          >
            <Eye className="h-4.5 w-4.5 text-indigo-600" />
            Pratinjau PDF
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={rekapList.length === 0 || downloadingPdf}
            className="flex items-center justify-center gap-1.5 border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 hover:text-brand-750 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Unduh laporan dalam format PDF berkualitas tinggi"
          >
            {downloadingPdf ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
            ) : (
              <Download className="h-4.5 w-4.5 text-brand-600" />
            )}
            {downloadingPdf ? "Memproses..." : "Unduh PDF"}
          </button>
        </div>
      </div>

      {downloadingPdf && (
        <div className="mb-4 p-3 bg-brand-50 border border-brand-150 rounded-lg text-xs text-brand-700 flex items-center gap-2 animate-pulse">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
          <span>Sedang memproses dokumen dan mengunduh berkas PDF, mohon tunggu sebentar...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Report Card */}
      {selectedClass && selectedMapel ? (
        <div className="space-y-6">
          {/* Printable Report Worksheet */}
          <div id="rekap-nilai-report-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 print:border-slate-800">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider print:bg-slate-100 print:border-slate-800">
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800 text-center w-12">No</th>
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800 w-24">NIS</th>
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800">Nama Lengkap Siswa</th>
                    
                    {/* Formatif Header */}
                    <th colSpan={activeTps.length > 0 ? activeTps.length + 1 : 1} className="px-4 py-1.5 border border-slate-200 print:border-slate-800 text-center bg-slate-100/50">
                      Formatif
                    </th>
                    
                    {/* Sumatif LM Header */}
                    <th colSpan={activeLMs.length > 0 ? activeLMs.length + 1 : 1} className="px-4 py-1.5 border border-slate-200 print:border-slate-800 text-center bg-slate-100/30">
                      Sumatif LM (SLM)
                    </th>
                    
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800 text-center w-28">Sumatif AS (SAS)</th>
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800 text-center w-28 bg-brand-50/25 print:bg-slate-100">Nilai Akhir</th>
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800 text-center w-20">KKM</th>
                    <th rowSpan={2} className="px-4 py-3 border border-slate-200 print:border-slate-800 text-center w-28">Ketuntasan</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider print:bg-slate-100 print:border-slate-800">
                    {activeTps.map((tp) => (
                      <th key={tp.id} className="px-2 py-1.5 border border-slate-200 print:border-slate-800 text-center min-w-[60px]" title={tp.deskripsi}>
                        {tp.kode_tp}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 border border-slate-200 print:border-slate-800 text-center w-20">Rata Formatif</th>
                    
                    {activeLMs.map((lm, idx) => (
                      <th key={`lm-head-${lm.id}`} className="px-2 py-1.5 border border-slate-200 print:border-slate-800 text-center min-w-[60px]" title={lm.materi_pokok}>
                        LM {idx + 1}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 border border-slate-200 print:border-slate-800 text-center w-20">Rata SLM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTps.length + activeLMs.length + 9} className="text-center py-8 text-slate-400">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 mx-auto mb-2"></div>
                        Memproses laporan rekap...
                      </td>
                    </tr>
                  ) : rekapList.length > 0 ? (
                    rekapList.map((r, index) => {
                      const isTuntas = r.status_ketuntasan === "Tuntas";
                      const nisVal = r.siswa_nis || r.nis;
                      const namaVal = r.nama_lengkap || r.nama_siswa;
                      const formatifAvgVal = r.rata_formatif !== undefined ? r.rata_formatif : r.avg_formatif;
                      const slmAvgVal = r.rata_slm !== undefined ? r.rata_slm : r.avg_slm;

                      return (
                        <tr key={`${nisVal || "siswa"}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center">{index + 1}</td>
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 font-mono text-slate-500">{nisVal}</td>
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 font-semibold text-slate-800">{namaVal}</td>
                          
                          {/* Individual TP Formative Scores */}
                          {activeTps.map((tp) => {
                            const score = r.tp_scores?.[tp.id];
                            return (
                              <td key={tp.id} className="px-2 py-2.5 border border-slate-200 print:border-slate-800 text-center font-mono">
                                {score !== undefined && score !== null ? score : "-"}
                              </td>
                            );
                          })}
                          
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center font-mono bg-slate-50/20">{formatifAvgVal !== undefined && formatifAvgVal !== null ? formatifAvgVal : "-"}</td>
                          
                          {/* Individual LM Sumatif Scores */}
                          {activeLMs.map((lm) => {
                            const score = getSlmScoreForLm(r, lm);
                            return (
                              <td key={`lm-score-${lm.id}`} className="px-2 py-2.5 border border-slate-200 print:border-slate-800 text-center font-mono">
                                {score}
                              </td>
                            );
                          })}

                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center font-mono bg-slate-50/20">{slmAvgVal !== undefined && slmAvgVal !== null ? slmAvgVal : "-"}</td>
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center font-mono">{r.nilai_sas !== undefined && r.nilai_sas !== null ? r.nilai_sas : "-"}</td>
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center font-bold font-mono text-brand-700 bg-brand-50/10 print:bg-transparent">
                            {r.nilai_akhir}
                          </td>
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center font-mono text-slate-500">{r.kkm}</td>
                          <td className="px-4 py-2.5 border border-slate-200 print:border-slate-800 text-center">
                            {isTuntas ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold print:bg-transparent print:border-none print:text-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 print:hidden" />
                                Tuntas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold print:bg-transparent print:border-none print:text-red-800">
                                <XCircle className="h-3.5 w-3.5 text-red-500 print:hidden" />
                                Belum Tuntas
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={activeTps.length + activeLMs.length + 9} className="text-center py-8 text-slate-400">
                        Tidak ada siswa terdaftar pada kelas aktif ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          <Filter className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <h4 className="font-semibold text-slate-600">Pilih Parameter Laporan</h4>
          <p className="text-xs max-w-sm mx-auto mt-1">
            Silakan pilih Rombel Kelas dan Mata Pelajaran untuk menampilkan ringkasan rekapitulasi capaian belajar siswa.
          </p>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Pratinjau Cetak Excel (PDF)</h3>
                  <p className="text-slate-400 text-[10px]">Ukuran Kertas: F4 Folio ({activeTps.length > 3 ? "Landscape" : "Portrait"})</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Unduh PDF
                </button>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4 flex justify-center">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full rounded-lg border border-slate-200 shadow-inner bg-white"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
