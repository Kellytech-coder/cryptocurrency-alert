// Simple JSON file-based database for Vercel deployment
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');

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

interface Database {
  users: User[];
  alerts: Alert[];
  triggeredAlerts: TriggeredAlert[];
}

let db: Database | null = null;

function getDbPath(): string {
  return path.join(DB_PATH, 'db.json');
}

function ensureDbDir(): void {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }
}

function loadDatabase(): Database {
  if (db) return db;
  
  ensureDbDir();
  const dbPath = getDbPath();
  
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(data);
  } else {
    db = { users: [], alerts: [], triggeredAlerts: [] };
    saveDatabase(db);
  }
  
  return db!;
}

function saveDatabase(data: Database): void {
  ensureDbDir();
  fs.writeFileSync(getDbPath(), JSON.stringify(data, null, 2));
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// User operations
export function createUser(email: string, password: string, name?: string): User {
  const data = loadDatabase();
  const user: User = {
    id: generateId(),
    email,
    password,
    name: name || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.users.push(user);
  saveDatabase(data);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const data = loadDatabase();
  return data.users.find(u => u.email === email);
}

export function findUserById(id: string): User | undefined {
  const data = loadDatabase();
  return data.users.find(u => u.id === id);
}

// Alert operations
export function createAlert(userId: string, cryptocurrency: string, targetPrice: number, condition: 'above' | 'below'): Alert {
  const data = loadDatabase();
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
  data.alerts.push(alert);
  saveDatabase(data);
  return alert;
}

export function getAlertsByUserId(userId: string): Alert[] {
  const data = loadDatabase();
  return data.alerts.filter(a => a.userId === userId);
}

export function getActiveAlerts(): Alert[] {
  const data = loadDatabase();
  return data.alerts.filter(a => a.isActive && !a.isTriggered);
}

export function getAllAlerts(): Alert[] {
  const data = loadDatabase();
  return data.alerts;
}

export function updateAlert(id: string, updates: Partial<Alert>): Alert | undefined {
  const data = loadDatabase();
  const index = data.alerts.findIndex(a => a.id === id);
  if (index === -1) return undefined;
  
  data.alerts[index] = { ...data.alerts[index], ...updates, updatedAt: new Date().toISOString() };
  saveDatabase(data);
  return data.alerts[index];
}

export function deleteAlert(id: string): boolean {
  const data = loadDatabase();
  const index = data.alerts.findIndex(a => a.id === id);
  if (index === -1) return false;
  
  data.alerts.splice(index, 1);
  saveDatabase(data);
  return true;
}

export function findAlertById(id: string): Alert | undefined {
  const data = loadDatabase();
  return data.alerts.find(a => a.id === id);
}

// Triggered Alert operations
export function createTriggeredAlert(alertId: string, triggeredPrice: number): TriggeredAlert {
  const data = loadDatabase();
  const triggeredAlert: TriggeredAlert = {
    id: generateId(),
    alertId,
    triggeredPrice,
    triggeredAt: new Date().toISOString(),
  };
  data.triggeredAlerts.push(triggeredAlert);
  saveDatabase(data);
  return triggeredAlert;
}

export function getTriggeredAlertsByUserId(userId: string): TriggeredAlert[] {
  const data = loadDatabase();
  const userAlertIds = data.alerts.filter(a => a.userId === userId).map(a => a.id);
  return data.triggeredAlerts.filter(ta => userAlertIds.includes(ta.alertId));
}

export function getAllTriggeredAlerts(): TriggeredAlert[] {
  const data = loadDatabase();
  return data.triggeredAlerts;
}
