import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LAUNCH_TYPE_LABELS,
  LAUNCH_TYPE_DESCRIPTIONS,
  PLATFORM_LABELS,
  LAUNCH_TYPE_COLORS,
} from "@/lib/checklistDefinitions";
import type { LaunchType, Platform } from "@/lib/checklistDefinitions";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, X, Rocket } from "lucide-react";

type Step = 1 | 2 | 3;

const LAUNCH_TYPES = Object.entries(LAUNCH_TYPE_LABELS) as [LaunchType, string][];
const PLATFORMS = Object.entries(PLATFORM_LABELS) as [Platform, string][];

export default function NewWorkflow() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [launchType, setLaunchType] = useState<LaunchType | "">("");

  // Step 2
  const [campaignName, setCampaignName] = useState("");
  const [client, setClient] = useState("MSC Cruises");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [market, setMarket] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [flightStart, setFlightStart] = useState("");
  const [flightEnd, setFlightEnd] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetType, setBudgetType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  // Step 3
  const [creatorName, setCreatorName] = useState("");
  const [adSetGroups, setAdSetGroups] = useState<string[]>(["LAL Combo", "Mini LAL Combo", "Interest Combo"]);
  const [newGroup, setNewGroup] = useState("");

  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: (data) => {
      toast.success("Workflow created successfully");
      navigate(`/workflow/${data.id}`);
    },
    onError: (err) => {
      toast.error(`Failed to create workflow: ${err.message}`);
    },
  });

  const needsBudget = launchType === "campaign_launch" || launchType === "platform_launch" || launchType === "budget_change";
  const needsAdSetGroups = ["campaign_launch", "creative_launch", "platform_launch"].includes(launchType);

  const handleSubmit = () => {
    if (!launchType || !campaignName || !platform) return;
    createMutation.mutate({
      campaignName,
      client,
      platform,
      launchType,
      market: market || undefined,
      campaignId: campaignId || undefined,
      flightStart: flightStart || undefined,
      flightEnd: flightEnd || undefined,
      budgetAmount: budgetAmount || undefined,
      budgetType: budgetType || undefined,
      adSetGroups: needsAdSetGroups ? JSON.stringify(adSetGroups) : undefined,
      notes: notes || undefined,
      createdByName: creatorName || "Builder",
      deadline: deadline || undefined,
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Dashboard
        </button>
        <h2 className="text-xl font-semibold" style={{ color: "#000033" }}>
          NEW QA WORKFLOW
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your campaign QA checklist
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {([1, 2, 3] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === s
                  ? "text-white"
                  : step > s
                  ? "text-white"
                  : "text-gray-400 bg-gray-100"
              )}
              style={step >= s ? { backgroundColor: "#E8321A" } : {}}
            >
              {s}
            </div>
            <div className="ml-2 text-xs font-medium hidden sm:block" style={{ color: step >= s ? "#000033" : "#94A3B8" }}>
              {["Launch Type", "Campaign Details", "Reviewer & Groups"][i]}
            </div>
            {i < 2 && (
              <div
                className="mx-3 h-px flex-1 w-12"
                style={{ backgroundColor: step > s ? "#E8321A" : "#E5E7EB" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Launch Type */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#000033" }}>
              Select Launch Type
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              The launch type determines which QA checklist sections are required.
            </p>
          </div>
          <div className="grid gap-3">
            {LAUNCH_TYPES.map(([type, label]) => {
              const desc = LAUNCH_TYPE_DESCRIPTIONS[type];
              const colorClass = LAUNCH_TYPE_COLORS[type];
              const isSelected = launchType === type;
              return (
                <button
                  key={type}
                  onClick={() => setLaunchType(type)}
                  className={cn(
                    "w-full text-left rounded border p-4 transition-all",
                    isSelected
                      ? "border-[#E8321A] bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 border-2 transition-all",
                        isSelected ? "border-[#E8321A] bg-[#E8321A]" : "border-gray-300"
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: "#000033" }}>
                          {label}
                        </span>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", colorClass)}>
                          {type.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              disabled={!launchType}
              onClick={() => setStep(2)}
              className="gap-1.5 text-white"
              style={{ backgroundColor: "#E8321A", borderColor: "#E8321A" }}
            >
              Continue
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Campaign Details */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. MSC_META_US_AWARENESS_Q2_2026"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Client
              </Label>
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Platform <span className="text-red-500">*</span>
              </Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Market / Geo
              </Label>
              <Input
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g. US, Northeast, Miami"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Campaign ID
              </Label>
              <Input
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Platform campaign ID"
                className="mt-1.5 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Flight Start
              </Label>
              <Input
                type="date"
                value={flightStart}
                onChange={(e) => setFlightStart(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Flight End
              </Label>
              <Input
                type="date"
                value={flightEnd}
                onChange={(e) => setFlightEnd(e.target.value)}
                className="mt-1.5"
              />
            </div>
            {needsBudget && (
              <>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                    Budget Amount
                  </Label>
                  <Input
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="e.g. $50,000"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                    Budget Type
                  </Label>
                  <Select value={budgetType} onValueChange={setBudgetType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Budget</SelectItem>
                      <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="sm:col-span-2 space-y-4">
              <div>
                <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                  QA Deadline
                </Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The date by which this QA workflow must be completed and approved.
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional context for this workflow..."
                  className="mt-1.5 text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ChevronLeft size={14} />
              Back
            </Button>
            <Button
              disabled={!campaignName || !platform}
              onClick={() => setStep(3)}
              className="gap-1.5 text-white"
              style={{ backgroundColor: "#E8321A", borderColor: "#E8321A" }}
            >
              Continue
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Reviewer & Ad Set Groups */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
              Your Name (Builder)
            </Label>
            <Input
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="mt-1.5 max-w-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be recorded as the workflow builder in the activity log.
            </p>
          </div>

          {needsAdSetGroups && (
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>
                Ad Set Groups
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Add the ad set groups for this campaign. Checklist items marked "per ad set group" will be tracked separately for each group.
              </p>
              <div className="space-y-2">
                {adSetGroups.map((group, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="flex-1 flex items-center gap-2 px-3 py-2 rounded border text-sm"
                      style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: "#E8321A" }}
                      />
                      {group}
                    </div>
                    <button
                      onClick={() => setAdSetGroups(adSetGroups.filter((_, j) => j !== i))}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newGroup.trim()) {
                        setAdSetGroups([...adSetGroups, newGroup.trim()]);
                        setNewGroup("");
                      }
                    }}
                    placeholder="Add ad set group name..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newGroup.trim()) {
                        setAdSetGroups([...adSetGroups, newGroup.trim()]);
                        setNewGroup("");
                      }
                    }}
                    className="gap-1"
                  >
                    <Plus size={13} />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div
            className="rounded border p-4 space-y-2"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
          >
            <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#000033" }}>
              Workflow Summary
            </div>
            {[
              ["Campaign", campaignName],
              ["Client", client],
              ["Launch Type", LAUNCH_TYPE_LABELS[launchType as LaunchType]],
              ["Platform", PLATFORM_LABELS[platform as Platform]],
              ["Market", market || "—"],
              ["Flight", flightStart && flightEnd ? `${flightStart} → ${flightEnd}` : "—"],
              ["Budget", budgetAmount ? `${budgetAmount} (${budgetType})` : "—"],
              ["QA Deadline", deadline || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium" style={{ color: "#000033" }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
              <ChevronLeft size={14} />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="gap-1.5 text-white"
              style={{ backgroundColor: "#E8321A", borderColor: "#E8321A" }}
            >
              <Rocket size={14} />
              {createMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
