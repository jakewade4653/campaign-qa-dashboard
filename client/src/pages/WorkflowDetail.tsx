import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSectionsForLaunchType,
  LAUNCH_TYPE_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LAUNCH_TYPE_COLORS,
  REVIEWER_LABELS,
} from "@/lib/checklistDefinitions";
import type { LaunchType, Platform } from "@/lib/checklistDefinitions";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Pen,
  Shield,
} from "lucide-react";

type CheckStatus = "pass" | "fail" | "na" | "pending";
type ReviewerRole = "builder" | "qa1" | "qa2" | "md";

const STATUS_ICON: Record<CheckStatus, React.ReactNode> = {
  pass: <CheckCircle2 size={15} className="text-green-600" />,
  fail: <XCircle size={15} className="text-red-500" />,
  na: <MinusCircle size={15} className="text-slate-400" />,
  pending: <Clock size={15} className="text-amber-500" />,
};

const REVIEWER_ORDER: ReviewerRole[] = ["builder", "qa1", "qa2", "md"];
const REVIEWER_SHORT: Record<ReviewerRole, string> = {
  builder: "B",
  qa1: "Q1",
  qa2: "Q2",
  md: "MD",
};

function getCompletionForSection(
  checklistData: Record<string, Record<string, { status: string }>>,
  sectionId: string,
  itemIds: string[]
): { done: number; total: number } {
  const section = checklistData[sectionId] ?? {};
  let done = 0;
  for (const id of itemIds) {
    const s = section[id]?.status;
    if (s === "pass" || s === "na") done++;
  }
  return { done, total: itemIds.length };
}

