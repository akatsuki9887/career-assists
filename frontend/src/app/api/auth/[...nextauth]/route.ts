import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo", 
        },
      },
      profile(profile) {
        return {
          id: profile.id?.toString() ?? "unknown",
          name: profile.name ?? profile.login ?? null,
          email: profile.email ?? `${profile.login}@users.noreply.github.com`,
          image: profile.avatar_url ?? null,
          login: profile.login,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token ?? undefined;
        token.id = profile.id?.toString() ?? account.providerAccountId ?? "unknown";
        token.email = profile.email ?? `${profile.login}@users.noreply.github.com`;
        token.name = profile.name ?? profile.login ?? null;
        token.login = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = {
          id: "unknown",
          email: null,
          name: null,
          image: null,
          login: "unknown",
        };
      }
      session.user.id = token.id ?? "unknown";
      session.user.email = token.email ?? null;
      session.user.name = token.name ?? null;
      session.user.login = token.login ?? "unknown";
      session.user.image = session.user.image ?? null;
      session.accessToken = token.accessToken ?? undefined;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
export { handler as GET, handler as POST };
