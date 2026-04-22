import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from './prisma';
import { verifyPassword } from './password';

// Validation schema for login credentials
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'OWNER' | 'TECHNICIAN';
      mustChangePassword: boolean;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _request) {
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim()
          ?? headersList.get('x-real-ip')
          ?? null;
        const ua = headersList.get('user-agent') ?? null;

        const log = (args: {
          email: string;
          userId?: string;
          success: boolean;
          reason?: string;
        }) =>
          prisma.loginLog
            .create({
              data: {
                email: args.email,
                userId: args.userId ?? null,
                success: args.success,
                reason: args.reason ?? null,
                ipAddress: ip,
                userAgent: ua,
              },
            })
            .catch((e) => console.error('LoginLog write failed:', e));

        let email = '';
        try {
          const validatedData = loginSchema.parse(credentials);
          email = validatedData.email;
          const { password } = validatedData;

          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            await log({ email, success: false, reason: 'user_not_found' });
            return null;
          }

          if (!user.isActive) {
            await log({ email, userId: user.id, success: false, reason: 'account_deactivated' });
            return null;
          }

          const isValidPassword = await verifyPassword(password, user.passwordHash);

          if (!isValidPassword) {
            await log({ email, userId: user.id, success: false, reason: 'invalid_password' });
            return null;
          }

          await log({ email, userId: user.id, success: true });

          return { id: user.id, email: user.email, name: user.name };
        } catch (error) {
          console.error('Login error:', error);
          await log({ email, success: false, reason: 'validation_error' });
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger: _trigger }) {
      // Add user id to token on sign in
      if (user) {
        token.id = user.id;
      }
      // Load role + mustChangePassword from DB on every token refresh
      // This ensures deactivation and role changes take effect promptly
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, mustChangePassword: true, isActive: true },
        });
        if (dbUser && dbUser.isActive) {
          token.role = dbUser.role;
          token.mustChangePassword = dbUser.mustChangePassword;
        } else {
          // User deactivated or deleted — invalidate token
          return {};
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id, role, and mustChangePassword to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'OWNER' | 'TECHNICIAN') ?? 'OWNER';
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
      }
      return session;
    },
  },
});
