import { NextAuthConfig } from "next-auth";
import { NeonAdapter } from "@auth/neon-adapter";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Credentials from "next-auth/providers/credentials";
import { sql } from "../lib/neon-client.js";
import bcrypt from "bcrypt";
import { z } from "zod";

// NextAuth.js schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  displayName: z.string().optional(),
  preferences: z.record(z.any()).default({})
});

export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;

// Auth.js configuration
export const authConfig: NextAuthConfig = {
  adapter: NeonAdapter(sql),
  
  providers: [
    // Credentials provider for email/password login
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const validated = LoginSchema.parse(credentials);
          
          // Find user
          const userResult = await sql`
            SELECT id, email, username, display_name, avatar_url, password_hash, role, is_verified, preferences
            FROM users 
            WHERE email = ${validated.email}
          `;
          
          if (userResult.length === 0) {
            return null;
          }
          
          const user = userResult[0];
          
          // Verify password
          const isValidPassword = await bcrypt.compare(validated.password, user.password_hash);
          
          if (!isValidPassword) {
            return null;
          }
          
          // Update last login
          await sql`
            UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
          `;
          
          return {
            id: user.id,
            email: user.email,
            name: user.display_name || user.username,
            image: user.avatar_url,
            username: user.username,
            role: user.role,
            isVerified: user.is_verified,
            preferences: user.preferences
          };
        } catch {
          return null;
        }
      }
    }),

    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
          role: "user",
          isVerified: true
        };
      }
    }),

    // Discord OAuth
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name || profile.username,
          email: profile.email,
          image: profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : undefined,
          username: profile.username,
          role: "user",
          isVerified: true
        };
      }
    }),

    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split('@')[0],
          role: "user",
          isVerified: profile.email_verified
        };
      }
    }),

    // Twitter OAuth v2
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: profile.data.email,
          image: profile.data.profile_image_url,
          username: profile.data.username,
          role: "user",
          isVerified: true
        };
      }
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  cookies: {
    sessionToken: {
      name: "deepweb_session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined
      }
    }
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider !== "credentials") {
        try {
          // Check if user exists
          const existingUser = await sql`
            SELECT id, role, preferences FROM users WHERE email = ${user.email}
          `;

          if (existingUser.length === 0) {
            // Create new user for OAuth
            const username = await generateUniqueUsername(user.username || user.email?.split('@')[0] || 'user');
            
            const newUser = await sql`
              INSERT INTO users (
                email, username, display_name, avatar_url, role, is_verified, preferences
              ) VALUES (
                ${user.email},
                ${username},
                ${user.name},
                ${user.image},
                'user',
                ${user.isVerified || true},
                '{}'
              )
              RETURNING id, role, preferences
            `;

            user.id = newUser[0].id;
            user.role = newUser[0].role;
            user.preferences = newUser[0].preferences;
            user.username = username;
          } else {
            // Update existing user
            await sql`
              UPDATE users 
              SET 
                display_name = ${user.name},
                avatar_url = ${user.image},
                last_login_at = NOW()
              WHERE id = ${existingUser[0].id}
            `;

            user.id = existingUser[0].id;
            user.role = existingUser[0].role;
            user.preferences = existingUser[0].preferences;
          }

          return true;
        } catch (error) {
          console.error("Sign-in error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // Include user info in JWT token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.preferences = user.preferences;
      }

      return token;
    },

    async session({ session, token }) {
      // Include user info in session
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.preferences = token.preferences as Record<string, any>;
      }

      return session;
    }
  },

  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user"
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);
      }
    },
    async signOut({ session, token }) {
      console.log(`User signed out: ${session?.user?.email || token?.email}`);
    }
  },

  debug: process.env.NODE_ENV === "development",
  
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  
  trustHost: true
};

// Helper function to generate unique username
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  let counter = 1;
  
  while (true) {
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;
    
    if (existing.length === 0) {
      break;
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
}

export default authConfig;
