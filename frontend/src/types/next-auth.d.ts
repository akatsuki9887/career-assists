import { DefaultSession, DefaultJWT } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Account as NextAuthAccount } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface Profile {
    id: string;
    login: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string;
  }

  interface Account extends NextAuthAccount {
    access_token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    login?: string;
    accessToken?: string;
  }
}