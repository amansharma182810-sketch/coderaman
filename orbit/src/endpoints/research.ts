import { schema, type OutputType } from "./research_POST.schema";
import superjson from "superjson";
import { db } from "../helpers/db";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";

const MODEL = "gpt-6.2-astra";

type OpenAIAnnotation = { type?: string; url?: string; title?: string };
type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; annotations?: OpenAIAnnotation[] }> }>;
  error?: { message?: string };
};

async function callOpenAI(args: { instructions: string; input: string; max_output_tokens: number; webSearch?: boolean }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not connected. Configure OPENAI_API_KEY as a server-side secret.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "medium" },
      instructions: args.instructions,
      input: args.input,
      max_output_tokens: args.max_output_tokens,
      ...(args.webSearch ? { tools: [{ type: "web_search", search_context_size: "high" }], tool_choice: "required" } : {}),
    }),
  });
  const data = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(data.error?.message || `OpenAI API request failed (${response.status}).`);
  const outputText = data.output_text?.trim() || "";
  if (!outputText) throw new Error("OpenAI returned an empty response.");
  return { outputText, output: data.output ?? [] };
}

function extractBlock(text: string, tag: string) {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}
function parseSections(text: string) {
  const matches = [...text.matchAll(new RegExp('<SECTION title="([^"]+)">([^]*?)</SECTION>', "gi"))];
  return matches.map((m) => ({ heading: m[1].trim(), body: m[2].trim() })).filter((s) => s.heading && s.body);
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await request.text()));
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRuns = await db.selectFrom("researchRuns").select("id").where("userId", "=", String(user.id)).where("createdAt", ">", hourAgo).limit(5).execute();
    if (recentRuns.length >= 5) return new Response(superjson.stringify({ error: "Research limit reached: up to 5 completed runs per hour per account." }), { status: 429, headers: { "Content-Type": "application/json" } });

    const depthInstruction = input.depth === "Quick"
      ? "Keep the research concise and focus on the highest-signal findings."
      : input.depth === "Deep dive"
        ? "Conduct a thorough investigation, compare competing evidence, and include nuanced trade-offs."
        : "Provide a balanced investigation with enough evidence to support decisions.";

    const plan = await callOpenAI({
      instructions: "You are ORBIT Planner. Create a compact research plan with 4-6 specific questions, search angles, and evidence criteria. Do not answer the objective yet.",
      input: `Research objective: ${input.goal}\nDepth: ${input.depth}\n${depthInstruction}`,
      max_output_tokens: 900,
    });
    const research = await callOpenAI({
      instructions: "You are ORBIT Researcher. Investigate using live web search. Prefer primary sources, official documentation, peer-reviewed work, and reputable reporting. Compare evidence, note dates and uncertainty, and never invent sources. Support factual claims with web-search citations.",
      input: `OBJECTIVE\n${input.goal}\n\nRESEARCH PLAN\n${plan.outputText}\n\nDEPTH\n${depthInstruction}\n\nSearch the live web and cite sources.`,
      max_output_tokens: input.depth === "Deep dive" ? 5000 : 3200,
      webSearch: true,
    });
    const analysis = await callOpenAI({
      instructions: "You are ORBIT Analyst. Compare source quality, corroboration and contradictions; distinguish facts from interpretation; produce confidence labels and open questions. Do not invent facts or sources.",
      input: `OBJECTIVE\n${input.goal}\n\nRESEARCH PLAN\n${plan.outputText}\n\nRESEARCH EVIDENCE\n${research.outputText}\n\nDEPTH\n${depthInstruction}`,
      max_output_tokens: input.depth === "Deep dive" ? 3000 : 1800,
    });
    const writer = await callOpenAI({
      instructions: 'You are ORBIT Report Writer. Synthesize only supplied evidence and analyst assessment. Do not add facts or sources. Clearly state uncertainty. Output exactly: <TITLE>title</TITLE><SUMMARY>one paragraph</SUMMARY><SECTION title="Executive summary">...</SECTION><SECTION title="Key findings">...</SECTION><SECTION title="Evidence and implications">...</SECTION><SECTION title="Risks and open questions">...</SECTION><SECTION title="Conclusion">...</SECTION>.',
      input: `OBJECTIVE\n${input.goal}\n\nRESEARCH PLAN\n${plan.outputText}\n\nRESEARCH EVIDENCE\n${research.outputText}\n\nANALYST ASSESSMENT\n${analysis.outputText}\n\nDEPTH\n${depthInstruction}`,
      max_output_tokens: input.depth === "Deep dive" ? 4500 : 3000,
    });

    const title = extractBlock(writer.outputText, "TITLE") || `Research brief: ${input.goal.slice(0, 72)}`;
    const summary = extractBlock(writer.outputText, "SUMMARY") || "Summary unavailable.";
    const sections = parseSections(writer.outputText);
    if (!sections.length) throw new Error("The report writer returned an unexpected format.");

    const seen = new Set<string>();
    const sources: OutputType["report"]["sources"] = [];
    for (const item of research.output) {
      if (item.type !== "message") continue;
      for (const part of item.content ?? []) {
        if (part.type !== "output_text") continue;
        for (const annotation of part.annotations ?? []) {
          if (annotation.type !== "url_citation" || !annotation.url || seen.has(annotation.url)) continue;
          seen.add(annotation.url);
          sources.push({ title: annotation.title || annotation.url, url: annotation.url, note: "Web source cited during research" });
        }
      }
    }
    if (!sources.length) throw new Error("No verifiable web citations were returned; refusing to save an uncited report.");
    const report: OutputType["report"] = { title, summary, sections, sources };
    await db.insertInto("researchRuns").values({ userId: user.id, goal: input.goal, depth: input.depth, title, summary, sections: sections as any, sources: sources as any }).execute();
    return new Response(superjson.stringify({ report } satisfies OutputType), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return new Response(superjson.stringify({ error: "Please sign in to run research." }), { status: 401, headers: { "Content-Type": "application/json" } });
    const message = error instanceof Error ? error.message : "Research failed unexpectedly.";
    const status = message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expected") ? 400 : 500;
    return new Response(superjson.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });
  }
}
