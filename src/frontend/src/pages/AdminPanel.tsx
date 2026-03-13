import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  LogOut,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { StudentProfile } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type PendingEntry = [Principal, StudentProfile];

export default function AdminPanel() {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [active, setActive] = useState<StudentProfile[]>([]);
  const [expired, setExpired] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const [pend, act, exp] = await Promise.all([
        actor.listPendingRegistrations(),
        actor.getActiveStudents(),
        actor.getExpiredStudents(),
      ]);
      setPending(pend);
      setActive(act);
      setExpired(exp);
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApprove = async (principal: Principal, idx: number) => {
    if (!actor) return;
    setActionLoading(`approve-${idx}`);
    try {
      await actor.approveRegistration(principal);
      toast.success("Student approved!");
      fetchAll();
    } catch {
      toast.error("Failed to approve student");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (principal: Principal, idx: number) => {
    if (!actor) return;
    setActionLoading(`reject-${idx}`);
    try {
      await actor.rejectRegistration(principal, null);
      toast.success("Student rejected");
      fetchAll();
    } catch {
      toast.error("Failed to reject student");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (time?: bigint) => {
    if (!time) return "—";
    return new Date(Number(time) / 1_000_000).toLocaleDateString("en-ET", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="mobile-container min-h-dvh flex flex-col">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="ethio-brand text-xl gold-gradient leading-none">
            Ethio+
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clear()}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      {/* Stats */}
      <div className="px-6 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Pending",
              count: pending.length,
              icon: <Clock className="w-4 h-4" />,
              color: "text-secondary",
            },
            {
              label: "Active",
              count: active.length,
              icon: <CheckCircle className="w-4 h-4" />,
              color: "text-primary",
            },
            {
              label: "Expired",
              count: expired.length,
              icon: <AlertTriangle className="w-4 h-4" />,
              color: "text-destructive",
            },
          ].map(({ label, count, icon, color }) => (
            <div
              key={label}
              className="p-3 rounded-xl bg-card border border-border text-center"
            >
              <span className={`${color} flex justify-center mb-1`}>
                {icon}
              </span>
              <div className="text-xl font-bold font-display text-foreground">
                {count}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-6 pb-8">
        <Tabs defaultValue="pending">
          <TabsList className="w-full mb-4 bg-card">
            <TabsTrigger
              value="pending"
              className="flex-1"
              data-ocid="admin.pending_tab"
            >
              Pending
              {pending.length > 0 && (
                <Badge className="ml-1.5 bg-secondary text-secondary-foreground text-xs px-1.5">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex-1"
              data-ocid="admin.active_tab"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="expired"
              className="flex-1"
              data-ocid="admin.expired_tab"
            >
              Expired
            </TabsTrigger>
          </TabsList>

          {/* Pending tab */}
          <TabsContent value="pending">
            {loading ? (
              <LoadingState />
            ) : pending.length === 0 ? (
              <EmptyState message="No pending registrations" />
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map(([principal, profile], idx) => (
                  <div
                    key={principal.toString()}
                    data-ocid={`admin.item.${idx + 1}`}
                    className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <a
                        href={profile.profilePhotoId.getDirectURL()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={profile.profilePhotoId.getDirectURL()}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </a>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {profile.phone}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {profile.email}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Registered: {formatDate(profile.creationTime)}
                        </p>
                      </div>
                    </div>

                    {/* Document links */}
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={profile.schoolDocumentId.getDirectURL()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent underline underline-offset-2"
                      >
                        <ExternalLink className="w-3 h-3" /> School Doc
                      </a>
                      <a
                        href={profile.paymentBillId.getDirectURL()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent underline underline-offset-2"
                      >
                        <ExternalLink className="w-3 h-3" /> Payment Bill
                      </a>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        data-ocid={`admin.approve_button.${idx + 1}`}
                        size="sm"
                        onClick={() => handleApprove(principal, idx)}
                        disabled={actionLoading !== null}
                        className="flex-1 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {actionLoading === `approve-${idx}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />{" "}
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        data-ocid={`admin.reject_button.${idx + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(principal, idx)}
                        disabled={actionLoading !== null}
                        className="flex-1 h-9 border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        {actionLoading === `reject-${idx}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active tab */}
          <TabsContent value="active">
            {loading ? (
              <LoadingState />
            ) : active.length === 0 ? (
              <EmptyState message="No active students" />
            ) : (
              <div className="flex flex-col gap-3">
                {active.map((profile, idx) => (
                  <div
                    key={`${profile.phone}-${idx}`}
                    data-ocid={`admin.item.${idx + 1}`}
                    className="p-4 rounded-2xl bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {profile.phone}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expires:{" "}
                          <span className="text-accent">
                            {formatDate(profile.subscriptionEnd)}
                          </span>
                        </p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Expired tab */}
          <TabsContent value="expired">
            {loading ? (
              <LoadingState />
            ) : expired.length === 0 ? (
              <EmptyState message="No expired students" />
            ) : (
              <div className="flex flex-col gap-3">
                {expired.map((profile, idx) => (
                  <div
                    key={`${profile.phone}-${idx}`}
                    data-ocid={`admin.item.${idx + 1}`}
                    className="p-4 rounded-2xl bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {profile.phone}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expired:{" "}
                          <span className="text-destructive">
                            {formatDate(profile.subscriptionEnd)}
                          </span>
                        </p>
                      </div>
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                        Expired
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" data-ocid="admin.loading_state">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-2xl bg-card border border-border animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 gap-3"
      data-ocid="admin.empty_state"
    >
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Users className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
