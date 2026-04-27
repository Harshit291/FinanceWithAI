/**
 * LLM adapter — all Claude calls go through here. Model IDs are read from env,
 * never hardcoded. Session 2 will wire the real Anthropic SDK; for now, the
 * synthesis function returns a mocked VerdictReport.
 */
import type { VerdictReport } from "./schema";
import { MOCK_VERDICT } from "./mock-verdict";

const SYNTHESIS_MODEL = process.env.LLM_SYNTHESIS_MODEL ?? "claude-opus-4-7";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in session 2
const CLASSIFIER_MODEL = process.env.LLM_CLASSIFIER_MODEL ?? "claude-haiku-4-5";

/** Synthesise a verdict for the given symbol. Returns a mock in session 1. */
export async function synthesiseVerdict(symbol: string): Promise<VerdictReport> {
  // TODO(session-2): replace with real Anthropic SDK call using SYNTHESIS_MODEL
  void SYNTHESIS_MODEL;
  return { ...MOCK_VERDICT, symbol, as_of: new Date().toISOString() };
}
