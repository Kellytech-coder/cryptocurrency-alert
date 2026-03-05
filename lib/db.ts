// Database operations using Prisma with SQLite
// Provides persistent storage for the application

import prisma from './prisma';

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

// Generate unique ID using Prisma's cuid
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// User operations
export async function createUser(email: string, password: string, name?: string) {
  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: name || null,
      isEmailVerified: false,
      isOTPVerified: false,
    },
  });
  return user;
}

export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user || undefined;
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user || undefined;
}

export async function findUserByVerificationCode(code: string) {
  const user = await prisma.user.findFirst({
    where: { verificationCode: code },
  });
  return user || undefined;
}

export async function updateUserVerification(
  userId: string, 
  updates: { 
    verificationCode?: string | null; 
    verificationCodeExpiry?: Date | string | null;
    isEmailVerified?: boolean;
    isOTPVerified?: boolean;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updates,
      // Convert string dates to Date objects if needed
      verificationCodeExpiry: updates.verificationCodeExpiry 
        ? new Date(updates.verificationCodeExpiry as string)
        : null,
    },
  });
  return user;
}

// Notification Preferences functions
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.notificationPreferences) {
    return {
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
  
  return JSON.parse(user.notificationPreferences);
}

export async function updateNotificationPreferences(
  userId: string, 
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) return null;
  
  const currentPrefs = user.notificationPreferences 
    ? JSON.parse(user.notificationPreferences)
    : {
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
  
  await prisma.user.update({
    where: { id: userId },
    data: { notificationPreferences: JSON.stringify(updatedPrefs) },
  });
  
  return updatedPrefs;
}

// Alert operations
export async function createAlert(
  userId: string, 
  cryptocurrency: string, 
  targetPrice: number, 
  condition: 'above' | 'below'
) {
  const alert = await prisma.alert.create({
    data: {
      userId,
      cryptocurrency,
      targetPrice,
      condition,
      isActive: true,
      isTriggered: false,
    },
  });
  return alert;
}

export async function getAlertsByUserId(userId: string) {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getActiveAlerts() {
  return prisma.alert.findMany({
    where: { 
      isActive: true,
      isTriggered: false,
    },
  });
}

export async function getAllAlerts() {
  return prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAlert(id: string, updates: any) {
  const alert = await prisma.alert.update({
    where: { id },
    data: updates,
  });
  return alert;
}

export async function deleteAlert(id: string) {
  try {
    await prisma.alert.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function findAlertById(id: string) {
  const alert = await prisma.alert.findUnique({
    where: { id },
  });
  return alert || undefined;
}

// Triggered Alert operations
export async function createTriggeredAlert(alertId: string, triggeredPrice: number) {
  const triggeredAlert = await prisma.triggeredAlert.create({
    data: {
      alertId,
      triggeredPrice,
    },
  });
  return triggeredAlert;
}

export async function getTriggeredAlertsByUserId(userId: string) {
  const alerts = await prisma.alert.findMany({
    where: { userId },
  });
  const alertIds = alerts.map(a => a.id);
  
  return prisma.triggeredAlert.findMany({
    where: { alertId: { in: alertIds } },
    orderBy: { triggeredAt: 'desc' },
  });
}

export async function getAllTriggeredAlerts() {
  return prisma.triggeredAlert.findMany({
    orderBy: { triggeredAt: 'desc' },
  });
}

// Sync version for backward compatibility (not needed with Prisma)
export function findUserByEmailSync(email: string) {
  return undefined; // Not supported with Prisma
}
