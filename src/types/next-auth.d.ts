import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      systemRole: "MEMBER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    systemRole: "MEMBER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    systemRole: "MEMBER" | "ADMIN";
  }
}