export default function WorkflowDetail() {
  const params = useParams<{ id: string }>();
  const workflowId = parseInt(params.id ?? "0", 10);
  const [, navigate] = useLocation();

  const [activeRole, setActiveRole] = useState<ReviewerRole>("builder");
  const [reviewerName, setReviewerName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [noteModal, setNoteModal] = useState<{ sectionId: string; itemId: string; currentNote: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [signOffModal, setSignOffModal] = useState(false);

  const utils = trpc.useUtils();

  const { data: workflow, isLoading } = trpc.workflows.byId.useQuery(
    { id: workflowId },
    { enabled: !!workflowId }
  );

  const updateChecklistMutation = trpc.workflows.updateChecklist.useMutation({
    onSuccess: () => utils.workflows.byId.invalidate({ id: workflowId }),
    onError: (err) => toast.error(err.message),
  });

  const signOffMutation = trpc.workflows.signOff.useMutation({
    onSuccess: () => {
      toast.success("Signed off successfully");
      utils.workflows.byId.invalidate({ id: workflowId });
      setSignOffModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const checklistData = useMemo(() => {
    if (!workflow?.checklistData) return {} as Record<string, Record<string, { status: CheckStatus; note?: string; reviewer?: string; reviewerRole?: string; updatedAt?: string }>>;
    return workflow.checklistData as Record<string, Record<string, { status: CheckStatus; note?: string; reviewer?: string; reviewerRole?: string; updatedAt?: string }>>;
  }, [workflow]);

  const sections = useMemo(() => {
    if (!workflow) return [];
    return getSectionsForLaunchType(workflow.launchType as LaunchType);
  }, [workflow]);

  const adSetGroups = useMemo(() => {
    if (!workflow?.adSetGroups) return [];
    try { return JSON.parse(workflow.adSetGroups) as string[]; } catch { return []; }
  }, [workflow]);

  const overallProgress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const section of Object.values(checklistData)) {
      for (const item of Object.values(section)) {
        total++;
        if (item.status === "pass" || item.status === "na") done++;
      }
    }
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [checklistData]);

  const handleToggle = (sectionId: string, itemId: string, currentStatus: CheckStatus) => {
    const cycle: CheckStatus[] = ["pending", "pass", "fail", "na"];
    const next = cycle[(cycle.indexOf(currentStatus) + 1) % cycle.length];
    const actor = reviewerName.trim() || "Reviewer";
    updateChecklistMutation.mutate({
      workflowId,
      sectionId,
      itemId,
      item: {
        status: next,
        reviewer: actor,
        reviewerRole: activeRole,
        updatedAt: new Date().toISOString(),
      },
      actorName: actor,
      actorRole: activeRole,
    });
  };

  const handleSaveNote = () => {
    if (!noteModal) return;
    const current = checklistData[noteModal.sectionId]?.[noteModal.itemId];
    updateChecklistMutation.mutate({
      workflowId,
      sectionId: noteModal.sectionId,
      itemId: noteModal.itemId,
      item: {
        status: current?.status ?? "pending",
        note: noteText,
        reviewer: reviewerName || current?.reviewer,
        reviewerRole: activeRole,
        updatedAt: new Date().toISOString(),
      },
      actorName: reviewerName || "Reviewer",
      actorRole: activeRole,
    });
    setNoteModal(null);
    setNoteText("");
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading workflow...</div>
    );
  }
  if (!workflow) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Workflow not found.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-3" size="sm">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const launchLabel = LAUNCH_TYPE_LABELS[workflow.launchType as LaunchType] ?? workflow.launchType;
  const platformLabel = PLATFORM_LABELS[workflow.platform as Platform] ?? workflow.platform;
  const launchColor = LAUNCH_TYPE_COLORS[workflow.launchType as LaunchType] ?? "bg-gray-200 text-gray-700";
  const statusColor = STATUS_COLORS[workflow.status] ?? "bg-gray-100 text-gray-700";
  const statusLabel = STATUS_LABELS[workflow.status] ?? workflow.status;

  const signOffs = {
    builder: workflow.builderSignOff as { name: string; timestamp: string } | null,
    qa1: workflow.qa1SignOff as { name: string; timestamp: string } | null,
    qa2: workflow.qa2SignOff as { name: string; timestamp: string } | null,
    md: workflow.mdSignOff as { name: string; timestamp: string } | null,
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={14} />
        Back to Dashboard
      </button>

      {/* Campaign header */}
      <div
        className="rounded border p-4"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#fff" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold" style={{ color: "#000033" }}>
                {workflow.campaignName}
              </h2>
              <span className={cn("text-xs px-2 py-0.5 rounded font-medium", launchColor)}>
                {launchLabel}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded font-medium", statusColor)}>
                {statusLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{workflow.client}</span>
              <span>·</span>
              <span>{platformLabel}</span>
              {workflow.market && <><span>·</span><span>{workflow.market}</span></>}
              {workflow.campaignId && (
                <><span>·</span><span className="font-mono">#{workflow.campaignId}</span></>
              )}
              {workflow.flightStart && (
                <><span>·</span><span>{workflow.flightStart} → {workflow.flightEnd}</span></>
              )}
              {workflow.budgetAmount && (
                <><span>·</span><span>{workflow.budgetAmount} ({workflow.budgetType})</span></>
              )}
            </div>
          </div>
          {/* Overall progress */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono" style={{ color: "#E8321A" }}>
                {overallProgress}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="w-12 h-12 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={overallProgress === 100 ? "#22C55E" : "#E8321A"}
                  strokeWidth="3"
                  strokeDasharray={`${overallProgress} ${100 - overallProgress}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Reviewer sign-off chain */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "#F1F5F9" }}>
          <div className="flex flex-wrap gap-3">
            {REVIEWER_ORDER.map((role) => {
              const so = signOffs[role];
              return (
                <div
                  key={role}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded border text-xs",
                    so ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-mono",
                      so ? "text-white bg-green-600" : "text-gray-400 bg-gray-200"
                    )}
                  >
                    {REVIEWER_SHORT[role]}
                  </div>
                  <div>
                    <div className={cn("font-medium", so ? "text-green-800" : "text-muted-foreground")}>
                      {REVIEWER_LABELS[role]}
                    </div>
                    {so ? (
                      <div className="text-green-600 font-mono" style={{ fontSize: "10px" }}>
                        {so.name} · {new Date(so.timestamp).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-muted-foreground" style={{ fontSize: "10px" }}>Pending</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active reviewer selector */}
      <div
        className="rounded border overflow-hidden"
        style={{ borderColor: "#E8321A" }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ backgroundColor: "#E8321A" }}
        >
          <Pen size={13} className="text-white" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">
            Who is reviewing? Fill in your name and role, then click any checklist item to mark it.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-3" style={{ backgroundColor: "#fff" }}>
        <Select value={activeRole} onValueChange={(v) => setActiveRole(v as ReviewerRole)}>
          <SelectTrigger className="h-9 text-sm w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEWER_ORDER.map((role) => (
              <SelectItem key={role} value={role}>{REVIEWER_LABELS[role]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Your name (optional)"
          className="h-9 text-sm w-48"
        />
        <div className="text-xs text-muted-foreground">
          Click any item below to cycle: <span className="font-semibold text-amber-600">Pending</span> → <span className="font-semibold text-green-600">Pass</span> → <span className="font-semibold text-red-500">Fail</span> → <span className="font-semibold text-slate-500">N/A</span>
        </div>
        <Button
          size="sm"
          onClick={() => setSignOffModal(true)}
          disabled={!reviewerName.trim()}
          className="gap-1.5 text-white ml-auto"
          style={{ backgroundColor: "#000033", borderColor: "#000033" }}
        >
          <Shield size={13} />
          Sign Off
        </Button>
        </div>
      </div>

      {/* Checklist sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          const allItemIds = section.items.flatMap((item) =>
            item.perAdSetGroup && adSetGroups.length > 0
              ? adSetGroups.map((g) => `${item.id}__${g.replace(/\s+/g, "_")}`)
              : [item.id]
          );
          const { done, total } = getCompletionForSection(checklistData, section.id, allItemIds);
          const pct = total === 0 ? 0 : Math.round((done / total) * 100);

          return (
            <div
              key={section.id}
              className="rounded border overflow-hidden"
              style={{ borderColor: "#E5E7EB" }}
            >
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                style={{ backgroundColor: "#000033" }}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "#E2E8F0", letterSpacing: "0.08em" }}
                  >
                    {section.title}
                  </span>
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  >
                    {done}/{total}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="w-24 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? "#22C55E" : "#E8321A",
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {pct}%
                  </span>
                  {isCollapsed ? (
                    <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                  ) : (
                    <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                  )}
                </div>
              </button>

              {/* Section items */}
              {!isCollapsed && (
                <div className="bg-white divide-y" style={{ borderColor: "#F1F5F9" }}>
                  {/* Column headers for per-adset-group items */}
                  {adSetGroups.length > 0 && section.items.some((i) => i.perAdSetGroup) && (
                    <div
                      className="grid text-xs font-semibold px-4 py-2"
                      style={{
                        gridTemplateColumns: `2fr repeat(${adSetGroups.length}, 1fr) 32px`,
                        backgroundColor: "#F8FAFC",
                        color: "#64748B",
                      }}
                    >
                      <div>Check Item</div>
                      {adSetGroups.map((g) => (
                        <div key={g} className="text-center truncate px-1">{g}</div>
                      ))}
                      <div />
                    </div>
                  )}

                  {section.items.map((item) => {
                    if (item.perAdSetGroup && adSetGroups.length > 0) {
                      // Render one row with columns per ad set group
                      return (
                        <div
                          key={item.id}
                          className="grid items-center px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          style={{ gridTemplateColumns: `2fr repeat(${adSetGroups.length}, 1fr) 32px` }}
                        >
                          <div>
                            <div className="text-sm font-medium" style={{ color: "#000033" }}>
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {adSetGroups.map((group) => {
                            const itemId = `${item.id}__${group.replace(/\s+/g, "_")}`;
                            const current = checklistData[section.id]?.[itemId];
                            const status: CheckStatus = current?.status ?? "pending";
                            return (
                              <div key={group} className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleToggle(section.id, itemId, status)}
                                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                                  title={`Toggle ${item.label} for ${group}`}
                                >
                                  {STATUS_ICON[status]}
                                </button>
                                {current?.note && (
                                  <div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: "#E8321A" }}
                                    title={current.note}
                                  />
                                )}
                              </div>
                            );
                          })}
                          {/* Note button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                const firstId = `${item.id}__${adSetGroups[0].replace(/\s+/g, "_")}`;
                                const note = checklistData[section.id]?.[firstId]?.note ?? "";
                                setNoteModal({ sectionId: section.id, itemId: firstId, currentNote: note });
                                setNoteText(note);
                              }}
                              className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <MessageSquare size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Non-per-group item
                    const current = checklistData[section.id]?.[item.id];
                    const status: CheckStatus = current?.status ?? "pending";
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors",
                          status === "pass" ? "border-l-2 border-l-green-400" :
                          status === "fail" ? "border-l-2 border-l-red-400" : ""
                        )}
                      >
                        <button
                          onClick={() => handleToggle(section.id, item.id, status)}
                          className="mt-0.5 p-0.5 rounded hover:bg-gray-100 transition-colors shrink-0"
                        >
                          {STATUS_ICON[status]}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: "#000033" }}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {item.description}
                            </div>
                          )}
                          {current?.note && (
                            <div
                              className="mt-1 text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                            >
                              Note: {current.note}
                            </div>
                          )}
                          {current?.reviewer && (
                            <div className="mt-0.5 text-xs text-muted-foreground font-mono">
                              {current.reviewer} · {current.reviewerRole?.toUpperCase()}
                              {current.updatedAt && ` · ${new Date(current.updatedAt).toLocaleString()}`}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setNoteModal({ sectionId: section.id, itemId: item.id, currentNote: current?.note ?? "" });
                            setNoteText(current?.note ?? "");
                          }}
                          className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <MessageSquare size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note modal */}
      <Dialog open={!!noteModal} onOpenChange={() => setNoteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add / Edit Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note for this checklist item..."
            rows={4}
            className="text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteModal(null)}>Cancel</Button>
            <Button
              onClick={handleSaveNote}
              className="text-white"
              style={{ backgroundColor: "#E8321A" }}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign-off modal */}
      <Dialog open={signOffModal} onOpenChange={setSignOffModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Off — {REVIEWER_LABELS[activeRole]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              You are signing off as <strong>{reviewerName}</strong> ({REVIEWER_LABELS[activeRole]}).
              This will advance the workflow to the next review stage.
            </p>
            <div
              className="rounded p-3 text-xs font-mono"
              style={{ backgroundColor: "#F8FAFC", color: "#64748B" }}
            >
              Campaign: {workflow.campaignName}<br />
              Progress: {overallProgress}% complete<br />
              Role: {REVIEWER_LABELS[activeRole]}
            </div>
            {overallProgress < 100 && (
              <div
                className="rounded p-3 text-xs"
                style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
              >
                Warning: The checklist is only {overallProgress}% complete. You can still sign off, but incomplete items will be noted.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOffModal(false)}>Cancel</Button>
            <Button
              onClick={() => {
                signOffMutation.mutate({
                  workflowId,
                  role: activeRole,
                  name: reviewerName,
                });
              }}
              disabled={signOffMutation.isPending}
              className="text-white"
              style={{ backgroundColor: "#000033" }}
            >
              <Shield size={13} className="mr-1.5" />
              {signOffMutation.isPending ? "Signing..." : "Confirm Sign Off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
