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
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"STAFF" | "ALL" | "APPLICANT">("STAFF");
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Revoke state
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  // Form State for Adding Staff
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState("REVIEWER");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Live Discord Lookup State
  const [lookingUp, setLookingUp] = useState(false);
  const [lookedUpProfile, setLookedUpProfile] = useState<{
    id: string;
    username: string;
    globalName?: string | null;
    avatar?: string | null;
  } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedRoleFilter) params.append("role", selectedRoleFilter);

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
    }, 250);
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
        fetchUsers();
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (err) {
      alert("Network error updating role");
    }
  };

  const handleRevokeStaff = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke this user's staff permissions and demote them to applicant?")) {
      return;
    }
    setRevokingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to revoke staff access");
      }
    } catch (err) {
      alert("Network error revoking access");
    } finally {
      setRevokingUserId(null);
    }
  };

  // Live lookup Discord user
  const handleDiscordIdLookup = async (idToLookup: string) => {
    if (!idToLookup.trim() || idToLookup.trim().length < 15) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(idToLookup.trim())}&role=ALL`);
      const data = await res.json();
      if (data.success && data.users && data.users.length > 0) {
        const found = data.users.find((u: any) => u.discordId === idToLookup.trim());
        if (found) {
          setLookedUpProfile({
            id: found.discordId,
            username: found.discordUsername,
            globalName: found.discordGlobalName,
            avatar: found.discordAvatar,
          });
          setNewUsername(found.discordUsername);
          setLookingUp(false);
          return;
        }
      }
      setLookedUpProfile(null);
    } catch (err) {
      console.warn("Lookup note:", err);
    } finally {
      setLookingUp(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscordId.trim()) {
      setFormError("Discord Snowflake User ID is required.");
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

      setFormSuccess(`Successfully granted ${newRole} permissions to ${data.user.discordUsername}!`);
      setNewDiscordId("");
      setNewUsername("");
      setLookedUpProfile(null);
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
              Staff & Roster Management
            </h1>
            <Badge className="bg-primary/20 text-primary border-primary/40 font-mono">
              {users.length} {selectedRoleFilter === "STAFF" ? "Staff Members" : "Users"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Manage administrative access, application reviewers, and staff rosters.
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
            Full platform control. Manage staff roles, configure recruitment questions, edit supported game modes, modify settings, and review applications.
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-[#12111c] p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
            <Shield className="h-4 w-4" />
            <span>Staff Reviewer (REVIEWER)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Application evaluation suite access. Inspect applicant dossiers, review duel clips, write private notes, accept/reject, and request changes.
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-[#10141c] p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Applicant (APPLICANT)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            General candidate access. Can fill and submit staff applications, upload duel evidence, and track review status.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Discord name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#0e1218] border-border/80 text-xs font-mono"
          />
        </div>

        {/* Role View Toggle Tabs */}
        <div className="flex items-center rounded-xl bg-[#0e1218] p-1 border border-border/80 w-full sm:w-auto">
          <button
            onClick={() => setSelectedRoleFilter("STAFF")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              selectedRoleFilter === "STAFF"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Staff Roster Only
          </button>
          <button
            onClick={() => setSelectedRoleFilter("ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              selectedRoleFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> All Users
          </button>
          <button
            onClick={() => setSelectedRoleFilter("APPLICANT")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              selectedRoleFilter === "APPLICANT"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Applicants
          </button>
        </div>
      </div>

      {/* Users & Staff Roster Table */}
      <div className="rounded-2xl border border-border/80 bg-[#121721] overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground font-mono text-xs">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Loading user directory...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-white font-mono text-sm">No Users Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No accounts match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-border/60 bg-[#0e1218] text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Discord Member</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Snowflake ID</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Role</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-center">Applications</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-center">Reviews Done</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Registered</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u) => {
                  const avatarUrl = u.discordAvatar
                    ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.discordAvatar}.png`
                    : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discordId || "0", 10) % 5}.png`;

                  return (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      {/* User Avatar + Username */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={u.discordUsername}
                            className="h-8 w-8 rounded-full border border-border/80 object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/vx-logo.jpg";
                            }}
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

                      {/* Quick Role Change & Remove Button */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="rounded-lg border border-border/80 bg-[#0a0d13] px-2.5 py-1 text-xs font-mono text-white focus:border-primary focus:outline-none cursor-pointer"
                          >
                            <option value="APPLICANT">Applicant</option>
                            <option value="REVIEWER">Reviewer</option>
                            <option value="ADMIN">Admin</option>
                          </select>

                          {u.role !== "APPLICANT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeStaff(u.id)}
                              disabled={revokingUserId === u.id}
                              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                              title="Revoke Staff Permissions"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
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
                <UserPlus className="h-4 w-4 text-primary" /> Grant Staff Permissions
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 font-mono flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-mono flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Discord ID Input + Live Lookup */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-white uppercase">
                  Discord Snowflake ID <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 1422296301768540240"
                    value={newDiscordId}
                    onChange={(e) => {
                      setNewDiscordId(e.target.value);
                      handleDiscordIdLookup(e.target.value);
                    }}
                    className="bg-[#080b0f] border-border/80 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDiscordIdLookup(newDiscordId)}
                    disabled={lookingUp || !newDiscordId.trim()}
                    className="font-mono text-xs text-muted-foreground hover:text-white"
                  >
                    {lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Lookup"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Right-click any user in Discord and select <strong>Copy User ID</strong>.
                </p>
              </div>

              {/* Looked up profile preview */}
              {lookedUpProfile && (
                <div className="rounded-xl border border-border/80 bg-[#121721] p-3 flex items-center gap-3">
                  <img
                    src={
                      lookedUpProfile.avatar
                        ? `https://cdn.discordapp.com/avatars/${lookedUpProfile.id}/${lookedUpProfile.avatar}.png`
                        : "/vx-logo.jpg"
                    }
                    alt={lookedUpProfile.username}
                    className="h-9 w-9 rounded-full object-cover border border-border"
                  />
                  <div>
                    <span className="font-bold text-white text-xs font-mono block">
                      {lookedUpProfile.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {lookedUpProfile.globalName || "Discord Member"}
                    </span>
                  </div>
                </div>
              )}

              {/* Optional Custom Display Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-white uppercase">
                  Staff Display Name <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Alex (Staff Lead)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-[#080b0f] border-border/80 text-xs font-mono"
                />
              </div>

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-white uppercase">
                  Role Assignment <span className="text-red-400">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-[#080b0f] p-2.5 text-xs font-mono text-white focus:border-primary focus:outline-none"
                >
                  <option value="REVIEWER">Reviewer (Staff Application Evaluator)</option>
                  <option value="ADMIN">Administrator (Full Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="font-mono text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !newDiscordId.trim()}
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
