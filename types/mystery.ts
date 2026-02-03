export type TaskType = "mcq" | "open";

export interface Task {
  id: string;
  idx: number;
  type: TaskType;
  question: string;
  options: string[];
  answer: string;
  hint: string;
  is_final: boolean;
  revelation?: string;
}

export interface Evidence {
  id: string;
  title: string;
  type: "image" | "video" | "audio" | "document";
  description: string;
  storage_path: string;
  transcript_path?: string;
  unlocked_on_task_idx: number;
  has_transcript: boolean;
}
