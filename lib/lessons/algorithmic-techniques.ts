import type { UsageGuide } from "./foundations.ts";
import type { LessonDefinition, VisualizationStep, VisualItem } from "../visualization/types.ts";

export type TechniqueLessonId =
  | "brute-force"
  | "divide-conquer"
  | "greedy"
  | "memoization"
  | "dynamic-programming"
  | "backtracking"
  | "sliding-window";

export type TechniqueInput = { values: number[]; target: number };

export type TechniqueMeta = Readonly<{
  id: TechniqueLessonId;
  navLabel: string;
  shortLabel: string;
  title: string;
  description: string;
  concept: string;
  rule: string;
  analogy: string;
  valueLabel: string;
  targetLabel: string;
  usesValues: boolean;
  usesTarget: boolean;
  inputHint: string;
  usage: UsageGuide;
}>;

function validateList(values: number[], minimum = 2, maximum = 10) {
  if (values.length < minimum || values.length > maximum) return { valid: false as const, message: `Use ${minimum} to ${maximum} values.` };
  if (!values.every(Number.isInteger)) return { valid: false as const, message: "Use whole numbers only." };
  if (values.some((value) => Math.abs(value) > 99)) return { valid: false as const, message: "Keep each value between −99 and 99." };
  return { valid: true as const };
}

function cells(values: number[], active: number[] = [], completed: number[] = [], muted: number[] = [], labels: string[] = []): VisualItem[] {
  return values.map((value, index) => ({
    id: `technique-${index}`,
    value,
    label: labels[index] ?? `index ${index}`,
    state: active.includes(index) ? "active" : completed.includes(index) ? "completed" : muted.includes(index) ? "muted" : "idle",
  }));
}

function recursionItems(frames: Array<{ value: string; label: string }>, completed = false): VisualItem[] {
  return frames.map((frame, index) => ({ id: `call-${index}`, value: frame.value, label: frame.label, state: completed ? "completed" : index === frames.length - 1 ? "active" : "idle" }));
}

export const bruteForceLesson: LessonDefinition<TechniqueInput> = {
  id: "brute-force", title: "Brute-force pair sum", category: "algorithm",
  code: ["def pair_sum(items, target):", "    for left in range(len(items)):", "        for right in range(left + 1, len(items)):", "            if items[left] + items[right] == target:", "                return (left, right)", "    return None"],
  validate: ({ values, target }) => Number.isInteger(target) ? validateList(values) : { valid: false, message: "The target must be a whole number." },
  createSteps: ({ values, target }) => {
    const steps: VisualizationStep[] = [{ id: "brute-0", operation: "list-candidates", explanation: `There are ${values.length * (values.length - 1) / 2} possible pairs. Brute force checks them systematically.`, codeLine: 0, frame: { layout: "array", items: cells(values), caption: `Find any pair totaling ${target}`, output: [`PAIRS=${values.length * (values.length - 1) / 2}`] } }];
    let checked = 0;
    for (let left = 0; left < values.length; left += 1) for (let right = left + 1; right < values.length; right += 1) {
      checked += 1; const sum = values[left] + values[right]; const found = sum === target;
      steps.push({ id: `brute-${checked}`, operation: found ? "solution-found" : "try-candidate", explanation: `${values[left]} + ${values[right]} = ${sum}. ${found ? "This pair reaches the target, so the search can stop." : "It does not match, so try the next pair."}`, codeLine: found ? 4 : 3, frame: { layout: "array", items: cells(values, [left, right], found ? [left, right] : []), pointers: [{ id: "left", label: "LEFT", itemId: `technique-${left}` }, { id: "right", label: "RIGHT", itemId: `technique-${right}` }], caption: `Candidate ${checked}: ${sum} ${found ? "= target" : "≠ target"}`, output: found ? [`PAIR=${values[left]}+${values[right]}`, `CHECKS=${checked}`] : [`SUM=${sum}`, `CHECKS=${checked}`] } });
      if (found) return steps;
    }
    steps.push({ id: "brute-missing", operation: "no-solution", explanation: "Every possible pair was checked and none reached the target.", codeLine: 5, frame: { layout: "array", items: cells(values, [], [], values.map((_, index) => index)), caption: "No matching pair", output: ["PAIR=None", `CHECKS=${checked}`] } }); return steps;
  },
};

