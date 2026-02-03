-- Minimal seed for the Silent Harbour demo case.
insert into mysteries (id, code, difficulty, estimated_minutes, is_published)
values (
  '00000000-0000-0000-0000-000000000001',
  'silent-harbour',
  'medium',
  45,
  true
) on conflict (id) do nothing;

insert into mystery_locales (mystery_id, lang, title, tagline, description)
values
  ('00000000-0000-0000-0000-000000000001', 'en', 'Silent Harbour', 'Fog and missing cargo', 'A harbour blackout hides a cargo handoff.'),
  ('00000000-0000-0000-0000-000000000001', 'no', 'Silent Harbour', 'Tåke og savnet last', 'Et strømbrudd i havna skjuler et overlevering.');
