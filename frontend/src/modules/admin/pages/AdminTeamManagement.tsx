import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '../../../services/api/config';
import { ALL_MODULES, AdminModule, MODULE_LABELS } from '../../../context/AdminPermissionContext';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.inorfresh.com/api/v1';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: 'Investor' | 'Staff';
  isActive: boolean;
  viewModules: AdminModule[];
  writeModules: AdminModule[];
  createdAt: string;
}

interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: 'Investor' | 'Staff';
}

const emptyForm: MemberFormData = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  role: 'Staff',
};

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
  };
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function roleColor(role: string) {
  if (role === 'Investor') return 'bg-violet-100 text-violet-700 border-violet-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

// ─── Permission Matrix Component ─────────────────────────────────────────────
function PermissionMatrix({
  viewModules,
  writeModules,
  onChange,
}: {
  viewModules: AdminModule[];
  writeModules: AdminModule[];
  onChange: (view: AdminModule[], write: AdminModule[]) => void;
}) {
  function toggleView(m: AdminModule) {
    if (viewModules.includes(m)) {
      onChange(
        viewModules.filter((x) => x !== m),
        writeModules.filter((x) => x !== m),
      );
    } else {
      onChange([...viewModules, m], writeModules);
    }
  }

  function toggleWrite(m: AdminModule) {
    if (!viewModules.includes(m)) return;
    if (writeModules.includes(m)) {
      onChange(viewModules, writeModules.filter((x) => x !== m));
    } else {
      onChange(viewModules, [...writeModules, m]);
    }
  }

  function selectAll() {
    onChange([...ALL_MODULES], [...ALL_MODULES]);
  }

  function clearAll() {
    onChange([], []);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-neutral-500">
          Toggle view/write access per module. Write requires View to be enabled.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px] bg-neutral-50 border-b border-neutral-200 px-4 py-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Module</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide text-center">View</span>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide text-center">Write</span>
        </div>
        {ALL_MODULES.map((m, i) => {
          const hasView = viewModules.includes(m);
          const hasWrite = writeModules.includes(m);
          return (
            <div
              key={m}
              className={`grid grid-cols-[1fr_80px_80px] px-4 py-2.5 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'} hover:bg-indigo-50/30 transition-colors`}
            >
              <span className="text-sm text-neutral-700 font-medium">{MODULE_LABELS[m]}</span>

              {/* View toggle */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => toggleView(m)}
                  className={`w-10 h-5.5 rounded-full relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                    hasView ? 'bg-indigo-500' : 'bg-neutral-200'
                  }`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      hasView ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Write toggle */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => toggleWrite(m)}
                  disabled={!hasView}
                  className={`relative rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all duration-200 ${
                    !hasView ? 'opacity-30 cursor-not-allowed' : ''
                  } ${hasWrite && hasView ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      hasWrite && hasView ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
          View enabled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          Write enabled
        </span>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (m: TeamMember) => void;
}) {
  const [form, setForm] = useState<MemberFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.mobile) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/team`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`${form.role} added successfully`);
      onCreated(data.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add member');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-800">Add Team Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">First Name</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Last Name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="john@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Mobile</label>
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="10-digit number"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Staff', 'Investor'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.role === r
                      ? r === 'Staff'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                  }`}
                >
                  <div className="font-semibold">{r}</div>
                  <div className="text-xs font-normal opacity-70 mt-0.5">
                    {r === 'Staff' ? 'Custom access' : 'Read-only'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Permissions Slide-over ───────────────────────────────────────────────────
function PermissionsPanel({
  member,
  onClose,
  onUpdated,
}: {
  member: TeamMember;
  onClose: () => void;
  onUpdated: (m: TeamMember) => void;
}) {
  const [view, setView] = useState<AdminModule[]>(member.viewModules);
  const [write, setWrite] = useState<AdminModule[]>(member.writeModules);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/team/${member.id}/permissions`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ viewModules: view, writeModules: write }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Permissions saved');
      onUpdated(data.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Edit Permissions</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {member.firstName} {member.lastName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <PermissionMatrix
            viewModules={view}
            writeModules={write}
            onChange={(v, w) => { setView(v); setWrite(w); }}
          />
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({
  member,
  onEdit,
  onPermissions,
  onToggleStatus,
  onDelete,
}: {
  member: TeamMember;
  onEdit: (m: TeamMember) => void;
  onPermissions: (m: TeamMember) => void;
  onToggleStatus: (m: TeamMember) => void;
  onDelete: (m: TeamMember) => void;
}) {
  const moduleCount = member.viewModules.length;
  const writeCount = member.writeModules.length;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 rounded-xl transition-colors group">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        member.role === 'Investor' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {getInitials(member.firstName, member.lastName)}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 truncate">
          {member.firstName} {member.lastName}
        </p>
        <p className="text-xs text-neutral-400 truncate">{member.email}</p>
      </div>

      {/* Role badge */}
      <span className={`hidden sm:inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${roleColor(member.role)}`}>
        {member.role}
      </span>

      {/* Modules summary */}
      <div className="hidden md:flex flex-col items-end">
        {member.role === 'Investor' ? (
          <span className="text-xs text-neutral-400">All modules (read-only)</span>
        ) : (
          <>
            <span className="text-xs text-neutral-700 font-medium">{moduleCount}/{ALL_MODULES.length} modules</span>
            <span className="text-xs text-neutral-400">{writeCount} write</span>
          </>
        )}
      </div>

      {/* Status */}
      <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${member.isActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
        {member.isActive ? 'Active' : 'Inactive'}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {member.role === 'Staff' && (
          <button
            onClick={() => onPermissions(member)}
            title="Edit permissions"
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-neutral-400 hover:text-indigo-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onEdit(member)}
          title="Edit info"
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 1 0-14.14 14.14" />
          </svg>
        </button>
        <button
          onClick={() => onToggleStatus(member)}
          title={member.isActive ? 'Deactivate' : 'Activate'}
          className={`p-1.5 rounded-lg transition-colors ${member.isActive ? 'hover:bg-amber-50 text-neutral-400 hover:text-amber-500' : 'hover:bg-emerald-50 text-neutral-400 hover:text-emerald-500'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(member)}
          title="Remove"
          className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Edit Info Modal ──────────────────────────────────────────────────────────
function EditMemberModal({
  member,
  onClose,
  onUpdated,
}: {
  member: TeamMember;
  onClose: () => void;
  onUpdated: (m: TeamMember) => void;
}) {
  const [form, setForm] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    mobile: member.mobile,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/team/${member.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Member updated');
      onUpdated(data.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-800">Edit Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Mobile</label>
            <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" maxLength={10} />
          </div>
          <div className="pt-1 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Staff' | 'Investor'>('Staff');
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [permMember, setPermMember] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/team`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setMembers(data.data);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleCreated(m: TeamMember) {
    setMembers((prev) => [m, ...prev]);
  }

  function handleUpdated(m: TeamMember) {
    setMembers((prev) => prev.map((x) => (x.id === m.id ? m : x)));
  }

  async function handleToggleStatus(m: TeamMember) {
    try {
      const res = await fetch(`${API}/admin/team/${m.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      handleUpdated(data.data);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed');
    }
  }

  async function handleDelete(m: TeamMember) {
    if (!window.confirm(`Remove ${m.firstName} ${m.lastName}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/admin/team/${m.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed');
    }
  }

  const filtered = members.filter((m) => m.role === tab);
  const staffCount = members.filter((m) => m.role === 'Staff').length;
  const investorCount = members.filter((m) => m.role === 'Investor').length;
  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Team Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage who has access to the admin panel</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Staff Members', value: staffCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Investors', value: investorCount, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-neutral-100 px-4 pt-4">
          {(['Staff', 'Investor'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors mr-1 ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t} Members
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-indigo-100 text-indigo-600' : 'bg-neutral-100 text-neutral-400'}`}>
                {t === 'Staff' ? staffCount : investorCount}
              </span>
            </button>
          ))}
        </div>

        {/* Role description */}
        <div className={`mx-4 mt-4 mb-2 px-4 py-3 rounded-xl text-sm ${
          tab === 'Staff'
            ? 'bg-blue-50 border border-blue-100 text-blue-700'
            : 'bg-violet-50 border border-violet-100 text-violet-700'
        }`}>
          {tab === 'Staff'
            ? 'Staff members have custom access — you control exactly which modules they can view and write to.'
            : 'Investors can view all modules but cannot create, edit, or delete any data.'}
        </div>

        {/* Member list */}
        <div className="px-4 pb-4">
          {loading ? (
            <div className="py-12 text-center text-neutral-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">No {tab.toLowerCase()} members yet</p>
              <p className="text-xs text-neutral-400 mt-1">Click "Add Member" to invite someone</p>
            </div>
          ) : (
            <div className="space-y-1 mt-2">
              {filtered.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  onEdit={setEditMember}
                  onPermissions={setPermMember}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddMemberModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onUpdated={(m) => { handleUpdated(m); setEditMember(null); }}
        />
      )}
      {permMember && (
        <PermissionsPanel
          member={permMember}
          onClose={() => setPermMember(null)}
          onUpdated={(m) => { handleUpdated(m); setPermMember(null); }}
        />
      )}
    </div>
  );
}
