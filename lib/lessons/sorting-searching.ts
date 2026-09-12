import type { UsageGuide } from "./foundations.ts";
import type { LessonDefinition, VisualizationStep, VisualItem } from "../visualization/types.ts";

export type AlgorithmLessonId =
  | "linear-search" | "binary-search" | "bubble-sort" | "selection-sort"
  | "insertion-sort" | "merge-sort" | "quick-sort" | "heap-sort"
  | "counting-sort" | "radix-sort";

export type NumberListInput = { values: number[] };
export type SearchInput = NumberListInput & { target: number };

export type AlgorithmMeta = Readonly<{
  id: AlgorithmLessonId;
  navLabel: string;
  shortLabel: string;
  title: string;
  description: string;
  concept: string;
  rule: string;
  analogy: string;
  inputHint: string;
  usage: UsageGuide;
}>;

function validateValues(values: number[], special?: "nonnegative" | "small-range") {
  if (values.length < 2 || values.length > 12) return { valid: false as const, message: "Use 2 to 12 values." };
  if (!values.every(Number.isInteger)) return { valid: false as const, message: "Use whole numbers only." };
  if (special === "nonnegative" && values.some((value) => value < 0 || value > 999)) return { valid: false as const, message: "Radix Sort uses values from 0 to 999 here." };
  if (special === "small-range" && values.some((value) => value < 0 || value > 20)) return { valid: false as const, message: "Counting Sort uses values from 0 to 20 here." };
  return { valid: true as const };
}

function arrayItems(values: number[], active: number[] = [], completed: number[] = [], muted: number[] = []): VisualItem[] {
  return values.map((value, index) => ({
    id: `array-${index}`, value, label: `index ${index}`,
    state: active.includes(index) ? "active" : completed.includes(index) ? "completed" : muted.includes(index) ? "muted" : "idle",
  }));
}

function listLesson(
  id: string,
  title: string,
  code: readonly string[],
  createSteps: (input: NumberListInput) => VisualizationStep[],
  special?: "nonnegative" | "small-range",
): LessonDefinition<NumberListInput> {
  return { id, title, category: "algorithm", code, validate: ({ values }) => validateValues(values, special), createSteps };
}

function stepBuilder(prefix: string, values: number[]) {
  const steps: VisualizationStep[] = [];
  let sequence = 0;
  const add = (operation: string, explanation: string, codeLine: number, active: number[] = [], completed: number[] = [], muted: number[] = [], caption?: string) => {
    steps.push({ id: `${prefix}-${sequence++}`, operation, explanation, codeLine, frame: { layout: "array", items: arrayItems(values, active, completed, muted), caption } });
  };
  return { steps, add };
}

export const linearSearchLesson: LessonDefinition<SearchInput> = {
  id: "linear-search", title: "Linear Search", category: "algorithm",
  code: ["def linear_search(items, target):", "    for index, value in enumerate(items):", "        if value == target:", "            return index", "    return -1"],
  validate: ({ values, target }) => Number.isInteger(target) ? validateValues(values) : { valid: false, message: "The target must be a whole number." },
  createSteps: ({ values, target }) => {
    const steps: VisualizationStep[] = [{ id: "linear-0", operation: "start", explanation: `Start at index 0 and inspect each value until ${target} is found.`, codeLine: 0, frame: { layout: "array", items: arrayItems(values), caption: `Target: ${target}` } }];
    const checked: number[] = [];
    for (let index = 0; index < values.length; index += 1) {
      steps.push({ id: `linear-check-${index}`, operation: "compare", explanation: `Is ${values[index]} equal to ${target}?`, codeLine: 2, frame: { layout: "array", items: arrayItems(values, [index], [], checked), caption: `Checking index ${index}` } });
      if (values[index] === target) {
        steps.push({ id: "linear-found", operation: "found", explanation: `Yes. Return index ${index}; the search can stop.`, codeLine: 3, frame: { layout: "array", items: arrayItems(values, [], [index], checked), caption: `Found ${target} at index ${index}` } });
        return steps;
      }
      checked.push(index);
    }
    steps.push({ id: "linear-missing", operation: "not-found", explanation: `Every value was checked. ${target} is not in the list, so return -1.`, codeLine: 4, frame: { layout: "array", items: arrayItems(values, [], [], checked), caption: "Not found · result -1" } });
    return steps;
  },
};

