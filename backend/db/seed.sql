-- =============================================
-- Pansion CRM — Full Demo Reset + Seed
-- Run: PGPASSWORD='***' psql -U pansion -d pansion -h 127.0.0.1 -f backend/db/seed.sql
-- Password for all users: admin123
-- =============================================

DELETE FROM medication_logs;
DELETE FROM medical_prescriptions;
DELETE FROM sos_signals;
DELETE FROM transactions;
DELETE FROM maid_tasks;
DELETE FROM relatives;
DELETE FROM guests;
DELETE FROM rooms;
DELETE FROM users;
DELETE FROM pensions;

ALTER SEQUENCE medication_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE sos_signals_id_seq RESTART WITH 1;

INSERT INTO pensions (id, name, address) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Родные Пенаты — Крым', 'Респ. Крым, г. Ялта, ул. Морская, 12');

-- All passwords: admin123
INSERT INTO users (id, pension_id, email, phone, password_hash, first_name, last_name, role, status) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@pansion.local',    '+790****1000', '$2a$10$71KxrBV94VPBpPtthtUCAul7ont8sdXkiiQWLEmsiaT0muE4w/J1e', 'Админ',   'Системы',  'owner',   'active'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'manager@pansion.local',  '+790****1002', '$2a$10$71KxrBV94VPBpPtthtUCAul7ont8sdXkiiQWLEmsiaT0muE4w/J1e', 'Мария',   'Петрова',  'manager', 'active'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'doctor@pansion.local',   '+790****1003', '$2a$10$71KxrBV94VPBpPtthtUCAul7ont8sdXkiiQWLEmsiaT0muE4w/J1e', 'Алексей', 'Смирнов',  'doctor',  'active'),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 'sidorova@pansion.local', '+790****1004', '$2a$10$71KxrBV94VPBpPtthtUCAul7ont8sdXkiiQWLEmsiaT0muE4w/J1e', 'Анна',    'Сидорова', 'maid',    'active'),
  ('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111111', 'kozlova@pansion.local',  '+790****1005', '$2a$10$71KxrBV94VPBpPtthtUCAul7ont8sdXkiiQWLEmsiaT0muE4w/J1e', 'Елена',   'Козлова',  'maid',    'active');

DO $$
DECLARE
  fid UUID := '11111111-1111-1111-1111-111111111111';
  s TEXT[] := ARRAY['vacant','vacant','vacant','booked','occupied','occupied','checking_out_today'];
  floor INT; n INT; num TEXT; st TEXT;
BEGIN
  FOR floor IN 1..3 LOOP
    FOR n IN 1..10 LOOP
      num := floor || LPAD(n::text, 2, '0');
      st := s[1 + ((floor * 3 + n) % array_length(s, 1))];
      INSERT INTO rooms (pension_id, number, floor, status) VALUES (fid, num, floor, st);
    END LOOP;
  END LOOP;
END$$;

