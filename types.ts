
export interface VideoGenerationStatus {
  step: 'idle' | 'analyzing' | 'generating' | 'polling' | 'completed' | 'error';
  message: string;
  progress?: number;
}

export interface GenerationResult {
  videoUrl: string;
  directorPrompt: string;
}
