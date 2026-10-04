"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Users, Plus, CheckCircle2, Phone, Mail, RotateCw, CheckSquare } from "lucide-react";

interface Member {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  availability: string;
  responsibilities?: string;
  preferences?: string;
  avatar?: string;
  pendingTasksCount: number;
  completedTasksCount: number;
  pendingTasks: Array<{ id: string; title: string; priority: string }>;
}

export default function FamilyPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("Member");
  const [phone, setPhone] = useState("+91 ");
  const [responsibilities, setResponsibilities] = useState("");
  const [preferences, setPreferences] = useState("");

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/family");
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          phone,
          responsibilities,
          preferences,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setName("");
        setPhone("+91 ");
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase">
              <Users className="w-3.5 h-3.5" />
              <span>Sharma Household Members</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Family &amp; Domestic Helpers
            </h1>
            <p className="text-sm text-slate-500">
              Manage member roles, active workloads, chore preferences, and domestic helper coordination.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Members Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>Loading family profiles...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top: Avatar, Name, Role */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center ring-2 ring-slate-100">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">{member.name}</h2>
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {member.availability}
                    </span>
                  </div>

                  {/* Contact Info */}
                  {member.phone && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Responsibilities & Preferences */}
                  <div className="mt-4 space-y-2 text-xs">
                    {member.responsibilities && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                          Delegated Responsibilities
                        </span>
                        <span className="text-slate-800">{member.responsibilities}</span>
                      </div>
                    )}

                    {member.preferences && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                          Preferences &amp; Timings
                        </span>
                        <span className="text-slate-800">{member.preferences}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workload footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    <strong className="text-slate-900">{member.pendingTasksCount}</strong> active tasks
                  </span>
                  <span className="text-slate-500">
                    <strong className="text-emerald-700">{member.completedTasksCount}</strong> resolved
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Member */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95">
              <h2 className="text-base font-bold text-slate-900">Add Household Member</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a family member or domestic staff to delegate tasks.
              </p>

              <form onSubmit={handleAddMember} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma, Sunita Devi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Member">Family Member</option>
                      <option value="Parent">Parent / Senior</option>
                      <option value="Helper">Domestic Staff / Cook / Maid</option>
                      <option value="Child">Child</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Responsibilities
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen supplies, Plant watering, Morning delivery"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Preferences &amp; Timings
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Works 9am - 1pm, prefers morning slots"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
