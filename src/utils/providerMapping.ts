import type { IconInfo } from './iconMapping';

/**
 * Maps provider IDs to their corresponding icons and colors
 */
export function getProviderIcon(providerID: string): IconInfo {
  switch (providerID) {
    case 'openai':
      return {
        name: 'radio-button-on',
        color: '#10b981',
      };
      
    case 'anthropic':
      return {
        name: 'leaf',
        color: '#d97706',
      };
      
    case 'google':
      return {
        name: 'logo-google',
        color: '#3b82f6',
      };
      
    case 'azure':
      return {
        name: 'cloud',
        color: '#0ea5e9',
      };
      
    case 'aws':
      return {
        name: 'cloud',
        color: '#f59e0b',
      };
      
    case 'huggingface':
      return {
        name: 'heart',
        color: '#f43f5e',
      };
      
    case 'ollama':
      return {
        name: 'server',
        color: '#7c3aed',
      };
      
    case 'openrouter':
      return {
        name: 'git-branch',
        color: '#8b5cf6',
      };
      
    case 'together':
      return {
        name: 'git-network',
        color: '#ec4899',
      };
      
    case 'mistral':
      return {
        name: 'flame',
        color: '#f97316',
      };
      
    case 'cohere':
      return {
        name: 'pulse',
        color: '#6366f1',
      };
      
    case 'replicate':
      return {
        name: 'copy',
        color: '#1d4ed8',
      };
      
    case 'deepseek':
      return {
        name: 'aperture',
        color: '#0891b2',
      };
      
    case 'groq':
      return {
        name: 'flash',
        color: '#f59e0b',
      };
      
    case 'xai':
      return {
        name: 'logo-xbox',
        color: '#000000',
      };
      
    case 'opencode':
      return {
        name: 'code',
        color: '#64748b',
      };
      
    default:
      return {
        name: 'help-circle',
        color: '#64748b',
      };
  }
}

/**
 * Maps model IDs to their corresponding icons and colors
 * This is a simplified mapping - in practice, this would be more comprehensive
 */
export function getModelIcon(modelID: string): IconInfo {
  // OpenAI models
  if (modelID.includes('gpt')) {
    return {
      name: 'radio-button-on',
      color: '#10b981',
    };
  }
  
  // Anthropic models
  if (modelID.includes('claude')) {
    return {
      name: 'leaf',
      color: '#d97706',
    };
  }
  
  // Google models
  if (modelID.includes('gemini') || modelID.includes('palm')) {
    return {
      name: 'logo-google',
      color: '#3b82f6',
    };
  }
  
  // Mistral models
  if (modelID.includes('mistral')) {
    return {
      name: 'flame',
      color: '#f97316',
    };
  }
  
  // Default fallback
  return {
    name: 'cube',
    color: '#64748b',
  };
}