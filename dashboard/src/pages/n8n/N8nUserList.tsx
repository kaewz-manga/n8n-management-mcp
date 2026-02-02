import { useEffect, useState } from 'react';
import { listN8nUsers, deleteN8nUser } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, RefreshCw, Trash2, AlertCircle, UserCog } from 'lucide-react';

export default function N8nUserList() {
  const { activeConnection } = useConnection();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  async function fetch() {
    setLoading(true);
    setError('');
    const res = await listN8nUsers();
    if (res.success && res.data) {
      const d = res.data as any;
      setUsers(Array.isArray(d) ? d : d.data || []);
    } else {
      setError(res.error?.message || 'Failed');
    }
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [activeConnection?.id]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteN8nUser(deleteTarget.id);
    if (res.success) { setDeleteTarget(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-n2f-text-secondary">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n2f-text">n8n Users</h1>
          <p className="text-n2f-text-secondary mt-1">{activeConnection.name} - {users.length} users</p>
        </div>
        <button onClick={fetch} className="p-2 border border-n2f-border rounded-lg hover:bg-n2f-elevated" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-n2f-accent" /></div>
      ) : (
        <div className="overflow-x-auto bg-n2f-card rounded-lg border border-n2f-border">
          <table className="min-w-full divide-y divide-n2f-border">
            <thead className="bg-n2f-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n2f-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-n2f-elevated">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-n2f-text-muted" />
                      <span className="text-sm font-medium text-n2f-text">
                        {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-n2f-text-secondary">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      user.role === 'global:owner' ? 'bg-purple-900/30 text-purple-400' : 'bg-n2f-accent/10 text-n2f-accent'
                    }`}>
                      {user.role === 'global:owner' ? 'Owner' : 'Member'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.isPending ? 'pending' : user.disabled ? 'inactive' : 'active'} />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteTarget(user)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded" title="Delete user">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-n2f-text-secondary">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Delete user "${deleteTarget?.email || deleteTarget?.id}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
