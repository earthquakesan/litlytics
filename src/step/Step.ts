import { CompletionUsage } from 'openai/resources/completions.mjs';
import { Doc } from '../doc/Document';

export interface StepResult {
  stepId: string;
  result: string;
  usage?: CompletionUsage;
}

export type StepType = 'source' | 'code' | 'llm';

// whether step input is full document, previous processing result or all docs
export type StepInput = 'doc' | 'result' | 'aggregate';

export interface Step extends Record<string, unknown> {
  id: string;
  name: string;
  description: string;
  type: StepType;
  input?: StepInput;
  prompt?: string;
  code?: string;
  position: { x: number; y: number };
  connectsTo: string[];
  documents?: Doc[];
  getDocuments?: () => Promise<Doc[]>;
}
