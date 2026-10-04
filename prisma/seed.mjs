import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) { console.log("skip seed: env missing"); process.exit(0); }
const ex = await prisma.user.findUnique({ where: { email } });
if (!ex) {
  await prisma.user.create({ data: { name: "Admin", email, passwordHash: await bcrypt.hash(password, 10), role: "admin" } });
  console.log("seeded admin", email);
}
await prisma.$disconnect();
