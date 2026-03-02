-- AlterEnum (IF NOT EXISTS to handle pre-existing value)
DO $$ BEGIN
  ALTER TYPE "AccountType" ADD VALUE 'LABORATORY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable (add columns only if they don't exist)
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "bvn" TEXT;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "bvnVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "bvnVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "bvnFirstName" TEXT;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "bvnLastName" TEXT;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "nin" TEXT;
