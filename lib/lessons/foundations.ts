import type {
  LessonDefinition,
  VisualizationStep,
  VisualItem,
} from "../visualization/types.ts";

export type FoundationLessonId =
  | "arrays"
  | "strings"
  | "matrices"
  | "recursion"
  | "big-o";

export type UsageGuide = Readonly<{
  summary: string;
  examples: readonly string[];
  chooseWhen: string;
  avoidWhen: string;
  operations: readonly Readonly<{ name: string; cost: string }>[];
  practice: string;
}>;

export type FoundationMeta = Readonly<{
  id: FoundationLessonId;
  navLabel: string;
  shortLabel: string;
  title: string;
  description: string;
  concept: string;
  rule: string;
  analogy: string;
  usage: UsageGuide;
}>;

export type ArrayAccessInput = { values: number[]; index: number };
export type StringScanInput = { text: string; target: string };
export type MatrixScanInput = { values: number[][]; target: number };
export type FactorialInput = { n: number };
export type BigOInput = { n: number };

const itemState = (
  index: number,
  active: number | null,
  completed: number[] = [],
) =>
  index === active
    ? ("active" as const)
    : completed.includes(index)
      ? ("completed" as const)
      : ("idle" as const);

export const arrayAccessLesson: LessonDefinition<ArrayAccessInput> = {
  id: "array-access",
  title: "Array access",
  category: "foundation",
  code: [
    "items = [14, 28, 35, 42, 57, 63]",
    "index = 3",
    "value = items[index]",
    "print(value)",
  ],
  validate: ({ values, index }) => {
    if (values.length < 2 || values.length > 12) {
      return { valid: false, message: "Use between 2 and 12 array values." };
    }
    if (!values.every(Number.isInteger)) {
      return { valid: false, message: "Array values must be integers." };
    }
    if (!Number.isInteger(index) || index < 0 || index >= values.length) {
      return { valid: false, message: "The selected index must exist in the array." };
    }
    return { valid: true };
  },
  createSteps: ({ values, index }) => {
    const makeItems = (active: number | null, completed: number[] = []): VisualItem[] =>
      values.map((value, itemIndex) => ({
        id: `array-cell-${itemIndex}`,
        value,
        label: `index ${itemIndex}`,
        state: itemState(itemIndex, active, completed),
      }));
    return [
      {
        id: "array-0",
        operation: "inspect",
        explanation: "An array stores values in numbered positions called indices. Python starts counting at 0.",
        codeLine: 0,
        frame: { layout: "array-cells", items: makeItems(null), caption: "Contiguous indexed values" },
      },
      {
        id: "array-1",
        operation: "locate-index",
        explanation: `Go directly to index ${index}. No earlier value needs to be checked.`,
        codeLine: 1,
        frame: { layout: "array-cells", items: makeItems(index), caption: `Requested index: ${index}` },
      },
      {
        id: "array-2",
        operation: "read-value",
        explanation: `Index ${index} contains ${values[index]}. Direct access takes constant time, O(1).`,
        codeLine: 2,
        frame: { layout: "array-cells", items: makeItems(null, [index]), caption: `Result: ${values[index]}` },
      },
    ];
  },
};

export const stringScanLesson: LessonDefinition<StringScanInput> = {
  id: "string-scan",
  title: "String scan",
  category: "foundation",
  code: [
    "def find_character(text, target):",
    "    for index, character in enumerate(text):",
    "        if character == target:",
    "            return index",
    "    return -1",
  ],
  validate: ({ text, target }) => {
    if (text.length < 1 || text.length > 16) {
      return { valid: false, message: "Use a string between 1 and 16 characters." };
    }
    if ([...target].length !== 1) {
      return { valid: false, message: "Choose exactly one target character." };
    }
    return { valid: true };
  },
  createSteps: ({ text, target }) => {
    const characters = [...text];
    const steps: VisualizationStep[] = [
      {
        id: "string-0",
        operation: "inspect",
        explanation: "A string is an ordered sequence of characters. Each character has an index.",
        codeLine: 0,
        frame: {
          layout: "string",
          items: characters.map((value, index) => ({ id: `char-${index}`, value, label: `index ${index}`, state: "idle" })),
          caption: `Find “${target}”`,
        },
      },
    ];
    const checked: number[] = [];
    let found = false;
    for (let index = 0; index < characters.length; index += 1) {
      steps.push({
        id: `string-check-${index}`,
        operation: "compare-character",
        explanation: `Compare character “${characters[index]}” at index ${index} with “${target}”.`,
        codeLine: 2,
        frame: {
          layout: "string",
          items: characters.map((value, itemIndex) => ({
            id: `char-${itemIndex}`,
            value,
            label: `index ${itemIndex}`,
            state: itemIndex === index ? "active" : checked.includes(itemIndex) ? "muted" : "idle",
          })),
          caption: `Scanning left to right for “${target}”`,
        },
      });
      if (characters[index] === target) {
        steps.push({
          id: "string-found",
          operation: "found",
          explanation: `Found “${target}” at index ${index}. The function returns ${index}.`,
          codeLine: 3,
          frame: {
            layout: "string",
            items: characters.map((value, itemIndex) => ({
              id: `char-${itemIndex}`,
              value,
              label: `index ${itemIndex}`,
              state: itemIndex === index ? "completed" : itemIndex < index ? "muted" : "idle",
            })),
            caption: `Result: index ${index}`,
          },
        });
        found = true;
        break;
      }
      checked.push(index);
    }
    if (!found) {
      steps.push({
        id: "string-missing",
        operation: "not-found",
        explanation: `Every character was checked. “${target}” is not present, so the function returns -1.`,
        codeLine: 4,
        frame: {
          layout: "string",
          items: characters.map((value, index) => ({ id: `char-${index}`, value, label: `index ${index}`, state: "muted" })),
          caption: "Result: -1",
        },
      });
    }
    return steps;
  },
};

