import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const passwordHash = await hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", banned: false, username },
    create: { email, username, passwordHash, role: "ADMIN" },
  });
  console.log("Admin ready:", { email: user.email, username: user.username, password });
}

main().finally(() => prisma.$disconnect());