export const divideConquerLesson: LessonDefinition<TechniqueInput> = {
  id: "divide-conquer", title: "Divide-and-conquer maximum", category: "algorithm",
  code: ["def find_max(items, left, right):", "    if left == right:", "        return items[left]", "    middle = (left + right) // 2", "    left_max = find_max(items, left, middle)", "    right_max = find_max(items, middle + 1, right)", "    return max(left_max, right_max)"],
  validate: ({ values }) => validateList(values),
  createSteps: ({ values }) => {
    const steps: VisualizationStep[] = []; const stack: Array<{ value: string; label: string }> = []; let sequence = 0;
    const solve = (left: number, right: number): number => {
      stack.push({ value: `[${values.slice(left, right + 1).join(", ")}]`, label: `range ${left}–${right}` });
      steps.push({ id: `divide-${sequence++}`, operation: left === right ? "base-case" : "divide-range", explanation: left === right ? `A one-value range is a base case, so it returns ${values[left]}.` : `Split range ${left}–${right} into two smaller independent ranges.`, codeLine: left === right ? 2 : 3, frame: { layout: "recursion", items: recursionItems(stack), caption: left === right ? `Base case returns ${values[left]}` : `Divide range ${left}–${right}`, output: [`DEPTH=${stack.length}`] } });
      if (left === right) { stack.pop(); return values[left]; }
      const middle = Math.floor((left + right) / 2); const leftMax = solve(left, middle); const rightMax = solve(middle + 1, right); const answer = Math.max(leftMax, rightMax);
      steps.push({ id: `divide-${sequence++}`, operation: "combine-results", explanation: `Combine the two answers: max(${leftMax}, ${rightMax}) = ${answer}.`, codeLine: 6, frame: { layout: "recursion", items: recursionItems(stack, left === 0 && right === values.length - 1), caption: `Combine range ${left}–${right}`, output: [`LEFT=${leftMax}`, `RIGHT=${rightMax}`, `MAX=${answer}`] } }); stack.pop(); return answer;
    };
    const result = solve(0, values.length - 1); steps.push({ id: "divide-complete", operation: "problem-complete", explanation: `The smaller answers combine upward into the maximum value, ${result}.`, codeLine: 6, frame: { layout: "array", items: cells(values, [], values.map((_, index) => indexOfFirst(values, result) === index ? index : -1).filter((index) => index >= 0)), caption: `Maximum value: ${result}`, output: [`MAX=${result}`] } }); return steps;
  },
};

function indexOfFirst(values: number[], target: number) { return values.indexOf(target); }

function validateCoins(values: number[], target: number) {
  const list = validateList(values, 1, 8); if (!list.valid) return list;
  if (values.some((value) => value <= 0)) return { valid: false as const, message: "Coin denominations must be positive." };
  if (new Set(values).size !== values.length) return { valid: false as const, message: "Use each denomination once." };
  if (!Number.isInteger(target) || target < 1 || target > 100) return { valid: false as const, message: "Use a target amount from 1 to 100." };
  return { valid: true as const };
}