export const matrixScanLesson: LessonDefinition<MatrixScanInput> = {
  id: "matrix-scan",
  title: "Matrix scan",
  category: "foundation",
  code: [
    "def find_in_matrix(matrix, target):",
    "    for row in range(len(matrix)):",
    "        for column in range(len(matrix[row])):",
    "            if matrix[row][column] == target:",
    "                return row, column",
    "    return None",
  ],
  validate: ({ values }) => {
    if (values.length < 2 || values.length > 5) {
      return { valid: false, message: "Use between 2 and 5 matrix rows." };
    }
    const columns = values[0]?.length ?? 0;
    if (columns < 2 || columns > 5 || !values.every((row) => row.length === columns)) {
      return { valid: false, message: "Every matrix row must have between 2 and 5 columns." };
    }
    return { valid: true };
  },
  createSteps: ({ values, target }) => {
    const flattened = values.flat();
    const columns = values[0].length;
    const makeItems = (active: number | null, found: number | null = null): VisualItem[] =>
      flattened.map((value, index) => ({
        id: `matrix-${index}`,
        value,
        label: `row ${Math.floor(index / columns)}, column ${index % columns}`,
        state: index === found ? "completed" : index === active ? "active" : active !== null && index < active ? "muted" : "idle",
      }));
    const steps: VisualizationStep[] = [
      {
        id: "matrix-0",
        operation: "inspect-grid",
        explanation: `This matrix has ${values.length} rows and ${columns} columns. A value needs two indices: row and column.`,
        codeLine: 0,
        frame: { layout: "matrix", items: makeItems(null), columns, caption: `${values.length} × ${columns} matrix` },
      },
    ];
    let foundIndex = -1;
    for (let index = 0; index < flattened.length; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      steps.push({
        id: `matrix-check-${index}`,
        operation: "visit-cell",
        explanation: `Visit row ${row}, column ${column}. Compare ${flattened[index]} with ${target}.`,
        codeLine: 3,
        frame: { layout: "matrix", items: makeItems(index), columns, caption: `Checking matrix[${row}][${column}]` },
      });
      if (flattened[index] === target) {
        foundIndex = index;
        steps.push({
          id: "matrix-found",
          operation: "found",
          explanation: `Found ${target} at row ${row}, column ${column}.`,
          codeLine: 4,
          frame: { layout: "matrix", items: makeItems(null, index), columns, caption: `Result: (${row}, ${column})` },
        });
        break;
      }
    }
    if (foundIndex === -1) {
      steps.push({
        id: "matrix-missing",
        operation: "not-found",
        explanation: `${target} is not in this matrix, so the function returns None.`,
        codeLine: 5,
        frame: {
          layout: "matrix",
          items: flattened.map((value, index) => ({ id: `matrix-${index}`, value, label: `cell ${index}`, state: "muted" })),
          columns,
          caption: "Result: None",
        },
      });
    }
    return steps;
  },
};

