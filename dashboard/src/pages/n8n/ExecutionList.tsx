import { useEffect, useState } from 'react';
import {
  listExecutions, getExecution, deleteExecution, retryExecution,
} from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import JsonViewer from '../../components/n8n/JsonViewer';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import {
  Loader2, RefreshCw, Trash2, RotateCcw, AlertCircle, Filter,
  ChevronDown, ChevronRight,
} from 'lucide-react';

export default function ExecutionList() {
  const { activeConnection } = useConnection();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [filterWorkflow, setFilterWorkflow] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Expanded detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchList() {
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

  useEffect(() => { if (activeConnection) fetchList(); }, [activeConnection?.id, filterWorkflow, filterStatus]);

  async function loadDetail(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setDetailLoading(true);
    const res = await getExecution(id);
    if (res.success && res.data) setDetail(res.data);
    else setDetail(null);
    setDetailLoading(false);
  }

  async function handleRetry(id: string) {
    setRetrying(id);
    const res = await retryExecution(id);
    setRetrying(null);
    if (res.success) { alert('Retry queued'); fetchList(); }
    else alert(res.error?.message || 'Retry failed');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteExecution(deleteTarget.id);
    if (res.success) {
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      fetchList();
    } else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executions</h1>
          <p className="text-gray-500 mt-1">{activeConnection.name} - {executions.length} executions</p>
        </div>
        <button onClick={fetchList} className="p-2 border rounded-lg hover:bg-gray-100" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by Workflow ID..."
          value={filterWorkflow}
          onChange={(e) => setFilterWorkflow(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48"
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
        <div className="space-y-2">
          {executions.map((ex) => {
            const status = ex.status || (ex.finished ? 'success' : 'running');
            return (
              <div key={ex.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <button onClick={() => loadDetail(ex.id)} className="text-gray-400">
                    {expandedId === ex.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <button onClick={() => loadDetail(ex.id)} className="text-sm font-mono text-blue-600 hover:underline">
                    #{ex.id}
                  </button>
                  <span className="flex-1 text-sm text-gray-700 truncate">{ex.workflowData?.name || ex.workflowId || '-'}</span>
                  <span className="text-xs text-gray-400 hidden md:block">{ex.startedAt ? new Date(ex.startedAt).toLocaleString() : ''}</span>
                  <StatusBadge status={status} />
                  {(status === 'error' || status === 'crashed') && (
                    <button onClick={() => handleRetry(ex.id)} disabled={retrying === ex.id} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Retry">
                      {retrying === ex.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(ex)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded detail */}
                {expandedId === ex.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                    {detailLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
                    ) : detail ? (
                      <>
                        {/* Info cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg border p-3">
                            <p className="text-xs text-gray-500">Status</p>
                            <StatusBadge status={detail.status || (detail.finished ? 'success' : 'running')} />
                          </div>
                          <div className="bg-white rounded-lg border p-3">
                            <p className="text-xs text-gray-500">Started</p>
                            <p className="text-sm font-medium">{detail.startedAt ? new Date(detail.startedAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="bg-white rounded-lg border p-3">
                            <p className="text-xs text-gray-500">Finished</p>
                            <p className="text-sm font-medium">{detail.stoppedAt ? new Date(detail.stoppedAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="bg-white rounded-lg border p-3">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-sm font-medium">
                              {detail.startedAt && detail.stoppedAt
                                ? `${((new Date(detail.stoppedAt).getTime() - new Date(detail.startedAt).getTime()) / 1000).toFixed(1)}s`
                                : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Error */}
                        {(detail.status === 'error' || detail.status === 'crashed') && detail.data?.resultData?.error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-red-800 mb-1">Error</p>
                            <p className="text-xs text-red-700 font-mono">{detail.data.resultData.error.message}</p>
                            {detail.data.resultData.error.node && (
                              <p className="text-xs text-red-500 mt-1">Node: {detail.data.resultData.error.node}</p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {(detail.status === 'error' || detail.status === 'crashed') && (
                            <button onClick={() => handleRetry(detail.id)} disabled={retrying === detail.id} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                              {retrying === detail.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                              Retry
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(detail)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>

                        {/* Full data */}
                        <JsonViewer data={detail} title="Execution Data" />
                      </>
                    ) : <div className="text-center text-gray-400 text-sm">Failed to load detail</div>}
                  </div>
                )}
              </div>
            );
          })}
          {executions.length === 0 && (
            <div className="text-center py-8 text-gray-500">No executions found</div>
          )}
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
