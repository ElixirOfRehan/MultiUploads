import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommon from "@zxcvbn-ts/language-common";
import * as zxcvbnEn from "@zxcvbn-ts/language-en";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  zxcvbnOptions.setOptions({
    translations: zxcvbnEn.translations,
    graphs: zxcvbnCommon.adjacencyGraphs,
    dictionary: {
      ...zxcvbnCommon.dictionary,
      ...zxcvbnEn.dictionary,
    },
  });
  configured = true;
}

export const MIN_SCORE = 3;

const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["#ef4444", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

export function evaluatePassword(password, userInputs = []) {
  ensureConfigured();
  const pw = typeof password === "string" ? password : "";
  const inputs = (userInputs || []).filter((v) => typeof v === "string" && v.length > 0);
  const result = zxcvbn(pw, inputs);
  return {
    score: result.score,
    label: LABELS[result.score],
    color: COLORS[result.score],
    ok: result.score >= MIN_SCORE,
    warning: result.feedback.warning || "",
    suggestions: result.feedback.suggestions || [],
  };
}
