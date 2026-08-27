"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldAlert,
  UserPlus,
  Search,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Crown,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Adding Staff
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState("REVIEWER");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedRoleFilter !== "ALL") params.append("role", selectedRoleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedRoleFilter]);

  const handleUpdateRole = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
        );
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (err) {
      alert("Network error updating role");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscordId.trim()) {
      setFormError("Discord User ID (Snowflake) is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: newDiscordId.trim(),
          discordUsername: newUsername.trim() || undefined,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add user");
      }

      setFormSuccess(`Successfully granted ${newRole} access!`);
      setNewDiscordId("");
      setNewUsername("");
      fetchUsers();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to add user.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white font-mono uppercase">
              Staff & Permissions
            </h1>
            <Badge className="bg-primary/20 text-primary border-primary/40 font-mono">
              {users.length} Users
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Manage administrative privileges, application reviewers, and staff access rosters.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-xs gap-2 shadow-lg shadow-primary/15"
        >
          <UserPlus className="h-4 w-4" /> Add Staff / Grant Role
        </Button>
      </div>

      {/* Permissions Legend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-500/30 bg-[#141018] p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
            <Crown className="h-4 w-4" />
            <span>Administrator (ADMIN)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Full platform access. Manage staff roles, configure recruitment questions, edit supported game modes, modify platform settings, and review applications.
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-[#12111c] p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
            <Shield className="h-4 w-4" />
            <span>Staff Reviewer (REVIEWER)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Application evaluation suite access. Inspect applicant dossiers, stream attached duel clips, write private review notes, accept/reject, and request changes.
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-[#121721] p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Standard Contender (APPLICANT)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Standard candidate account. Can create, edit, save drafts, submit staff applications, and view personal application review status.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by username or Discord ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#121721] border-border text-xs font-mono text-white placeholder:text-muted-foreground h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ADMIN", "REVIEWER", "APPLICANT"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition-colors cursor-pointer ${
                selectedRoleFilter === r
                  ? "bg-primary text-black"
                  : "bg-secondary/60 text-muted-foreground hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border/80 bg-[#121721] overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground font-mono text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading staff roster...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-12 space-y-2">
            <p className="text-sm font-mono text-muted-foreground">No users found matching query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/60 bg-[#161c28] font-mono text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Discord Snowflake</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5 text-center">Applications</th>
                  <th className="p-3.5 text-center">Reviews Done</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right">Quick Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {users.map((u) => {
                  const avatarUrl = u.discordAvatar
                    ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.discordAvatar}.png?size=64`
                    : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discordId.slice(-1) || "0") % 5}.png`;

                  return (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      {/* User Avatar + Username */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={u.discordUsername}
                            className="h-8 w-8 rounded-full border border-border/80 object-cover flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.discordUsername}</span>
                              {u.role === "ADMIN" && <Crown className="h-3 w-3 text-red-400" />}
                              {u.role === "REVIEWER" && <Shield className="h-3 w-3 text-purple-400" />}
                            </div>
                            {u.discordGlobalName && (
                              <div className="text-[10px] text-muted-foreground font-sans">
                                {u.discordGlobalName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Discord ID */}
                      <td className="p-3.5">
                        <button
                          onClick={() => copyToClipboard(u.discordId)}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-white text-[11px] font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/50 group cursor-pointer"
                          title="Click to copy Discord Snowflake"
                        >
                          <span>{u.discordId}</span>
                          {copiedId === u.discordId ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                            <Crown className="h-3 w-3" /> ADMIN
                          </span>
                        ) : u.role === "REVIEWER" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                            <Shield className="h-3 w-3" /> REVIEWER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-secondary/80 border border-border/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            APPLICANT
                          </span>
                        )}
                      </td>

                      {/* Application Count */}
                      <td className="p-3.5 text-center text-foreground font-semibold">
                        {u._count?.applications || 0}
                      </td>

                      {/* Reviews Done */}
                      <td className="p-3.5 text-center text-primary font-bold">
                        {u._count?.reviewedApps || 0}
                      </td>

                      {/* Joined Date */}
                      <td className="p-3.5 text-muted-foreground text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Quick Role Change Selector */}
                      <td className="p-3.5 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="rounded-lg border border-border/80 bg-[#0a0d13] px-2.5 py-1 text-xs font-mono text-white focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="APPLICANT">Applicant</option>
                          <option value="REVIEWER">Reviewer (Staff)</option>
                          <option value="ADMIN">Admin (Full Control)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Staff / Grant Permissions */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-[#0e1218] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold font-mono text-white uppercase">
                <Key className="h-4 w-4 text-primary" />
                <span>Grant Staff Role & Permissions</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-400 font-mono flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-400 font-mono flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-white uppercase">
                  Discord User ID (Snowflake) *
                </label>
                <Input
                  required
                  placeholder="e.g. 1422296301768540240"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  className="bg-[#121721] border-border text-xs font-mono text-white placeholder:text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground font-mono">
                  Right click the user in Discord → Copy User ID (Developer Mode must be on).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-white uppercase">
                  Discord Username <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="e.g. tanmay_pvp"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-[#121721] border-border text-xs font-mono text-white placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-white uppercase">
                  Role Assignment *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("REVIEWER")}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer font-mono text-xs ${
                      newRole === "REVIEWER"
                        ? "border-purple-500 bg-purple-500/15 text-purple-300 font-bold"
                        : "border-border/70 bg-[#121721] text-muted-foreground hover:border-border hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Reviewer</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Grade and review applications.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("ADMIN")}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer font-mono text-xs ${
                      newRole === "ADMIN"
                        ? "border-red-500 bg-red-500/15 text-red-300 font-bold"
                        : "border-border/70 bg-[#121721] text-muted-foreground hover:border-border hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crown className="h-3.5 w-3.5" />
                      <span>Admin</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Full control & configuration.
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="font-mono text-xs border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-xs gap-1.5"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Assign Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
