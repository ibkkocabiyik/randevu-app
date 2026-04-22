import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Review } from '../types';

interface ReviewStore {
  reviews: Review[];
  addReview: (r: Omit<Review, 'id' | 'createdAt'>) => void;
  hasReview: (appointmentId: string) => boolean;
}

let _id = Date.now();
const uid = () => String(++_id);

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      addReview: (r) =>
        set((s) => ({
          reviews: [...s.reviews, { ...r, id: uid(), createdAt: new Date().toISOString() }],
        })),
      hasReview: (appointmentId) =>
        get().reviews.some((r) => r.appointmentId === appointmentId),
    }),
    { name: 'randevu-reviews' }
  )
);
