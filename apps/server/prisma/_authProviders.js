const defaultAuthProviders = [
  {
    name: "google",
    displayName: "Google",
    type: "oauth2",
    icon: "FcGoogle",
    enabled: false,
    issuerUrl: "https://accounts.google.com",
    authorizationEndpoint: "/o/oauth2/v2/auth",
    tokenEndpoint: "/o/oauth2/token",
    userInfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid profile email",
    sortOrder: 1,
    metadata: JSON.stringify({
      description: "Sign in with your Google account",
      docs: "https://developers.google.com/identity/protocols/oauth2",
      supportsDiscovery: true,
      authMethod: "body",
    }),
  },
  {
    name: "discord",
    displayName: "Discord",
    type: "oauth2",
    icon: "FaDiscord",
    enabled: false,
    issuerUrl: "https://discord.com",
    authorizationEndpoint: "/oauth2/authorize",
    tokenEndpoint: "/api/oauth2/token",
    userInfoEndpoint: "/api/users/@me",
    scope: "identify email",
    sortOrder: 2,
    metadata: JSON.stringify({
      description: "Sign in with your Discord account",
      docs: "https://discord.com/developers/docs/topics/oauth2",
      supportsDiscovery: false,
      authMethod: "body",
    }),
  },
  {
    name: "github",
    displayName: "GitHub",
    type: "oauth2",
    icon: "SiGithub",
    enabled: false,
    issuerUrl: "https://github.com/login/oauth", // URL fixa do GitHub
    authorizationEndpoint: "/authorize",
    tokenEndpoint: "/access_token",
    userInfoEndpoint: "https://api.github.com/user", // GitHub usa URL absoluta para userInfo
    scope: "user:email",
    sortOrder: 3,
    metadata: JSON.stringify({
      description: "Sign in with your GitHub account",
      docs: "https://docs.github.com/en/developers/apps/building-oauth-apps",
      specialHandling: "email_fetch_required",
    }),
  },
  {
    name: "auth0",
    displayName: "Auth0",
    type: "oidc",
    icon: "SiAuth0",
    enabled: false,
    issuerUrl: "https://your-tenant.auth0.com", // Placeholder - usuário deve configurar
    authorizationEndpoint: "/authorize",
    tokenEndpoint: "/oauth/token",
    userInfoEndpoint: "/userinfo",
    scope: "openid profile email",
    sortOrder: 4,
    metadata: JSON.stringify({
      description: "Sign in with Auth0 - Replace 'your-tenant' with your Auth0 domain",
      docs: "https://auth0.com/docs/get-started/authentication-and-authorization-flow",
      supportsDiscovery: true,
    }),
  },
  {
    name: "kinde",
    displayName: "Kinde Auth",
    type: "oidc",
    icon: "FaKey",
    enabled: false,
    issuerUrl: "https://your-tenant.kinde.com", // Placeholder - usuário deve configurar
    authorizationEndpoint: "/oauth2/auth",
    tokenEndpoint: "/oauth2/token",
    userInfoEndpoint: "/oauth2/user_profile",
    scope: "openid profile email",
    sortOrder: 5,
    metadata: JSON.stringify({
      description: "Sign in with Kinde - Replace 'your-tenant' with your Kinde domain",
      docs: "https://kinde.com/docs/developer-tools/about/",
      supportsDiscovery: true,
    }),
  },
  {
    name: "zitadel",
    displayName: "Zitadel",
    type: "oidc",
    icon: "FaShield",
    enabled: false,
    issuerUrl: "https://your-instance.zitadel.cloud", // Placeholder - usuário deve configurar
    authorizationEndpoint: "/oauth/v2/authorize",
    tokenEndpoint: "/oauth/v2/token",
    userInfoEndpoint: "/oidc/v1/userinfo",
    scope: "openid profile email",
    sortOrder: 6,
    metadata: JSON.stringify({
      description: "Sign in with Zitadel - Replace with your Zitadel instance URL",
      docs: "https://zitadel.com/docs/guides/integrate/login/oidc",
      supportsDiscovery: true,
      authMethod: "basic",
    }),
  },
  {
    name: "authentik",
    displayName: "Authentik",
    type: "oidc",
    icon: "FaShieldAlt",
    enabled: false,
    issuerUrl: "https://your-authentik.domain.com", // Placeholder - usuário deve configurar
    authorizationEndpoint: "/application/o/authorize/",
    tokenEndpoint: "/application/o/token/",
    userInfoEndpoint: "/application/o/userinfo/",
    scope: "openid profile email",
    sortOrder: 7,
    metadata: JSON.stringify({
      description: "Sign in with Authentik - Replace with your Authentik instance URL",
      docs: "https://goauthentik.io/docs/providers/oauth2",
      supportsDiscovery: true,
    }),
  },
  {
    name: "frontegg",
    displayName: "Frontegg",
    type: "oidc",
    icon: "FaEgg",
    enabled: false,
    issuerUrl: "https://your-tenant.frontegg.com", // Placeholder - usuário deve configurar
    authorizationEndpoint: "/oauth/authorize",
    tokenEndpoint: "/oauth/token",
    userInfoEndpoint: "/identity/resources/users/v2/me",
    scope: "openid profile email",
    sortOrder: 8,
    metadata: JSON.stringify({
      description: "Sign in with Frontegg - Replace 'your-tenant' with your Frontegg tenant",
      docs: "https://docs.frontegg.com",
      supportsDiscovery: true,
    }),
  },
  {
    name: "pocketid",
    displayName: "Pocket ID",
    type: "oidc",
    icon: "BsFillPSquareFill",
    enabled: false,
    issuerUrl: "https://your-pocket-id.domain.com",
    authorizationEndpoint: "/authorize",
    tokenEndpoint: "/api/oidc/token",
    userInfoEndpoint: "/api/oidc/userinfo",
    scope: "openid profile email",
    sortOrder: 9,
    metadata: JSON.stringify({
      description: "Sign in with Pocket ID - Replace with your Pocket ID instance URL",
      docs: "https://docs.pocket-id.org",
      supportsDiscovery: true,
    }),
  },
];

