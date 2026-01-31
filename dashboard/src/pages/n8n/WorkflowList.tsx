import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listWorkflows, activateWorkflow, deactivateWorkflow, executeWorkflow, deleteWorkflow as deleteWf } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, Play, Trash2, RefreshCw, Plus, AlertCircle } from 'lucide-react';

export default function WorkflowList() {
  const { activeConnection } = useConnection();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setError('');
    const res = await listWorkflows();
    if (res.success && res.data) {
      const data = res.data as any;
      setWorkflows(Array.isArray(data) ? data : data.data || []);
    } else {
      setError(res.error?.message || 'Failed to load');
    }
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [activeConnection?.id]);

  async function handleToggle(wf: any) {
    const fn = wf.active ? deactivateWorkflow : activateWorkflow;
    const res = await fn(wf.id);
    if (res.success) fetch();
    else alert(res.error?.message || 'Failed');
  }

  async function handleExecute(id: string) {
    setExecuting(id);
    const res = await executeWorkflow(id);
    setExecuting(null);
    if (res.success) alert('Workflow executed successfully');
    else alert(res.error?.message || 'Execution failed');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteWf(deleteTarget.id);
    if (res.success) { setDeleteTarget(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) {
    return <div className="text-center py-12 text-gray-500">Select a connection from the sidebar to manage workflows.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 mt-1">{activeConnection.name} - {workflows.length} workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 border rounded-lg hover:bg-gray-100" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/n8n/workflows/${wf.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {wf.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(wf)} title={wf.active ? 'Click to deactivate' : 'Click to activate'}>
                      <StatusBadge status={wf.active ? 'active' : 'inactive'} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{wf.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExecute(wf.id)}
                        disabled={executing === wf.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Execute"
                      >
                        {executing === wf.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setDeleteTarget(wf)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {workflows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No workflows found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Workflow"
        message={`Delete "${deleteTarget?.name}"? This will also delete all execution history.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
