// Vercel KV (Redis) storage for serverless environment
// Provides persistent storage across function invocations

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
  await kv.set(USERS_KEY, JSON.stringify(users));
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
  try {
    const data = await kv.get<string>(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
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
  await kv.set(ALERTS_KEY, JSON.stringify(alerts));
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
  try {
    const data = await kv.get<string>(ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
  const alerts = await getAllAlertsRaw();
  const index = alerts.findIndex(alert => alert.id === id);
  
  if (index === -1) return undefined;
  
  const updatedAlert = { ...alerts[index], ...updates, updatedAt: new Date().toISOString() };
  alerts[index] = updatedAlert;
  await kv.set(ALERTS_KEY, JSON.stringify(alerts));
  return updatedAlert;
}

export async function deleteAlert(id: string): Promise<boolean> {
  const alerts = await getAllAlertsRaw();
  const index = alerts.findIndex(alert => alert.id === id);
  
  if (index === -1) return false;
  
  alerts.splice(index, 1);
  await kv.set(ALERTS_KEY, JSON.stringify(alerts));
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
  await kv.set(TRIGGERED_ALERTS_KEY, JSON.stringify(triggeredAlerts));
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
  try {
    const data = await kv.get<string>(TRIGGERED_ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error fetching triggered alerts:', error);
    return [];
  }
}

// Sync versions for backward compatibility
export function findUserByEmailSync(email: string): User | undefined {
  // This is a fallback - in practice, use async version
  return undefined;
}