INSERT INTO guests (pension_id, room_id, first_name, last_name, middle_name, birth_date, diet_type, character_notes, status) VALUES
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='101' LIMIT 1), 'Николай',   'Кузнецов',  'Петрович',    '1945-03-15', 'Стол №5',     'Гипертония, утром принимает лекарства', 'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='102' LIMIT 1), 'Татьяна',   'Соколова',  'Андреевна',   '1952-07-22', 'Без сахара',  'Диабет 2 типа, диета строгая',           'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='108' LIMIT 1), 'Александр', 'Попов',     'Игоревич',    '1938-11-08', 'Обычный',     '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='109' LIMIT 1), 'Елена',     'Новикова',  'Николаевна',  '1949-05-30', 'Стол №9',     'После операции, лёгкая пища',            'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='205' LIMIT 1), 'Михаил',    'Федоров',   'Александрович','1941-09-12', 'Обычный',     '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='206' LIMIT 1), 'Ольга',     'Морозова',  'Дмитриевна',  '1955-01-25', 'Без глютена', 'Аллергия на орехи',                      'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='302' LIMIT 1), 'Сергей',    'Волков',    'Сергеевич',    '1936-04-18', 'Обычный',     '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='303' LIMIT 1), 'Наталья',   'Лебедева',  'Павловна',    '1958-08-03', 'Стол №5',     '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='304' LIMIT 1), 'Андрей',    'Козлов',    'Владимирович','1943-12-07', 'Обычный',     'Любит тишину, номер окном в сад',       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='308' LIMIT 1), 'Ирина',     'Смирнова',  'Олеговна',    '1950-06-20', 'Без сахара',  '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='309' LIMIT 1), 'Дмитрий',   'Орлов',     'Васильевич',  '1939-10-14', 'Обычный',     '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='103' LIMIT 1), 'Марина',    'Белова',    'Ивановна',    '1947-02-28', 'Стол №9',     'Пожилая, нужна помощь с передвижением', 'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='104' LIMIT 1), 'Евгений',   'Комаров',   'Николаевич',  '1944-07-06', 'Обычный',     '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='107' LIMIT 1), 'Светлана',  'Тихонова',  'Александровна','1953-11-19', 'Без глютена', '',                                       'active'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM rooms WHERE number='204' LIMIT 1), 'Виктор',    'Егоров',    'Петрович',    '1940-04-01', 'Стол №5',     '',                                       'active');

DO $$
DECLARE
  r RECORD;
  tt TEXT[] := ARRAY['linen_change','wet_cleaning','watering_flowers'];
  t TEXT; st TEXT; n INT;
BEGIN
  FOR r IN SELECT id FROM rooms WHERE status IN ('occupied','booked','checking_out_today') LOOP
    n := 1 + (random() * 2)::int;
    FOR i IN 1..n LOOP
      t := tt[1 + (i % 3)];
      st := CASE WHEN random() < 0.3 THEN 'completed' WHEN random() < 0.5 THEN 'in_progress' ELSE 'pending' END;
      INSERT INTO maid_tasks (pension_id, room_id, task_type, status) VALUES ((SELECT id FROM pensions LIMIT 1), r.id, t, st);
    END LOOP;
  END LOOP;
END$$;

INSERT INTO transactions (pension_id, type, amount, category, description, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'income',  45000, 'rent',        'Проживание Кузнецов Н.П.',          NOW() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'income',  38000, 'rent',        'Проживание Соколова Т.А.',          NOW() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'income',  52000, 'rent',        'Проживание Попов А.И.',             NOW() - interval '7 days'),
  ('11111111-1111-1111-1111-111111111111', 'income',  41000, 'rent',        'Проживание Новикова Е.Н.',          NOW() - interval '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'income',  35000, 'rent',        'Проживание Федоров М.А.',           NOW() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111111', 'income',  15000, 'rent',        'Предоплата Орлов Д.В.',             NOW() - interval '15 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 12500, 'food',        'Закупка продуктов — неделя 1',       NOW() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 15800, 'food',        'Закупка продуктов — неделя 2',       NOW() - interval '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  4800, 'food',        'Поставка диетического питания',      NOW() - interval '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  3500, 'food',        'Фрукты и овощи',                    NOW() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  3200, 'chemicals',   'Бытовая химия',                     NOW() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 45000, 'salary',      'Зарплата управляющей Петрова М.',    NOW() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 28000, 'salary',      'Зарплата горничной Сидорова А.',    NOW() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'expense', 28000, 'salary',      'Зарплата горничной Козлова Е.',     NOW() - interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  8500, 'utilities',   'Электричество — май 2026',           NOW() - interval '8 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  4200, 'utilities',   'Водоснабжение — май 2026',           NOW() - interval '8 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  1500, 'utilities',   'Интернет и телефон',                 NOW() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  6000, 'maintenance', 'Ремонт санузла №205',                NOW() - interval '12 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  2800, 'maintenance', 'Замена замка №103',                  NOW() - interval '18 days'),
  ('11111111-1111-1111-1111-111111111111', 'expense',  9500, 'maintenance', 'Покраска коридора 3 этаж',            NOW() - interval '20 days');

