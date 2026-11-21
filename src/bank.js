import types from "../data/types.json" with { type: "json" }
import results from "../data/results.json" with { type: "json" }
import visual from "../data/questions/01-visual.json" with { type: "json" }
import logic from "../data/questions/02-logic.json" with { type: "json" }
import ambiguity from "../data/questions/03-ambiguity.json" with { type: "json" }
import counter from "../data/questions/04-counter.json" with { type: "json" }
import code from "../data/questions/05-code.json" with { type: "json" }
import count from "../data/questions/06-count.json" with { type: "json" }
import instruct from "../data/questions/07-instruct.json" with { type: "json" }
import extract from "../data/questions/08-extract.json" with { type: "json" }
import plan from "../data/questions/09-plan.json" with { type: "json" }
import creative from "../data/questions/10-creative.json" with { type: "json" }
import analogy from "../data/questions/11-analogy.json" with { type: "json" }

export const typeList = types
export const typeMap = Object.fromEntries(types.map((type) => [type.id, type]))
export const questions = [
  ...visual,
  ...logic,
  ...ambiguity,
  ...counter,
  ...code,
  ...count,
  ...instruct,
  ...extract,
  ...plan,
  ...creative,
  ...analogy,
]
export const resultBook = results

export function getQuestion(id) {
  return questions.find((question) => question.id === id) || null
}
