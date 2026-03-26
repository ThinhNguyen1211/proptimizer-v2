/**
 * Proptimizer Shared Type Definitions
 * Used across Backend, Frontend, and Extension
 */

export interface User {
  user_id: string;
  email: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  credits_used: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  mode: 'precision' | 'exploratory' | 'structured' | 'multilingual';
  is_public: boolean;
  media?: { before_url?: string; after_url?: string };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model: 'haiku' | 'sonnet';
}
