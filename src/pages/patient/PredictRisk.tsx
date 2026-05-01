import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Feature order MUST match the trained model (UCI Heart Disease, train.py):
// age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal
type FormState = {
  age: string;
  sex: string;        // 1 = male, 0 = female
  cp: string;         // 1-4 chest pain type
  trestbps: string;   // resting BP
  chol: string;       // cholesterol mg/dl
  fbs: string;        // fasting blood sugar > 120 mg/dl (1 true, 0 false)
  restecg: string;    // 0,1,2
  thalach: string;    // max heart rate
  exang: string;      // exercise-induced angina (1 yes, 0 no)
  oldpeak: string;    // ST depression
  slope: string;      // 1,2,3
  ca: string;         // 0-3 number of major vessels
  thal: string;       // 3 = normal, 6 = fixed defect, 7 = reversible defect
};

type PredictionResult = {
  prediction: number;
  probability: number;
  label: string;
} | null;

const FEATURE_ORDER: (keyof FormState)[] = [
  "age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal",
];

const PredictRisk = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormState>({
    age: "", sex: "", cp: "", trestbps: "", chol: "", fbs: "",
    restecg: "", thalach: "", exang: "", oldpeak: "", slope: "", ca: "", thal: "",
  });
  const [result, setResult] = useState<PredictionResult>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof FormState, v: string) => setFormData((p) => ({ ...p, [k]: v }));

  const handlePredict = async () => {
    const missing = FEATURE_ORDER.filter((k) => formData[k] === "");
    if (missing.length > 0) {
      toast.error(`Please fill in all 13 fields. Missing: ${missing.join(", ")}`);
      return;
    }
    if (!user) return;

    const features = FEATURE_ORDER.map((k) => Number(formData[k]));
    if (features.some((n) => Number.isNaN(n))) {
      toast.error("All values must be numeric.");
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      // ── Call your local Flask server ──────────────────────────────────
      const res = await fetch("/api/predict-tabular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const data: PredictionResult = await res.json();
      setResult(data);

      // ── Persist result to Supabase ─────────────────────────────────────
      await supabase.from("prediction_results").insert({
        patient_id: user.id,
        form_data: { ...formData, feature_order: FEATURE_ORDER, features } as any,
        risk_score: data?.label ?? "Unknown",
      });

      toast.success("Prediction complete!");
    } catch (err: any) {
      toast.error(err.message ?? "Prediction failed. Is the Flask server running?");
    } finally {
      setSubmitting(false);
    }
  };

  const numField = (k: keyof FormState, label: string, hint: string, step = "1") => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" step={step} placeholder={hint} value={formData[k]} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  const selectField = (
    k: keyof FormState,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={formData[k]} onValueChange={(v) => set(k, v)}>
        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const isHighRisk = result?.prediction === 1;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Heart Disease Risk Prediction</h1>
      <p className="mt-1 text-muted-foreground">
        Enter the 13 clinical parameters used by the trained model (UCI Heart Disease dataset).
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="font-display font-semibold">Medical Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {numField("age", "Age (years)", "e.g. 54")}
            {selectField("sex", "Sex", [
              { value: "1", label: "Male" },
              { value: "0", label: "Female" },
            ])}
            {selectField("cp", "Chest Pain Type (cp)", [
              { value: "1", label: "1 — Typical angina" },
              { value: "2", label: "2 — Atypical angina" },
              { value: "3", label: "3 — Non-anginal pain" },
              { value: "4", label: "4 — Asymptomatic" },
            ])}
            {numField("trestbps", "Resting BP (trestbps, mmHg)", "e.g. 130")}
            {numField("chol", "Cholesterol (chol, mg/dL)", "e.g. 240")}
            {selectField("fbs", "Fasting Blood Sugar > 120 (fbs)", [
              { value: "1", label: "True" },
              { value: "0", label: "False" },
            ])}
            {selectField("restecg", "Resting ECG (restecg)", [
              { value: "0", label: "0 — Normal" },
              { value: "1", label: "1 — ST-T abnormality" },
              { value: "2", label: "2 — LV hypertrophy" },
            ])}
            {numField("thalach", "Max Heart Rate (thalach)", "e.g. 150")}
            {selectField("exang", "Exercise-Induced Angina (exang)", [
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ])}
            {numField("oldpeak", "ST Depression (oldpeak)", "e.g. 1.4", "0.1")}
            {selectField("slope", "Slope of peak ST (slope)", [
              { value: "1", label: "1 — Upsloping" },
              { value: "2", label: "2 — Flat" },
              { value: "3", label: "3 — Downsloping" },
            ])}
            {selectField("ca", "Major Vessels Colored (ca)", [
              { value: "0", label: "0" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ])}
            {selectField("thal", "Thal", [
              { value: "3", label: "3 — Normal" },
              { value: "6", label: "6 — Fixed defect" },
              { value: "7", label: "7 — Reversible defect" },
            ])}
          </div>
          <Button className="w-full gap-2 mt-2" onClick={handlePredict} disabled={submitting}>
            <Brain className="h-4 w-4" /> {submitting ? "Analyzing..." : "Predict Heart Disease Risk"}
          </Button>
        </div>

        {/* Result Panel */}
        <div className={`rounded-xl border p-6 flex flex-col items-center justify-center text-center transition-colors ${
          result
            ? isHighRisk
              ? "border-destructive/30 bg-destructive/5"
              : "border-green-500/30 bg-green-500/5"
            : "border-primary/20 bg-card glow-blue"
        }`}>
          {result ? (
            <>
              {isHighRisk
                ? <AlertTriangle className="h-16 w-16 text-destructive" />
                : <CheckCircle2 className="h-16 w-16 text-green-500" />
              }
              <h3 className={`mt-4 font-display text-2xl font-bold ${isHighRisk ? "text-destructive" : "text-green-500"}`}>
                {result.label}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Model confidence: <span className="font-semibold text-foreground">
                  {(result.probability * 100).toFixed(1)}%
                </span>
              </p>
              <div className="mt-4 w-full rounded-lg bg-secondary/50 p-3">
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isHighRisk ? "bg-destructive" : "bg-green-500"}`}
                    style={{ width: `${result.probability * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Risk probability: {(result.probability * 100).toFixed(1)}%
                </p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This is an AI-generated result. Always consult a physician.
              </p>
            </>
          ) : (
            <>
              <Brain className="h-16 w-16 text-primary animate-pulse-glow" />
              <h3 className="mt-4 font-display text-xl font-bold">AI Prediction Module</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Fill in all 13 clinical fields and click Predict. The Random Forest model will
                return a real-time risk score.
              </p>
              <div className="mt-4 rounded-lg border border-border/50 px-4 py-2 text-xs bg-secondary text-muted-foreground">
                Status: Awaiting Input
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictRisk;
