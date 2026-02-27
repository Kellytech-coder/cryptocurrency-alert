// File-based storage for serverless environment
// Uses JSON file to persist data between function invocations

import fs from 'fs';
import path from 'path';

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

interface DataStore {
  users: User[];
  alerts: Alert[];
  triggeredAlerts: TriggeredAlert[];
}

const DATA_FILE = path.join(process.cwd(), 'data.json');

// In-memory storage with file-based persistence
let usersStore: Map<string, User> = new Map();
let alertsStore: Map<string, Alert> = new Map();
let triggeredAlertsStore: Map<string, TriggeredAlert> = new Map();
let isInitialized = false;

// Load data from file
function loadData(): void {
  if (isInitialized) return;
  
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data: DataStore = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      
      // Load users
      usersStore = new Map();
      data.users?.forEach((user: User) => usersStore.set(user.id, user));
      
      // Load alerts
      alertsStore = new Map();
      data.alerts?.forEach((alert: Alert) => alertsStore.set(alert.id, alert));
      
      // Load triggered alerts
      triggeredAlertsStore = new Map();
      data.triggeredAlerts?.forEach((ta: TriggeredAlert) => triggeredAlertsStore.set(ta.id, ta));
      
      console.log('Data loaded from file');
    } else {
      // Ensure data directory exists
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      saveData();
      console.log('New data file created');
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  
  isInitialized = true;
}

// Save data to file
function saveData(): void {
  try {
    const data: DataStore = {
      users: Array.from(usersStore.values()),
      alerts: Array.from(alertsStore.values()),
      triggeredAlerts: Array.from(triggeredAlertsStore.values()),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize on module load
loadData();

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// User operations
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const user: User = {
    id: generateId(),
    email,
    password,
    name: name || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  usersStore.set(user.id, user);
  saveData();
  return user;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  for (const user of usersStore.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  return usersStore.get(id);
}

// Alert operations
export async function createAlert(
  userId: string, 
  cryptocurrency: string, 
  targetPrice: number, 
  condition: 'above' | 'below'
): Promise<Alert> {
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
  
  alertsStore.set(alert.id, alert);
  saveData();
  return alert;
}

export async function getAlertsByUserId(userId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];
  for (const alert of alertsStore.values()) {
    if (alert.userId === userId) {
      alerts.push(alert);
    }
  }
  return alerts;
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  for (const alert of alertsStore.values()) {
    if (alert.isActive && !alert.isTriggered) {
      alerts.push(alert);
    }
  }
  return alerts;
}

export async function getAllAlerts(): Promise<Alert[]> {
  return Array.from(alertsStore.values());
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
  const alert = alertsStore.get(id);
  if (!alert) return undefined;
  
  const updatedAlert = { ...alert, ...updates, updatedAt: new Date().toISOString() };
  alertsStore.set(id, updatedAlert);
  saveData();
  return updatedAlert;
}

export async function deleteAlert(id: string): Promise<boolean> {
  const result = alertsStore.delete(id);
  if (result) saveData();
  return result;
}

export async function findAlertById(id: string): Promise<Alert | undefined> {
  return alertsStore.get(id);
}

// Triggered Alert operations
export async function createTriggeredAlert(alertId: string, triggeredPrice: number): Promise<TriggeredAlert> {
  const triggeredAlert: TriggeredAlert = {
    id: generateId(),
    alertId,
    triggeredPrice,
    triggeredAt: new Date().toISOString(),
  };
  
  triggeredAlertsStore.set(triggeredAlert.id, triggeredAlert);
  saveData();
  return triggeredAlert;
}

export async function getTriggeredAlertsByUserId(userId: string): Promise<TriggeredAlert[]> {
  const userAlertIds = new Set<string>();
  for (const alert of alertsStore.values()) {
    if (alert.userId === userId) {
      userAlertIds.add(alert.id);
    }
  }
  
  const triggeredAlerts: TriggeredAlert[] = [];
  for (const ta of triggeredAlertsStore.values()) {
    if (userAlertIds.has(ta.alertId)) {
      triggeredAlerts.push(ta);
    }
  }
  return triggeredAlerts;
}

export async function getAllTriggeredAlerts(): Promise<TriggeredAlert[]> {
  return Array.from(triggeredAlertsStore.values());
}

// Sync versions for backward compatibility
export function findUserByEmailSync(email: string): User | undefined {
  for (const user of usersStore.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
}
