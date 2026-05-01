import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Criar admin (Renato)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD são obrigatórios");
  }

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { accounts: true },
  });

  if (existing) {
    // Atualizar role e appRole
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        appRole: "ADMIN",
        role: "admin",
        name: "Renato",
      },
    });

    // Atualizar password na account se existir
    if (existing.accounts.length > 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.account.update({
        where: { id: existing.accounts[0].id },
        data: { password: hashedPassword },
      });
    } else {
      // Criar account com password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.account.create({
        data: {
          userId: existing.id,
          accountId: adminEmail,
          providerId: "email",
          password: hashedPassword,
        },
      });
    }

    console.log(`✅ Admin atualizado: ${adminEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Renato",
        emailVerified: true,
        appRole: "ADMIN",
        role: "admin",
        accounts: {
          create: {
            accountId: adminEmail,
            providerId: "email",
            password: hashedPassword,
          },
        },
      },
    });

    console.log(`✅ Admin criado: ${admin.email} (${admin.id})`);
  }

  // 2. Migrar Andrea para CREATOR
  const andrea = await prisma.user.findUnique({
    where: { email: "andreavillar85@gmail.com" },
  });

  if (andrea) {
    await prisma.user.update({
      where: { email: "andreavillar85@gmail.com" },
      data: { appRole: "CREATOR" },
    });
    console.log("✅ Andrea migrada para CREATOR");
  } else {
    console.log("⚠️  Andrea não encontrada no banco (normal se ainda não logou)");
  }

  console.log("🌱 Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
