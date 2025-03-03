'use server'

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import 'server-only';

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

interface ISession {
    username?: string,
    sid?: string,
}

export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
}

// TODO empty session
export async function decrypt(session: string) {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        console.log('Failed to verify session.')
    }
}

export async function createSession(payload: ISession) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const session = await encrypt({ ...payload, expiresAt })
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        secure: false,
        expires: expiresAt,
    })
}

export async function deleteSession(): Promise<undefined> {
    const cookieStore = await cookies()
    cookieStore.delete('session');
}

export async function updateSession(payload: Partial<ISession>) {
    const session = await getSession();
    const nextSession: ISession = {
        ...session,
        ...payload
    };
    createSession(nextSession);
}

export async function getSession(): Promise<ISession | undefined> {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get('session');
    if (encryptedCookie) {
        const payload = await decrypt(encryptedCookie.value);
        if (payload)
            return payload as ISession;
    } else {
        console.log("Session field does not exist.");
    }
}

export async function getSessionField(name: string) {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get('session');
    if (encryptedCookie) {
        const payload = await decrypt(encryptedCookie.value);
        if (payload)
            return payload[name];
    } else {
        console.log("Session field does not exist.");
    }
}