export const binarySearchLesson: LessonDefinition<SearchInput> = {
  id: "binary-search", title: "Binary Search", category: "algorithm",
  code: ["def binary_search(items, target):", "    left, right = 0, len(items) - 1", "    while left <= right:", "        middle = (left + right) // 2", "        if items[middle] == target:", "            return middle", "        if items[middle] < target:", "            left = middle + 1", "        else:", "            right = middle - 1", "    return -1"],
  validate: ({ values, target }) => {
    const base = Number.isInteger(target) ? validateValues(values) : { valid: false as const, message: "The target must be a whole number." };
    if (!base.valid) return base;
    return values.every((value, index) => index === 0 || values[index - 1] <= value) ? { valid: true } : { valid: false, message: "Binary Search needs values sorted from low to high." };
  },
  createSteps: ({ values, target }) => {
    const steps: VisualizationStep[] = [];
    let left = 0; let right = values.length - 1; let sequence = 0;
    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      const outside = values.map((_, index) => index).filter((index) => index < left || index > right);
      steps.push({ id: `binary-${sequence++}`, operation: "check-middle", explanation: `Search range is ${left}–${right}. Check middle index ${middle}: ${values[middle]}.`, codeLine: 3, frame: { layout: "array", items: arrayItems(values, [middle], [], outside), pointers: [{ id: "left", label: "LEFT", itemId: `array-${left}` }, { id: "middle", label: "MIDDLE", itemId: `array-${middle}` }, { id: "right", label: "RIGHT", itemId: `array-${right}` }], caption: `Target ${target} · remaining range ${left}–${right}` } });
      if (values[middle] === target) {
        steps.push({ id: "binary-found", operation: "found", explanation: `The middle value is ${target}. Return index ${middle}.`, codeLine: 5, frame: { layout: "array", items: arrayItems(values, [], [middle], outside), caption: `Found ${target} at index ${middle}` } });
        return steps;
      }
      if (values[middle] < target) {
        steps.push({ id: `binary-discard-${sequence++}`, operation: "discard-left-half", explanation: `${values[middle]} is too small. Discard it and everything to its left.`, codeLine: 7, frame: { layout: "array", items: arrayItems(values, [], [], values.map((_, i) => i).filter((i) => i <= middle || i > right)), caption: `Move LEFT to ${middle + 1}` } });
        left = middle + 1;
      } else {
        steps.push({ id: `binary-discard-${sequence++}`, operation: "discard-right-half", explanation: `${values[middle]} is too large. Discard it and everything to its right.`, codeLine: 9, frame: { layout: "array", items: arrayItems(values, [], [], values.map((_, i) => i).filter((i) => i < left || i >= middle)), caption: `Move RIGHT to ${middle - 1}` } });
        right = middle - 1;
      }
    }
    steps.push({ id: "binary-missing", operation: "not-found", explanation: "The search range is empty. Return -1.", codeLine: 10, frame: { layout: "array", items: arrayItems(values, [], [], values.map((_, i) => i)), caption: "Not found · result -1" } });
    return steps;
  },
};

export const selectionSortLesson = listLesson("selection-sort", "Selection Sort", [
  "def selection_sort(items):", "    for start in range(len(items)):", "        smallest = start", "        for i in range(start + 1, len(items)):", "            if items[i] < items[smallest]:", "                smallest = i", "        items[start], items[smallest] = items[smallest], items[start]", "    return items",
], ({ values: source }) => {
  const values = [...source]; const { steps, add } = stepBuilder("selection", values); add("start", "Divide the list into a sorted left side and an unsorted right side.", 0);
  for (let start = 0; start < values.length - 1; start += 1) {
    let smallest = start;
    for (let i = start + 1; i < values.length; i += 1) { add("compare", `Compare ${values[i]} with the smallest seen, ${values[smallest]}.`, 4, [smallest, i], values.map((_, x) => x).filter((x) => x < start)); if (values[i] < values[smallest]) { smallest = i; add("new-minimum", `${values[i]} becomes the new smallest candidate.`, 5, [smallest], values.map((_, x) => x).filter((x) => x < start)); } }
    [values[start], values[smallest]] = [values[smallest], values[start]]; add("place-minimum", `Place ${values[start]} at sorted index ${start}.`, 6, [start], values.map((_, x) => x).filter((x) => x <= start));
  }
  add("complete", "Every position now holds the smallest remaining value.", 7, [], values.map((_, i) => i)); return steps;
});

