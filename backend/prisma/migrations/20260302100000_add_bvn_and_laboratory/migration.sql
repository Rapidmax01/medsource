-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'LABORATORY';

-- AlterTable
ALTER TABLE "Seller" ADD COLUMN "bvn" TEXT,
ADD COLUMN "bvnVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bvnVerifiedAt" TIMESTAMP(3),
ADD COLUMN "bvnFirstName" TEXT,
ADD COLUMN "bvnLastName" TEXT,
ADD COLUMN "nin" TEXT;
