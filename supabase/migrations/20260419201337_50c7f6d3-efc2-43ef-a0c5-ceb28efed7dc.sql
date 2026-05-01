
-- 1. Schema additions
ALTER TABLE public.patient_uploads ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.doctor_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false;

-- 2. RLS: uploader edit/delete
CREATE POLICY "Patients can update own uploads"
  ON public.patient_uploads FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete own uploads"
  ON public.patient_uploads FOR DELETE
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update own reports"
  ON public.doctor_reports FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own reports"
  ON public.doctor_reports FOR DELETE
  USING (auth.uid() = doctor_id);

-- 3. updated_at trigger for doctor_reports
CREATE TRIGGER trg_doctor_reports_updated
BEFORE UPDATE ON public.doctor_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Notification triggers
-- 4a. Patient upload -> notify linked doctors
CREATE OR REPLACE FUNCTION public.notify_doctors_on_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  patient_full_name TEXT;
BEGIN
  SELECT full_name INTO patient_full_name FROM public.profiles WHERE id = NEW.patient_id;
  INSERT INTO public.notifications (user_id, title, message, link)
  SELECT DISTINCT a.doctor_id,
         'New patient ' || CASE WHEN NEW.file_type = 'ecg' THEN 'ECG' ELSE 'Report' END,
         COALESCE(patient_full_name, 'A patient') || ' uploaded "' || NEW.file_name || '".',
         '/doctor/patients'
  FROM public.appointments a
  WHERE a.patient_id = NEW.patient_id
    AND a.status IN ('accepted', 'completed');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_doctors_on_upload
AFTER INSERT ON public.patient_uploads
FOR EACH ROW EXECUTE FUNCTION public.notify_doctors_on_upload();

-- 4b. Doctor report -> notify patient
CREATE OR REPLACE FUNCTION public.notify_patient_on_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_name TEXT;
BEGIN
  SELECT full_name INTO doc_name FROM public.doctors WHERE user_id = NEW.doctor_id;
  INSERT INTO public.notifications (user_id, title, message, link)
  VALUES (
    NEW.patient_id,
    'New medical report',
    COALESCE(doc_name, 'Your doctor') || ' shared a report: "' || NEW.title || '".',
    '/patient/reports'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_patient_on_report
AFTER INSERT ON public.doctor_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_patient_on_report();

-- 4c. Appointment status change -> notify patient
CREATE OR REPLACE FUNCTION public.notify_patient_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted', 'rejected', 'completed') THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.patient_id,
      'Appointment ' || NEW.status,
      'Your appointment with Dr. ' || NEW.doctor_name || ' on ' || NEW.appointment_date || ' was ' || NEW.status || '.',
      '/patient/appointments'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_patient_on_status_change
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_patient_on_status_change();

-- 5. 1-hour reminder function (scheduled via pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appt RECORD;
  appt_ts TIMESTAMPTZ;
BEGIN
  FOR appt IN
    SELECT * FROM public.appointments
    WHERE status = 'accepted' AND reminder_sent = false
  LOOP
    appt_ts := (appt.appointment_date::text || ' ' || appt.appointment_time::text)::timestamptz;
    IF appt_ts BETWEEN now() + interval '50 minutes' AND now() + interval '70 minutes' THEN
      INSERT INTO public.notifications (user_id, title, message, link) VALUES
      (appt.patient_id, 'Appointment reminder',
       'Your appointment with Dr. ' || appt.doctor_name || ' is in about 1 hour.',
       '/patient/appointments'),
      (appt.doctor_id, 'Appointment reminder',
       'Your appointment with ' || appt.patient_name || ' is in about 1 hour.',
       '/doctor/appointments');
      UPDATE public.appointments SET reminder_sent = true WHERE id = appt.id;
    END IF;
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'appointment-reminders-every-10-min',
  '*/10 * * * *',
  $$ SELECT public.send_appointment_reminders(); $$
);
