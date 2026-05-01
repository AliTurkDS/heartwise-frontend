import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Calendar, FileText, Settings, Heart, Trash2, LogOut } from "lucide-react";
import { Routes, Route } from "react-router-dom";

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/users", icon: Users, label: "Manage Users" },
  { to: "/admin/appointments", icon: Calendar, label: "Appointments" },
  { to: "/admin/reports", icon: FileText, label: "Reports" },
];

const Overview = () => (
  <div>
    <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
    <p className="mt-1 text-muted-foreground">System overview and management.</p>

    <div className="mt-6 grid gap-4 md:grid-cols-4">
      {[
        { label: "Total Patients", value: "1,247" },
        { label: "Total Doctors", value: "34" },
        { label: "Appointments Today", value: "56" },
        { label: "Reports Uploaded", value: "3,891" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-border/50 bg-card p-6">
          <span className="text-sm text-muted-foreground">{s.label}</span>
          <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const ManageUsers = () => {
  const users = [
    { name: "John Smith", email: "john@email.com", role: "Patient", status: "Active" },
    { name: "Dr. Sarah Johnson", email: "sarah@hospital.com", role: "Doctor", status: "Active" },
    { name: "Alice Brown", email: "alice@email.com", role: "Patient", status: "Active" },
    { name: "Dr. Michael Chen", email: "michael@hospital.com", role: "Doctor", status: "Inactive" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Manage Users</h1>
      <div className="mt-6 rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b border-border/30 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                    u.role === "Doctor" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.status === "Active" ? "text-green-400" : "text-muted-foreground"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1">
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminAppointments = () => (
  <div>
    <h1 className="font-display text-2xl font-bold">All Appointments</h1>
    <div className="mt-6 space-y-3">
      {[
        { patient: "John Smith", doctor: "Dr. Sarah Johnson", date: "Feb 16, 2026", status: "Confirmed" },
        { patient: "Alice Brown", doctor: "Dr. Michael Chen", date: "Feb 17, 2026", status: "Pending" },
        { patient: "Bob Wilson", doctor: "Dr. Sarah Johnson", date: "Feb 18, 2026", status: "Completed" },
      ].map((a, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
          <div>
            <p className="text-sm font-medium">{a.patient} → {a.doctor}</p>
            <p className="text-xs text-muted-foreground">{a.date}</p>
          </div>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${
            a.status === "Confirmed" ? "bg-green-500/10 text-green-400" :
            a.status === "Pending" ? "bg-yellow-500/10 text-yellow-400" :
            "bg-secondary text-muted-foreground"
          }`}>{a.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const AdminReports = () => (
  <div>
    <h1 className="font-display text-2xl font-bold">Uploaded Reports</h1>
    <div className="mt-6 space-y-3">
      {[
        { patient: "John Smith", type: "ECG Image", date: "Feb 14, 2026" },
        { patient: "Alice Brown", type: "Blood Test PDF", date: "Feb 13, 2026" },
        { patient: "Bob Wilson", type: "Medical Report", date: "Feb 12, 2026" },
      ].map((r, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{r.patient} — {r.type}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-primary/30">Download</Button>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => (
  <DashboardLayout role="Admin" links={adminLinks}>
    <Routes>
      <Route index element={<Overview />} />
      <Route path="users" element={<ManageUsers />} />
      <Route path="appointments" element={<AdminAppointments />} />
      <Route path="reports" element={<AdminReports />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
