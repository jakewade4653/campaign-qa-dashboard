import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
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
  REVIEWER_LABELS,
} from "@/lib/checklistDefinitions";
import type { LaunchType, Platform } from "@/lib/checklistDefinitions";
import { Search, Filter, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  workflow_created: "Workflow Created",
  item_updated: "Item Updated",
  signed_off: "Signed Off",
  status_changed: "Status Changed",
};

const ACTION_COLORS: Record<string, string> = {
  workflow_created: "bg-blue-100 text-blue-800",
  item_updated: "bg-gray-100 text-gray-700",
  signed_off: "bg-green-100 text-green-800",
  status_changed: "bg-amber-100 text-amber-800",
};

const ROLE_COLORS: Record<string, string> = {
  builder: "bg-[#000033] text-white",
  qa1: "bg-[#2D6C93] text-white",
  qa2: "bg-[#3D8CA4] text-white",
  md: "bg-[#E8321A] text-white",
};

function formatDetails(action: string, details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  if (action === "item_updated") {
    const status = String(d.status ?? "").toUpperCase();
    const section = String(d.sectionId ?? "").replace(/_/g, " ").toUpperCase();
    const item = String(d.itemId ?? "").split("__")[0].replace(/_/g, " ");
    return `${section} → ${item} → ${status}${d.note ? ` (Note: ${d.note})` : ""}`;
  }
  if (action === "signed_off") {
    return `${REVIEWER_LABELS[String(d.role)] ?? d.role} sign-off → ${String(d.newStatus ?? "").replace(/_/g, " ")}`;
  }
  if (action === "status_changed") {
    return `${String(d.fromStatus ?? "").replace(/_/g, " ")} → ${String(d.toStatus ?? "").replace(/_/g, " ")}${d.reason ? ` (${d.reason})` : ""}`;
  }
  if (action === "workflow_created") {
    return `${LAUNCH_TYPE_LABELS[String(d.launchType) as LaunchType] ?? d.launchType} on ${PLATFORM_LABELS[String(d.platform) as Platform] ?? d.platform}`;
  }
  return JSON.stringify(details);
}

export default function WorkflowLog() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterLaunchType, setFilterLaunchType] = useState("all");

  const { data: logs = [], isLoading, refetch } = trpc.logs.list.useQuery({});

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !search ||
        (log.campaignName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        log.actorName.toLowerCase().includes(search.toLowerCase()) ||
        (log.client ?? "").toLowerCase().includes(search.toLowerCase());
      const matchAction = filterAction === "all" || log.action === filterAction;
      const matchPlatform = filterPlatform === "all" || log.platform === filterPlatform;
      const matchLaunch = filterLaunchType === "all" || log.launchType === filterLaunchType;
      return matchSearch && matchAction && matchPlatform && matchLaunch;
    });
  }, [logs, search, filterAction, filterPlatform, filterLaunchType]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: "#000033" }}
          >
            ACTIVITY LOG
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full audit trail of all QA workflow actions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5"
        >
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: logs.length },
          { label: "Workflows Created", value: logs.filter((l) => l.action === "workflow_created").length },
          { label: "Items Updated", value: logs.filter((l) => l.action === "item_updated").length },
          { label: "Sign-Offs", value: logs.filter((l) => l.action === "signed_off").length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded border px-4 py-3"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div className="text-xl font-bold font-mono" style={{ color: "#000033" }}>{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by campaign, actor, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-8 text-sm w-44">
            <Filter size={12} className="mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
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
        <Select value={filterLaunchType} onValueChange={setFilterLaunchType}>
          <SelectTrigger className="h-8 text-sm w-44">
            <SelectValue placeholder="Launch Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Launch Types</SelectItem>
            {Object.entries(LAUNCH_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log table */}
      <div className="bg-white rounded border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {/* Table header */}
        <div
          className="grid text-xs font-semibold tracking-widest uppercase px-4 py-2.5"
          style={{
            backgroundColor: "#000033",
            color: "rgba(255,255,255,0.7)",
            gridTemplateColumns: "140px 80px 1fr 1fr 1fr 120px",
            letterSpacing: "0.07em",
          }}
        >
          <div>Timestamp</div>
          <div>Role</div>
          <div>Actor</div>
          <div>Campaign</div>
          <div>Action / Details</div>
          <div>Platform · Type</div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading activity log...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Activity size={24} className="mx-auto mb-3 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">No activity found</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {filtered.map((log) => {
              const actionColor = ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700";
              const roleColor = ROLE_COLORS[log.actorRole] ?? "bg-gray-200 text-gray-700";
              const details = formatDetails(log.action, log.details);
              const ts = new Date(log.createdAt);

              return (
                <div
                  key={log.id}
                  className="grid items-start px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                  style={{ gridTemplateColumns: "140px 80px 1fr 1fr 1fr 120px" }}
                >
                  {/* Timestamp */}
                  <div className="font-mono text-xs text-muted-foreground">
                    <div>{ts.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div>{ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>

                  {/* Role */}
                  <div>
                    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-xs font-bold font-mono", roleColor)}>
                      {log.actorRole.toUpperCase()}
                    </span>
                  </div>

                  {/* Actor */}
                  <div className="font-medium" style={{ color: "#000033" }}>
                    {log.actorName}
                  </div>

                  {/* Campaign */}
                  <div>
                    <div className="font-medium text-xs" style={{ color: "#000033" }}>
                      {log.campaignName ?? "—"}
                    </div>
                    {log.client && (
                      <div className="text-xs text-muted-foreground">{log.client}</div>
                    )}
                  </div>

                  {/* Action + details */}
                  <div>
                    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-xs font-medium mb-1", actionColor)}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    {details && (
                      <div className="text-xs text-muted-foreground leading-relaxed">{details}</div>
                    )}
                  </div>

                  {/* Platform + launch type */}
                  <div className="text-xs text-muted-foreground">
                    <div>{PLATFORM_LABELS[log.platform as Platform] ?? log.platform ?? "—"}</div>
                    <div>{LAUNCH_TYPE_LABELS[log.launchType as LaunchType] ?? log.launchType ?? "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {logs.length} events
        </div>
      )}
    </div>
  );
}
