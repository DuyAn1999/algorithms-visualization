import type {
  LessonDefinition,
  VisualizationStep,
  VisualItem,
} from "../visualization/types.ts";

export type BubbleSortInput = { values: number[] };

const code = [
  "def bubble_sort(items):",
  "    for end in range(len(items) - 1, 0, -1):",
  "        for i in range(end):",
  "            if items[i] > items[i + 1]:",
  "                items[i], items[i + 1] = items[i + 1], items[i]",
  "    return items",
] as const;

function itemsFor(
  values: number[],
  active: number[] = [],
  completed: number[] = [],
): VisualItem[] {
  return values.map((value, index) => ({
    id: `array-${index}`,
    value,
    label: `index ${index}`,
    state: active.includes(index)
      ? "active"
      : completed.includes(index)
        ? "completed"
        : "idle",
  }));
}

function createSteps(input: BubbleSortInput): VisualizationStep[] {
  const values = [...input.values];
  const steps: VisualizationStep[] = [];
  let sequence = 0;
  const addStep = (
    operation: string,
    explanation: string,
    codeLine: number,
    active: number[] = [],
    completed: number[] = [],
  ) => {
    steps.push({
      id: `bubble-${sequence++}`,
      operation,
      explanation,
      codeLine,
      frame: { layout: "array", items: itemsFor(values, active, completed) },
    });
  };

  addStep(
    "start",
    "Start at the left. Each pass settles one large value on the right.",
    0,
  );

  for (let end = values.length - 1; end > 0; end -= 1) {
    const completed = Array.from(
      { length: values.length - 1 - end },
      (_, offset) => values.length - 1 - offset,
    );
    for (let index = 0; index < end; index += 1) {
      addStep(
        "compare",
        `Compare ${values[index]} and ${values[index + 1]}.`,
        3,
        [index, index + 1],
        completed,
      );
      if (values[index] > values[index + 1]) {
        const larger = values[index];
        [values[index], values[index + 1]] = [
          values[index + 1],
          values[index],
        ];
        addStep(
          "swap",
          `${larger} is larger, so the neighboring values swap places.`,
          4,
          [index, index + 1],
          completed,
        );
      }
    }
    addStep(
      "settle",
      `${values[end]} is now in its final position.`,
      1,
      [end],
      Array.from(
        { length: values.length - end },
        (_, offset) => values.length - 1 - offset,
      ),
    );
  }

  addStep(
    "complete",
    "Every value is in order. Bubble Sort is complete.",
    5,
    [],
    values.map((_, index) => index),
  );
  return steps;
}

export const bubbleSortLesson: LessonDefinition<BubbleSortInput> = {
  id: "bubble-sort",
  title: "Bubble Sort",
  category: "algorithm",
  code,
  validate: ({ values }) => {
    if (values.length < 2 || values.length > 20) {
      return { valid: false, message: "Bubble Sort needs 2 to 20 values." };
    }
    if (!values.every(Number.isInteger)) {
      return { valid: false, message: "Bubble Sort accepts integers only." };
    }
    return { valid: true };
  },
  createSteps,
};
