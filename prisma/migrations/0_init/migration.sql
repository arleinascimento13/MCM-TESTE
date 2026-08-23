-- CreateEnum
CREATE TYPE "PAPEL" AS ENUM ('ADMIN', 'JOB_LEADER', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "TIPO_OPCAO" AS ENUM ('DISCIPLINA', 'CENTRO_CUSTO', 'LOCAL');

-- CreateEnum
CREATE TYPE "ACAO_AUDITORIA" AS ENUM ('CRIAR', 'EDITAR', 'APROVAR', 'REJEITAR', 'REENVIAR', 'REMOVER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "papel" "PAPEL" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_leader_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "funcionario_id" UUID NOT NULL,
    "job_leader_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "job_leader_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "funcionario_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_allowed_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "tipo" "TIPO_OPCAO" NOT NULL,
    "valor_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "user_allowed_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "funcionario_id" UUID NOT NULL,
    "job_leader_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "inicio" VARCHAR(5) NOT NULL,
    "fim" VARCHAR(5) NOT NULL,
    "duracao" DECIMAL(5, 2) NOT NULL,
    "descricao" TEXT,
    "cost_center_id" UUID NOT NULL,
    "discipline_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "hora_extra" BOOLEAN NOT NULL DEFAULT false,
    "status" "STATUS" NOT NULL DEFAULT 'PENDENTE',
    "motivo_rejeicao" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "time_entry_id" UUID NOT NULL,
    "acao" "ACAO_AUDITORIA" NOT NULL,
    "usuario_id" UUID NOT NULL,
    "motivo" TEXT,
    "dados_alterados" JSONB,
    "quando" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "job_leader_assignments_funcionario_id_idx" ON "job_leader_assignments"("funcionario_id");

-- CreateIndex
CREATE INDEX "job_leader_assignments_job_leader_id_idx" ON "job_leader_assignments"("job_leader_id");

-- CreateIndex
CREATE INDEX "allocations_funcionario_id_idx" ON "allocations"("funcionario_id");

-- CreateIndex
CREATE INDEX "allocations_project_id_idx" ON "allocations"("project_id");

-- CreateIndex
CREATE INDEX "user_allowed_options_user_id_idx" ON "user_allowed_options"("user_id");

-- CreateIndex
CREATE INDEX "time_entries_funcionario_id_idx" ON "time_entries"("funcionario_id");

-- CreateIndex
CREATE INDEX "time_entries_status_idx" ON "time_entries"("status");

-- CreateIndex
CREATE INDEX "time_entries_funcionario_id_mes_ano_idx" ON "time_entries"("funcionario_id", "mes", "ano");

-- CreateIndex
CREATE INDEX "time_entries_project_id_idx" ON "time_entries"("project_id");

-- CreateIndex
CREATE INDEX "audit_logs_time_entry_id_idx" ON "audit_logs"("time_entry_id");

-- CreateIndex
CREATE INDEX "audit_logs_quando_idx" ON "audit_logs"("quando");

-- AddForeignKey
ALTER TABLE "job_leader_assignments" ADD CONSTRAINT "job_leader_assignments_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_leader_assignments" ADD CONSTRAINT "job_leader_assignments_job_leader_id_fkey" FOREIGN KEY ("job_leader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allowed_options" ADD CONSTRAINT "user_allowed_options_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_leader_id_fkey" FOREIGN KEY ("job_leader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