async function seedAuthProviders() {
  // Seed Auth Providers
  console.log("\n🔐 Starting auth providers seed...");
  console.log("🛡️  Protected mode: Only creates missing providers");

  let providersCreatedCount = 0;
  let providersSkippedCount = 0;

  for (const provider of defaultAuthProviders) {
    const existingProvider = await prisma.authProvider.findUnique({
      where: { name: provider.name },
    });

    if (existingProvider) {
      console.log(`⏭️  Auth provider '${provider.name}' already exists, skipping...`);
      providersSkippedCount++;
      continue;
    }

    await prisma.$runCommandRaw({
      update: "auth_providers",
      updates: [
        {
          q: { name: provider.name },
          u: { $setOnInsert: { ...provider, createdAt: new Date(), updatedAt: new Date() } },
          upsert: true,
        },
      ],
    });

    console.log(`✅ Created auth provider: ${provider.displayName} (${provider.name})`);
    providersCreatedCount++;
  }

  // Normalize Date fields in auth_providers
  try {
    await prisma.$runCommandRaw({
      update: "auth_providers",
      updates: [
        { q: { createdAt: { $type: "string" } }, u: [{ $set: { createdAt: { $toDate: "$createdAt" } } }], multi: true },
        { q: { updatedAt: { $type: "string" } }, u: [{ $set: { updatedAt: { $toDate: "$updatedAt" } } }], multi: true },
      ],
    });
  } catch (e) {
    console.warn("⚠️  Skipped auth_providers date normalization:", e?.message || e);
  }

  console.log("\n📊 Auth Providers Summary:");
  console.log(`   ✅ Created: ${providersCreatedCount} providers`);
  console.log(`   ⏭️  Skipped: ${providersSkippedCount} providers`);
  console.log("🎉 Auth providers seeded successfully!");
}