export const greedyLesson: LessonDefinition<TechniqueInput> = {
  id: "greedy", title: "Greedy coin choice", category: "algorithm",
  code: ["def greedy_change(coins, amount):", "    chosen = []", "    for coin in sorted(coins, reverse=True):", "        while coin <= amount:", "            chosen.append(coin)", "            amount -= coin", "    return chosen if amount == 0 else None"],
  validate: ({ values, target }) => validateCoins(values, target),
  createSteps: ({ values, target }) => {
    const coins = [...values].sort((a, b) => b - a); const chosen: number[] = []; let remaining = target; const steps: VisualizationStep[] = [{ id: "greedy-0", operation: "sort-choices", explanation: "Greedy change starts with the largest denomination and never revisits an earlier decision.", codeLine: 2, frame: { layout: "array-cells", items: cells(coins, [], [], [], coins.map(() => "coin")), caption: `Make ${target} using largest coins first`, output: [`REMAINING=${remaining}`] } }];
    coins.forEach((coin, index) => { const count = Math.floor(remaining / coin); if (count > 0) { remaining -= count * coin; chosen.push(...Array(count).fill(coin)); } steps.push({ id: `greedy-${index + 1}`, operation: count ? "take-best-local-choice" : "skip-too-large", explanation: count ? `${coin} fits ${count} time${count === 1 ? "" : "s"}. Take it now, leaving ${remaining}.` : `${coin} is larger than the remaining ${remaining}, so skip it.`, codeLine: count ? 5 : 3, frame: { layout: "array-cells", items: cells(coins, [index], coins.map((_, i) => i).filter((i) => i < index), [], coins.map((value) => `${value <= remaining + count * coin ? "considered" : "coin"}`)), caption: count ? `Take ${count} × ${coin}` : `Skip ${coin}`, output: [...chosen.map(String), `REMAINING=${remaining}`] } }); });
    steps.push({ id: "greedy-complete", operation: remaining === 0 ? "change-complete" : "greedy-stuck", explanation: remaining === 0 ? `The local choices form ${target} using ${chosen.length} coins. Greedy is optimal only when the coin system has the right structure.` : `Greedy is stuck with remainder ${remaining}. A solution might still exist through different earlier choices.`, codeLine: 6, frame: { layout: "array-cells", items: cells(chosen.length ? chosen : coins, [], remaining === 0 ? chosen.map((_, index) => index) : [], remaining ? coins.map((_, index) => index) : [], (chosen.length ? chosen : coins).map(() => "chosen coin")), caption: remaining === 0 ? `${chosen.length} coins selected` : `No greedy solution · remainder ${remaining}`, output: remaining === 0 ? [...chosen.map(String), `COUNT=${chosen.length}`] : ["NO GREEDY SOLUTION", `REMAINDER=${remaining}`] } }); return steps;
  },
};

export const memoizationLesson: LessonDefinition<TechniqueInput> = {
  id: "memoization", title: "Memoized Fibonacci", category: "algorithm",
  code: ["def fib(n, cache={}):", "    if n in cache:", "        return cache[n]", "    if n < 2:", "        return n", "    cache[n] = fib(n - 1) + fib(n - 2)", "    return cache[n]"],
  validate: ({ target }) => Number.isInteger(target) && target >= 2 && target <= 10 ? { valid: true } : { valid: false, message: "Use n from 2 to 10." },
  createSteps: ({ target }) => {
    const cache = new Map<number, number>(); const stack: number[] = []; const steps: VisualizationStep[] = []; let sequence = 0;
    const fib = (n: number): number => { stack.push(n); steps.push({ id: `memo-${sequence++}`, operation: cache.has(n) ? "cache-hit" : "call-subproblem", explanation: cache.has(n) ? `fib(${n}) is already cached as ${cache.get(n)}. Reuse it without another subtree.` : `Ask for fib(${n}). ${n < 2 ? "This is a base case." : "Its answer depends on two smaller subproblems."}`, codeLine: cache.has(n) ? 2 : n < 2 ? 4 : 5, frame: { layout: "recursion", items: recursionItems(stack.map((value) => ({ value: `fib(${value})`, label: cache.has(value) ? `cached ${cache.get(value)}` : "waiting" }))), caption: cache.has(n) ? `Cache hit: fib(${n})` : `Call fib(${n})`, output: [...cache.entries()].map(([key, value]) => `${key}→${value}`) } }); if (cache.has(n)) { stack.pop(); return cache.get(n)!; } if (n < 2) { cache.set(n, n); stack.pop(); return n; } const answer = fib(n - 1) + fib(n - 2); cache.set(n, answer); steps.push({ id: `memo-${sequence++}`, operation: "store-answer", explanation: `Store fib(${n}) = ${answer}. Any later request for ${n} becomes a constant-time lookup.`, codeLine: 5, frame: { layout: "recursion", items: recursionItems(stack.map((value) => ({ value: `fib(${value})`, label: value === n ? `store ${answer}` : "waiting" }))), caption: `Cache fib(${n}) = ${answer}`, output: [...cache.entries()].map(([key, value]) => `${key}→${value}`) } }); stack.pop(); return answer; };
    const answer = fib(target); steps.push({ id: "memo-complete", operation: "memoized-result", explanation: `fib(${target}) = ${answer}. Each distinct n was fully solved only once.`, codeLine: 6, frame: { layout: "array-cells", items: [...cache.entries()].sort((a, b) => a[0] - b[0]).map(([key, value]) => ({ id: `cache-${key}`, value, label: `fib(${key})`, state: "completed" as const })), caption: "Completed memoization cache", output: [`FIB(${target})=${answer}`, `STATES=${cache.size}`] } }); return steps;
  },
};

