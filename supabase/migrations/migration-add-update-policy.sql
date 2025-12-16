-- ============================================
-- MIGRACIÓN: Añadir política de UPDATE para secret_santa_assignments
-- ============================================

-- Permitir que los profesores actualicen las asignaciones de sus salas
-- (necesario para actualizar el campo email_sent)
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

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ve a tu proyecto en Supabase (https://supabase.com)
-- 2. Navega a SQL Editor en el menú lateral
-- 3. Copia y pega este script
-- 4. Haz clic en "Run" para ejecutarlo
-- 5. Verifica en Authentication > Policies que la nueva política aparezca
-- ============================================
