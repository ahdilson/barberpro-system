-- Migration: Adiciona configuração de horários de funcionamento por dia da semana
alter table public.establishments
add column if not exists operating_hours jsonb default '[
  {"day": 0, "name": "Domingo", "isOpen": false, "openTime": "09:00", "closeTime": "14:00"},
  {"day": 1, "name": "Segunda-feira", "isOpen": false, "openTime": "09:00", "closeTime": "19:00"},
  {"day": 2, "name": "Terça-feira", "isOpen": true, "openTime": "09:00", "closeTime": "19:00"},
  {"day": 3, "name": "Quarta-feira", "isOpen": true, "openTime": "09:00", "closeTime": "19:00"},
  {"day": 4, "name": "Quinta-feira", "isOpen": true, "openTime": "09:00", "closeTime": "19:00"},
  {"day": 5, "name": "Sexta-feira", "isOpen": true, "openTime": "09:00", "closeTime": "20:00"},
  {"day": 6, "name": "Sábado", "isOpen": true, "openTime": "08:00", "closeTime": "18:00"}
]'::jsonb;
