export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SubscribeRequest {
  userId: string;
  subscription: PushSubscription;
  userAgent?: string;
}

export interface UnsubscribeRequest {
  userId: string;
  endpoint: string;
}

export interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export interface GetPublicKeyResponse {
  publicKey: string;
}

export interface PushSubscriptionRecord {
  id: number;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: Date;
  lastUsed?: Date;
}