export const insertionSortLesson = listLesson("insertion-sort", "Insertion Sort", [
  "def insertion_sort(items):", "    for i in range(1, len(items)):", "        current = items[i]", "        j = i - 1", "        while j >= 0 and items[j] > current:", "            items[j + 1] = items[j]", "            j -= 1", "        items[j + 1] = current", "    return items",
], ({ values: source }) => {
  const values = [...source]; const { steps, add } = stepBuilder("insertion", values); add("start", "Treat the first value as a sorted hand of one card.", 0, [], [0]);
  for (let i = 1; i < values.length; i += 1) { const current = values[i]; let j = i - 1; add("pick-up", `Pick up ${current} and find its place in the sorted left side.`, 2, [i], values.map((_, x) => x).filter((x) => x < i)); while (j >= 0 && values[j] > current) { add("compare", `${values[j]} is larger than ${current}, so shift it right.`, 4, [j, j + 1], values.map((_, x) => x).filter((x) => x < i && x !== j)); values[j + 1] = values[j]; add("shift", `${values[j]} moved one space right.`, 5, [j + 1]); j -= 1; } values[j + 1] = current; add("insert", `Insert ${current} at index ${j + 1}. The sorted hand grows.`, 7, [j + 1], values.map((_, x) => x).filter((x) => x <= i)); }
  add("complete", "All values are inserted in order.", 8, [], values.map((_, i) => i)); return steps;
});

export const mergeSortLesson = listLesson("merge-sort", "Merge Sort", [
  "def merge_sort(items):", "    if len(items) <= 1: return items", "    middle = len(items) // 2", "    left = merge_sort(items[:middle])", "    right = merge_sort(items[middle:])", "    return merge(left, right)", "", "def merge(left, right):", "    take the smaller front value", "    repeat until both halves are empty",
], ({ values: source }) => {
  const values = [...source]; const { steps, add } = stepBuilder("merge", values); add("start", "Split the list into smaller halves, then merge those halves back in order.", 0);
  const sort = (left: number, right: number) => { if (right - left <= 1) return; const middle = Math.floor((left + right) / 2); add("split", `Split range ${left}–${right - 1} between indices ${middle - 1} and ${middle}.`, 2, values.map((_, i) => i).filter((i) => i >= left && i < right), [], values.map((_, i) => i).filter((i) => i < left || i >= right)); sort(left, middle); sort(middle, right); const merged: number[] = []; let i = left; let j = middle; while (i < middle && j < right) { add("compare-halves", `Compare the front values ${values[i]} and ${values[j]}; take the smaller one.`, 8, [i, j]); if (values[i] <= values[j]) merged.push(values[i++]); else merged.push(values[j++]); } while (i < middle) merged.push(values[i++]); while (j < right) merged.push(values[j++]); for (let offset = 0; offset < merged.length; offset += 1) values[left + offset] = merged[offset]; add("merge", `Merge produces [${merged.join(", ")}] for positions ${left}–${right - 1}.`, 9, values.map((_, x) => x).filter((x) => x >= left && x < right), right - left === values.length ? values.map((_, x) => x) : []); }; sort(0, values.length); add("complete", "The final merge combines two sorted halves into one sorted list.", 5, [], values.map((_, i) => i)); return steps;
});

