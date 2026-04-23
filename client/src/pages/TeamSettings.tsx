import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { REVIEWER_LABELS } from "@/lib/checklistDefinitions";
import { Users, Plus, Pencil, Trash2, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = ["builder", "qa1", "qa2", "md", "ed"];

const ROLE_COLORS: Record<string, string> = {
  builder: "bg-blue-100 text-blue-700",
  qa1: "bg-purple-100 text-purple-700",
  qa2: "bg-indigo-100 text-indigo-700",
  md: "bg-red-100 text-red-700",
  ed: "bg-orange-100 text-orange-700",
};

interface MemberForm {
  name: string;
  email: string;
  role: string;
}

const EMPTY_FORM: MemberForm = { name: "", email: "", role: "builder" };

export default function TeamSettings() {
  const utils = trpc.useUtils();

  const { data: members = [], isLoading } = trpc.team.getEmails.useQuery();

  const upsertMutation = trpc.team.upsertEmail.useMutation({
    onSuccess: () => {
      utils.team.getEmails.invalidate();
      toast.success("Team member saved.");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingName(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.team.deleteEmail.useMutation({
    onSuccess: () => {
      utils.team.getEmails.invalidate();
      toast.success("Team member removed.");
    },
    onError: (err) => toast.error(err.message),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingName(null);
    setModalOpen(true);
  };

  const openEdit = (member: { name: string; email: string; role: string }) => {
    setForm({ name: member.name, email: member.email, role: member.role });
    setEditingName(member.name);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { toast.error("Valid email is required."); return; }
    upsertMutation.mutate({ name: form.name.trim(), email: form.email.trim(), role: form.role });
  };

  const handleDelete = (name: string) => {
    deleteMutation.mutate({ name });
    setDeleteConfirm(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#000033" }}>
            <Users size={18} style={{ color: "#E8321A" }} />
            Team Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage team members for QA notification routing. Email addresses are used to send sign-off, fail, and deadline alerts.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openAdd}
          className="gap-1.5 text-white"
          style={{ backgroundColor: "#E8321A" }}
        >
          <Plus size={13} />
          Add Member
        </Button>
      </div>

      {/* Info banner */}
      <div
        className="rounded border p-3 text-xs flex items-start gap-2"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
      >
        <ShieldCheck size={14} className="shrink-0 mt-0.5" style={{ color: "#E8321A" }} />
        <div style={{ color: "#64748B" }}>
          <strong style={{ color: "#000033" }}>Notification routing:</strong> When a reviewer signs off or a checklist item fails,
          the system looks up the next reviewer's email from this roster. Jenna Radomsky is always CC'd on all QA emails.
          Team members can also add themselves when they log in.
        </div>
      </div>

      {/* Table */}
      <div className="rounded border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        {/* Table header */}
        <div
          className="grid text-xs font-semibold uppercase tracking-wider px-4 py-2.5"
          style={{
            gridTemplateColumns: "1fr 1.5fr 120px 80px",
            backgroundColor: "#000033",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div className="text-right">Actions</div>
        </div>

        {isLoading && (
          <div className="px-4 py-8 text-sm text-center text-muted-foreground">Loading team...</div>
        )}

        {!isLoading && members.length === 0 && (
          <div className="px-4 py-8 text-sm text-center text-muted-foreground">
            No team members yet. Add your first member above.
          </div>
        )}

        {!isLoading && members.map((member, idx) => (
          <div
            key={member.name}
            className={cn(
              "grid items-center px-4 py-3 text-sm",
              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
            )}
            style={{ gridTemplateColumns: "1fr 1.5fr 120px 80px" }}
          >
            <div className="font-medium" style={{ color: "#000033" }}>{member.name}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail size={11} className="shrink-0" />
              <span className="truncate font-mono text-xs">{member.email}</span>
            </div>
            <div>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
                  ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-700"
                )}
              >
                {REVIEWER_LABELS[member.role] ?? member.role}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(member)}
                className="p-1.5 rounded hover:bg-gray-200 text-muted-foreground hover:text-foreground transition-colors"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => setDeleteConfirm(member.name)}
                className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) { setForm(EMPTY_FORM); setEditingName(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingName ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Jake Wade"
                className="mt-1.5 h-9 text-sm"
                disabled={!!editingName}
              />
              {editingName && (
                <p className="text-xs text-muted-foreground mt-1">Name is the primary key — create a new entry to change it.</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. jake.wade@omc.com"
                className="mt-1.5 h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold" style={{ color: "#000033" }}>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1.5 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{REVIEWER_LABELS[r] ?? r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                className="text-white"
                style={{ backgroundColor: "#E8321A" }}
              >
                {upsertMutation.isPending ? "Saving..." : "Save Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deleteConfirm}</strong> from the team roster?
            They will no longer receive QA notification emails.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
              className="text-white"
              style={{ backgroundColor: "#E8321A" }}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