export const dynamicProgrammingLesson: LessonDefinition<TechniqueInput> = {
  id: "dynamic-programming", title: "Dynamic-programming coin change", category: "algorithm",
  code: ["def min_coins(coins, amount):", "    dp = [0] + [inf] * amount", "    for total in range(1, amount + 1):", "        for coin in coins:", "            if coin <= total:", "                dp[total] = min(dp[total], dp[total-coin] + 1)", "    return dp[amount]"],
  validate: ({ values, target }) => {
    if (!Number.isInteger(target) || target < 1 || target > 30) return { valid: false, message: "Use a target amount from 1 to 30." };
    return validateCoins(values, target);
  },
  createSteps: ({ values, target }) => {
    const dp = Array(target + 1).fill(Infinity) as number[]; dp[0] = 0; const steps: VisualizationStep[] = [{ id: "dp-0", operation: "define-base-case", explanation: "Amount 0 needs 0 coins. Every larger amount starts as unknown.", codeLine: 1, frame: { layout: "array-cells", items: dp.map((value, amount) => ({ id: `dp-${amount}`, value: Number.isFinite(value) ? value : "∞", label: `amount ${amount}`, state: amount === 0 ? "completed" : "idle" })), caption: "dp[amount] = fewest coins", output: ["dp[0]=0"] } }];
    for (let amount = 1; amount <= target; amount += 1) { let bestCoin: number | null = null; for (const coin of values) if (coin <= amount && Number.isFinite(dp[amount - coin]) && dp[amount - coin] + 1 < dp[amount]) { dp[amount] = dp[amount - coin] + 1; bestCoin = coin; } steps.push({ id: `dp-${amount}`, operation: Number.isFinite(dp[amount]) ? "solve-subproblem" : "unreachable-subproblem", explanation: Number.isFinite(dp[amount]) ? `For amount ${amount}, coin ${bestCoin} extends the solved amount ${amount - bestCoin!}. Best count: ${dp[amount]}.` : `No coin can build amount ${amount} from a previously solved amount.`, codeLine: Number.isFinite(dp[amount]) ? 5 : 4, frame: { layout: "array-cells", items: dp.map((value, index) => ({ id: `dp-${index}`, value: Number.isFinite(value) ? value : "∞", label: `amount ${index}`, state: index === amount ? "active" : index < amount ? "completed" : "idle" })), caption: `Solve amount ${amount} from smaller answers`, output: [`BEST=${Number.isFinite(dp[amount]) ? dp[amount] : "∞"}`, bestCoin ? `LAST COIN=${bestCoin}` : "UNREACHABLE"] } }); }
    steps.push({ id: "dp-complete", operation: "table-complete", explanation: Number.isFinite(dp[target]) ? `The final table entry proves ${target} needs at least ${dp[target]} coins.` : `${target} cannot be formed from these denominations.`, codeLine: 6, frame: { layout: "array-cells", items: dp.map((value, amount) => ({ id: `dp-${amount}`, value: Number.isFinite(value) ? value : "∞", label: `amount ${amount}`, state: "completed" })), caption: `Minimum coins for ${target}: ${Number.isFinite(dp[target]) ? dp[target] : "impossible"}`, output: [`MIN COINS=${Number.isFinite(dp[target]) ? dp[target] : "∞"}`] } }); return steps;
  },
};

