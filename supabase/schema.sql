-- Enable RLS (Row Level Security)
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';
create table public.profiles (
    user_id uuid references auth.users primary key,
    elo integer default 1000,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create matches table
create table public.matches (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    mode text not null,
    num_players integer not null,
    solved boolean not null default false,
    time_taken float,
    elo_delta integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row level security
alter table public.profiles enable row level security;
alter table public.matches enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = user_id );

create policy "Matches are viewable by everyone."
    on matches for select
    using ( true );

create policy "Authenticated users can insert matches."
    on matches for insert
    with check ( auth.role() = 'authenticated' );

-- Enable realtime subscriptions
alter publication supabase_realtime add table profiles;

-- Create function to update updated_at on profiles
create function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for profiles updated_at
create trigger handle_profiles_updated_at
    before update on public.profiles
    for each row
    execute procedure public.handle_updated_at(); 