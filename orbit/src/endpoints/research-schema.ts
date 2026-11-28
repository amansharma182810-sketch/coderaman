import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ goal: z.string().trim().min(8).max(1200), depth: z.enum(["Quick", "Standard", "Deep dive"]).default("Standard") });
export type InputType = z.infer<typeof schema>;
export type OutputType = { report: { title: string; summary: string; sections: { heading: string; body: string }[]; sources: { title: string; url: string; note: string }[] } };
export const postResearch = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
 const input = schema.parse(body);
 const response = await fetch("/_api/research", { method: "POST", body: superjson.stringify(input), ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
 if (!response.ok) { const error = superjson.parse<{ error: string }>(await response.text()); throw new Error(error.error); }
 return superjson.parse<OutputType>(await response.text());
};
