
-- Storage bucket for medical files (ECG images, reports)
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

-- Storage policies
CREATE POLICY "Patients upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Patients view own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors view patient files via appointments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-files' AND
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE doctor_id = auth.uid()
    AND patient_id::text = (storage.foldername(name))[1]
    AND status IN ('accepted', 'completed')
  )
);

-- Patient uploads table (ECG + reports)
CREATE TABLE public.patient_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('ecg', 'report')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own uploads"
ON public.patient_uploads FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view own uploads"
ON public.patient_uploads FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient uploads via appointments"
ON public.patient_uploads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE doctor_id = auth.uid()
    AND patient_id = patient_uploads.patient_id
    AND status IN ('accepted', 'completed')
  )
);

-- Prediction results table
CREATE TABLE public.prediction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  form_data JSONB NOT NULL,
  risk_score TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can insert own predictions"
ON public.prediction_results FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view own predictions"
ON public.prediction_results FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient predictions via appointments"
ON public.prediction_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE doctor_id = auth.uid()
    AND patient_id = prediction_results.patient_id
    AND status IN ('accepted', 'completed')
  )
);

-- Doctor reports table (doctor writes for patient)
CREATE TABLE public.doctor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can insert reports for their patients"
ON public.doctor_reports FOR INSERT
WITH CHECK (
  auth.uid() = doctor_id AND
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE doctor_id = auth.uid()
    AND patient_id = doctor_reports.patient_id
    AND status IN ('accepted', 'completed')
  )
);

CREATE POLICY "Doctors can view own reports"
ON public.doctor_reports FOR SELECT
USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view reports written for them"
ON public.doctor_reports FOR SELECT
USING (auth.uid() = patient_id);
