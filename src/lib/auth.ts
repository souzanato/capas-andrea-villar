import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/mailer";
import {
  confirmationEmailHtml,
  passwordResetEmailHtml,
} from "@/lib/email/templates";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // Configuração de email e senha
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Redefinir senha — Capas Andrea Villar",
          html: passwordResetEmailHtml(user.name ?? "", url),
        });
        console.log("[RESET PASSWORD] Enviado para:", user.email);
      } catch (err) {
        console.error("[RESET PASSWORD] Erro ao enviar:", err);
      }
    },
  },

  // Verificação de email
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        console.log("[VERIFY EMAIL] Chamado para:", user.email);
        console.log("[VERIFY EMAIL] URL:", url);
        await sendEmail({
          to: user.email,
          subject: "Confirme seu email — Capas Andrea Villar",
          html: confirmationEmailHtml(user.name ?? "", url),
        });
        console.log("[VERIFY EMAIL] Enviado com sucesso para:", user.email);
      } catch (err) {
        console.error("[VERIFY EMAIL] Erro ao enviar:", err);
      }
    },
  },

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Plugin de admin (roles: user, admin)
  plugins: [admin(), nextCookies()],

  // Forçar appRole VIEWER em novos usuários (incluindo OAuth)
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              appRole: (user as { appRole?: string }).appRole ?? "VIEWER",
            },
          };
        },
      },
    },
  },

  // Campos customizados no user
  user: {
    additionalFields: {
      appRole: {
        type: "string",
        defaultValue: "VIEWER",
        required: false,
      },
    },
  },

  // URL base
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  // Trusted origins para produção
  trustedOrigins: [
    "http://localhost:3000",
    "https://capas.andreavillar.com.br",
  ],
});

export type Session = typeof auth.$Infer.Session;
