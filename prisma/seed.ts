import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function seed() {
  const senhaHash = await bcrypt.hash("Admin123!", 10);

  const adminExistente = await prisma.user.findFirst({ where: { papel: "ADMIN" } });
  if (!adminExistente) {
    await prisma.user.create({
      data: {
        nome: "Administrador",
        email: "admin@mcm.local",
        senhaHash,
        papel: "ADMIN",
      },
    });
  }
  console.log("Seed concluído: admin@mcm.local / Admin123!");
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
