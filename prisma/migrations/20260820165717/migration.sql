-- AlterTable
ALTER TABLE "allocations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cost_centers" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "disciplines" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "job_leader_assignments" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "locations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "time_entries" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_allowed_options" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