export const factorialLesson: LessonDefinition<FactorialInput> = {
  id: "factorial-recursion",
  title: "Factorial recursion",
  category: "foundation",
  code: [
    "def factorial(n):",
    "    if n <= 1:",
    "        return 1",
    "    return n * factorial(n - 1)",
    "",
    "result = factorial(4)",
  ],
  validate: ({ n }) =>
    Number.isInteger(n) && n >= 2 && n <= 6
      ? { valid: true }
      : { valid: false, message: "Use a whole number from 2 to 6." },
  createSteps: ({ n }) => {
    const steps: VisualizationStep[] = [];
    const calls: number[] = [];
    for (let current = n; current >= 1; current -= 1) {
      calls.push(current);
      steps.push({
        id: `recursion-call-${current}`,
        operation: current === 1 ? "base-case" : "recursive-call",
        explanation:
          current === 1
            ? "factorial(1) reaches the base case. It returns 1 without another call."
            : `factorial(${current}) pauses and asks factorial(${current - 1}) for help.`,
        codeLine: current === 1 ? 2 : 3,
        frame: {
          layout: "recursion",
          items: calls.map((value, index) => ({
            id: `call-${value}`,
            value: `factorial(${value})`,
            label: index === calls.length - 1 ? (current === 1 ? "base case" : "active call") : "waiting",
            state: index === calls.length - 1 ? "active" : "idle",
          })),
          caption: `${calls.length} call${calls.length === 1 ? "" : "s"} on the call stack`,
        },
      });
    }
    let result = 1;
    for (let current = 2; current <= n; current += 1) {
      result *= current;
      const remaining = calls.slice(0, n - current + 1);
      steps.push({
        id: `recursion-return-${current}`,
        operation: "return-value",
        explanation: `Return upward: ${current} × ${result / current} = ${result}. The paused call can now finish.`,
        codeLine: 3,
        frame: {
          layout: "recursion",
          items: remaining.map((value, index) => ({
            id: `call-${value}`,
            value: index === remaining.length - 1 ? `factorial(${value}) = ${result}` : `factorial(${value})`,
            label: index === remaining.length - 1 ? "returning" : "waiting",
            state: index === remaining.length - 1 ? "completed" : "idle",
          })),
          caption: `Returning ${result} toward factorial(${n})`,
        },
      });
    }
    return steps;
  },
};

export const bigOLesson: LessonDefinition<BigOInput> = {
  id: "big-o-growth",
  title: "Big-O growth",
  category: "foundation",
  code: [
    "first = items[0]                 # O(1)",
    "while size > 1: size //= 2      # O(log n)",
    "for item in items: visit(item)   # O(n)",
    "for a in items:",
    "    for b in items: compare(a,b) # O(n²)",
  ],
  validate: ({ n }) =>
    Number.isInteger(n) && n >= 2 && n <= 64
      ? { valid: true }
      : { valid: false, message: "Use an input size from 2 to 64." },
  createSteps: ({ n }) => {
    const measures = [
      { id: "constant", label: "O(1)", value: 1, codeLine: 0, explanation: `O(1) stays at 1 operation even when n grows to ${n}.` },
      { id: "logarithmic", label: "O(log n)", value: Math.ceil(Math.log2(n)), codeLine: 1, explanation: `O(log n) needs about ${Math.ceil(Math.log2(n))} steps because each step halves the remaining work.` },
      { id: "linear", label: "O(n)", value: n, codeLine: 2, explanation: `O(n) grows with the input: ${n} items means about ${n} visits.` },
      { id: "quadratic", label: "O(n²)", value: n * n, codeLine: 4, explanation: `O(n²) compares pairs: ${n} × ${n} produces about ${n * n} operations.` },
    ];
    const intro: VisualizationStep = {
      id: "big-o-intro",
      operation: "compare-growth",
      explanation: "Big-O describes how work grows as the input grows. It compares growth patterns, not exact clock time.",
      codeLine: 0,
      frame: {
        layout: "complexity",
        items: measures.map((measure) => ({ id: measure.id, value: measure.value, label: measure.label, state: "idle" })),
        caption: `Estimated operations when n = ${n}`,
      },
    };
    return [
      intro,
      ...measures.map((focus, index) => ({
        id: `big-o-${focus.id}`,
        operation: "focus-growth",
        explanation: focus.explanation,
        codeLine: focus.codeLine,
        frame: {
          layout: "complexity" as const,
          items: measures.map((measure, itemIndex) => ({
            id: measure.id,
            value: measure.value,
            label: measure.label,
            state: itemIndex === index ? ("active" as const) : ("idle" as const),
          })),
          caption: `Estimated operations when n = ${n}`,
        },
      })),
    ];
  },
};

