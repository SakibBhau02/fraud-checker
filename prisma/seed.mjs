import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function ensureUser(email, password, name, role) {
  if (!email || !password) { console.log(`skip ${role} seed: env missing`); return; }
  const ex = await prisma.user.findUnique({ where: { email } });
  if (!ex) {
    await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10), role } });
    console.log(`seeded ${role}`, email);
  } else if (ex.role !== role) {
    await prisma.user.update({ where: { email }, data: { role } });
    console.log(`promoted to ${role}`, email);
  } else {
    console.log(`exists (${role})`, email);
  }
}

await ensureUser(process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, "Admin", "admin");
await ensureUser(process.env.SEED_SUPERADMIN_EMAIL, process.env.SEED_SUPERADMIN_PASSWORD, "Super Admin", "superadmin");
await prisma.$disconnect();