export const backtrackingLesson: LessonDefinition<TechniqueInput> = {
  id: "backtracking", title: "Backtracking subset sum", category: "algorithm",
  code: ["def subset_sum(items, target, index=0, chosen=[]):", "    if sum(chosen) == target:", "        return chosen", "    if index == len(items) or sum(chosen) > target:", "        return None", "    take = subset_sum(items, target, index + 1, chosen + [items[index]])", "    if take: return take", "    return subset_sum(items, target, index + 1, chosen)"],
  validate: ({ values, target }) => { const list = validateList(values, 2, 8); if (!list.valid) return list; if (values.some((value) => value <= 0)) return { valid: false, message: "Use positive values so pruning is easy to see." }; return Number.isInteger(target) && target > 0 && target <= 100 ? { valid: true } : { valid: false, message: "Use a target from 1 to 100." }; },
  createSteps: ({ values, target }) => {
    const steps: VisualizationStep[] = []; const stack: Array<{ value: string; label: string }> = []; let sequence = 0; const result = { solution: null as number[] | null };
    const search = (index: number, chosen: number[]): boolean => { const total = chosen.reduce((sum, value) => sum + value, 0); stack.push({ value: `[${chosen.join(", ") || "empty"}]`, label: `sum ${total} · next ${index}` }); steps.push({ id: `backtrack-${sequence++}`, operation: total === target ? "solution-found" : index === values.length || total > target ? "prune-branch" : "choose-or-skip", explanation: total === target ? `The chosen values total ${target}; this branch is a solution.` : total > target ? `The total ${total} is already too large. Undo the latest choice.` : index === values.length ? "No values remain and the target was not reached. Backtrack." : `At ${values[index]}, first try including it. If that branch fails, undo and skip it.`, codeLine: total === target ? 2 : index === values.length || total > target ? 4 : 5, frame: { layout: "recursion", items: recursionItems(stack), caption: total === target ? "Solution found" : total > target || index === values.length ? "Dead end · backtrack" : `Decision: include or skip ${values[index]}`, output: [...chosen.map(String), `SUM=${total}`, `TARGET=${target}`] } }); if (total === target) { result.solution = [...chosen]; stack.pop(); return true; } if (index === values.length || total > target) { stack.pop(); return false; } if (search(index + 1, [...chosen, values[index]])) { stack.pop(); return true; } steps.push({ id: `backtrack-${sequence++}`, operation: "undo-choice", explanation: `The branch including ${values[index]} failed. Remove it and explore the skip branch.`, codeLine: 7, frame: { layout: "recursion", items: recursionItems(stack), caption: `Undo ${values[index]} · try skip`, output: [...chosen.map(String), `SUM=${total}`] } }); const found = search(index + 1, chosen); stack.pop(); return found; };
    search(0, []); const solution = result.solution; steps.push({ id: "backtrack-complete", operation: solution ? "search-complete" : "no-solution", explanation: solution ? `Backtracking found [${solution.join(", ")}] with sum ${target}. Unexplored branches are unnecessary.` : "Every include/skip branch was exhausted without reaching the target.", codeLine: solution ? 2 : 7, frame: { layout: "array", items: cells(values, [], solution ? values.map((value, index) => solution.includes(value) ? index : -1).filter((index) => index >= 0) : [], solution ? [] : values.map((_, index) => index)), caption: solution ? `Subset found: ${solution.join(" + ")} = ${target}` : "No subset reaches the target", output: [solution ? `SUBSET=${solution.join("+")}` : "SUBSET=None"] } }); return steps;
  },
};

