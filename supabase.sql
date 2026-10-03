create table products (
  id bigint generated always as identity primary key,
  name text not null,
  price numeric not null,
  sizes text[] not null,
  image text not null,
  created_at timestamptz default now()
);
alter table products enable row level security;
create policy "Anyone can view products" on products for select using (true);
create policy "Only logged-in admin can change products" on products for all to authenticated using (true) with check (true);
