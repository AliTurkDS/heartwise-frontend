import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LayoutDashboard, Calendar, Clock, Check, X, User, FileText, Brain, Activity, Send, Pencil, Trash2 } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const doctorLinks = [
  { to: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { to: "/doctor/patients", icon: User, label: "Patient Records" },
  { to: "/doctor/schedule", icon: Clock, label: "Availability" },
];

type Appointment = {
  id: string; patient_id: string; patient_name: string; patient_gender: string | null;
  patient_age: number | null; patient_phone: string | null; patient_notes: string | null;
  appointment_date: string; appointment_time: string; status: string; doctor_specialization: string;
};

// ─── Ensure doctor record exists ─────────────────────────────────────────────
const useEnsureDoctorRecord = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const ensure = async () => {
      const { data } = await supabase.from("doctors").select("id").eq("user_id", user.id).maybeSingle();
      if (!data) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        await supabase.from("doctors").insert({
          user_id: user.id,
          full_name: profile?.full_name || user.email || "Doctor",
          specialization: "General Physician",
        });
      }
    };
    ensure();
  }, [user]);
};

// ─── Overview ────────────────────────────────────────────────────────────────
const Overview = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ pending: 0, accepted: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("appointments").select("status").eq("doctor_id", user.id).then(({ data }) => {
      const pending = data?.filter((a) => a.status === "pending").length ?? 0;
      const accepted = data?.filter((a) => a.status === "accepted").length ?? 0;
      setCounts({ pending, accepted });
    });
  }, [user]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Doctor Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Manage your appointments and patients.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          { label: "Accepted Appointments", value: String(counts.accepted), icon: Calendar, color: "text-primary" },
          { label: "Pending Requests", value: String(counts.pending), icon: Clock, color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Appointments ─────────────────────────────────────────────────────────────
const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("id,patient_id,patient_name,patient_gender,patient_age,patient_phone,patient_notes,appointment_date,appointment_time,status,doctor_specialization")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });
    setAppointments(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const handleAction = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Appointment ${status}!`);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Appointments</h1>
      <p className="mt-1 text-muted-foreground">View and manage patient appointment requests.</p>
      <div className="mt-6 space-y-3">
        {appointments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No appointments yet.</p>}
        {appointments.map((a) => (
          <div key={a.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{a.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.appointment_date} · {a.appointment_time?.slice(0, 5)}
                    {a.patient_gender && ` · ${a.patient_gender}`}
                    {a.patient_age && ` · Age ${a.patient_age}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs border-primary/30" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  {expanded === a.id ? "Hide" : "Details"}
                </Button>
                {a.status === "pending" ? (
                  <>
                    <Button size="sm" className="gap-1" onClick={() => handleAction(a.id, "accepted")}><Check className="h-3 w-3" /> Accept</Button>
                    <Button size="sm" variant="outline" className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction(a.id, "rejected")}>
                      <X className="h-3 w-3" /> Reject
                    </Button>
                  </>
                ) : (
                  <span className={`text-xs font-medium rounded-full px-3 py-1 ${a.status === "accepted" ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
            {expanded === a.id && (
              <div className="border-t border-border/50 bg-secondary/30 px-4 py-3 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted-foreground">Phone</span><p>{a.patient_phone || "—"}</p></div>
                <div><span className="text-xs text-muted-foreground">Gender</span><p>{a.patient_gender || "—"}</p></div>
                <div><span className="text-xs text-muted-foreground">Age</span><p>{a.patient_age ?? "—"}</p></div>
                <div className="col-span-2"><span className="text-xs text-muted-foreground">Notes / Symptoms</span><p className="mt-0.5">{a.patient_notes || "—"}</p></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Patient Records ──────────────────────────────────────────────────────────
type PatientRecord = { patient_id: string; patient_name: string };
type Upload = { id: string; file_name: string; file_type: string; created_at: string; file_path: string; ai_prediction: { label: string; confidence: number } | null };
type Prediction = { id: string; form_data: any; risk_score: string; created_at: string };

const PatientRecords = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selected, setSelected] = useState<PatientRecord | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [sending, setSending] = useState(false);
  const [doctorReports, setDoctorReports] = useState<{ id: string; title: string; content: string; created_at: string }[]>([]);
  const [editingReport, setEditingReport] = useState<{ id: string; title: string; content: string } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteReport, setDeleteReport] = useState<{ id: string; title: string } | null>(null);
  const [viewPrediction, setViewPrediction] = useState<Upload | null>(null);

  useEffect(() => {
    if (!user) return;
    // Get unique patients from accepted/completed appointments
    supabase.from("appointments")
      .select("patient_id, patient_name")
      .eq("doctor_id", user.id)
      .in("status", ["accepted", "completed"])
      .then(({ data }) => {
        const unique = new Map<string, PatientRecord>();
        data?.forEach((a) => unique.set(a.patient_id, { patient_id: a.patient_id, patient_name: a.patient_name }));
        setPatients(Array.from(unique.values()));
      });
  }, [user]);

  const loadPatientData = async (p: PatientRecord) => {
    setSelected(p);
    const [{ data: up }, { data: pred }, { data: dr }] = await Promise.all([
      supabase.from("patient_uploads").select("*").eq("patient_id", p.patient_id).order("created_at", { ascending: false }),
      supabase.from("prediction_results").select("*").eq("patient_id", p.patient_id).order("created_at", { ascending: false }),
      supabase.from("doctor_reports").select("id, title, content, created_at").eq("patient_id", p.patient_id).eq("doctor_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setUploads((up ?? []) as unknown as Upload[]);
    setPredictions(pred ?? []);
    setDoctorReports(dr ?? []);
  };

  const handleSendReport = async () => {
    if (!reportTitle.trim() || !reportContent.trim()) { toast.error("Fill in both title and content."); return; }
    if (!user || !selected) return;
    setSending(true);

    // Find an appointment id for this patient
    const { data: appts } = await supabase.from("appointments")
      .select("id").eq("doctor_id", user.id).eq("patient_id", selected.patient_id)
      .in("status", ["accepted", "completed"]).limit(1);

    const { error } = await supabase.from("doctor_reports").insert({
      doctor_id: user.id,
      patient_id: selected.patient_id,
      appointment_id: appts?.[0]?.id ?? null,
      title: reportTitle,
      content: reportContent,
    });

    if (error) { toast.error(error.message); }
    else {
      toast.success("Report sent to patient!");
      setReportTitle("");
      setReportContent("");
      loadPatientData(selected);
    }
    setSending(false);
  };

  if (!selected) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold">Patient Records</h1>
        <p className="mt-1 text-muted-foreground">View records of patients who have booked with you.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {patients.length === 0 && <p className="text-sm text-muted-foreground py-8 col-span-full text-center">No patients with accepted appointments yet.</p>}
          {patients.map((p) => (
            <button key={p.patient_id} onClick={() => loadPatientData(p)}
              className="rounded-xl border border-border/50 bg-card p-5 text-left hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{p.patient_name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="border-primary/30" onClick={() => setSelected(null)}>← Back</Button>
        <h1 className="font-display text-2xl font-bold">{selected.patient_name}</h1>
      </div>

      {/* Uploaded Files */}
      <h2 className="mt-6 font-display text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Uploaded Files</h2>
      <div className="mt-3 space-y-2">
        {uploads.length === 0 && <p className="text-sm text-muted-foreground py-4">No uploads from this patient.</p>}
        {uploads.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3">
            <div className="flex items-center gap-3">
              {u.file_type === "ecg" ? <Activity className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
              <div>
                <p className="text-sm font-medium">{u.file_name}</p>
                <p className="text-xs text-muted-foreground">{u.file_type.toUpperCase()} · {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {u.file_type === "ecg" && u.ai_prediction && (
                <Button variant="outline" size="sm" className="border-primary/30 gap-1.5" onClick={() => setViewPrediction(u)}>
                  <Brain className="h-3.5 w-3.5" /> View Prediction
                </Button>
              )}
              <Button variant="outline" size="sm" className="border-primary/30" onClick={async () => {
                const { data, error } = await supabase.storage.from("medical-files").createSignedUrl(u.file_path, 300);
                if (error || !data?.signedUrl) { toast.error("Could not load file"); return; }
                window.open(data.signedUrl, "_blank");
              }}>View</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Prediction Results */}
      <h2 className="mt-6 font-display text-lg font-semibold flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Prediction Results</h2>
      <div className="mt-3 space-y-2">
        {predictions.length === 0 && <p className="text-sm text-muted-foreground py-4">No predictions submitted.</p>}
        {predictions.map((p) => (
          <div key={p.id} className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risk Score: {p.risk_score}</span>
              <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {Object.entries(p.form_data as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><span className="capitalize">{k}:</span> {v}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Previous Reports */}
      {doctorReports.length > 0 && (
        <>
          <h2 className="mt-6 font-display text-lg font-semibold">Your Previous Reports</h2>
          <div className="mt-3 space-y-2">
            {doctorReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{r.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 border-primary/30"
                      onClick={() => { setEditingReport(r); setEditTitle(r.title); setEditContent(r.content); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteReport({ id: r.id, title: r.title })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Write Report */}
      <h2 className="mt-6 font-display text-lg font-semibold">Write Report for Patient</h2>
      <div className="mt-3 rounded-xl border border-border/50 bg-card p-4 space-y-3">
        <div><Label>Title</Label><Input placeholder="e.g. Initial Assessment" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} /></div>
        <div><Label>Content</Label><Textarea placeholder="Write your medical report here..." rows={5} value={reportContent} onChange={(e) => setReportContent(e.target.value)} /></div>
        <Button className="gap-2" onClick={handleSendReport} disabled={sending}>
          <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Report to Patient"}
        </Button>
      </div>

      {/* Edit report dialog */}
      <Dialog open={!!editingReport} onOpenChange={(o) => !o && setEditingReport(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
            <div><Label>Content</Label><Textarea rows={5} value={editContent} onChange={(e) => setEditContent(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editingReport) return;
              const { error } = await supabase.from("doctor_reports").update({ title: editTitle, content: editContent }).eq("id", editingReport.id);
              if (error) { toast.error(error.message); return; }
              toast.success("Report updated");
              setEditingReport(null);
              if (selected) loadPatientData(selected);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete report confirm */}
      <AlertDialog open={!!deleteReport} onOpenChange={(o) => !o && setDeleteReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes "{deleteReport?.title}". This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!deleteReport) return;
              const { error } = await supabase.from("doctor_reports").delete().eq("id", deleteReport.id);
              if (error) { toast.error(error.message); return; }
              toast.success("Report deleted");
              setDeleteReport(null);
              if (selected) loadPatientData(selected);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ECG Prediction view */}
      <Dialog open={!!viewPrediction} onOpenChange={(o) => !o && setViewPrediction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> ECG AI Prediction</DialogTitle>
          </DialogHeader>
          {viewPrediction?.ai_prediction && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">File</p>
                <p className="text-sm font-medium">{viewPrediction.file_name}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">Prediction</p>
                <p className="text-lg font-semibold">{viewPrediction.ai_prediction.label}</p>
                {viewPrediction.ai_prediction.confidence > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Confidence: {(viewPrediction.ai_prediction.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPrediction(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Schedule ─────────────────────────────────────────────────────────────────
const Schedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({
    Monday: { start: "09:00", end: "17:00", enabled: true },
    Tuesday: { start: "09:00", end: "17:00", enabled: true },
    Wednesday: { start: "09:00", end: "17:00", enabled: true },
    Thursday: { start: "09:00", end: "17:00", enabled: true },
    Friday: { start: "09:00", end: "17:00", enabled: true },
  });
  const [editing, setEditing] = useState<string | null>(null);

  const handleSave = async (day: string) => {
    setEditing(null);
    const enabledDays = Object.entries(schedule).filter(([, s]) => s.enabled).map(([d]) => d.slice(0, 3)).join(", ");
    if (user) await supabase.from("doctors").update({ available_days: enabledDays }).eq("user_id", user.id);
    toast.success(`${day} schedule updated!`);
  };

  const toggleDay = (day: string) => {
    setSchedule((p) => ({ ...p, [day]: { ...p[day], enabled: !p[day].enabled } }));
    toast.success(`${day} ${schedule[day].enabled ? "disabled" : "enabled"}`);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Manage Availability</h1>
      <p className="mt-1 text-muted-foreground">Set your working hours and availability.</p>
      <div className="mt-6 grid gap-3">
        {Object.entries(schedule).map(([day, s]) => (
          <div key={day} className={`flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 ${!s.enabled ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className={`border-primary/30 text-xs w-16 ${s.enabled ? "bg-primary/10 text-primary" : ""}`} onClick={() => toggleDay(day)}>
                {s.enabled ? "On" : "Off"}
              </Button>
              <span className="font-medium text-sm">{day}</span>
            </div>
            {editing === day ? (
              <div className="flex items-center gap-2">
                <Input type="time" className="w-28 text-sm" value={s.start} onChange={(e) => setSchedule((p) => ({ ...p, [day]: { ...p[day], start: e.target.value } }))} />
                <span className="text-muted-foreground">—</span>
                <Input type="time" className="w-28 text-sm" value={s.end} onChange={(e) => setSchedule((p) => ({ ...p, [day]: { ...p[day], end: e.target.value } }))} />
                <Button size="sm" onClick={() => handleSave(day)}>Save</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{s.start} - {s.end}</span>
                <Button variant="outline" size="sm" className="border-primary/30" onClick={() => setEditing(day)}>Edit</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard Root ────────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  useEnsureDoctorRecord();
  return (
  <DashboardLayout role="Doctor" links={doctorLinks}>
    <Routes>
      <Route index element={<Overview />} />
      <Route path="appointments" element={<DoctorAppointments />} />
      <Route path="patients" element={<PatientRecords />} />
      <Route path="schedule" element={<Schedule />} />
    </Routes>
  </DashboardLayout>
  );
};

export default DoctorDashboard;