-- Assign guests to occupied/booked rooms
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '101' LIMIT 1) WHERE first_name = 'Николай' AND last_name = 'Кузнецов';
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '102' LIMIT 1) WHERE first_name = 'Татьяна' AND last_name = 'Соколова';
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '108' LIMIT 1) WHERE first_name = 'Александр' AND last_name = 'Попов';
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '109' LIMIT 1) WHERE first_name = 'Елена' AND last_name = 'Новикова';
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '205' LIMIT 1) WHERE first_name = 'Михаил' AND last_name = 'Федоров';
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '206' LIMIT 1) WHERE first_name = 'Ольга' AND last_name = 'Морозова';
UPDATE guests SET room_id = (SELECT id FROM rooms WHERE number = '302' LIMIT 1) WHERE first_name = 'Сергей' AND last_name = 'Волков';

-- Medical prescriptions (doctor Алексей Смирнов)
INSERT INTO medical_prescriptions (guest_id, doctor_id, medication_name, dosage, frequency, start_date, end_date) VALUES
  ((SELECT id FROM guests WHERE first_name = 'Николай' AND last_name = 'Кузнецов' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Лизиноприл', '10 мг', '1 раз утром', '2026-05-01', '2026-06-01'),
  ((SELECT id FROM guests WHERE first_name = 'Николай' AND last_name = 'Кузнецов' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Амлодипин', '5 мг', '1 раз утром', '2026-05-01', '2026-06-01'),
  ((SELECT id FROM guests WHERE first_name = 'Татьяна' AND last_name = 'Соколова' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Метформин', '850 мг', '2 раза после еды', '2026-04-15', '2026-07-15'),
  ((SELECT id FROM guests WHERE first_name = 'Татьяна' AND last_name = 'Соколова' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Гликлазид', '60 мг', '1 раз утром', '2026-04-15', '2026-07-15'),
  ((SELECT id FROM guests WHERE first_name = 'Александр' AND last_name = 'Попов' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Аторвастатин', '20 мг', '1 раз вечером', '2026-03-01', '2026-06-01'),
  ((SELECT id FROM guests WHERE first_name = 'Елена' AND last_name = 'Новикова' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Омепразол', '20 мг', '1 раз до еды', '2026-05-10', '2026-06-10'),
  ((SELECT id FROM guests WHERE first_name = 'Михаил' AND last_name = 'Федоров' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Варфарин', '5 мг', '1 раз вечером', '2026-01-01', '2026-07-01'),
  ((SELECT id FROM guests WHERE first_name = 'Сергей' AND last_name = 'Волков' LIMIT 1),
   '22222222-2222-2222-2222-222222222224', 'Бисопролол', '5 мг', '1 раз утром', '2026-04-01', '2026-07-01');

-- Medication logs (today's schedule)
INSERT INTO medication_logs (prescription_id, scheduled_time, status, taken_at, nurse_id)
SELECT
  mp.id,
  CASE
    WHEN mp.frequency LIKE '%утром%' THEN CURRENT_DATE + interval '8 hours'
    WHEN mp.frequency LIKE '%вечером%' THEN CURRENT_DATE + interval '20 hours'
    WHEN mp.frequency LIKE '%2 раза%' THEN CURRENT_DATE + interval '8 hours'
    ELSE CURRENT_DATE + interval '12 hours'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'taken'
    WHEN 1 THEN 'pending'
    ELSE 'taken'
  END,
  CASE WHEN (random() * 3)::int < 2 THEN CURRENT_DATE + interval '8 hours' + (random() * 30 * interval 'minute') ELSE NULL END,
  '22222222-2222-2222-2222-222222222225'  -- Сидорова Анна (maid) as nurse
FROM medical_prescriptions mp;
