import { Bell, Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="mobile-container min-h-dvh flex flex-col items-center justify-center px-6 gap-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center">
            <Clock className="w-12 h-12 text-secondary" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        <div>
          <h1 className="ethio-brand text-3xl gold-gradient mb-2">Ethio+</h1>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Registration Under Review
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Your registration has been submitted successfully. Our team will
            review your documents and activate your account{" "}
            <span className="text-accent font-semibold">within 24 hours</span>.
          </p>
        </div>

        <div className="w-full p-5 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
            What happens next?
          </h3>
          <div className="flex flex-col gap-4">
            {[
              {
                step: "1",
                text: "Admin reviews your documents and payment",
                done: true,
              },
              {
                step: "2",
                text: "Your account is approved within 24 hours",
                done: false,
              },
              {
                step: "3",
                text: "You get full access for one month",
                done: false,
              },
            ].map(({ step, text, done }) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
                <p className="text-sm text-muted-foreground pt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Please check back later or contact us on{" "}
          <a
            href="https://t.me/Ethiopluss"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2"
          >
            Telegram
          </a>{" "}
          if you have questions.
        </p>
      </div>
    </div>
  );
}
