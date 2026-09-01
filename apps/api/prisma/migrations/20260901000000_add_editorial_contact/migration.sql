-- AlterTable: Add editorialContact JSON field to Site model
-- Digunakan untuk konfigurasi Akses Redaksi di homepage (WhatsApp Chat Redaksi, Telegram Redaksi, Email Redaksi)
ALTER TABLE "Site" ADD COLUMN "editorialContact" JSONB DEFAULT '{"whatsapp":"","telegram":"","email":""}';
