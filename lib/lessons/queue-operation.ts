import type {
  LessonDefinition,
  VisualizationStep,
  VisualItem,
} from "../visualization/types.ts";

export type QueueInput = {
  values: string[];
  operation: "enqueue" | "dequeue";
  value?: string;
};

const code = [
  "from collections import deque",
  "",
  "class Queue:",
  "    def __init__(self):",
  "        self.items = deque()",
  "",
  "    def enqueue(self, value):",
  "        self.items.append(value)",
  "",
  "    def dequeue(self):",
  "        if not self.items:",
  "            return None",
  "        return self.items.popleft()",
] as const;

function queueItems(
  values: string[],
  activeId: string | null = null,
  specialState?: "entering" | "leaving",
): VisualItem[] {
  return values.map((value, index) => {
    const id = `queue-${index}`;
    return {
      id,
      value,
      label:
        index === 0
          ? "front · next out"
          : index === values.length - 1
            ? "rear"
            : `position ${index}`,
      state:
        id === activeId ? (specialState ?? "active") : ("idle" as const),
    };
  });
}

function frame(values: string[], items: VisualItem[]) {
  return {
    layout: "queue" as const,
    items,
    pointers: [
      {
        id: "front",
        label: "FRONT · next out",
        itemId: values.length ? "queue-0" : null,
      },
      {
        id: "rear",
        label: "REAR · joins here",
        itemId: values.length ? `queue-${values.length - 1}` : null,
      },
    ],
  };
}

function createSteps(input: QueueInput): VisualizationStep[] {
  const values = [...input.values];
  const frontId = values.length ? "queue-0" : null;
  const steps: VisualizationStep[] = [
    {
      id: "queue-0",
      operation: "inspect-front",
      explanation: values.length
        ? `${values[0]} is at the FRONT because it arrived first.`
        : "The queue is empty. Its FRONT and REAR pointers are clear.",
      codeLine: 4,
      frame: frame(values, queueItems(values, frontId)),
    },
  ];

  if (input.operation === "enqueue") {
    const value = input.value ?? "new";
    const enteringValues = [...values, value];
    const enteringId = `queue-${enteringValues.length - 1}`;
    steps.push(
      {
        id: "queue-1",
        operation: "enqueue-enter",
        explanation: `Enqueue brings ${value} to the REAR, behind earlier values.`,
        codeLine: 6,
        frame: frame(
          enteringValues,
          queueItems(enteringValues, enteringId, "entering"),
        ),
      },
      {
        id: "queue-2",
        operation: "enqueue-complete",
        explanation: `${value} joined at the REAR. ${enteringValues[0]} remains next to leave.`,
        codeLine: 7,
        frame: frame(enteringValues, queueItems(enteringValues, enteringId)),
      },
    );
  } else if (values.length) {
    const removed = values[0];
    steps.push({
      id: "queue-1",
      operation: "dequeue-leave",
      explanation: `Dequeue removes ${removed} because it is at the FRONT.`,
      codeLine: 12,
      frame: frame(values, queueItems(values, frontId, "leaving")),
    });
    values.shift();
    const nextFrontId = values.length ? "queue-0" : null;
    steps.push({
      id: "queue-2",
      operation: "dequeue-complete",
      explanation: values.length
        ? `${removed} is gone. ${values[0]} is now at the FRONT.`
        : `${removed} is gone. The queue is now empty.`,
      codeLine: 12,
      frame: frame(values, queueItems(values, nextFrontId)),
    });
  } else {
    steps.push({
      id: "queue-1",
      operation: "empty",
      explanation: "There is no value to dequeue, so Python returns None.",
      codeLine: 11,
      frame: frame(values, []),
    });
  }

  return steps;
}

export const queueOperationLesson: LessonDefinition<QueueInput> = {
  id: "queue-operation",
  title: "Queue operation",
  category: "data-structure",
  code,
  validate: (input) => {
    if (input.values.length > 12) {
      return { valid: false, message: "The teaching queue supports up to 12 values." };
    }
    if (input.operation === "enqueue" && !input.value?.trim()) {
      return { valid: false, message: "Enqueue needs a value." };
    }
    return { valid: true };
  },
  createSteps,
};