export const foundationMeta: Record<FoundationLessonId, FoundationMeta> = {
  arrays: {
    id: "arrays",
    navLabel: "Arrays",
    shortLabel: "AR",
    title: "Arrays & indices",
    description: "Learn how ordered values receive numbered positions and why indexed access is fast.",
    concept: "An array is like a row of numbered lockers. The index tells you exactly which locker to open.",
    rule: "Python indices start at 0",
    analogy: "Numbered lockers",
    usage: {
      summary: "Use an array when order matters and you frequently access values by position.",
      examples: ["Scores by round", "Pixels in an image row", "Daily temperature readings"],
      chooseWhen: "You know the position you need or want fast sequential traversal.",
      avoidWhen: "Values are constantly inserted near the beginning or must be found by a descriptive key.",
      operations: [{ name: "Read by index", cost: "O(1)" }, { name: "Search", cost: "O(n)" }, { name: "Insert in middle", cost: "O(n)" }],
      practice: "Return the largest value and its index from an array.",
    },
  },
  strings: {
    id: "strings",
    navLabel: "Strings",
    shortLabel: "ST",
    title: "Strings & characters",
    description: "Treat text as an ordered sequence and scan characters while keeping their positions.",
    concept: "A string is like letter tiles arranged in a fixed order. Each tile has an index.",
    rule: "Order and exact characters matter",
    analogy: "Letter tiles",
    usage: {
      summary: "Use strings to represent text, identifiers, commands, and any ordered character data.",
      examples: ["Usernames and IDs", "Search boxes", "File paths and URLs"],
      chooseWhen: "The information is naturally textual and character order carries meaning.",
      avoidWhen: "You need to change individual characters repeatedly; Python strings are immutable.",
      operations: [{ name: "Read character", cost: "O(1)" }, { name: "Find character", cost: "O(n)" }, { name: "Concatenate", cost: "O(n)" }],
      practice: "Count how many times a chosen character appears in a word.",
    },
  },
  matrices: {
    id: "matrices",
    navLabel: "Matrices",
    shortLabel: "2D",
    title: "Matrices & coordinates",
    description: "Navigate information arranged in rows and columns using a pair of indices.",
    concept: "A matrix is a seating chart: one number selects the row, and another selects the seat.",
    rule: "Use row first, then column",
    analogy: "Seating chart",
    usage: {
      summary: "Use a matrix when data naturally forms a rectangular grid.",
      examples: ["Game boards", "Images and pixels", "Dynamic programming tables"],
      chooseWhen: "Rows and columns both have meaning or every pair of entities needs a stored relationship.",
      avoidWhen: "Most cells would be empty; a sparse representation may use far less memory.",
      operations: [{ name: "Read cell", cost: "O(1)" }, { name: "Scan all cells", cost: "O(r × c)" }, { name: "Stored cells", cost: "O(r × c)" }],
      practice: "Find the coordinates of a target value in a grid.",
    },
  },
  recursion: {
    id: "recursion",
    navLabel: "Recursion",
    shortLabel: "RE",
    title: "Recursion & the call stack",
    description: "Follow a function as it solves a smaller version of its problem and returns upward.",
    concept: "Recursion is like opening nested boxes: reach the smallest box, then close them in reverse order.",
    rule: "Every recursive path needs a base case",
    analogy: "Nested boxes",
    usage: {
      summary: "Use recursion when a problem contains smaller versions of itself or follows a hierarchy.",
      examples: ["Tree traversal", "Folder navigation", "Divide-and-conquer algorithms"],
      chooseWhen: "The recursive definition is clearer than manually managing a stack.",
      avoidWhen: "The call depth may be very large or a simple loop expresses the same work more safely.",
      operations: [{ name: "Factorial time", cost: "O(n)" }, { name: "Call-stack space", cost: "O(n)" }, { name: "Base case", cost: "O(1)" }],
      practice: "Trace factorial(5) and list every call and return value.",
    },
  },
  "big-o": {
    id: "big-o",
    navLabel: "Big-O",
    shortLabel: "O",
    title: "Big-O intuition",
    description: "Compare how different algorithms grow as their input becomes larger.",
    concept: "Big-O is a growth forecast. It asks what happens to the work when the input becomes much larger.",
    rule: "Growth matters more than one timing",
    analogy: "A scaling forecast",
    usage: {
      summary: "Use Big-O to compare approaches and predict whether an algorithm will scale.",
      examples: ["Choosing a search strategy", "Reviewing nested loops", "Estimating memory growth"],
      chooseWhen: "You need to compare algorithms independently of one computer or one small test.",
      avoidWhen: "You need an exact runtime; constants, hardware, and input distribution still matter.",
      operations: [{ name: "Constant", cost: "O(1)" }, { name: "Logarithmic", cost: "O(log n)" }, { name: "Linear", cost: "O(n)" }, { name: "Quadratic", cost: "O(n²)" }],
      practice: "Classify a single loop and a pair of nested loops using Big-O.",
    },
  },
};
