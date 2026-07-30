import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const staffDomain = process.env.STAFF_EMAIL_DOMAIN ?? "pillar5group.co.za";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
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
