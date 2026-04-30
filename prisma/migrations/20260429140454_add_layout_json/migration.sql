-- AlterTable
ALTER TABLE "Cover" ADD COLUMN     "layoutJson" JSONB,
ADD COLUMN     "themeId" TEXT NOT NULL DEFAULT 'andrea-editorial';
