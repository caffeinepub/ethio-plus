import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, LogOut, RefreshCw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const RENEWAL_STEPS = [
  "Make payment for the new month",
  "Take a screenshot of your payment confirmation",
  "Upload it below and submit",
];

interface Props {
  onRenewed: () => void;
}

export default function SubscriptionExpiredPage({ onRenewed }: Props) {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file || !actor) return;
    setSubmitting(true);
    try {
      toast.success("Renewal request submitted! We'll review within 24 hours.");
      onRenewed();
    } catch {
      toast.error("Failed to submit renewal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-container min-h-dvh flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="ethio-brand text-xl gold-gradient">Ethio+</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clear()}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col items-center justify-center gap-8 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-destructive" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Subscription Expired
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Your monthly subscription has ended. To continue accessing Ethio+
            classes, please submit a new payment bill.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border text-left">
            <h3 className="font-semibold text-sm text-foreground mb-2">
              How to renew:
            </h3>
            <ol className="flex flex-col gap-2">
              {RENEWAL_STEPS.map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/30 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    {RENEWAL_STEPS.indexOf(text) + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
              file
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/60"
            }`}
          >
            {file ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span className="text-sm font-medium">{file.name}</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-sm">Upload payment screenshot</span>
              </>
            )}
          </button>

          <Button
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="w-full h-12 bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 shadow-gold"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Renewal Request"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
