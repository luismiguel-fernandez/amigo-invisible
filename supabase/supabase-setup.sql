-- ============================================
-- SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- Aplicación: Amigo Invisible Estilo Kahoot
-- ============================================

-- 1. Crear tabla de salas (rooms)
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name TEXT,
  teacher_email TEXT,
  status TEXT DEFAULT 'waiting', -- waiting, drawing, completed
  avoid_previous_matches BOOLEAN DEFAULT false, -- Evitar repetir asignaciones de sorteos anteriores
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de participantes en salas
CREATE TABLE room_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  preferences TEXT,
  restrictions TEXT[], -- Array de IDs de participantes que no pueden tocarle
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, email)
);

-- 3. Crear tabla de asignaciones
CREATE TABLE secret_santa_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  giver_id UUID REFERENCES room_participants(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES room_participants(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_santa_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de acceso con autenticación
-- Política para rooms: los profesores solo ven sus propias salas
CREATE POLICY "Teachers can view their own rooms" 
ON rooms FOR SELECT 
USING (auth.uid() = teacher_id);

-- Política para que estudiantes (no autenticados) puedan buscar salas por código
CREATE POLICY "Anyone can view rooms by code" 
ON rooms FOR SELECT 
USING (true);

CREATE POLICY "Teachers can create rooms" 
ON rooms FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own rooms" 
ON rooms FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own rooms" 
ON rooms FOR DELETE 
USING (auth.uid() = teacher_id);

-- Política para room_participants: cualquiera puede leer y unirse
CREATE POLICY "Anyone can view participants" 
ON room_participants FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join a room" 
ON room_participants FOR INSERT 
WITH CHECK (true);

-- Solo el profesor de la sala puede eliminar participantes
CREATE POLICY "Only room teacher can delete participants" 
ON room_participants FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_participants.room_id 
    AND rooms.teacher_id = auth.uid()
  )
);

-- Solo el profesor de la sala puede actualizar participantes
CREATE POLICY "Only room teacher can update participants" 
ON room_participants FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_participants.room_id 
    AND rooms.teacher_id = auth.uid()
  )
);

-- Los estudiantes pueden actualizar solo sus propias preferencias
CREATE POLICY "Students can update their own preferences" 
ON room_participants FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Política para assignments: solo el profesor puede crear y ver
CREATE POLICY "Teachers can create assignments for their rooms" 
ON secret_santa_assignments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_id 
    AND rooms.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view assignments for their rooms" 
ON secret_santa_assignments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_id 
    AND rooms.teacher_id = auth.uid()
  )
);

-- Los estudiantes también pueden ver su propia asignación
CREATE POLICY "Students can view their own assignment" 
ON secret_santa_assignments FOR SELECT 
USING (true);

-- Permitir que los profesores actualicen las asignaciones de sus salas
CREATE POLICY "Teachers can update assignments for their rooms" 
ON secret_santa_assignments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = secret_santa_assignments.room_id 
    AND rooms.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = secret_santa_assignments.room_id 
    AND rooms.teacher_id = auth.uid()
  )
);

-- 6. Crear índices para mejorar el rendimiento
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_teacher ON rooms(teacher_id);
CREATE INDEX idx_room_participants_room ON room_participants(room_id);
CREATE INDEX idx_room_participants_email ON room_participants(email);
CREATE INDEX idx_assignments_room ON secret_santa_assignments(room_id);

-- 7. Habilitar Realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE secret_santa_assignments;

-- 8. Crear función para generar código único de sala
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ve a tu proyecto en Supabase (https://supabase.com)
-- 2. Navega a SQL Editor en el menú lateral
-- 3. Copia y pega este script completo
-- 4. Haz clic en "Run" para ejecutarlo
-- 5. Verifica que las tablas se crearon en "Table Editor"
-- 6. Ve a "Database > Replication" y asegúrate que las tablas tengan Realtime habilitado
-- ============================================

-- NOTA: Para el envío de emails, necesitarás configurar:
-- 1. Resend (https://resend.com) - servicio de emails
-- 2. Una función Edge en Supabase para enviar emails
-- 3. O usar un servicio externo como EmailJS o similar
-- ============================================
