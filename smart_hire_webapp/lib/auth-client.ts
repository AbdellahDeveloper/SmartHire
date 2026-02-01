import { createAuthClient } from "better-auth/react";
console.log(process.env.BETTER_AUTH_URL);

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL ,
});

export const { useSession, signIn, signOut, signUp } = authClient;
