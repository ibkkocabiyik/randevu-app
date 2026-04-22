import { useEffect } from 'react';
import { subscribeToChanges } from '../lib/realtime';
import { useStore } from '../store';
import { useReviewStore } from '../store/reviews';
import { appointmentsApi, reviewsApi } from '../lib/api';

/**
 * Supabase Realtime aboneliği kurar.
 * Herhangi bir appointments/reviews değişikliğinde store'u API'den yeniler.
 * AdminLayout veya App kök bileşeninde bir kez mount edilmeli.
 */
export function useRealtime() {
  useEffect(() => {
    const unsubscribe = subscribeToChanges({
      onAppointment: async () => {
        try {
          const appts = await appointmentsApi.list();
          // Snake_case → camelCase dönüşümü
          useStore.setState(s => ({
            ...s,
            appointments: appts.map(a => ({
              id:            a.id,
              customerId:    a.customer_id,
              customerName:  a.customer_name,
              customerPhone: a.customer_phone,
              serviceId:     a.service_id,
              employeeId:    a.employee_id,
              date:          a.date,
              startTime:     a.start_time,
              endTime:       a.end_time,
              status:        a.status,
              notes:         a.notes,
            })),
          }));
        } catch {}
      },
      onReview: async () => {
        try {
          const reviews = await reviewsApi.list();
          useReviewStore.setState(s => ({
            ...s,
            reviews: reviews.map(r => ({
              id:            r.id,
              appointmentId: r.appointment_id,
              serviceId:     r.service_id,
              employeeId:    r.employee_id,
              customerName:  r.customer_name,
              rating:        r.rating as 1|2|3|4|5,
              comment:       r.comment,
              createdAt:     r.created_at,
            })),
          }));
        } catch {}
      },
    });

    return unsubscribe;
  }, []);
}