export const quickSortLesson = listLesson("quick-sort", "Quick Sort", [
  "def quick_sort(items, low, high):", "    if low < high:", "        pivot = partition(items, low, high)", "        quick_sort(items, low, pivot - 1)", "        quick_sort(items, pivot + 1, high)", "", "def partition(items, low, high):", "    pivot = items[high]", "    smaller = low", "    for i in range(low, high):", "        if items[i] <= pivot:", "            items[smaller], items[i] = items[i], items[smaller]", "            smaller += 1", "    items[smaller], items[high] = items[high], items[smaller]", "    return smaller",
], ({ values: source }) => {
  const values = [...source]; const { steps, add } = stepBuilder("quick", values); const settled = new Set<number>(); add("start", "Choose a pivot, move smaller values left, and larger values right.", 0);
  const sort = (low: number, high: number) => { if (low > high) return; if (low === high) { settled.add(low); return; } const pivot = values[high]; let smaller = low; add("choose-pivot", `Choose ${pivot} at index ${high} as the pivot.`, 7, [high], [...settled]); for (let i = low; i < high; i += 1) { add("compare-pivot", `Compare ${values[i]} with pivot ${pivot}.`, 10, [i, high], [...settled]); if (values[i] <= pivot) { [values[smaller], values[i]] = [values[i], values[smaller]]; add("move-left", `${values[smaller]} belongs on the pivot’s left side.`, 11, [smaller, high], [...settled]); smaller += 1; } } [values[smaller], values[high]] = [values[high], values[smaller]]; settled.add(smaller); add("place-pivot", `Place pivot ${pivot} at index ${smaller}. It is now in its final position.`, 13, [smaller], [...settled]); sort(low, smaller - 1); sort(smaller + 1, high); }; sort(0, values.length - 1); values.forEach((_, i) => settled.add(i)); add("complete", "Every pivot has reached its final position.", 0, [], [...settled]); return steps;
});

export const heapSortLesson = listLesson("heap-sort", "Heap Sort", [
  "def heap_sort(items):", "    for root in range(len(items)//2 - 1, -1, -1):", "        heapify(items, len(items), root)", "    for end in range(len(items) - 1, 0, -1):", "        items[0], items[end] = items[end], items[0]", "        heapify(items, end, 0)", "    return items", "", "# heapify keeps the largest value at the root",
], ({ values: source }) => {
  const values = [...source]; const { steps, add } = stepBuilder("heap", values); add("start", "Build a max heap: every parent should be at least as large as its children.", 0);
  const heapify = (size: number, root: number) => { let largest = root; const left = root * 2 + 1; const right = left + 1; add("inspect-family", `Inspect parent ${values[root]}${left < size ? ` and child ${values[left]}` : ""}${right < size ? `, ${values[right]}` : ""}.`, 8, [root, ...(left < size ? [left] : []), ...(right < size ? [right] : [])], values.map((_, i) => i).filter((i) => i >= size)); if (left < size && values[left] > values[largest]) largest = left; if (right < size && values[right] > values[largest]) largest = right; if (largest !== root) { [values[root], values[largest]] = [values[largest], values[root]]; add("heap-swap", `Move the larger child ${values[root]} up to preserve the max heap.`, 2, [root, largest], values.map((_, i) => i).filter((i) => i >= size)); heapify(size, largest); } };
  for (let root = Math.floor(values.length / 2) - 1; root >= 0; root -= 1) heapify(values.length, root);
  add("max-heap-ready", `${values[0]} is now the largest value at the heap root.`, 2, [0]);
  for (let end = values.length - 1; end > 0; end -= 1) { [values[0], values[end]] = [values[end], values[0]]; add("extract-maximum", `Move the largest remaining value, ${values[end]}, to sorted index ${end}.`, 4, [0, end], values.map((_, i) => i).filter((i) => i >= end)); heapify(end, 0); }
  add("complete", "The shrinking heap leaves every maximum in sorted order.", 6, [], values.map((_, i) => i)); return steps;
});

