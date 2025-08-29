export interface ContextInfo {
  currentTokens: number;
  maxTokens: number;
  percentage: number;
  sessionCost: number;
  isSubscriptionModel: boolean;
}

export interface ChutesQuota {
  used: number;
  quota: number;
}

export interface ProviderModel {
  providerID: string;
  modelID: string;
}