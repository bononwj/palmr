const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Deleting all existing app_configs...");

  const result = await prisma.appConfig.deleteMany({});

  console.log(`✅ Deleted ${result.count} configurations`);
  console.log("\n🌱 Now run: node prisma/seed.js");
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