export const slidingWindowLesson: LessonDefinition<TechniqueInput> = {
  id: "sliding-window", title: "Fixed sliding window", category: "algorithm",
  code: ["def max_window_sum(items, size):", "    current = sum(items[:size])", "    best = current", "    for right in range(size, len(items)):", "        current += items[right]", "        current -= items[right - size]", "        best = max(best, current)", "    return best"],
  validate: ({ values, target }) => { const list = validateList(values, 2, 12); if (!list.valid) return list; return Number.isInteger(target) && target >= 1 && target <= values.length ? { valid: true } : { valid: false, message: "Window size must be from 1 to the number of values." }; },
  createSteps: ({ values, target: size }) => {
    let current = values.slice(0, size).reduce((sum, value) => sum + value, 0); let best = current; let bestStart = 0; const steps: VisualizationStep[] = [{ id: "window-0", operation: "build-first-window", explanation: `Add the first ${size} values once. This is the starting window sum, ${current}.`, codeLine: 1, frame: { layout: "array", items: cells(values, values.map((_, index) => index).filter((index) => index < size)), pointers: [{ id: "left", label: "WINDOW START", itemId: "technique-0" }, { id: "right", label: "WINDOW END", itemId: `technique-${size - 1}` }], caption: `Window 0–${size - 1} · sum ${current}`, output: [`CURRENT=${current}`, `BEST=${best}`] } }];
    for (let right = size; right < values.length; right += 1) { const leaving = right - size; current += values[right] - values[leaving]; if (current > best) { best = current; bestStart = leaving + 1; } const windowIndices = values.map((_, index) => index).filter((index) => index > leaving && index <= right); steps.push({ id: `window-${right}`, operation: "slide-window", explanation: `Remove ${values[leaving]}, add ${values[right]}; the new sum is ${current}. ${current === best && bestStart === leaving + 1 ? "This is the best window so far." : `Keep the best sum ${best}.`}`, codeLine: 6, frame: { layout: "array", items: cells(values, windowIndices, current === best && bestStart === leaving + 1 ? windowIndices : [], [leaving]), pointers: [{ id: "left", label: "WINDOW START", itemId: `technique-${leaving + 1}` }, { id: "right", label: "WINDOW END", itemId: `technique-${right}` }], caption: `Window ${leaving + 1}–${right} · sum ${current}`, output: [`−${values[leaving]}`, `+${values[right]}`, `CURRENT=${current}`, `BEST=${best}`] } }); }
    const winners = values.map((_, index) => index).filter((index) => index >= bestStart && index < bestStart + size); steps.push({ id: "window-complete", operation: "best-window", explanation: `The best length-${size} window is indices ${bestStart}–${bestStart + size - 1}, with sum ${best}.`, codeLine: 7, frame: { layout: "array", items: cells(values, [], winners, values.map((_, index) => index).filter((index) => !winners.includes(index))), caption: `Maximum window sum: ${best}`, output: [`RANGE=${bestStart}..${bestStart + size - 1}`, `MAX SUM=${best}`] } }); return steps;
  },
};

const usage = (summary: string, examples: string[], chooseWhen: string, avoidWhen: string, operations: [string, string][], practice: string): UsageGuide => ({ summary, examples, chooseWhen, avoidWhen, operations: operations.map(([name, cost]) => ({ name, cost })), practice });

