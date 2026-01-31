
export async function verifySession(requestHeaders: Record<string, string | undefined>) {
    const authHeader = requestHeaders['authorization'];
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');

    try {
        const response = await fetch('http://localhost:3000/api/auth/get-session', {
            headers: {
                cookie: requestHeaders['cookie'] || '',
                authorization: authHeader
            }
        });

        if (!response.ok) return null;

        const session = await response.json();
        if (!session || !session.user) return null;

        return {
            userId: session.user.id,
            companyId: session.user.companyId || session.user.id, // Fallback to userId if companyId not set
            role: session.user.role
        };
    } catch (e) {
        return null;
    }
}
