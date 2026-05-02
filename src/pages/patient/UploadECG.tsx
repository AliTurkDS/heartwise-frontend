import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Upload, Pencil, Trash2, Brain, Sparkles, Loader2 } from "lucide-react";
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

type AIPrediction = { label: string; confidence: number } | null;
type ECGRecord = {
  id: string;
  file_name: string;
  created_at: string;
  file_path: string;
  description: string | null;
  ai_prediction: AIPrediction;
};

const UploadECG = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [ecgFiles, setEcgFiles] = useState<ECGRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<ECGRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ECGRecord | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AIPrediction>>({});

  // ── Analyze ECG by fetching a signed URL then sending to Flask ──────────
  const analyzeECG = async (f: ECGRecord) => {
    setAnalyzing(f.id);
    setResults((r) => ({ ...r, [f.id]: null }));

    try {
      // Step 1: Get a signed URL for the stored ECG image
      const { data: signed, error: signErr } = await supabase.storage
        .from("medical-files")
        .createSignedUrl(f.file_path, 300);

      if (signErr || !signed?.signedUrl) {
        throw new Error("Could not create signed URL for the file.");
      }

      // Step 2: Send the URL to the local Flask server
      const res = await fetch(`${import.meta.env.VITE_API_URL}/predict-ecg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: signed.signedUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const prediction: AIPrediction = {
        label: data.label,
        confidence: data.confidence,
      };

      setResults((r) => ({ ...r, [f.id]: prediction }));
      toast.success(`ECG analysed: ${prediction.label}`);

      // Step 3: Persist the result to Supabase
      await supabase
        .from("patient_uploads")
        .update({ ai_prediction: prediction })
        .eq("id", f.id);

      setEcgFiles((prev) =>
        prev.map((x) => (x.id === f.id ? { ...x, ai_prediction: prediction } : x))
      );
    } catch (err: any) {
      toast.error(err.message ?? "Analysis failed. Is the Flask server running?");
      setResults((r) => ({ ...r, [f.id]: null }));
    } finally {
      setAnalyzing(null);
    }
  };

  const loadECGs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("patient_uploads")
      .select("id, file_name, created_at, file_path, description, ai_prediction")
      .eq("patient_id", user.id)
      .eq("file_type", "ecg")
      .order("created_at", { ascending: false });
    setEcgFiles((data ?? []) as ECGRecord[]);
    const map: Record<string, AIPrediction> = {};
    (data ?? []).forEach((d: any) => { if (d.ai_prediction) map[d.id] = d.ai_prediction; });
    setResults((r) => ({ ...map, ...r }));
  };

  useEffect(() => { loadECGs(); }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `${user.id}/ecg/${Date.now()}_${file.name}`;

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
      file_type: "ecg",
    });

    if (dbError) {
      toast.error("Failed to save record: " + dbError.message);
    } else {
      toast.success(`ECG "${file.name}" uploaded successfully!`);
      loadECGs();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleView = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("medical-files")
      .createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) {
      toast.error("Could not generate file URL");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const openEdit = (f: ECGRecord) => {
    setEditing(f);
    setEditName(f.file_name);
    setEditDesc(f.description ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("patient_uploads")
      .update({ file_name: editName, description: editDesc })
      .eq("id", editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("ECG updated");
    setEditing(null);
    loadECGs();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.storage.from("medical-files").remove([deleteTarget.file_path]);
    const { error } = await supabase.from("patient_uploads").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); return; }
    toast.success("ECG deleted");
    setDeleteTarget(null);
    loadECGs();
  };

  // Colour badge for ECG result
  const resultColor = (label: string) => {
    if (label.toLowerCase().includes("normal")) return "border-green-500/30 bg-green-500/5 text-green-600";
    return "border-destructive/30 bg-destructive/5 text-destructive";
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Upload ECG</h1>
      <p className="mt-1 text-muted-foreground">Upload your ECG image and run the AI model.</p>

      <div className="mt-6 rounded-xl border border-border/50 bg-card p-8">
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-display font-semibold">
            {uploading ? "Uploading..." : "Drop your ECG file here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            variant="outline"
            className="mt-4 border-primary/30"
            type="button"
            disabled={uploading}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Browse Files
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="font-display text-base font-semibold">AI ECG Analysis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload an ECG image then click <span className="font-medium text-foreground">Analyze</span>.
              The image is sent to your local Keras model for real-time classification.
            </p>
          </div>
        </div>
      </div>

      {ecgFiles.length > 0 && (
        <>
          <h2 className="mt-6 font-display text-lg font-semibold">Your ECG Uploads</h2>
          <div className="mt-3 space-y-2">
            {ecgFiles.map((f) => {
              const result = results[f.id];
              const isAnalyzing = analyzing === f.id;
              return (
                <div key={f.id} className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Activity className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.file_name}</p>
                        {f.description && (
                          <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(f.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/30"
                        onClick={() => handleView(f.file_path)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => analyzeECG(f)}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Sparkles className="h-3.5 w-3.5" />
                        }
                        {isAnalyzing ? "Analyzing..." : "Analyze"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-primary/30"
                        onClick={() => openEdit(f)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(f)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Result Card */}
                  {result && (
                    <div className={`mt-3 flex items-center gap-3 rounded-lg border p-3 ${resultColor(result.label)}`}>
                      <Brain className="h-5 w-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">AI Analysis: {result.label}</p>
                        {result.confidence > 0 && (
                          <div className="mt-1">
                            <p className="text-xs opacity-80">
                              Confidence: {(result.confidence * 100).toFixed(1)}%
                            </p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-current/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-current/60 transition-all duration-500"
                                style={{ width: `${result.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit ECG</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>File name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="e.g. Routine checkup"
              />
            </div>
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
            <AlertDialogTitle>Delete this ECG?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UploadECG;
