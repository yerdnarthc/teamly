export type StatusCode = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type PriorityCode = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  MED: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const STATUS_OPTIONS: Array<{ code: StatusCode; label: string }> = [
  { code: "NOT_STARTED", label: STATUS_LABELS.NOT_STARTED },
  { code: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS },
  { code: "COMPLETED", label: STATUS_LABELS.COMPLETED },
];

export const PRIORITY_OPTIONS: Array<{ code: PriorityCode; label: string }> = [
  { code: "LOW", label: PRIORITY_LABELS.LOW },
  { code: "MEDIUM", label: PRIORITY_LABELS.MEDIUM },
  { code: "HIGH", label: PRIORITY_LABELS.HIGH },
  { code: "URGENT", label: PRIORITY_LABELS.URGENT },
];
