'use client';

import * as React from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = React.useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Handle auth state changes
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return <>{children}</>;
} 