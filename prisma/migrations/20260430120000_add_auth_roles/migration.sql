-- Step 1: Create new MessageRole enum (replaces old Role)
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- Step 2: Alter Message table to use new enum
ALTER TABLE "Message" ALTER COLUMN "role" TYPE "MessageRole" USING "role"::text::"MessageRole";

-- Step 3: Drop old Role enum
DROP TYPE "Role";

-- Step 4: Create new Role enum for user roles
CREATE TYPE "Role" AS ENUM ('VIEWER', 'CREATOR', 'ADMIN');

-- Step 5: Create RequestStatus enum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Step 6: Create EmailTokenType enum
CREATE TYPE "EmailTokenType" AS ENUM ('EMAIL_CONFIRMATION', 'PASSWORD_RESET');

-- Step 7: Alter User table
ALTER TABLE "User" RENAME COLUMN "passwordHash" TO "password";
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'VIEWER';
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "image" TEXT;

-- Step 8: Create EmailToken table
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "EmailTokenType" NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailToken_token_key" ON "EmailToken"("token");

-- Step 9: Create ProfileRequest table
CREATE TABLE "ProfileRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileRequest_pkey" PRIMARY KEY ("id")
);

-- Step 10: Add foreign keys
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileRequest" ADD CONSTRAINT "ProfileRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
