const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const defaultConfigs = [
  // General Configurations
  {
    key: "appName",
    value: "Yipai.app ",
    type: "string",
    group: "general",
  },
  {
    key: "showHomePage",
    value: "true",
    type: "boolean",
    group: "general",
  },
  {
    key: "appDescription",
    value: "Yipai.app is a secure and simple file sharing platform",
    type: "string",
    group: "general",
  },
  {
    key: "appLogo",
    value: "https://www.yipai360.com/live/static/logo.e0eef9a7.png",
    type: "string",
    group: "general",
  },
  {
    key: "firstUserAccess",
    value: "true",
    type: "boolean",
    group: "general",
  },
  // Storage Configurations
  {
    key: "maxFileSize",
    value: "1073741824", // default 1GiB in bytes
    type: "bigint",
    group: "storage",
  },
  {
    key: "maxTotalStoragePerUser",
    value: "10737418240", // 10GB in bytes
    type: "bigint",
    group: "storage",
  },
  // Security Configurations
  {
    key: "jwtSecret",
    value: crypto.randomBytes(64).toString("hex"),
    type: "string",
    group: "security",
  },
  {
    key: "maxLoginAttempts",
    value: "5",
    type: "number",
    group: "security",
  },
  {
    key: "loginBlockDuration",
    value: "600", // 10 minutes in seconds
    type: "number",
    group: "security",
  },
  {
    key: "passwordMinLength",
    value: "8",
    type: "number",
    group: "security",
  },
  // Email Configurations
  {
    key: "smtpEnabled",
    value: "false",
    type: "boolean",
    group: "email",
  },
  {
    key: "smtpHost",
    value: "smtp.gmail.com",
    type: "string",
    group: "email",
  },
  {
    key: "smtpPort",
    value: "587",
    type: "number",
    group: "email",
  },
  {
    key: "smtpUser",
    value: "your-email@gmail.com",
    type: "string",
    group: "email",
  },
  {
    key: "smtpPass",
    value: "your-app-specific-password",
    type: "string",
    group: "email",
  },
  {
    key: "smtpFromName",
    value: "Palmr",
    type: "string",
    group: "email",
  },
  {
    key: "smtpFromEmail",
    value: "noreply@palmr.app",
    type: "string",
    group: "email",
  },
  {
    key: "smtpSecure",
    value: "auto",
    type: "string",
    group: "email",
  },
  {
    key: "smtpNoAuth",
    value: "false",
    type: "boolean",
    group: "email",
  },
  {
    key: "smtpTrustSelfSigned",
    value: "false",
    type: "boolean",
    group: "email",
  },
  {
    key: "passwordResetTokenExpiration",
    value: "3600",
    type: "number",
    group: "security",
  },
  // Auth Providers Global Configuration
  {
    key: "authProvidersEnabled",
    value: "true",
    type: "boolean",
    group: "auth-providers",
  },
  {
    key: "passwordAuthEnabled",
    value: "true",
    type: "boolean",
    group: "security",
  },
  {
    key: "serverUrl",
    value: "http://localhost:3333",
    type: "string",
    group: "general",
  },
];

async function main() {
  console.log("🌱 Starting app configurations seed...");
  console.log("🛡️  Protected mode: Only creates missing configurations");

  let createdCount = 0;
  let skippedCount = 0;

  for (const config of defaultConfigs) {
    const existingConfig = await prisma.appConfig.findUnique({
      where: { key: config.key },
    });

    if (existingConfig) {
      console.log(`⏭️  Configuration '${config.key}' already exists, skipping...`);
      skippedCount++;
      continue;
    }

    await prisma.$runCommandRaw({
      update: "app_configs",
      updates: [
        {
          q: { key: config.key },
          u: { $setOnInsert: { ...config, createdAt: new Date(), updatedAt: new Date() } },
          upsert: true,
        },
      ],
    });

    console.log(`✅ Created configuration: ${config.key}`);
    createdCount++;
  }

  // Normalize Date fields to BSON Date (fix records saved as strings)
  try {
    await prisma.$runCommandRaw({
      update: "app_configs",
      updates: [
        { q: { createdAt: { $type: "string" } }, u: [{ $set: { createdAt: { $toDate: "$createdAt" } } }], multi: true },
        { q: { updatedAt: { $type: "string" } }, u: [{ $set: { updatedAt: { $toDate: "$updatedAt" } } }], multi: true },
      ],
    });
  } catch (e) {
    console.warn("⚠️  Skipped app_configs date normalization:", e?.message || e);
  }

  console.log("\n📊 Seed Summary:");
  console.log(`   ✅ Created: ${createdCount} configurations`);
  console.log(`   ⏭️  Skipped: ${skippedCount} configurations`);
  console.log("🎉 App configurations seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error during seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
