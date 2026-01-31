import { auth } from "@/lib/auth";
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Public paths that should always be accessible
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon.ico')
    ) {
        return NextResponse.next();
    }

    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        // We'll use a fetch to an internal API to check setup status
        const setupResponse = await fetch(`${request.nextUrl.origin}/api/setup-status`, { cache: 'no-store' });
        const { isComplete } = await setupResponse.json();

        // 1. Setup logic
        if (isComplete && pathname === '/setup') {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        if (!isComplete && pathname !== '/setup') {
            return NextResponse.redirect(new URL('/setup', request.url));
        }

        if (pathname === "/") {
            return NextResponse.redirect(new URL(isComplete ? '/dashboard' : '/setup', request.url));
        }

        // 2. Auth logic
        if (isComplete) {
            if (session && pathname === '/auth') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            if (!session && pathname.startsWith('/dashboard')) {
                return NextResponse.redirect(new URL('/auth', request.url));
            }

            // 3. Role-based access control
            if (session && pathname === '/dashboard/settings') {
                const role = (session.user as { role?: string }).role;
                if (role === 'admin') {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }
        }

    } catch (e) {
        console.error("Middleware check failed", e);
    }


    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
