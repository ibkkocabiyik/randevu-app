import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ChangeHandler = (payload: unknown) => void;

/**
 * Supabase Realtime aboneliği başlatır.
 * appointments, reviews — tüm INSERT/UPDATE/DELETE olaylarını dinler.
 * Döndürdüğü fonksiyon çağrıldığında abonelik iptal edilir.
 */
export function subscribeToChanges(handlers: {
  onAppointment?: ChangeHandler;
  onReview?: ChangeHandler;
}): () => void {
  const channel = supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      payload => handlers.onAppointment?.(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      payload => handlers.onReview?.(payload)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
