import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Users, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="mobile-container min-h-dvh flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img
          src="/assets/generated/ethio-hero-bg.dim_800x500.jpg"
          alt="Ethiopian highlands"
          className="w-full h-64 object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center">
          <h1 className="ethio-brand text-5xl text-center leading-tight">
            <span className="gold-gradient">Ethio</span>
            <span className="text-foreground">+</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            Ethio Plus
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 gap-8">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Learn Together, Grow Together
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Ethiopia's premier live online classroom. Join thousands of students
            learning together every day in real-time interactive sessions.
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-3">
          {[
            {
              icon: <BookOpen className="w-5 h-5" />,
              title: "Live Daily Classes",
              desc: "Interactive sessions with top Ethiopian educators",
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Thousands of Students",
              desc: "Learn alongside peers from across Ethiopia",
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: "YouTube & Telegram",
              desc: "Access content on your favorite platforms",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
            >
              <span className="p-2 rounded-lg bg-primary/20 text-primary flex-shrink-0">
                {icon}
              </span>
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 mt-auto">
          <Button
            data-ocid="landing.login_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              "Get Started — Login"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Secure login via Internet Identity · No password needed
          </p>
        </div>
      </div>
    </div>
  );
}
