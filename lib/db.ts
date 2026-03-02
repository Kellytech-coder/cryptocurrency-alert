// In-memory storage with optional Vercel KV persistence
// Provides storage for serverless environment

interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  notificationPreferences?: NotificationPreferences;
}

interface NotificationPreferences {
  emailEnabled: boolean;
  browserEnabled: boolean;
  pushEnabled: boolean;
  priceChangeThreshold: number;
  alertTypes: {
    priceAbove: boolean;
    priceBelow: boolean;
    priceChange: boolean;
  };
}

interface Alert {
  id: string;
  userId: string;
  cryptocurrency: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TriggeredAlert {
  id: string;
  alertId: string;
  triggeredPrice: number;
  triggeredAt: string;
}

// In-memory storage
const memoryStore: {
  users: User[];
  alerts: Alert[];
  triggeredAlerts: TriggeredAlert[];
} = {
  users: [],
  alerts: [],
  triggeredAlerts: []
};

// Try to import Vercel KV, but make it optional
// Only use KV if environment variables are properly set
let kv: any = null;
let useKv = false;

const hasKvEnvVars = !!(
  process.env.KV_REST_API_URL && 
  process.env.KV_REST_API_TOKEN
);

if (hasKvEnvVars) {
  try {
    const kvModule = require('@vercel/kv');
    kv = kvModule.kv;
    useKv = true;
    console.log('Vercel KV available, using KV storage');
  } catch (e) {
    console.log('Vercel KV not available, using in-memory storage');
    useKv = false;
  }
} else {
  console.log('Vercel KV environment variables not set, using in-memory storage');
  useKv = false;
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// User operations
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const users = await getAllUsers();
  
  const user: User = {
    id: generateId(),
    email,
    password,
    name: name || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(user);
  
  if (useKv && kv) {
    await kv.set('users', JSON.stringify(users));
  } else {
    memoryStore.users = users;
  }
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getAllUsers();
  return users.find(user => user.email === email);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getAllUsers();
  return users.find(user => user.id === id);
}

async function getAllUsers(): Promise<User[]> {
  if (useKv && kv) {
    try {
      const data = await kv.get('users');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching users from KV:', error);
      return memoryStore.users;
    }
  }
  return memoryStore.users;
}

// Notification Preferences functions
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  
  return user.notificationPreferences || {
    emailEnabled: true,
    browserEnabled: true,
    pushEnabled: false,
    priceChangeThreshold: 1,
    alertTypes: {
      priceAbove: true,
      priceBelow: true,
      priceChange: true,
    },
  };
}

export async function updateNotificationPreferences(
  userId: string, 
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  const users = await getAllUsers();
  const index = users.findIndex(user => user.id === userId);
  
  if (index === -1) return null;
  
  const currentPrefs = users[index].notificationPreferences || {
    emailEnabled: true,
    browserEnabled: true,
    pushEnabled: false,
    priceChangeThreshold: 1,
    alertTypes: {
      priceAbove: true,
      priceBelow: true,
      priceChange: true,
    },
  };
  
  const updatedPrefs = { ...currentPrefs, ...preferences };
  users[index] = { ...users[index], notificationPreferences: updatedPrefs };
  
  if (useKv && kv) {
    await kv.set('users', JSON.stringify(users));
  } else {
    memoryStore.users = users;
  }
  
  return updatedPrefs;
}

// Alert operations
export async function createAlert(
  userId: string, 
  cryptocurrency: string, 
  targetPrice: number, 
  condition: 'above' | 'below'
): Promise<Alert> {
  const alerts = await getAllAlertsRaw();
  
  const alert: Alert = {
    id: generateId(),
    userId,
    cryptocurrency,
    targetPrice,
    condition,
    isActive: true,
    isTriggered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  alerts.push(alert);
  
  if (useKv && kv) {
    await kv.set('alerts', JSON.stringify(alerts));
  } else {
    memoryStore.alerts = alerts;
  }
  return alert;
}

export async function getAlertsByUserId(userId: string): Promise<Alert[]> {
  const alerts = await getAllAlertsRaw();
  return alerts.filter(alert => alert.userId === userId);
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const alerts = await getAllAlertsRaw();
  return alerts.filter(alert => alert.isActive && !alert.isTriggered);
}

export async function getAllAlerts(): Promise<Alert[]> {
  return getAllAlertsRaw();
}

async function getAllAlertsRaw(): Promise<Alert[]> {
  if (useKv && kv) {
    try {
      const data = await kv.get('alerts');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching alerts from KV:', error);
      return memoryStore.alerts;
    }
  }
  return memoryStore.alerts;
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
  const alerts = await getAllAlertsRaw();
  const index = alerts.findIndex(alert => alert.id === id);
  
  if (index === -1) return undefined;
  
  const updatedAlert = { ...alerts[index], ...updates, updatedAt: new Date().toISOString() };
  alerts[index] = updatedAlert;
  
  if (useKv && kv) {
    await kv.set('alerts', JSON.stringify(alerts));
  } else {
    memoryStore.alerts = alerts;
  }
  return updatedAlert;
}

export async function deleteAlert(id: string): Promise<boolean> {
  const alerts = await getAllAlertsRaw();
  const index = alerts.findIndex(alert => alert.id === id);
  
  if (index === -1) return false;
  
  alerts.splice(index, 1);
  
  if (useKv && kv) {
    await kv.set('alerts', JSON.stringify(alerts));
  } else {
    memoryStore.alerts = alerts;
  }
  return true;
}

export async function findAlertById(id: string): Promise<Alert | undefined> {
  const alerts = await getAllAlertsRaw();
  return alerts.find(alert => alert.id === id);
}

// Triggered Alert operations
export async function createTriggeredAlert(alertId: string, triggeredPrice: number): Promise<TriggeredAlert> {
  const triggeredAlerts = await getAllTriggeredAlertsRaw();
  
  const triggeredAlert: TriggeredAlert = {
    id: generateId(),
    alertId,
    triggeredPrice,
    triggeredAt: new Date().toISOString(),
  };
  
  triggeredAlerts.push(triggeredAlert);
  
  if (useKv && kv) {
    await kv.set('triggered_alerts', JSON.stringify(triggeredAlerts));
  } else {
    memoryStore.triggeredAlerts = triggeredAlerts;
  }
  return triggeredAlert;
}

export async function getTriggeredAlertsByUserId(userId: string): Promise<TriggeredAlert[]> {
  const alerts = await getAlertsByUserId(userId);
  const userAlertIds = new Set(alerts.map(a => a.id));
  
  const triggeredAlerts = await getAllTriggeredAlertsRaw();
  return triggeredAlerts.filter(ta => userAlertIds.has(ta.alertId));
}

export async function getAllTriggeredAlerts(): Promise<TriggeredAlert[]> {
  return getAllTriggeredAlertsRaw();
}

async function getAllTriggeredAlertsRaw(): Promise<TriggeredAlert[]> {
  if (useKv && kv) {
    try {
      const data = await kv.get('triggered_alerts');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching triggered alerts from KV:', error);
      return memoryStore.triggeredAlerts;
    }
  }
  return memoryStore.triggeredAlerts;
}

// Sync versions for backward compatibility
export function findUserByEmailSync(email: string): User | undefined {
  return memoryStore.users.find(user => user.email === email);
}
