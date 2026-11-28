import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const runs = await db.selectFrom("researchRuns").select(["id", "goal", "depth", "title", "summary", "createdAt"]).where("userId", "=", String(user.id)).orderBy("createdAt", "desc").limit(30).execute();
    return new Response(superjson.stringify({ runs }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Please sign in." }), { status: 401, headers: { "Content-Type": "application/json" } });
    console.error("Research history error:", error);
    return new Response(superjson.stringify({ error: "Unable to load research history." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