export const countingSortLesson = listLesson("counting-sort", "Counting Sort", [
  "def counting_sort(items):", "    counts = [0] * (max(items) + 1)", "    for value in items:", "        counts[value] += 1", "    output = []", "    for value, count in enumerate(counts):", "        output.extend([value] * count)", "    return output",
], ({ values: source }) => {
  const values = [...source]; const steps: VisualizationStep[] = []; const max = Math.max(...values); const counts = Array(max + 1).fill(0) as number[]; let sequence = 0;
  const bucketStep = (operation: string, explanation: string, codeLine: number, active: number[] = []) => steps.push({ id: `counting-${sequence++}`, operation, explanation, codeLine, frame: { layout: "buckets", items: counts.map((count, value) => ({ id: `bucket-${value}`, value: count, label: `value ${value}`, state: active.includes(value) ? "active" : count ? "completed" : "idle" })), caption: "Bucket value → number of occurrences" } });
  bucketStep("make-buckets", `Create one count bucket for each value from 0 to ${max}.`, 1);
  for (const value of values) { counts[value] += 1; bucketStep("count-value", `See ${value}: increase bucket ${value} to ${counts[value]}.`, 3, [value]); }
  const output: number[] = []; for (let value = 0; value < counts.length; value += 1) { for (let count = 0; count < counts[value]; count += 1) { output.push(value); steps.push({ id: `counting-${sequence++}`, operation: "write-output", explanation: `Bucket ${value} still has a count, so append ${value} to the output.`, codeLine: 6, frame: { layout: "array", items: arrayItems(output, [output.length - 1], output.map((_, i) => i).slice(0, -1)), caption: `Output has ${output.length} of ${values.length} values` } }); } }
  steps.push({ id: "counting-complete", operation: "complete", explanation: "Reading non-empty buckets from left to right produces sorted order.", codeLine: 7, frame: { layout: "array", items: arrayItems(output, [], output.map((_, i) => i)), caption: "Counting Sort complete" } }); return steps;
}, "small-range");

export const radixSortLesson = listLesson("radix-sort", "Radix Sort", [
  "def radix_sort(items):", "    place = 1", "    while max(items) // place > 0:", "        buckets = [[] for _ in range(10)]", "        for value in items:", "            digit = (value // place) % 10", "            buckets[digit].append(value)", "        items = [value for bucket in buckets for value in bucket]", "        place *= 10", "    return items",
], ({ values: source }) => {
  let values = [...source]; const steps: VisualizationStep[] = []; let place = 1; let sequence = 0; const max = Math.max(...values);
  while (Math.floor(max / place) > 0) { const buckets: number[][] = Array.from({ length: 10 }, () => []); steps.push({ id: `radix-${sequence++}`, operation: "start-digit-pass", explanation: `Look only at the ${place === 1 ? "ones" : place === 10 ? "tens" : "hundreds"} digit of every value.`, codeLine: 2, frame: { layout: "array", items: arrayItems(values), caption: `Digit place: ${place}` } }); for (const value of values) { const digit = Math.floor(value / place) % 10; buckets[digit].push(value); steps.push({ id: `radix-${sequence++}`, operation: "place-in-bucket", explanation: `${value} has digit ${digit} in this place, so put it in bucket ${digit}.`, codeLine: 6, frame: { layout: "buckets", items: buckets.map((bucket, i) => ({ id: `bucket-${i}`, value: bucket.length ? bucket.join(", ") : "—", label: `digit ${i}`, state: i === digit ? "active" : bucket.length ? "completed" : "idle" })), caption: `Stable buckets for place ${place}` } }); } values = buckets.flat(); steps.push({ id: `radix-${sequence++}`, operation: "collect-buckets", explanation: `Collect buckets from 0 to 9. The list is now ordered through place ${place}.`, codeLine: 7, frame: { layout: "array", items: arrayItems(values, [], values.map((_, i) => i)), caption: `After place ${place}: ${values.join(", ")}` } }); place *= 10; }
  steps.push({ id: "radix-complete", operation: "complete", explanation: "All digit places have been processed, so the values are sorted.", codeLine: 9, frame: { layout: "array", items: arrayItems(values, [], values.map((_, i) => i)), caption: "Radix Sort complete" } }); return steps;
}, "nonnegative");

