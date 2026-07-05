-- CreateTable: HomepageConfig
-- 6 template system per site (A-F)
-- Reference: docs/design-grid.md

CREATE TABLE "HomepageConfig" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'F',
    "heroMode" TEXT NOT NULL DEFAULT 'MAGAZINE_COVER_550',
    "heroAutoRotate" BOOLEAN NOT NULL DEFAULT true,
    "heroIntervalMs" INTEGER NOT NULL DEFAULT 5000,
    "feedLayout" TEXT NOT NULL DEFAULT 'pattern_rotation',
    "trendingStyle" TEXT NOT NULL DEFAULT 'numbered_podium',
    "scoreFreshness" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "scoreEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "scoreEditorial" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "scoreRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "opinionCategories" JSONB NOT NULL DEFAULT '[]',
    "photoCategories" JSONB NOT NULL DEFAULT '[]',
    "videoCategories" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageConfig_siteId_key" ON "HomepageConfig"("siteId");
CREATE INDEX "HomepageConfig_siteId_idx" ON "HomepageConfig"("siteId");

-- AddForeignKey
ALTER TABLE "HomepageConfig" ADD CONSTRAINT "HomepageConfig_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: default config (Design F) untuk semua site yang sudah ada
INSERT INTO "HomepageConfig" ("id", "siteId", "template", "heroMode", "feedLayout", "trendingStyle", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", 'F', 'MAGAZINE_COVER_550', 'pattern_rotation', 'numbered_podium', NOW(), NOW()
FROM "Site"
WHERE "deletedAt" IS NULL
ON CONFLICT DO NOTHING;
