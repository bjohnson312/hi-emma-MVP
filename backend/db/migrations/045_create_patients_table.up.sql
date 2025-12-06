CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  created_by_provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  medical_record_number TEXT,
  address TEXT,
  
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patients_provider ON patients(created_by_provider_id);
CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_patients_active ON patients(created_by_provider_id, is_active);
CREATE INDEX idx_patients_email ON patients(created_by_provider_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_patients_mrn ON patients(created_by_provider_id, medical_record_number) WHERE medical_record_number IS NOT NULL;

ALTER TABLE care_plans ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;
CREATE INDEX idx_care_plans_patient ON care_plans(patient_id);

ALTER TABLE provider_patient_access ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;
CREATE INDEX idx_provider_patient_access_patient_id ON provider_patient_access(patient_id);
