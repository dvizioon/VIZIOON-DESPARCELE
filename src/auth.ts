import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateUser } from "@/modules/auth/application/authenticate-user";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials.email ?? "");
        const password = String(credentials.password ?? "");
        const result = await authenticateUser(email, password, new PrismaUserRepository());

        if (!result.ok) {
          return null;
        }

        return result.value;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        token.systemRole = user.systemRole ?? "MEMBER";
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? token.sub ?? "");
      session.user.name = token.name ?? "";
      session.user.email = token.email ?? "";
      session.user.systemRole = token.systemRole === "ADMIN" ? "ADMIN" : "MEMBER";
      return session;
    },
  },
});
