import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LAUNCH_TYPE_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LAUNCH_TYPE_COLORS,
} from "@/lib/checklistDefinitions";
import type { LaunchType, Platform } from "@/lib/checklistDefinitions";
import { cn } from "@/lib/utils";

function getCompletionPct(checklistData: unknown): number {
  if (!checklistData || typeof checklistData !== "object") return 0;
  const data = checklistData as Record<string, Record<string, { status: string }>>;
  let total = 0;
  let done = 0;
  for (const section of Object.values(data)) {
    for (const item of Object.values(section)) {
      total++;
      if (item.status === "pass" || item.status === "na") done++;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filterLaunchType, setFilterLaunchType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  const utils = trpc.useUtils();

  const { data: workflows = [], isLoading, refetch } = trpc.workflows.list.useQuery(
    { showArchived }
  );

  const archiveMutation = trpc.workflows.archive.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.archive ? "Workflow archived" : "Workflow restored");
      utils.workflows.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    return workflows.filter((wf) => {
      const matchSearch =
        !search ||
        wf.campaignName.toLowerCase().includes(search.toLowerCase()) ||
        wf.client.toLowerCase().includes(search.toLowerCase()) ||
        (wf.market ?? "").toLowerCase().includes(search.toLowerCase());
      const matchLaunch = filterLaunchType === "all" || wf.launchType === filterLaunchType;
      const matchStatus = filterStatus === "all" || wf.status === filterStatus;
      const matchPlatform = filterPlatform === "all" || wf.platform === filterPlatform;
      return matchSearch && matchLaunch && matchStatus && matchPlatform;
    });
  }, [workflows, search, filterLaunchType, filterStatus, filterPlatform]);

  const stats = useMemo(() => {
    const active = workflows.filter((w) => w.archived === "0");
    const total = active.length;
    const approved = active.filter((w) => w.status === "approved").length;
    const inProgress = active.filter((w) =>
      ["in_progress", "pending_qa1", "pending_qa2", "pending_md"].includes(w.status)
    ).length;
    const rejected = active.filter((w) => w.status === "rejected").length;
    return { total, approved, inProgress, rejected };
  }, [workflows]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: "#000033" }}
          >
            QA WORKFLOWS
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            MSC Cruises · All Platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
          <Link href="/new">
            <Button
              size="sm"
              className="gap-1.5 text-white"
              style={{ backgroundColor: "#E8321A", borderColor: "#E8321A" }}
            >
              <PlusCircle size={14} />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Workflows", value: stats.total, icon: TrendingUp, color: "#000033" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "#F59E0B" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "#22C55E" },
          { label: "Rejected", value: stats.rejected, icon: AlertCircle, color: "#E8321A" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded border px-4 py-3 flex items-center gap-3"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-bold leading-none" style={{ color: "#000033" }}>
                {value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterLaunchType} onValueChange={setFilterLaunchType}>
          <SelectTrigger className="h-8 text-sm w-44">
            <Filter size={12} className="mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Launch Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Launch Types</SelectItem>
            {Object.entries(LAUNCH_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="h-8 text-sm w-44">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Archive toggle */}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={cn(
            "flex items-center gap-1.5 px-3 h-8 rounded border text-xs font-medium transition-all",
            showArchived
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-gray-200 bg-white text-muted-foreground hover:border-gray-300 hover:text-foreground"
          )}
        >
          <Archive size={12} />
          {showArchived ? "Showing Archived" : "Show Archived"}
        </button>
      </div>

      {/* Workflow table */}
      <div className="bg-white rounded border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {/* Table header */}
        <div
          className="grid text-xs font-semibold tracking-widest uppercase px-4 py-2.5"
          style={{
            backgroundColor: "#000033",
            color: "rgba(255,255,255,0.7)",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 80px 100px 60px",
            letterSpacing: "0.07em",
          }}
        >
          <div>Campaign</div>
          <div>Launch Type</div>
          <div>Platform</div>
          <div>Status</div>
          <div>Progress</div>
          <div>Created</div>
          <div />
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading workflows...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-sm text-muted-foreground mb-3">
              {showArchived ? "No archived workflows" : "No workflows found"}
            </div>
            {!showArchived && (
              <Link href="/new">
                <Button size="sm" style={{ backgroundColor: "#E8321A", color: "white" }}>
                  <PlusCircle size={13} className="mr-1.5" />
                  Create your first workflow
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {filtered.map((wf) => {
              const pct = getCompletionPct(wf.checklistData);
              const launchLabel = LAUNCH_TYPE_LABELS[wf.launchType as LaunchType] ?? wf.launchType;
              const platformLabel = PLATFORM_LABELS[wf.platform as Platform] ?? wf.platform;
              const launchColor = LAUNCH_TYPE_COLORS[wf.launchType as LaunchType] ?? "bg-gray-200 text-gray-700";
              const statusColor = STATUS_COLORS[wf.status] ?? "bg-gray-100 text-gray-700";
              const statusLabel = STATUS_LABELS[wf.status] ?? wf.status;
              const isArchived = wf.archived === "1";
              const createdDate = new Date(wf.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "2-digit",
              });

              return (
                <div
                  key={wf.id}
                  className={cn(
                    "grid items-center px-4 py-3 transition-colors",
                    isArchived ? "bg-gray-50 opacity-70" : "hover:bg-gray-50"
                  )}
                  style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 80px 100px 60px" }}
                >
                  {/* Campaign name — clickable */}
                  <Link href={`/workflow/${wf.id}`}>
                    <div className="cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium hover:underline" style={{ color: "#000033" }}>
                          {wf.campaignName}
                        </span>
                        {isArchived && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {wf.client}{wf.market ? ` · ${wf.market}` : ""}
                        {wf.campaignId ? (
                          <span className="font-mono ml-1.5" style={{ color: "#94A3B8" }}>
                            #{wf.campaignId}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  {/* Launch type */}
                  <div>
                    <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", launchColor)}>
                      {launchLabel}
                    </span>
                  </div>

                  {/* Platform */}
                  <div className="text-sm text-muted-foreground">{platformLabel}</div>

                  {/* Status */}
                  <div>
                    <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", statusColor)}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct === 100 ? "#22C55E" : "#E8321A",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-7 text-right">
                      {pct}%
                    </span>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-muted-foreground font-mono">{createdDate}</div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveMutation.mutate({ workflowId: wf.id, archive: !isArchived });
                      }}
                      title={isArchived ? "Restore workflow" : "Archive workflow"}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        isArchived
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-muted-foreground hover:bg-gray-100 hover:text-amber-600"
                      )}
                    >
                      {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                    <Link href={`/workflow/${wf.id}`}>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {workflows.length} workflows
          {showArchived && " (including archived)"}
        </div>
      )}
    </div>
  );
}
