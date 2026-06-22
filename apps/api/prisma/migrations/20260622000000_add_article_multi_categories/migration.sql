-- CreateTable: Join table for multi-category support (max 3 per article)
CREATE TABLE "article_categories" (
    "article_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("article_id","category_id")
);

-- CreateIndex
CREATE INDEX "article_categories_category_id_idx" ON "article_categories"("category_id");

-- AddForeignKey: article_categories → articles
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_article_id_fkey"
    FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: article_categories → Category
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: copy Article.categoryId → article_categories
-- NOTE: Sesuaikan nama kolom jika berbeda di DB aktual.
-- Prisma default: categoryId (camelCase) karena tidak ada @map() di schema lama.
INSERT INTO "article_categories" ("article_id", "category_id")
SELECT "id", "categoryId" FROM "Article" WHERE "categoryId" IS NOT NULL;

-- DropForeignKey: constraint lama Article → Category
ALTER TABLE "Article" DROP CONSTRAINT IF EXISTS "Article_categoryId_fkey";

-- DropIndex: index lama
DROP INDEX IF EXISTS "Article_categoryId_idx";

-- AlterTable: hapus kolom categoryId dari Article
ALTER TABLE "Article" DROP COLUMN "categoryId";
