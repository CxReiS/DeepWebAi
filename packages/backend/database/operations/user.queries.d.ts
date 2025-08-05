import { z } from "zod";
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    display_name: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    is_verified: z.ZodDefault<z.ZodBoolean>;
    role: z.ZodDefault<z.ZodEnum<["user", "premium", "admin", "developer"]>>;
    preferences: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    created_at: z.ZodDate;
    updated_at: z.ZodDate;
    last_login_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    username: string;
    role: "user" | "admin" | "developer" | "premium";
    preferences: Record<string, any>;
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    last_login_at?: Date | undefined;
    bio?: string | undefined;
}, {
    id: string;
    email: string;
    username: string;
    created_at: Date;
    updated_at: Date;
    role?: "user" | "admin" | "developer" | "premium" | undefined;
    preferences?: Record<string, any> | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    is_verified?: boolean | undefined;
    last_login_at?: Date | undefined;
    bio?: string | undefined;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    display_name: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["user", "premium", "admin", "developer"]>>;
    preferences: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    role: "user" | "admin" | "developer" | "premium";
    preferences: Record<string, any>;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    bio?: string | undefined;
}, {
    email: string;
    username: string;
    role?: "user" | "admin" | "developer" | "premium" | undefined;
    preferences?: Record<string, any> | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    bio?: string | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    display_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    avatar_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<["user", "premium", "admin", "developer"]>>>;
    preferences: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "email">, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    role?: "user" | "admin" | "developer" | "premium" | undefined;
    preferences?: Record<string, any> | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    bio?: string | undefined;
}, {
    username?: string | undefined;
    role?: "user" | "admin" | "developer" | "premium" | undefined;
    preferences?: Record<string, any> | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    bio?: string | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export declare class UserQueries {
    static findById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static findByUsername(username: string): Promise<User | null>;
    static create(userData: CreateUser): Promise<User>;
    static update(id: string, userData: UpdateUser): Promise<User | null>;
    static delete(id: string): Promise<boolean>;
    static updateLastLogin(id: string): Promise<void>;
    static findMany(options?: {
        limit?: number;
        offset?: number;
        role?: string;
        search?: string;
    }): Promise<{
        users: User[];
        total: number;
    }>;
    static getStats(userId: string): Promise<{
        totalConversations: number;
        totalMessages: number;
        totalTokensUsed: number;
        totalCost: number;
    }>;
    static findWithOAuthAccounts(id: string): Promise<User & {
        oauthAccounts: any[];
    } | null>;
    static checkUserLimits(userId: string, action: string): Promise<{
        allowed: boolean;
        quotas: any[];
        rateLimits: any[];
    }>;
}
