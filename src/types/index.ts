export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  category: 'sac' | 'sakal' | 'bakim';
}

export interface Employee {
  id: string;
  name: string;
  avatar?: string;
  workingHours: { start: string; end: string }; // "09:00"
  serviceIds: string[];
}

export interface Appointment {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  employeeId: string;
  date: string; // ISO date string "2026-04-20"
  startTime: string; // "10:00"
  endTime: string;   // "10:30"
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'noshow';
  notes?: string;
}

export interface Review {
  id: string;
  appointmentId: string;
  serviceId: string;
  employeeId: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'review_request';
  title: string;
  body: string;
  appointmentId?: string;
  read: boolean;
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  customerPhone: string;
  text: string;
  createdAt: string;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  discountPct: number;
  color: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronz',  minPoints: 0,    discountPct: 0,  color: '#CD7F32' },
  { name: 'Gümüş', minPoints: 500,  discountPct: 5,  color: '#9CA3AF' },
  { name: 'Altın',  minPoints: 1000, discountPct: 10, color: '#F59E0B' },
  { name: 'Platin', minPoints: 2000, discountPct: 15, color: '#6366F1' },
];

export function getLoyaltyTier(points: number): LoyaltyTier {
  return [...LOYALTY_TIERS].reverse().find(t => points >= t.minPoints) ?? LOYALTY_TIERS[0];
}

export interface BookingState {
  serviceId: string | null;
  employeeId: string | null;
  date: string | null;
  startTime: string | null;
}
