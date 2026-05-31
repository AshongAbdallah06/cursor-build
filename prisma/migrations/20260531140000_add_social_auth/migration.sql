-- AlterTable
ALTER TABLE "users" ADD COLUMN "github_id" TEXT,
ADD COLUMN "facebook_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");
