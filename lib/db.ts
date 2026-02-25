import { kv } from '@vercel/kv';

interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
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

// Keys for KV storage
const USERS_KEY = 'users';
const ALERTS_KEY = 'alerts';
const TRIGGERED_ALERTS_KEY = 'triggered_alerts';

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper to get all users from KV
async function getUsers(): Promise<User[]> {
  try {
    const users = await kv.get<User[]>(USERS_KEY);
    return users || [];
  } catch (error) {
    console.error('Error fetching users from KV:', error);
    return [];
  }
}

// Helper to save all users to KV
async function saveUsers(users: User[]): Promise<void> {
  await kv.set(USERS_KEY, users);
}

// Helper to get all alerts from KV
async function getAlerts(): Promise<Alert[]> {
  try {
    const alerts = await kv.get<Alert[]>(ALERTS_KEY);
    return alerts || [];
  } catch (error) {
    console.error('Error fetching alerts from KV:', error);
    return [];
  }
}

// Helper to save all alerts to KV
async function saveAlerts(alerts: Alert[]): Promise<void> {
  await kv.set(ALERTS_KEY, alerts);
}

// Helper to get all triggered alerts from KV
async function getTriggeredAlerts(): Promise<TriggeredAlert[]> {
  try {
    const triggeredAlerts = await kv.get<TriggeredAlert[]>(TRIGGERED_ALERTS_KEY);
    return triggeredAlerts || [];
  } catch (error) {
    console.error('Error fetching triggered alerts from KV:', error);
    return [];
  }
}

// Helper to save all triggered alerts to KV
async function saveTriggeredAlerts(triggeredAlerts: TriggeredAlert[]): Promise<void> {
  await kv.set(TRIGGERED_ALERTS_KEY, triggeredAlerts);
}

// User operations
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const users = await getUsers();
  
  const user: User = {
    id: generateId(),
    email,
    password,
    name: name || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(user);
  await saveUsers(users);
  
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.email === email);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

// Alert operations
export async function createAlert(
  userId: string, 
  cryptocurrency: string, 
  targetPrice: number, 
  condition: 'above' | 'below'
): Promise<Alert> {
  const alerts = await getAlerts();
  
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
  await saveAlerts(alerts);
  
  return alert;
}

export async function getAlertsByUserId(userId: string): Promise<Alert[]> {
  const alerts = await getAlerts();
  return alerts.filter(a => a.userId === userId);
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const alerts = await getAlerts();
  return alerts.filter(a => a.isActive && !a.isTriggered);
}

export async function getAllAlerts(): Promise<Alert[]> {
  return getAlerts();
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
  const alerts = await getAlerts();
  const index = alerts.findIndex(a => a.id === id);
  
  if (index === -1) return undefined;
  
  alerts[index] = { ...alerts[index], ...updates, updatedAt: new Date().toISOString() };
  await saveAlerts(alerts);
  
  return alerts[index];
}

export async function deleteAlert(id: string): Promise<boolean> {
  const alerts = await getAlerts();
  const index = alerts.findIndex(a => a.id === id);
  
  if (index === -1) return false;
  
  alerts.splice(index, 1);
  await saveAlerts(alerts);
  
  return true;
}

export async function findAlertById(id: string): Promise<Alert | undefined> {
  const alerts = await getAlerts();
  return alerts.find(a => a.id === id);
}

// Triggered Alert operations
export async function createTriggeredAlert(alertId: string, triggeredPrice: number): Promise<TriggeredAlert> {
  const triggeredAlerts = await getTriggeredAlerts();
  
  const triggeredAlert: TriggeredAlert = {
    id: generateId(),
    alertId,
    triggeredPrice,
    triggeredAt: new Date().toISOString(),
  };
  
  triggeredAlerts.push(triggeredAlert);
  await saveTriggeredAlerts(triggeredAlerts);
  
  return triggeredAlert;
}

export async function getTriggeredAlertsByUserId(userId: string): Promise<TriggeredAlert[]> {
  const alerts = await getAlerts();
  const triggeredAlerts = await getTriggeredAlerts();
  
  const userAlertIds = alerts.filter(a => a.userId === userId).map(a => a.id);
  return triggeredAlerts.filter(ta => userAlertIds.includes(ta.alertId));
}

export async function getAllTriggeredAlerts(): Promise<TriggeredAlert[]> {
  return getTriggeredAlerts();
}

// Sync versions for backward compatibility (for cases where async/await isn't used)
export function findUserByEmailSync(email: string): User | undefined {
  // This is a fallback for synchronous calls - not recommended but kept for compatibility
  return undefined;
}
