-- Migrate User table to Better Auth format

-- 1. Drop existing FK constraints on User
ALTER TABLE "Cover" DROP CONSTRAINT IF EXISTS "Cover_userId_fkey";
ALTER TABLE "EmailToken" DROP CONSTRAINT IF EXISTS "EmailToken_userId_fkey";
ALTER TABLE "ProfileRequest" DROP CONSTRAINT IF EXISTS "ProfileRequest_userId_fkey";

-- 2. Create new user table (Better Auth format)
CREATE TABLE "user" (
    id          TEXT NOT NULL,
    name        TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image       TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role        TEXT NOT NULL DEFAULT 'user',
    banned      BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "appRole"   "Role" NOT NULL DEFAULT 'VIEWER',

    CONSTRAINT "user_pkey" PRIMARY KEY (id),
    CONSTRAINT "user_email_key" UNIQUE (email)
);

-- 3. Copy data from User to user
INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, "appRole")
SELECT
    u.id,
    COALESCE(u.name, '') as name,
    u.email,
    u."emailVerified" IS NOT NULL as "emailVerified",
    u.image,
    u."createdAt",
    COALESCE(u."createdAt", CURRENT_TIMESTAMP) as "updatedAt",
    CASE
        WHEN u.role = 'ADMIN' THEN 'admin'
        ELSE 'user'
    END as role,
    u.role as "appRole"
FROM "User" u;

-- 4. Create account table with password migration
CREATE TABLE "account" (
    id            TEXT NOT NULL,
    "accountId"   TEXT NOT NULL,
    "providerId"  TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken"     TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    scope         TEXT,
    password      TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_pkey" PRIMARY KEY (id),
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Migrate passwords from User table to account table
INSERT INTO "account" ("id", "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u.email,
    'email',
    u.id,
    u.password,
    NOW(),
    NOW()
FROM "User" u
WHERE u.password IS NOT NULL;

-- 5. Create session table
CREATE TABLE "session" (
    id          TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    token       TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId"    TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY (id),
    CONSTRAINT "session_token_key" UNIQUE (token),
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- 6. Create verification table
CREATE TABLE "verification" (
    id         TEXT NOT NULL,
    identifier TEXT NOT NULL,
    value      TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY (id)
);

-- 7. Recreate FK constraints on app tables pointing to user (not User)
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileRequest" ADD CONSTRAINT "ProfileRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Drop old User table
DROP TABLE "User" CASCADE;

-- 9. Record this migration for Prisma
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'manual',
    NOW(),
    '20260501100000_migrate_to_better_auth',
    'Manual migration: User → user, added Better Auth models, migrated passwords to account table',
    NULL,
    NOW(),
    1
);
