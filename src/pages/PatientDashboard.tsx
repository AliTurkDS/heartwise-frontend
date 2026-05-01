import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Activity, Brain, Calendar, FileText, Heart, LayoutDashboard } from "lucide-react";
import { Routes, Route, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PredictRisk from "./patient/PredictRisk";
import UploadECG from "./patient/UploadECG";
import Reports from "./patient/Reports";
import Appointments from "./patient/Appointments";

const patientLinks = [
  { to: "/patient", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patient/predict", icon: Brain, label: "Predict Risk" },
  { to: "/patient/ecg", icon: Activity, label: "Upload ECG" },
  { to: "/patient/reports", icon: FileText, label: "Reports" },
  { to: "/patient/appointments", icon: Calendar, label: "Appointments" },
];

const Overview = () => {
  const { user } = useAuth();
  const [apptCount, setApptCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("appointments")
      .select("id", { count: "exact" })
      .eq("patient_id", user.id)
      .in("status", ["accepted", "pending"])
      .then(({ count }) => setApptCount(count ?? 0));
    supabase
      .from("patient_uploads")
      .select("id", { count: "exact" })
      .eq("patient_id", user.id)
      .then(({ count }) => setReportCount(count ?? 0));
  }, [user]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Patient Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Welcome back! Here's your health overview.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Risk Score", value: "—", sub: "Complete prediction first", icon: Heart, color: "text-heart" },
          { label: "Appointments", value: String(apptCount), sub: "Upcoming / pending", icon: Calendar, color: "text-primary" },
          { label: "Reports", value: String(reportCount), sub: "Uploaded documents", icon: FileText, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border/50 bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/patient/predict"><Button className="gap-2"><Brain className="h-4 w-4" /> Predict Risk</Button></Link>
          <Link to="/patient/ecg"><Button variant="outline" className="gap-2 border-primary/30"><Activity className="h-4 w-4" /> Upload ECG</Button></Link>
          <Link to="/patient/appointments"><Button variant="outline" className="gap-2 border-primary/30"><Calendar className="h-4 w-4" /> Book Appointment</Button></Link>
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = () => (
  <DashboardLayout role="Patient" links={patientLinks}>
    <Routes>
      <Route index element={<Overview />} />
      <Route path="predict" element={<PredictRisk />} />
      <Route path="ecg" element={<UploadECG />} />
      <Route path="reports" element={<Reports />} />
      <Route path="appointments" element={<Appointments />} />
    </Routes>
  </DashboardLayout>
);

export default PatientDashboard;
