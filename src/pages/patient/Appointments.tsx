import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Doctor = { id: string; user_id: string; full_name: string; specialization: string; available_days: string };
type Appointment = {
  id: string; doctor_name: string; doctor_specialization: string;
  appointment_date: string; appointment_time: string; status: string;
};

const Appointments = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [booking, setBooking] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ date: "", time: "", age: "", phone: "", notes: "", gender: "" });
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    supabase.from("doctors").select("*").eq("is_available", true).then(({ data }) => setDoctors(data ?? []));
    if (user) {
      supabase.from("profiles").select("full_name, gender").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data?.full_name) setPatientName(data.full_name);
        if (data?.gender) setForm((p) => ({ ...p, gender: data.gender ?? "" }));
      });
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("id, doctor_name, doctor_specialization, appointment_date, appointment_time, status")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    setAppointments(data ?? []);
  };

  const handleBook = async () => {
    if (!booking || !form.date || !form.time) { toast.error("Please select a date and time."); return; }
    if (!user) return;
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id, doctor_id: booking.user_id,
      patient_name: patientName || user.email || "Patient",
      patient_gender: form.gender || null, patient_age: form.age ? parseInt(form.age) : null,
      patient_phone: form.phone || null, patient_notes: form.notes || null,
      doctor_name: booking.full_name, doctor_specialization: booking.specialization,
      appointment_date: form.date, appointment_time: form.time, status: "pending",
    });
    if (error) { toast.error("Failed to book: " + error.message); return; }

    // Send in-app notification to doctor
    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      title: "New Appointment Request",
      message: `${patientName || user.email || "A patient"} has booked an appointment for ${form.date} at ${form.time}.`,
      link: "/doctor/appointments",
    });

    toast.success(`Appointment booked with ${booking.full_name}!`);
    setBooking(null);
    setForm({ date: "", time: "", age: "", phone: "", notes: "", gender: form.gender });
    loadAppointments();
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    accepted: "bg-green-500/10 text-green-400",
    rejected: "bg-destructive/10 text-destructive",
    completed: "bg-secondary text-muted-foreground",
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Appointments</h1>
      <p className="mt-1 text-muted-foreground">Book and manage your appointments.</p>

      <h2 className="mt-6 font-display text-lg font-semibold">Available Doctors</h2>
      {doctors.length === 0 && <p className="mt-3 text-sm text-muted-foreground py-4">No doctors registered yet.</p>}
      <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => (
          <div key={d.id} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{d.full_name}</p>
                <p className="text-xs text-muted-foreground">{d.specialization}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Available: {d.available_days || "Mon-Fri"}</p>
            {booking?.id === d.id ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Age</Label><Input placeholder="30" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} className="text-sm" /></div>
                  <div>
                    <Label className="text-xs">Gender</Label>
                    <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div><Label className="text-xs">Phone</Label><Input placeholder="+1 555..." value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="text-sm" /></div>
                <div><Label className="text-xs">Notes / Symptoms</Label><Input placeholder="Describe symptoms..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="text-sm" /></div>
                <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="text-sm" />
                <Input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className="text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleBook}>Confirm</Button>
                  <Button size="sm" variant="outline" className="border-primary/30" onClick={() => setBooking(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" className="mt-3 w-full" onClick={() => setBooking(d)}>Book Appointment</Button>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Your Appointments</h2>
      <div className="mt-3 space-y-3">
        {appointments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No appointments yet.</p>}
        {appointments.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
            <div>
              <p className="text-sm font-medium">{a.doctor_name}</p>
              <p className="text-xs text-muted-foreground">{a.doctor_specialization}</p>
              <p className="text-xs text-muted-foreground">{a.appointment_date} · {a.appointment_time?.slice(0, 5)}</p>
            </div>
            <span className={`text-xs font-medium rounded-full px-3 py-1 ${statusColors[a.status] ?? "bg-secondary text-muted-foreground"}`}>
              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appointments;
