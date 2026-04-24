import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

type ChangeHandler = (payload: unknown) => void;

export function subscribeToChanges(handlers: {
  onAppointment?: ChangeHandler;
  onReview?: ChangeHandler;
  onService?: ChangeHandler;
  onEmployee?: ChangeHandler;
}): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
      payload => handlers.onAppointment?.(payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' },
      payload => handlers.onReview?.(payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' },
      payload => handlers.onService?.(payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' },
      payload => handlers.onEmployee?.(payload))
    .subscribe((status) => {
      console.log('[realtime] channel status:', status);
    });

  return () => { supabase.removeChannel(channel); };
}
