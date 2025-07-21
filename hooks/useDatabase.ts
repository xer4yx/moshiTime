import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';

export interface User {
  user_id?: number;
  username: string;
  email: string;
  password: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarEvent {
  event_id?: number;
  event_name: string;
  description?: string;
  event_date: string;
  notif_time: string;
  notif_sent: boolean;
  event_time: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  notification_id?: number;
  user_id: number;
  event_id: number;
  sent_at?: string;
  status: string;
}

export interface Schedule {
  schedule_id?: number;
  user_id: number;
  event_id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const useDatabase = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('calendar.db');
        setDb(database);
        
        // Create users table
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create events table
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS events (
            event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            notif_time TEXT NOT NULL,
            notif_sent BOOLEAN DEFAULT 0,
            event_time TEXT NOT NULL,
            category TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create notifications table
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            sent_at DATETIME,
            status TEXT NOT NULL DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (event_id) REFERENCES events(event_id)
          );
        `);

        // Create schedules table
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS schedules (
            schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (event_id) REFERENCES events(event_id)
          );
        `);
        
        // Load existing data
        await loadAllData(database);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    initDatabase();
  }, []);

  const loadAllData = async (database?: SQLite.SQLiteDatabase) => {
    try {
      const dbToUse = database || db;
      if (!dbToUse) return;

      // Load events
      const eventsResult = await dbToUse.getAllAsync('SELECT * FROM events ORDER BY event_date, event_time');
      setEvents(eventsResult as CalendarEvent[]);

      // Load users
      const usersResult = await dbToUse.getAllAsync('SELECT * FROM users ORDER BY created_at');
      setUsers(usersResult as User[]);

      // Load notifications
      const notificationsResult = await dbToUse.getAllAsync('SELECT * FROM notifications ORDER BY sent_at DESC');
      setNotifications(notificationsResult as Notification[]);

      // Load schedules
      const schedulesResult = await dbToUse.getAllAsync('SELECT * FROM schedules ORDER BY created_at DESC');
      setSchedules(schedulesResult as Schedule[]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Event methods
  const saveEvent = async (event: CalendarEvent) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const result = await db.runAsync(
        'INSERT INTO events (event_name, description, event_date, notif_time, notif_sent, event_time, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [event.event_name, event.description || '', event.event_date, event.notif_time, event.notif_sent ? 1 : 0, event.event_time, event.category]
      );

      console.log('Event saved with ID:', result.lastInsertRowId);
      await loadAllData();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  const updateEvent = async (event_id: number, event: CalendarEvent) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      await db.runAsync(
        'UPDATE events SET event_name = ?, description = ?, event_date = ?, notif_time = ?, notif_sent = ?, event_time = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?',
        [event.event_name, event.description || '', event.event_date, event.notif_time, event.notif_sent ? 1 : 0, event.event_time, event.category, event_id]
      );

      await loadAllData();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (event_id: number) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      await db.runAsync('DELETE FROM events WHERE event_id = ?', [event_id]);
      await loadAllData();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const getEventsByDate = async (date: string) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const result = await db.getAllAsync(
        'SELECT * FROM events WHERE event_date = ? ORDER BY event_time',
        [date]
      );
      return result as CalendarEvent[];
    } catch (error) {
      console.error('Error getting events by date:', error);
      return [];
    }
  };

  // User methods
  const saveUser = async (user: User) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const result = await db.runAsync(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [user.username, user.email, user.password]
      );

      console.log('User saved with ID:', result.lastInsertRowId);
      await loadAllData();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  // Notification methods
  const saveNotification = async (notification: Notification) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const result = await db.runAsync(
        'INSERT INTO notifications (user_id, event_id, sent_at, status) VALUES (?, ?, ?, ?)',
        [notification.user_id, notification.event_id, notification.sent_at || null, notification.status]
      );

      console.log('Notification saved with ID:', result.lastInsertRowId);
      await loadAllData();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving notification:', error);
      throw error;
    }
  };

  // Schedule methods
  const saveSchedule = async (schedule: Schedule) => {
    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const result = await db.runAsync(
        'INSERT INTO schedules (user_id, event_id, status) VALUES (?, ?, ?)',
        [schedule.user_id, schedule.event_id, schedule.status]
      );

      console.log('Schedule saved with ID:', result.lastInsertRowId);
      await loadAllData();
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving schedule:', error);
      throw error;
    }
  };

  return {
    // Data states
    events,
    users,
    notifications,
    schedules,
    
    // Event methods
    saveEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    
    // User methods
    saveUser,
    
    // Notification methods
    saveNotification,
    
    // Schedule methods
    saveSchedule,
    
    // Utility methods
    loadAllData: () => loadAllData(),
    isReady: !!db,
  };
}; 