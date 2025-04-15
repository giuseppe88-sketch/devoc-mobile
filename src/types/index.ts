export interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'developer' | 'client';
  };
}

export interface Developer {
  id: string;
  userId: string;
  name: string;
  bio: string;
  skills: string[];
  timezone: string;
  avatar?: string;
  rating?: number;
  availability?: Availability[];
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  company?: string;
  avatar?: string;
}

export interface Availability {
  id: string;
  developerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
}

export interface TimeSlot {
  id: string;
  date: string; // ISO date string
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  developerId: string;
  clientId: string;
  date: string; // ISO date string
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  calendarEventId?: string; // Google Calendar event ID
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_confirmation' | 'booking_reminder' | 'booking_cancelled';
  read: boolean;
  createdAt: string; // ISO date string
  relatedBookingId?: string;
}
