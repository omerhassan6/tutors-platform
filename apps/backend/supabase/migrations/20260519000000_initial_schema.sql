-- ============================================================
-- Tutor Management Platform — Initial Schema
-- ============================================================

-- ------------------------------------
-- Utility: updated_at trigger function
-- ------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------
-- BATCHES
-- ------------------------------------
CREATE TABLE IF NOT EXISTS batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  subject       text NOT NULL,
  schedule      text,
  fee_amount    integer NOT NULL DEFAULT 0,  -- stored in smallest currency unit
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_batches_tutor_id  ON batches(tutor_id);
CREATE INDEX idx_batches_deleted_at ON batches(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own batches"
  ON batches FOR ALL
  USING (auth.uid() = tutor_id);

-- ------------------------------------
-- STUDENTS
-- ------------------------------------
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE IF NOT EXISTS students (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id      uuid REFERENCES batches(id) ON DELETE SET NULL,
  name          text NOT NULL,
  email         text,
  phone         text,
  parent_name   text,
  parent_phone  text,
  status        student_status NOT NULL DEFAULT 'active',
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  note          text,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_tutor_id  ON students(tutor_id);
CREATE INDEX idx_students_batch_id  ON students(batch_id);
CREATE INDEX idx_students_status    ON students(status);
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own students"
  ON students FOR ALL
  USING (auth.uid() = tutor_id);

-- ------------------------------------
-- ATTENDANCE
-- ------------------------------------
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

CREATE TABLE IF NOT EXISTS attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_date  date NOT NULL,
  status      attendance_status NOT NULL,
  marked_by   uuid REFERENCES auth.users(id),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_date)  -- one record per student per day
);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_date ON attendance(class_date);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Tutors access attendance for their students
CREATE POLICY "Tutors access attendance for own students"
  ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = attendance.student_id
        AND s.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- FEE RECORDS
-- ------------------------------------
CREATE TYPE fee_status AS ENUM ('pending', 'paid', 'overdue', 'waived');

CREATE TABLE IF NOT EXISTS fee_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount       integer NOT NULL,  -- smallest currency unit
  due_date     date NOT NULL,
  paid_date    date,
  status       fee_status NOT NULL DEFAULT 'pending',
  invoice_url  text,
  note         text,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fee_records_student_id ON fee_records(student_id);
CREATE INDEX idx_fee_records_status     ON fee_records(status);
CREATE INDEX idx_fee_records_due_date   ON fee_records(due_date);

CREATE TRIGGER trg_fee_records_updated_at
  BEFORE UPDATE ON fee_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors access fees for own students"
  ON fee_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = fee_records.student_id
        AND s.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- ASSIGNMENTS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  due_date     timestamptz NOT NULL,
  file_url     text,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_batch_id  ON assignments(batch_id);
CREATE INDEX idx_assignments_due_date  ON assignments(due_date);

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage assignments for own batches"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = assignments.batch_id
        AND b.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- SUBMISSIONS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_url       text NOT NULL,
  note           text,
  feedback       text,
  grade          integer CHECK (grade >= 0 AND grade <= 100),
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  graded_at      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id    ON submissions(student_id);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors access submissions for own assignments"
  ON submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN batches b ON b.id = a.batch_id
      WHERE a.id = submissions.assignment_id
        AND b.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- MESSAGES
-- ------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid NOT NULL REFERENCES auth.users(id),
  recipient_id  uuid NOT NULL REFERENCES auth.users(id),
  content       text NOT NULL,
  is_read       boolean NOT NULL DEFAULT false,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_sender_id    ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_sent_at      ON messages(sent_at DESC);

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own messages"
  ON messages FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ------------------------------------
-- ANNOUNCEMENTS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text NOT NULL,
  target_batches  uuid[] DEFAULT '{}',
  published_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_tutor_id ON announcements(tutor_id);

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own announcements"
  ON announcements FOR ALL
  USING (auth.uid() = tutor_id);

-- ------------------------------------
-- CLASSES (scheduled sessions)
-- ------------------------------------
CREATE TYPE class_platform AS ENUM ('zoom', 'meet', 'teams', 'in_person');

CREATE TABLE IF NOT EXISTS classes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title            text NOT NULL,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
  meeting_url      text,
  platform         class_platform,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_batch_id      ON classes(batch_id);
CREATE INDEX idx_classes_scheduled_at  ON classes(scheduled_at);

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage classes for own batches"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = classes.batch_id
        AND b.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- EXAMS
-- ------------------------------------
CREATE TYPE exam_type AS ENUM ('mcq', 'written', 'oral');

CREATE TABLE IF NOT EXISTS exams (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title        text NOT NULL,
  exam_type    exam_type NOT NULL,
  total_marks  integer NOT NULL,
  scheduled_at timestamptz NOT NULL,
  questions    jsonb DEFAULT '[]',
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exams_batch_id     ON exams(batch_id);
CREATE INDEX idx_exams_scheduled_at ON exams(scheduled_at);

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage exams for own batches"
  ON exams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = exams.batch_id
        AND b.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- EXAM RESULTS
-- ------------------------------------
CREATE TABLE IF NOT EXISTS exam_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks       integer NOT NULL CHECK (marks >= 0),
  answers     jsonb DEFAULT '[]',
  graded_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

CREATE INDEX idx_exam_results_exam_id    ON exam_results(exam_id);
CREATE INDEX idx_exam_results_student_id ON exam_results(student_id);

CREATE TRIGGER trg_exam_results_updated_at
  BEFORE UPDATE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors access results for own exams"
  ON exam_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams e
      JOIN batches b ON b.id = e.batch_id
      WHERE e.id = exam_results.exam_id
        AND b.tutor_id = auth.uid()
    )
  );

-- ------------------------------------
-- RESOURCES
-- ------------------------------------
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'image', 'link', 'note');

CREATE TABLE IF NOT EXISTS resources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id     uuid REFERENCES batches(id) ON DELETE SET NULL,
  title        text NOT NULL,
  type         resource_type NOT NULL,
  file_url     text,
  link_url     text,
  description  text,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_resources_tutor_id ON resources(tutor_id);
CREATE INDEX idx_resources_batch_id ON resources(batch_id);
CREATE INDEX idx_resources_type     ON resources(type);

CREATE TRIGGER trg_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors manage own resources"
  ON resources FOR ALL
  USING (auth.uid() = tutor_id);

-- ------------------------------------
-- NOTIFICATIONS
-- ------------------------------------
CREATE TYPE notification_type AS ENUM ('fee_reminder', 'attendance_alert', 'assignment_due', 'announcement', 'class_reminder');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'in_app');

CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  channel       notification_channel NOT NULL DEFAULT 'in_app',
  message       text NOT NULL,
  is_read       boolean NOT NULL DEFAULT false,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read      ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_sent_at      ON notifications(sent_at DESC);

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = recipient_id);

-- ------------------------------------
-- ANALYTICS EVENTS (internal tracking)
-- ------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  event_name  text NOT NULL,
  properties  jsonb DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_user_id     ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name  ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_occurred_at ON analytics_events(occurred_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- ------------------------------------
-- AUDIT LOG
-- ------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  action      text NOT NULL,
  table_name  text NOT NULL,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name  ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service-role (backend) can write audit logs
CREATE POLICY "Service role manages audit logs"
  ON audit_logs FOR ALL
  USING (false)  -- deny all client access; backend uses service-role key which bypasses RLS
  WITH CHECK (false);

-- ------------------------------------
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- ------------------------------------
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
