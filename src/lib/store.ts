// Simple localStorage-based store for sharing data between dashboards

export interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  spec: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string;
}

export interface Report {
  id: string;
  patient: string;
  name: string;
  type: "ecg" | "report";
  date: string;
  fileName: string;
}

const APPOINTMENTS_KEY = "heartcare_appointments";
const REPORTS_KEY = "heartcare_reports";

export function getAppointments(): Appointment[] {
  try {
    return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAppointments(appointments: Appointment[]) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

export function addAppointment(appt: Appointment) {
  const all = getAppointments();
  all.push(appt);
  saveAppointments(all);
}

export function updateAppointmentStatus(id: string, status: Appointment["status"]) {
  const all = getAppointments();
  const idx = all.findIndex((a) => a.id === id);
  if (idx !== -1) {
    all[idx].status = status;
    saveAppointments(all);
  }
}

export function getReports(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addReport(report: Report) {
  const all = getReports();
  all.push(report);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
