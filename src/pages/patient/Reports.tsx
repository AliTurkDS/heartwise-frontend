import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UploadRecord = { id: string; file_name: string; created_at: string; file_path: string; description: string | null };
type DoctorReport = { id: string; title: string; content: string; created_at: string; doctor_id: string; doctor_name?: string };

const Reports = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [doctorReports, setDoctorReports] = useState<DoctorReport[]>([]);
  const [openReport, setOpenReport] = useState<DoctorReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<UploadRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UploadRecord | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: up } = await supabase
      .from("patient_uploads")
      .select("id, file_name, created_at, file_path, description")
      .eq("patient_id", user.id)
      .eq("file_type", "report")
      .order("created_at", { ascending: false });
    setUploads(up ?? []);

    const { data: dr } = await supabase
      .from("doctor_reports")
      .select("id, title, content, created_at, doctor_id")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    const reports = dr ?? [];
    const doctorIds = [...new Set(reports.map((r) => r.doctor_id))];
    const nameMap = new Map<string, string>();
    if (doctorIds.length > 0) {
      const { data: docs } = await supabase
        .from("doctors")
        .select("user_id, full_name")
        .in("user_id", doctorIds);
      docs?.forEach((d) => nameMap.set(d.user_id, d.full_name));
    }
    setDoctorReports(reports.map((r) => ({ ...r, doctor_name: nameMap.get(r.doctor_id) })));
  };

  useEffect(() => { load(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `${user.id}/reports/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("medical-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("patient_uploads").insert({
      patient_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: "report" as const,
    });

    if (dbError) {
      toast.error("Failed to save: " + dbError.message);
    } else {
      toast.success(`Report "${file.name}" uploaded!`);
      load();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleView = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("medical-files")
      .createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) { toast.error("Could not load file"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const openEdit = (r: UploadRecord) => {
    setEditing(r);
    setEditName(r.file_name);
    setEditDesc(r.description ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("patient_uploads")
      .update({ file_name: editName, description: editDesc })
      .eq("id", editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Report updated");
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.storage.from("medical-files").remove([deleteTarget.file_path]);
    const { error } = await supabase.from("patient_uploads").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Report deleted");
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Medical Reports</h1>
      <p className="mt-1 text-muted-foreground">Upload your documents and view doctor reports.</p>
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            <Button className="gap-2 pointer-events-none" asChild>
              <span><Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Report"}</span>
            </Button>
          </label>
        </div>

        {uploads.length > 0 && <h2 className="font-display text-lg font-semibold pt-2">Your Uploaded Reports</h2>}
        {uploads.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.file_name}</p>
                {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="border-primary/30" onClick={() => handleView(r.file_path)}>View</Button>
              <Button variant="outline" size="icon" className="h-8 w-8 border-primary/30" onClick={() => openEdit(r)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(r)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <h2 className="font-display text-lg font-semibold pt-4">Doctor Reports</h2>
        {doctorReports.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No doctor reports yet.</p>
        )}
        {doctorReports.map((r) => (
          <div key={r.id} className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.doctor_name ? `Dr. ${r.doctor_name}` : "Doctor"} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-primary/30 shrink-0" onClick={() => setOpenReport(r)}>
                View Full Report
              </Button>
            </div>
            <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap line-clamp-4">{r.content}</p>
          </div>
        ))}
      </div>

      {/* Full doctor report dialog */}
      <Dialog open={!!openReport} onOpenChange={(o) => !o && setOpenReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openReport?.title}</DialogTitle>
            {openReport && (
              <p className="text-xs text-muted-foreground pt-1">
                {openReport.doctor_name ? `Dr. ${openReport.doctor_name}` : "Doctor"} · {new Date(openReport.created_at).toLocaleString()}
              </p>
            )}
          </DialogHeader>
          <div className="mt-2 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {openReport?.content}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReport(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>File name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div><Label>Description (optional)</Label><Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Add a note..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the file. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reports;
