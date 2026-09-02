export type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
  cloudBackupEnabled: boolean;
  notificationsEnabled: boolean;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  mediaUrl?: string; // base64 for prototyping
  timestamp: number;
  encrypted: boolean;
};

export type Chat = {
  id: string;
  participants: string[]; // array of UIDs
  lastMessage?: string;
  updatedAt: number;
  name?: string; // For groups, or empty for DM
};

export type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  timestamp: number;
  details?: string;
};
