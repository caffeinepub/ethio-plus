import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";

function getDeviceFingerprint(): string {
  const key = "ethioplus_device_fp";
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const raw = `${navigator.userAgent}|${screen.width}x${screen.height}|${screen.colorDepth}|${navigator.language}`;
  // simple djb2 hash
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) + hash + raw.charCodeAt(i);
    hash = hash & hash;
  }
  const fp = Math.abs(hash).toString(16).padStart(8, "0");
  localStorage.setItem(key, fp);
  return fp;
}

interface Props {
  onSubmitted: () => void;
}

type FileState = { file: File | null; progress: number };

export default function RegistrationPage({ onSubmitted }: Props) {
  const { actor } = useActor();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("+251");
  const [email, setEmail] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [photo, setPhoto] = useState<FileState>({ file: null, progress: 0 });
  const [schoolDoc, setSchoolDoc] = useState<FileState>({
    file: null,
    progress: 0,
  });
  const [paymentBill, setPaymentBill] = useState<FileState>({
    file: null,
    progress: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const billRef = useRef<HTMLInputElement>(null);

  const validateStep1 = async () => {
    let valid = true;
    setPhoneError("");
    setEmailError("");

    if (
      !phone.startsWith("+251") ||
      phone.length !== 13 ||
      !/^\+251\d{9}$/.test(phone)
    ) {
      setPhoneError("Phone must be in +251XXXXXXXXX format (13 characters)");
      valid = false;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    }

    if (valid && actor) {
      try {
        const taken = await actor.isEmailTaken(email);
        if (taken) {
          setEmailError("This email is already registered");
          valid = false;
        }
      } catch {
        // proceed
      }
    }
    return valid;
  };

  const handleNext = async () => {
    const ok = await validateStep1();
    if (ok) setStep(2);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileState>>,
  ) => {
    const file = e.target.files?.[0] ?? null;
    setter({ file, progress: 0 });
  };

  const readFileBytes = (file: File): Promise<Uint8Array<ArrayBuffer>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve(new Uint8Array(e.target!.result as ArrayBuffer));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async () => {
    if (!photo.file || !schoolDoc.file || !paymentBill.file) {
      toast.error("Please upload all required files");
      return;
    }
    if (!actor) {
      toast.error("Not connected. Please refresh.");
      return;
    }

    const fp = getDeviceFingerprint();
    setSubmitting(true);
    try {
      const [photoBytes, docBytes, billBytes] = await Promise.all([
        readFileBytes(photo.file),
        readFileBytes(schoolDoc.file),
        readFileBytes(paymentBill.file),
      ]);

      const photoBlob = ExternalBlob.fromBytes(photoBytes);
      const docBlob = ExternalBlob.fromBytes(docBytes);
      const billBlob = ExternalBlob.fromBytes(billBytes);

      await actor.submitRegistration(
        phone,
        email,
        photoBlob,
        docBlob,
        billBlob,
        fp,
      );
      toast.success("Registration submitted successfully!");
      onSubmitted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("device")) {
        toast.error("This device is already registered with another account.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-container min-h-dvh flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/assets/generated/ethioplus-logo-transparent.dim_200x200.png"
            alt="Ethio+"
            className="w-10 h-10"
          />
          <h1 className="ethio-brand text-2xl gold-gradient">Ethio+</h1>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Create Account
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {step === 1
            ? "Enter your contact details"
            : "Upload required documents"}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-5">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s
                    ? "bg-secondary text-secondary-foreground shadow-gold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`h-0.5 w-12 rounded-full ${step > 1 ? "bg-secondary" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            Step {step} of 2
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 pb-8 flex flex-col gap-6">
        {step === 1 ? (
          <>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-accent" /> Phone Number
              </Label>
              <Input
                id="phone"
                data-ocid="registration.phone_input"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError("");
                }}
                placeholder="+251912345678"
                className="h-12 text-base bg-card border-border focus:border-primary"
                maxLength={13}
              />
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: +251 followed by 9 digits
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-accent" /> Email Address
              </Label>
              <Input
                id="email"
                data-ocid="registration.email_input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="you@example.com"
                className="h-12 text-base bg-card border-border focus:border-primary"
                autoComplete="email"
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            <Button
              data-ocid="registration.next_button"
              onClick={handleNext}
              className="w-full h-12 mt-auto bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90"
            >
              Next <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <FileUploadField
              label="Profile Photo"
              icon={<ImageIcon className="w-4 h-4 text-accent" />}
              accept="image/*"
              fileState={photo}
              inputRef={photoRef}
              ocid="registration.photo_upload"
              onChange={(e) => handleFileChange(e, setPhoto)}
              hint="JPG, PNG — your clear profile picture"
            />

            <FileUploadField
              label="School Document"
              icon={<FileText className="w-4 h-4 text-accent" />}
              accept="image/*,application/pdf"
              fileState={schoolDoc}
              inputRef={docRef}
              ocid="registration.document_upload"
              onChange={(e) => handleFileChange(e, setSchoolDoc)}
              hint="PDF or image of your school ID / admission letter"
            />

            <FileUploadField
              label="Payment Bill Screenshot"
              icon={<Receipt className="w-4 h-4 text-accent" />}
              accept="image/*"
              fileState={paymentBill}
              inputRef={billRef}
              ocid="registration.payment_upload"
              onChange={(e) => handleFileChange(e, setPaymentBill)}
              hint="Screenshot of your payment confirmation"
            />

            <div className="flex gap-3 mt-auto">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 border-border"
                disabled={submitting}
              >
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button
                data-ocid="registration.submit_button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !photo.file ||
                  !schoolDoc.file ||
                  !paymentBill.file
                }
                className="flex-1 h-12 bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface FileUploadFieldProps {
  label: string;
  icon: React.ReactNode;
  accept: string;
  fileState: FileState;
  inputRef: React.RefObject<HTMLInputElement | null>;
  ocid: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint: string;
}

function FileUploadField({
  label,
  icon,
  accept,
  fileState,
  inputRef,
  ocid,
  onChange,
  hint,
}: FileUploadFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
        {icon} {label}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        id={ocid}
      />
      <button
        data-ocid={ocid}
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all text-sm ${
          fileState.file
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:bg-muted"
        }`}
      >
        {fileState.file ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-xs px-4 truncate max-w-full">
              {fileState.file.name}
            </span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span>Tap to upload</span>
          </>
        )}
      </button>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
