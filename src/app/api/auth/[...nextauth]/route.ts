import { handlers } from "@/lib/auth"

// Auth.js's database session strategy needs a real Prisma/Postgres
// connection — force the Node.js runtime so this never gets pushed to Edge.
export const runtime = "nodejs"

export const { GET, POST } = handlers
