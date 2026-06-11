-- CreateTable
CREATE TABLE "site_categories" (
    "site_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_categories_pkey" PRIMARY KEY ("site_id","category_id")
);

-- CreateIndex
CREATE INDEX "site_categories_category_id_idx" ON "site_categories"("category_id");

-- AddForeignKey
ALTER TABLE "site_categories" ADD CONSTRAINT "site_categories_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_categories" ADD CONSTRAINT "site_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
