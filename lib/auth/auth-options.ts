import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const staffDomain = process.env.STAFF_EMAIL_DOMAIN ?? "pillar5group.co.za";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
      authorization: {
        params: { scope: "openid profile email User.Read" },
      },
      // Work accounts often expose UPN as preferred_username, not email.
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email ?? profile.preferred_username,
          image: null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase() ?? "";
      return email.endsWith(`@${staffDomain}`);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = "staff";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
