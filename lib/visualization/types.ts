export type VisualizationLayout =
  | "array"
  | "array-cells"
  | "string"
  | "matrix"
  | "recursion"
  | "complexity"
  | "linked-list"
  | "doubly-linked-list"
  | "circular-linked-list"
  | "circular-queue"
  | "deque"
  | "hash-table"
  | "buckets"
  | "tree"
  | "stack"
  | "queue";

export type ItemState =
  | "idle"
  | "active"
  | "completed"
  | "muted"
  | "entering"
  | "leaving";

export type VisualItem = Readonly<{
  id: string;
  value: string | number;
  label?: string;
  parentId?: string | null;
  edgeLabel?: string;
  state: ItemState;
}>;

export type VisualPointer = Readonly<{
  id: string;
  label: string;
  itemId: string | null;
}>;

export type VisualizationFrame = Readonly<{
  layout: VisualizationLayout;
  items: readonly VisualItem[];
  pointers?: readonly VisualPointer[];
  columns?: number;
  caption?: string;
  output?: readonly (string | number)[];
}>;

export type VisualizationStep = Readonly<{
  id: string;
  operation: string;
  explanation: string;
  codeLine: number;
  frame: VisualizationFrame;
  durationMs?: number;
}>;

export type ValidationResult =
  | Readonly<{ valid: true }>
  | Readonly<{ valid: false; message: string }>;

export type LessonDefinition<TInput> = Readonly<{
  id: string;
  title: string;
  category: "foundation" | "algorithm" | "data-structure";
  code: readonly string[];
  validate: (input: TInput) => ValidationResult;
  createSteps: (input: TInput) => VisualizationStep[];
}>;

export type VisualizationTimeline<TInput> = Readonly<{
  lessonId: string;
  input: Readonly<TInput>;
  steps: readonly VisualizationStep[];
}>;