const usage = (summary: string, examples: string[], chooseWhen: string, avoidWhen: string, operations: [string, string][], practice: string): UsageGuide => ({ summary, examples, chooseWhen, avoidWhen, operations: operations.map(([name, cost]) => ({ name, cost })), practice });

export const algorithmMeta: Record<AlgorithmLessonId, AlgorithmMeta> = {
  "linear-search": { id: "linear-search", navLabel: "Linear Search", shortLabel: "→", title: "Linear Search", description: "Check values one by one—a dependable first search that needs no preparation.", concept: "Walk from left to right and stop when the target matches.", rule: "Works on any order · O(n)", analogy: "checking names on a paper list", inputHint: "Any whole numbers", usage: usage("Linear Search trades speed for simplicity and works even when data is unsorted.", ["Small contact lists", "Finding a first match", "One-time searches"], "The collection is small or unsorted, or you will search it only once.", "The collection is large and searched repeatedly; sorting or indexing may pay off.", [["Best", "O(1)"], ["Average", "O(n)"], ["Space", "O(1)"]], "Search once for a duplicate and once for a missing value.") },
  "binary-search": { id: "binary-search", navLabel: "Binary Search", shortLabel: "½", title: "Binary Search", description: "Discard half of a sorted search space after every comparison.", concept: "Ask the middle value which half can still contain the target.", rule: "Sorted input required · O(log n)", analogy: "opening a dictionary near the middle", inputHint: "Values are sorted automatically", usage: usage("Binary Search is ideal for repeated lookup in data that is already sorted.", ["Dictionary lookup", "Version boundaries", "Sorted database pages"], "Data is sorted and random access is cheap.", "Items arrive constantly in unsorted order or live in a linked list.", [["Best", "O(1)"], ["Average", "O(log n)"], ["Space", "O(1)"]], "Find the first occurrence when duplicate values exist.") },
  "bubble-sort": { id: "bubble-sort", navLabel: "Bubble Sort", shortLabel: "↔", title: "Bubble Sort", description: "Compare neighbors and repeatedly bubble the largest remaining value to the right.", concept: "Each pass settles one value at the end.", rule: "Friendly to learn · O(n²)", analogy: "large bubbles rising to the surface", inputHint: "Try a nearly sorted list", usage: usage("Bubble Sort makes swaps easy to see, but is mostly a teaching tool.", ["Learning swaps", "Tiny inputs", "Detecting sorted input"], "Clarity matters more than speed and the list is tiny.", "Performance matters or the data can grow.", [["Best", "O(n)*"], ["Average", "O(n²)"], ["Space", "O(1)"]], "Add an early-exit flag when no swap occurs.") },
  "selection-sort": { id: "selection-sort", navLabel: "Selection Sort", shortLabel: "↓", title: "Selection Sort", description: "Select the smallest remaining value and place it into the next sorted position.", concept: "Grow a sorted prefix one carefully chosen value at a time.", rule: "Few swaps · O(n²)", analogy: "choosing the smallest card from a spread", inputHint: "Distinct values make selection clear", usage: usage("Selection Sort uses few writes even though it makes many comparisons.", ["Learning minimum selection", "Write-limited memory", "Tiny arrays"], "Writes are expensive and the input is small.", "You need speed, stability, or adaptive behavior.", [["Comparisons", "O(n²)"], ["Swaps", "O(n)"], ["Space", "O(1)"]], "Track both the current position and minimum candidate.") },
  "insertion-sort": { id: "insertion-sort", navLabel: "Insertion Sort", shortLabel: "↳", title: "Insertion Sort", description: "Insert each new value into its correct place within an already sorted prefix.", concept: "The left side stays sorted after every insertion.", rule: "Great when nearly sorted", analogy: "sorting cards in your hand", inputHint: "Try a nearly sorted list", usage: usage("Insertion Sort is simple, stable, and fast for small or nearly sorted inputs.", ["Small library sort base cases", "Nearly sorted records", "Streaming insertion"], "The list is small, nearly sorted, or values arrive one at a time.", "Random large arrays need predictable high performance.", [["Best", "O(n)"], ["Average", "O(n²)"], ["Space", "O(1)"]], "Count how many shifts a reversed input needs.") },
  "merge-sort": { id: "merge-sort", navLabel: "Merge Sort", shortLabel: "⋈", title: "Merge Sort", description: "Split into tiny pieces, then merge sorted pieces back together.", concept: "Merging two sorted halves is linear and reliable.", rule: "Stable · O(n log n)", analogy: "combining two sorted queues", inputHint: "Watch ranges split and reunite", usage: usage("Merge Sort gives stable, predictable performance and excels on sequential data.", ["Sorting linked lists", "External file sorting", "Stable record sorting"], "You need stability or guaranteed O(n log n) time.", "Extra memory is tight and in-place sorting matters.", [["All cases", "O(n log n)"], ["Merge", "O(n)"], ["Space", "O(n)"]], "Merge two already-sorted arrays by hand.") },
  "quick-sort": { id: "quick-sort", navLabel: "Quick Sort", shortLabel: "◇", title: "Quick Sort", description: "Partition values around a pivot, then solve the smaller left and right ranges.", concept: "A placed pivot never needs to move again.", rule: "Fast average · pivot matters", analogy: "people lining up around a height marker", inputHint: "Last value becomes the pivot", usage: usage("Quick Sort is a strong in-memory general sort with good cache behavior.", ["In-memory arrays", "Systems libraries", "Partition selection"], "Average speed and low extra memory matter.", "You require stable output or cannot tolerate a quadratic worst case.", [["Average", "O(n log n)"], ["Worst", "O(n²)"], ["Stack", "O(log n)*"]], "Compare last-pivot and random-pivot behavior.") },
  "heap-sort": { id: "heap-sort", navLabel: "Heap Sort", shortLabel: "△", title: "Heap Sort", description: "Build a max heap, then repeatedly move the largest value into its final slot.", concept: "The heap root always exposes the largest remaining value.", rule: "In place · O(n log n)", analogy: "a tournament winner moving to the podium", inputHint: "Parent and child highlights show the heap", usage: usage("Heap Sort guarantees O(n log n) time using constant auxiliary array space.", ["Bounded-memory sorting", "Priority structures", "Worst-case guarantees"], "You need in-place sorting with a firm time bound.", "Stability or cache-friendly sequential access matters more.", [["Build heap", "O(n)"], ["Sort", "O(n log n)"], ["Space", "O(1)"]], "Map array index i to children 2i+1 and 2i+2.") },
  "counting-sort": { id: "counting-sort", navLabel: "Counting Sort", shortLabel: "#", title: "Counting Sort", description: "Count how often each small integer appears, then rebuild the output from those counts.", concept: "Sort values by counting them instead of comparing pairs.", rule: "O(n + k) · small range", analogy: "sorting votes into labeled boxes", inputHint: "Use values from 0 to 20", usage: usage("Counting Sort is exceptionally fast when integer keys occupy a small known range.", ["Age frequencies", "Exam-score bands", "Small integer categories"], "Values are integers and the range k is not much larger than n.", "Values span a huge range or are not discrete integers.", [["Time", "O(n + k)"], ["Space", "O(k)"], ["Comparisons", "0"]], "Turn raw counts into cumulative positions for a stable version.") },
  "radix-sort": { id: "radix-sort", navLabel: "Radix Sort", shortLabel: "10", title: "Radix Sort", description: "Sort by one digit place at a time while preserving the order from earlier passes.", concept: "Stable digit passes build a complete ordering from right to left.", rule: "No comparisons · digit buckets", analogy: "mail sorted by successive address fields", inputHint: "Use non-negative values up to 999", usage: usage("Radix Sort handles fixed-width integer or string keys efficiently with stable buckets.", ["Numeric identifiers", "ZIP or postal codes", "Fixed-width keys"], "Keys have a limited number of digits and stable bucketing is available.", "Keys have variable complex comparison rules or very large digit width.", [["Time", "O(d(n+k))"], ["Space", "O(n+k)"], ["Passes", "d digits"]], "Explain why collecting buckets must be stable.") },
};
