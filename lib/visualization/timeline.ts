import type {
  LessonDefinition,
  VisualizationStep,
  VisualizationTimeline,
} from "./types.ts";

function freezeStep(step: VisualizationStep): VisualizationStep {
  const items = step.frame.items.map((item) => Object.freeze({ ...item }));
  const pointers = step.frame.pointers?.map((pointer) =>
    Object.freeze({ ...pointer }),
  );
  const edges = step.frame.edges?.map((edge) => Object.freeze({ ...edge }));
  const frame = Object.freeze({
    ...step.frame,
    items: Object.freeze(items),
    pointers: pointers ? Object.freeze(pointers) : undefined,
    edges: edges ? Object.freeze(edges) : undefined,
    output: step.frame.output ? Object.freeze([...step.frame.output]) : undefined,
  });
  return Object.freeze({ ...step, frame });
}

export function createTimeline<TInput extends object>(
  lesson: LessonDefinition<TInput>,
  input: TInput,
): VisualizationTimeline<TInput> {
  const validation = lesson.validate(input);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const rawSteps = lesson.createSteps(structuredClone(input));
  if (rawSteps.length === 0) {
    throw new Error(`${lesson.title} must produce at least one visualization step.`);
  }

  const stepIds = new Set<string>();
  const steps = rawSteps.map((step) => {
    if (stepIds.has(step.id)) {
      throw new Error(`Duplicate visualization step id: ${step.id}`);
    }
    stepIds.add(step.id);
    return freezeStep(step);
  });

  return Object.freeze({
    lessonId: lesson.id,
    input: Object.freeze(structuredClone(input)) as Readonly<TInput>,
    steps: Object.freeze(steps),
  });
}
