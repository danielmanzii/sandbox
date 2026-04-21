// Auth stub. Returns the mock current user so the app can run end-to-end
// without real auth wired up yet.
//
// When we're ready for real auth:
//   1. `npm i @clerk/nextjs` inside /web
//   2. Add the Clerk keys to .env.local (see .env.example at repo root)
//   3. Wrap <ClerkProvider> around the app in src/app/layout.tsx
//   4. Add middleware.ts at src/middleware.ts using clerkMiddleware()
//   5. Replace this function with:
//        import { currentUser } from "@clerk/nextjs/server";
//        export async function getCurrentUser() { return currentUser(); }
//
// Until then, every screen gets the same mock user — which is fine for
// building out the UI layer.

import { MOCK_USER, type User } from "./mock-data";

export function getCurrentUser(): User {
  return MOCK_USER;
}
