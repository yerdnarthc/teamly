import { z } from "zod";

export const assignmentFormSchema = z.object({
  title: z.string().trim().min(1, "Assignment title cannot be empty."),
  instructions: z.string(),
  subjectId: z.number().nullable(),
  statusCode: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  priorityCode: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  hasDeadline: z.boolean(),
  dueDate: z.date(),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;
