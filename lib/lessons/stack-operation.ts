import type {
  LessonDefinition,
  VisualizationStep,
  VisualItem,
} from "../visualization/types.ts";

export type StackInput = {
  values: string[];
  operation: "push" | "pop";
  value?: string;
};

const code = [
  "class Stack:",
  "    def __init__(self):",
  "        self.items = []",
  "",
  "    def push(self, value):",
  "        self.items.append(value)",
  "",
  "    def pop(self):",
  "        if not self.items:",
  "            return None",
  "        return self.items.pop()",
] as const;

function stackItems(
  values: string[],
  activeId: string | null = null,
  specialState?: "entering" | "leaving",
): VisualItem[] {
  return values.map((value, index) => {
    const id = `stack-${index}`;
    return {
      id,
      value,
      label: index === values.length - 1 ? "top" : `position ${index}`,
      state:
        id === activeId ? (specialState ?? "active") : ("idle" as const),
    };
  });
}

function frame(values: string[], items: VisualItem[]) {
  return {
    layout: "stack" as const,
    items,
    pointers: [
      {
        id: "top",
        label: "TOP · next out",
        itemId: values.length ? `stack-${values.length - 1}` : null,
      },
    ],
  };
}

function createSteps(input: StackInput): VisualizationStep[] {
  const values = [...input.values];
  const topId = values.length ? `stack-${values.length - 1}` : null;
  const steps: VisualizationStep[] = [
    {
      id: "stack-0",
      operation: "inspect-top",
      explanation: values.length
        ? `${values.at(-1)} is at the TOP, the stack’s only open end.`
        : "The stack is empty. Its TOP pointer does not point to a value.",
      codeLine: 2,
      frame: frame(values, stackItems(values, topId)),
    },
  ];

  if (input.operation === "push") {
    const value = input.value ?? "new";
    const enteringValues = [...values, value];
    const enteringId = `stack-${enteringValues.length - 1}`;
    steps.push(
      {
        id: "stack-1",
        operation: "push-enter",
        explanation: `Push brings ${value} to the open TOP of the stack.`,
        codeLine: 4,
        frame: frame(
          enteringValues,
          stackItems(enteringValues, enteringId, "entering"),
        ),
      },
      {
        id: "stack-2",
        operation: "push-complete",
        explanation: `${value} is now on TOP and will be the next value popped.`,
        codeLine: 5,
        frame: frame(enteringValues, stackItems(enteringValues, enteringId)),
      },
    );
  } else if (values.length) {
    const removed = values.at(-1) ?? "";
    steps.push({
      id: "stack-1",
      operation: "pop-leave",
      explanation: `Pop removes ${removed} because it is currently on TOP.`,
      codeLine: 10,
      frame: frame(values, stackItems(values, topId, "leaving")),
    });
    values.pop();
    const nextTopId = values.length ? `stack-${values.length - 1}` : null;
    steps.push({
      id: "stack-2",
      operation: "pop-complete",
      explanation: values.length
        ? `${removed} is gone. ${values.at(-1)} is the new TOP.`
        : `${removed} is gone. The stack is now empty.`,
      codeLine: 10,
      frame: frame(values, stackItems(values, nextTopId)),
    });
  } else {
    steps.push({
      id: "stack-1",
      operation: "empty",
      explanation: "There is no value to pop, so Python returns None.",
      codeLine: 9,
      frame: frame(values, []),
    });
  }

  return steps;
}

export const stackOperationLesson: LessonDefinition<StackInput> = {
  id: "stack-operation",
  title: "Stack operation",
  category: "data-structure",
  code,
  validate: (input) => {
    if (input.values.length > 12) {
      return { valid: false, message: "The teaching stack supports up to 12 values." };
    }
    if (input.operation === "push" && !input.value?.trim()) {
      return { valid: false, message: "Push needs a value." };
    }
    return { valid: true };
  },
  createSteps,
};
