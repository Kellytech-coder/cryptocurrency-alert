'use client';

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  type: 'alert_triggered' | 'price_change' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationBellProps {
  token: string | null;
  onToggle?: (isOpen: boolean) => void;
}

export default function NotificationBell({ token, onToggle }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      fetchNotificationPreferences();
      fetchNotifications();
    }
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      // Convert alerts to notifications
      const alerts = data.alerts || [];
      const newNotifications: Notification[] = [];
      
      alerts.forEach((alert: any) => {
        if (alert.isTriggered) {
          newNotifications.push({
            id: alert.id,
            type: 'alert_triggered',
            title: `${alert.cryptocurrency.toUpperCase()} Alert Triggered!`,
            message: `Price went ${alert.condition} $${alert.targetPrice.toLocaleString()}`,
            timestamp: alert.triggeredAlerts?.[0]?.triggeredAt || alert.updatedAt,
            read: false,
          });
        }
      });
      
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const updatePreferences = async (key: string, value: any) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative dropdown-container overflow-visible" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (onToggle) onToggle(!showDropdown);
        }}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-gray-700 rounded-lg shadow-2xl z-[60] max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="p-4 border-b border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Notification Settings</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Browser Notifications</span>
                <button
                  onClick={() => updatePreferences('browserEnabled', !preferences?.browserEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences?.browserEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences?.browserEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Email Notifications</span>
                <button
                  onClick={() => updatePreferences('emailEnabled', !preferences?.emailEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences?.emailEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences?.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Push Notifications</span>
                <button
                  onClick={() => updatePreferences('pushEnabled', !preferences?.pushEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences?.pushEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences?.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            </div>
            <div className="mt-3">
              <label className="text-sm text-gray-300">Price Change Threshold (%)</label>
              <input
                type="number"
                value={preferences?.priceChangeThreshold || 1}
                onChange={(e) => updatePreferences('priceChangeThreshold', parseFloat(e.target.value))}
                className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-64">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? 'bg-gray-700/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      notification.type === 'alert_triggered' ? 'bg-yellow-500' :
                      notification.type === 'price_change' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