export const techniqueMeta: Record<TechniqueLessonId, TechniqueMeta> = {
  "brute-force": { id: "brute-force", navLabel: "Brute Force", shortLabel: "BF", title: "Brute Force: Try Every Pair", description: "Build a correct baseline by checking every candidate before looking for a shortcut.", concept: "Enumerate the complete solution space systematically.", rule: "simple · complete · often slow", analogy: "trying every key on a key ring", valueLabel: "Values", targetLabel: "Pair target", usesValues: true, usesTarget: true, inputHint: "Try a target that appears late", usage: usage("Brute force is the clearest dependable baseline and a useful correctness reference.", ["Tiny search spaces", "Test oracles", "Password-space demonstrations"], "The input is small or no exploitable structure is known.", "The candidate space grows combinatorially or a known faster method applies.", [["Pairs", "O(n²)"], ["Space", "O(1)"], ["Coverage", "complete"]], "Count the pairs for n values before running the lesson.") },
  "divide-conquer": { id: "divide-conquer", navLabel: "Divide & Conquer", shortLabel: "½", title: "Divide and Conquer: Find a Maximum", description: "Split one problem into independent halves, solve each half, and combine their answers.", concept: "Small subproblems make the original problem manageable.", rule: "divide · solve · combine", analogy: "two teams searching separate rooms", valueLabel: "Values", targetLabel: "Unused", usesValues: true, usesTarget: false, inputHint: "Uneven list lengths show the splits", usage: usage("Divide and conquer works when smaller independent instances combine cleanly.", ["Merge Sort", "Binary Search", "Closest-pair geometry"], "Subproblems are similar, mostly independent, and cheap to combine.", "Subproblems overlap heavily; dynamic programming may avoid repeated work.", [["Levels", "O(log n)"], ["This example", "O(n)"], ["Stack", "O(log n)"]], "Draw the recursion tree and label work at each level.") },
  greedy: { id: "greedy", navLabel: "Greedy Choice", shortLabel: "G", title: "Greedy: Choose the Best Coin Now", description: "Take the locally strongest choice and see why proof—not intuition—decides whether greedy is optimal.", concept: "Commit to one local choice without exploring alternatives.", rule: "fast when greedy-choice property holds", analogy: "always taking the largest fitting banknote", valueLabel: "Coin denominations", targetLabel: "Amount", usesValues: true, usesTarget: true, inputHint: "Try 1, 3, 4 with amount 6", usage: usage("Greedy algorithms are fast and simple when local optimal choices provably compose into a global optimum.", ["Activity selection", "Huffman coding", "Minimum spanning trees"], "The problem has optimal substructure and a proven greedy-choice property.", "A locally attractive choice can block a better later combination.", [["Sort", "O(n log n)*"], ["Scan", "O(n)"], ["Backtrack", "never"]], "Use coins 1, 3, 4 for amount 6 and compare with DP.") },
  memoization: { id: "memoization", navLabel: "Memoization", shortLabel: "M", title: "Memoization: Remember Fibonacci", description: "Cache recursive answers so repeated subproblems become instant lookups instead of repeated trees.", concept: "Compute each distinct state once, then reuse it.", rule: "top-down recursion + cache", analogy: "writing an answer on a reusable note", valueLabel: "Unused", targetLabel: "Fibonacci n", usesValues: false, usesTarget: true, inputHint: "Use n from 2 to 10", usage: usage("Memoization preserves a natural recursive solution while eliminating repeated subproblem work.", ["Recursive parsers", "Game-state search", "Sequence recurrences"], "Only part of the state space may be needed and recursion expresses the problem clearly.", "Recursion depth is unsafe or every state will be needed in a simple order.", [["Fib time", "O(n)"], ["Cache", "O(n)"], ["Cache hit", "O(1)"]], "Compare the number of calls with uncached Fibonacci.") },
  "dynamic-programming": { id: "dynamic-programming", navLabel: "Dynamic Programming", shortLabel: "DP", title: "Dynamic Programming: Minimum Coins", description: "Solve amounts from small to large and preserve each best answer for the next amounts.", concept: "Store overlapping subproblem answers in a table.", rule: "state · transition · base case", analogy: "filling a reference table one row at a time", valueLabel: "Coin denominations", targetLabel: "Amount", usesValues: true, usesTarget: true, inputHint: "Amount is limited to 30", usage: usage("Dynamic programming turns repeated overlapping work into a table of reusable optimal answers.", ["Knapsack", "Edit distance", "Sequence alignment"], "The problem has overlapping subproblems and optimal substructure.", "States cannot be defined compactly or a greedy proof gives a simpler solution.", [["Time", "O(amount·coins)"], ["Space", "O(amount)"], ["State", "one amount"]], "Write the transition before filling the table.") },
  backtracking: { id: "backtracking", navLabel: "Backtracking", shortLabel: "↩", title: "Backtracking: Build a Target Subset", description: "Make a choice, explore its consequences, then undo it when the branch cannot work.", concept: "Search a decision tree while pruning dead ends.", rule: "choose · explore · undo", analogy: "walking a maze and returning from dead ends", valueLabel: "Positive values", targetLabel: "Subset target", usesValues: true, usesTarget: true, inputHint: "Up to 8 positive values", usage: usage("Backtracking is a structured exhaustive search that abandons partial candidates as soon as they cannot succeed.", ["Sudoku", "N-Queens", "Constraint assignments"], "Solutions are combinations or arrangements and invalid partial choices are detectable early.", "The search space is enormous and pruning rules are weak.", [["Worst time", "O(2ⁿ)"], ["Stack", "O(n)"], ["Undo", "O(1)*"]], "State exactly what makes a partial solution impossible.") },
  "sliding-window": { id: "sliding-window", navLabel: "Sliding Window", shortLabel: "▣", title: "Sliding Window: Reuse a Running Sum", description: "Move a fixed-size range by removing one outgoing value and adding one incoming value.", concept: "Reuse almost all work from the previous contiguous range.", rule: "subtract left · add right", analogy: "moving a camera frame across a landscape", valueLabel: "Values", targetLabel: "Window size", usesValues: true, usesTarget: true, inputHint: "Size must fit the list", usage: usage("Sliding windows make contiguous range calculations efficient by updating instead of recomputing.", ["Moving averages", "Traffic-rate monitoring", "Substring analysis"], "Candidate ranges are contiguous and neighboring ranges overlap heavily.", "Selections are non-contiguous or the update cannot be maintained incrementally.", [["Time", "O(n)"], ["Space", "O(1)"], ["Each slide", "O(1)"]], "Derive the new sum from the old sum without adding the full window.") },
};
