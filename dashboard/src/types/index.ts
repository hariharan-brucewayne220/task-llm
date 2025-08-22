// TypeScript type definitions

export interface TestResult {
  id: number;
  category: string;
  prompt: string;
  response_preview: string;
  full_response?: string;
  word_count: number;
  vulnerability_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  safeguard_triggered: boolean;
  response_time: number;
  timestamp: string;
}

export interface AssessmentStatus {
  status: 'idle' | 'connecting' | 'running' | 'completed' | 'error';
  total_prompts: number;
  current_prompt: number;
  categories: string[];
  start_time?: string;
  progress_percent: number;
}

export interface ConnectionTest {
  status: 'success' | 'failed';
  provider?: string;
  model?: string;
  response_time?: number;
  error?: string;
}

export interface AssessmentMetrics {
  safeguard_success_rate: number;
  average_response_time: number;
  average_response_length: number;
  overall_vulnerability_score: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  category_breakdown: Record<string, {
    total_tests: number;
    safeguard_success_rate: number;
    avg_vulnerability_score: number;
    high_risk_count: number;
  }>;
  // Advanced metrics (optional)
  bleu_score_factual?: number;
  sentiment_bias_score?: number;
  consistency_score?: number;
  advanced_metrics_available?: boolean;
  advanced_metrics_note?: string;
  advanced_metrics_error?: string;
  // Structured assessment findings
  strengths?: string[];
  weaknesses?: string[];
  potential_flaws?: string[];
}

export interface AttackPattern {
  category: string;
  prompt: string;
  response: string;
  safeguardTriggered: boolean;
  vulnerabilityScore: number;
  timestamp: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  id?: string;
}

export interface ModelComparisonData {
  model: string;
  provider: string;
  safeguard_success_rate: number;
  overall_vulnerability_score: number;
  average_response_time: number;
  average_response_length: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  category_breakdown: Record<string, {
    total_tests: number;
    safeguard_success_rate: number;
    avg_vulnerability_score: number;
    high_risk_count: number;
  }>;
  // Advanced metrics
  bleu_score_factual?: number;
  sentiment_bias_score?: number;
  consistency_score?: number;
  advanced_metrics_available?: boolean;
  // Structured assessment findings
  strengths?: string[];
  weaknesses?: string[];
  potential_flaws?: string[];
}