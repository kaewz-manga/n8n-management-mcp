import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listExecutions, deleteExecution, retryExecution } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, RefreshCw, Trash2, RotateCcw, AlertCircle, Filter } from 'lucide-react';

export default function ExecutionList() {
  const { activeConnection } = useConnection();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [filterWorkflow, setFilterWorkflow] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  async function fetch() {
    setLoading(true);
    setError('');
    const res = await listExecutions(filterWorkflow || undefined);
    if (res.success && res.data) {
      const data = res.data as any;
      let list = Array.isArray(data) ? data : data.data || data.results || [];
      if (filterStatus) list = list.filter((e: any) => e.status === filterStatus);
      setExecutions(list);
    } else {
      setError(res.error?.message || 'Failed to load');
    }
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [activeConnection?.id, filterWorkflow, filterStatus]);

  async function handleRetry(id: string) {
    setRetrying(id);
    const res = await retryExecution(id);
    setRetrying(null);
    if (res.success) { alert('Retry queued'); fetch(); }
    else alert(res.error?.message || 'Retry failed');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteExecution(deleteTarget.id);
    if (res.success) { setDeleteTarget(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executions</h1>
          <p className="text-gray-500 mt-1">{activeConnection.name} - {executions.length} executions</p>
        </div>
        <button onClick={fetch} className="p-2 border rounded-lg hover:bg-gray-100" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by Workflow ID..."
          value={filterWorkflow}
          onChange={(e) => setFilterWorkflow(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="waiting">Waiting</option>
          <option value="running">Running</option>
        </select>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {executions.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/n8n/executions/${ex.id}`} className="text-sm font-mono text-blue-600 hover:underline">
                      {ex.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ex.workflowData?.name || ex.workflowId || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={ex.status || (ex.finished ? 'success' : 'running')} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(ex.status === 'error' || ex.status === 'crashed') && (
                        <button
                          onClick={() => handleRetry(ex.id)}
                          disabled={retrying === ex.id}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Retry"
                        >
                          {retrying === ex.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(ex)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {executions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No executions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Execution"
        message={`Delete execution #${deleteTarget?.id}? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
