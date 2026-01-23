/**
 * MySQL Database Client Configuration
 * 
 * This file provides a Prisma client instance and helper functions
 * to replace Supabase functionality.
 */

import { PrismaClient } from '@prisma/client';

// Prisma Client Singleton
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}

export default prisma;

/**
 * Helper function to handle Prisma errors
 */
export function handlePrismaError(error: any) {
    console.error('Database error:', error);

    if (error.code === 'P2002') {
        return { error: 'A record with this value already exists' };
    }

    if (error.code === 'P2025') {
        return { error: 'Record not found' };
    }

    if (error.code === 'P2003') {
        return { error: 'Referenced record not found' };
    }

    return { error: 'Database operation failed' };
}

/**
 * Type-safe query wrapper
 */
export async function safeQuery<T>(
    queryFn: () => Promise<T>
): Promise<{ data: T | null; error: any }> {
    try {
        const data = await queryFn();
        return { data, error: null };
    } catch (error) {
        return { data: null, error: handlePrismaError(error) };
    }
}
