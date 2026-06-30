import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DatabaseSchema, Sekolah, User, Role, Guru, Kelas, Siswa, Mapel, GuruPengampu, TujuanPembelajaran, KKM, BobotPenilaian, NilaiFormatif, NilaiSLM, NilaiSAS, AuditLog } from "./db_service.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Explicitly load and override from .env to bypass platform/system environment variables
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath, "utf-8"));
    for (const key in envConfig) {
      process.env[key] = envConfig[key];
    }
  }
} catch (e) {
  console.error("[Supabase Config] Gagal memuat paksa file .env:", e);
}

// Load configuration from environment variables
let supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

// Clean up URL if it has trailing parts
if (supabaseUrl.endsWith("/rest/v1/")) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`[Supabase] Client berhasil diinisialisasi untuk URL: ${supabaseUrl}`);
  } catch (err) {
    console.error("[Supabase] Gagal menginisialisasi client:", err);
  }
} else {
  console.log("[Supabase] URL atau Anon Key tidak lengkap di .env. Menggunakan database lokal.");
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Map JavaScript property names to database columns if they differ, or sanitize objects for SQL constraints
function sanitizeForDb(tableName: string, record: any): any {
  const sanitized = { ...record };

  // 1. Map users table: passwordHash -> password
  if (tableName === "users") {
    if ("passwordHash" in sanitized) {
      sanitized.password = sanitized.passwordHash;
      delete sanitized.passwordHash;
    }
  }

  // 2. Sanitize nilai_slm table
  if (tableName === "nilai_slm") {
    // Remove tp_id which is only used in-memory but doesn't exist in the SQL table
    delete sanitized.tp_id;
    // Provide defaults for NOT NULL SQL columns if they are empty
    if (!sanitized.lingkup_materi) {
      sanitized.lingkup_materi = "Umum";
    }
    if (!sanitized.tanggal) {
      sanitized.tanggal = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    }
  }

  return sanitized;
}

// Map database columns back to JavaScript property names
function sanitizeFromDb(tableName: string, record: any): any {
  const sanitized = { ...record };

  // Map users table: password -> passwordHash
  if (tableName === "users") {
    if ("password" in sanitized) {
      sanitized.passwordHash = sanitized.password;
      delete sanitized.password;
    }
  }

  return sanitized;
}

/**
 * Loads the complete database schema from Supabase tables.
 * Returns null if tables do not exist or if fetch fails, triggering a local fallback.
 */
export async function loadFromSupabase(): Promise<DatabaseSchema | null> {
  if (!supabase) return null;

  console.log("[Supabase] Memulai sinkronisasi dan loading data dari cloud...");

  try {
    // Define all tables we need to load
    const tableKeys: (keyof DatabaseSchema)[] = [
      "sekolah",
      "roles",
      "users",
      "guru",
      "kelas",
      "siswa",
      "mapel",
      "guru_pengampu",
      "tujuan_pembelajaran",
      "kkm",
      "bobot_penilaian",
      "nilai_formatif",
      "nilai_slm",
      "nilai_sas",
      "audit_log",
    ];

    const schema: Partial<DatabaseSchema> = {};

    // Load tables in parallel
    const promises = tableKeys.map(async (key) => {
      const dbTableName = key;
      const { data, error } = await supabase!.from(dbTableName).select("*");

      if (error) {
        // Code '42P01' means relation/table does not exist in PostgreSQL
        if (error.code === "42P01") {
          throw new Error(`Tabel "${dbTableName}" belum dibuat di Supabase. Harap jalankan schema.sql.`);
        }
        throw error;
      }

      return { key, data };
    });

    const results = await Promise.all(promises);

    for (const res of results) {
      const key = res.key;
      let rawData = res.data || [];

      // Map any schema naming differences
      rawData = rawData.map((item) => sanitizeFromDb(key, item));

      if (key === "sekolah") {
        if (rawData.length > 0) {
          schema.sekolah = rawData[0] as Sekolah;
        } else {
          // If empty, we need seeding
          return null;
        }
      } else if (key === "bobot_penilaian") {
        if (rawData.length > 0) {
          schema.bobot_penilaian = rawData[0] as BobotPenilaian;
        } else {
          // If empty, we need seeding
          return null;
        }
      } else {
        schema[key] = rawData as any;
      }
    }

    console.log("[Supabase] Data berhasil dimuat sepenuhnya dari cloud database.");
    return schema as DatabaseSchema;
  } catch (error: any) {
    console.warn("[Supabase] Menggunakan database lokal karena:", error.message || error);
    return null;
  }
}

/**
 * Syncs a single table's records to Supabase. Runs asynchronously in the background.
 */
export async function syncTableToSupabase(key: keyof DatabaseSchema, data: any): Promise<void> {
  if (!supabase) return;

  try {
    const dbTableName = key;
    let recordsToSync = [];

    // Format single-object entities as arrays for Postgres table inserts
    if (key === "sekolah" || key === "bobot_penilaian") {
      recordsToSync = [sanitizeForDb(key, data)];
    } else if (Array.isArray(data)) {
      recordsToSync = data.map((item) => sanitizeForDb(key, item));
    } else {
      return;
    }

    if (recordsToSync.length === 0) {
      // If table is empty, we don't necessarily want to do anything or we can delete (handling deletes is done reactively, but for simplicity upsert handles empty gracefully)
      return;
    }

    // Perform bulk upsert
    const { error } = await supabase.from(dbTableName).upsert(recordsToSync, {
      onConflict: key === "sekolah" || key === "bobot_penilaian" ? "id" : undefined,
    });

    if (error) {
      console.error(`[Supabase] Gagal melakukan sinkronisasi tabel "${dbTableName}":`, error.message);
    } else {
      console.log(`[Supabase] Tabel "${dbTableName}" berhasil disinkronkan (${recordsToSync.length} baris)`);
    }
  } catch (error) {
    console.error(`[Supabase] Error pada sinkronisasi tabel "${key}":`, error);
  }
}

/**
 * Seed Supabase with initial data when tables exist but are completely empty.
 */
export async function seedSupabase(initialData: DatabaseSchema): Promise<void> {
  if (!supabase) return;

  console.log("[Supabase] Mulai melakukan seeding data awal...");
  
  const keys: (keyof DatabaseSchema)[] = [
    "sekolah",
    "roles",
    "users",
    "guru",
    "kelas",
    "siswa",
    "mapel",
    "guru_pengampu",
    "tujuan_pembelajaran",
    "kkm",
    "bobot_penilaian",
    "nilai_formatif",
    "nilai_slm",
    "nilai_sas",
    "audit_log",
  ];

  for (const key of keys) {
    const data = initialData[key];
    await syncTableToSupabase(key, data);
  }
  
  console.log("[Supabase] Selesai melakukan seeding data awal ke cloud.");
}
