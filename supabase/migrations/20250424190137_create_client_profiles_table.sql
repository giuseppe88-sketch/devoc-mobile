CREATE TABLE client_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  company_name TEXT,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
