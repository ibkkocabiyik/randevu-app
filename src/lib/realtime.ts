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
}): () => void {
  if (!supabase) return () => {};

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
