import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Calendar,
  Flame,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiTelegram, SiYoutube } from "react-icons/si";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type GridWeek = {
  weekKey: string;
  days: Array<{ val: number; dayKey: string }>;
};

function ActivityGrid() {
  const grid = useMemo<GridWeek[]>(() => {
    const weeks = 12;
    const daysCount = 7;
    const result: GridWeek[] = [];
    for (let w = 0; w < weeks; w++) {
      const days: GridWeek["days"] = [];
      for (let d = 0; d < daysCount; d++) {
        const rand = Math.random();
        let val = 0;
        if (rand > 0.7) val = 3 + Math.floor(Math.random() * 2);
        else if (rand > 0.4) val = 1 + Math.floor(Math.random() * 2);
        days.push({ val, dayKey: `w${w}d${d}` });
      }
      result.push({ weekKey: `w${w}`, days });
    }
    return result;
  }, []);

  return (
    <div>
      <div className="flex gap-1">
        {grid.map(({ weekKey, days }) => (
          <div key={weekKey} className="flex flex-col gap-1">
            {days.map(({ val, dayKey }) => (
              <div
                key={dayKey}
                className={`w-4 h-4 activity-cell activity-cell-${val}`}
                title={`Activity: ${val}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-xs text-muted-foreground">Less</span>
        {([0, 1, 2, 3, 4] as const).map((v) => (
          <div key={v} className={`w-3 h-3 activity-cell activity-cell-${v}`} />
        ))}
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor
      .getRemainingDays()
      .then((days) => {
        setRemainingDays(days != null ? Number(days) : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const isExpiringSoon = remainingDays !== null && remainingDays <= 3;
  const daysInMonth = 30;
  const progress =
    remainingDays !== null
      ? Math.max(0, (remainingDays / daysInMonth) * 100)
      : 0;

  return (
    <div className="mobile-container min-h-dvh flex flex-col">
      {/* Header */}
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

      {/* Warning banner */}
      {isExpiringSoon && (
        <div className="mx-6 mb-2 p-3 rounded-xl bg-destructive/20 border border-destructive/40 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            <span className="font-semibold">Subscription expiring soon!</span>{" "}
            {remainingDays === 0
              ? "Expires today"
              : `${remainingDays} day${remainingDays === 1 ? "" : "s"} remaining`}
            . Renew before the 1st of next month.
          </p>
        </div>
      )}

      <main className="flex-1 px-6 pb-8 flex flex-col gap-5">
        {/* Subscription card */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Subscription</h2>
          </div>
          {loading ? (
            <div
              className="h-8 bg-muted rounded-lg animate-pulse"
              data-ocid="dashboard.loading_state"
            />
          ) : (
            <>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold font-display text-foreground">
                  {remainingDays ?? "—"}
                </span>
                <span className="text-muted-foreground text-sm mb-1">
                  days remaining
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: isExpiringSoon
                      ? "oklch(0.52 0.18 30)"
                      : "oklch(0.72 0.13 78)",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monthly subscription · Renews on 1st (Ethiopian calendar)
              </p>
            </>
          )}
        </div>

        {/* Learn now buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://youtube.com/@yonifx.discipline?si=h-3m0EbVLgsEA4S7"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="dashboard.youtube_button"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-red-500/40 hover:bg-red-500/10 transition-all"
          >
            <SiYoutube className="w-8 h-8 text-red-500" />
            <span className="text-sm font-semibold text-foreground">
              Watch on YouTube
            </span>
          </a>
          <a
            href="https://t.me/Ethiopluss"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="dashboard.telegram_button"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
          >
            <SiTelegram className="w-8 h-8 text-blue-400" />
            <span className="text-sm font-semibold text-foreground">
              Join Telegram
            </span>
          </a>
        </div>

        {/* Q&A Stats */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Q&amp;A Stats</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Questions", value: "48" },
              { label: "Answered", value: "41" },
              { label: "Streak", value: "7d" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted">
                <div className="text-xl font-bold font-display text-secondary">
                  {value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning consistency */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">
              Learning Consistency
            </h2>
          </div>
          <ActivityGrid />
        </div>
      </main>
    </div>
  );
}
