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

  if (!activeConnection) return <div className="text-center py-12 text-n2f-text-secondary">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n2f-text">Executions</h1>
          <p className="text-n2f-text-secondary mt-1">{activeConnection.name} - {executions.length} executions</p>
        </div>
        <button onClick={fetchList} className="p-2 border border-n2f-border rounded-lg hover:bg-n2f-elevated" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter className="h-4 w-4 text-n2f-text-muted" />
        <input
          type="text"
          placeholder="Filter by Workflow ID..."
          value={filterWorkflow}
          onChange={(e) => setFilterWorkflow(e.target.value)}
          className="px-3 py-1.5 text-sm border border-n2f-border rounded-lg focus:ring-2 focus:ring-n2f-accent w-48 bg-n2f-card text-n2f-text"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-n2f-border rounded-lg focus:ring-2 focus:ring-n2f-accent bg-n2f-card text-n2f-text"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="waiting">Waiting</option>
          <option value="running">Running</option>
        </select>
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
        <div className="space-y-2">
          {executions.map((ex) => {
            const status = ex.status || (ex.finished ? 'success' : 'running');
            return (
              <div key={ex.id} className="bg-n2f-card border border-n2f-border rounded-lg overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-n2f-elevated">
                  <button onClick={() => loadDetail(ex.id)} className="text-n2f-text-muted">
                    {expandedId === ex.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <button onClick={() => loadDetail(ex.id)} className="text-sm font-mono text-n2f-accent hover:underline">
                    #{ex.id}
                  </button>
                  <span className="flex-1 text-sm text-n2f-text-secondary truncate">{ex.workflowData?.name || ex.workflowId || '-'}</span>
                  <span className="text-xs text-n2f-text-muted hidden md:block">{ex.startedAt ? new Date(ex.startedAt).toLocaleString() : ''}</span>
                  <StatusBadge status={status} />
                  {(status === 'error' || status === 'crashed') && (
                    <button onClick={() => handleRetry(ex.id)} disabled={retrying === ex.id} className="p-1.5 text-n2f-accent hover:bg-n2f-accent/10 rounded" title="Retry">
                      {retrying === ex.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(ex)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded detail */}
                {expandedId === ex.id && (
                  <div className="border-t border-n2f-border bg-n2f-elevated p-4 space-y-4">
                    {detailLoading ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-n2f-accent" /></div>
                    ) : detail ? (
                      <>
                        {/* Info cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                            <p className="text-xs text-n2f-text-secondary">Status</p>
                            <StatusBadge status={detail.status || (detail.finished ? 'success' : 'running')} />
                          </div>
                          <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                            <p className="text-xs text-n2f-text-secondary">Started</p>
                            <p className="text-sm font-medium text-n2f-text">{detail.startedAt ? new Date(detail.startedAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                            <p className="text-xs text-n2f-text-secondary">Finished</p>
                            <p className="text-sm font-medium text-n2f-text">{detail.stoppedAt ? new Date(detail.stoppedAt).toLocaleString() : '-'}</p>
                          </div>
                          <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                            <p className="text-xs text-n2f-text-secondary">Duration</p>
                            <p className="text-sm font-medium text-n2f-text">
                              {detail.startedAt && detail.stoppedAt
                                ? `${((new Date(detail.stoppedAt).getTime() - new Date(detail.startedAt).getTime()) / 1000).toFixed(1)}s`
                                : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Error */}
                        {(detail.status === 'error' || detail.status === 'crashed') && detail.data?.resultData?.error && (
                          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                            <p className="text-xs font-medium text-red-300 mb-1">Error</p>
                            <p className="text-xs text-red-300 font-mono">{detail.data.resultData.error.message}</p>
                            {detail.data.resultData.error.node && (
                              <p className="text-xs text-red-400 mt-1">Node: {detail.data.resultData.error.node}</p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {(detail.status === 'error' || detail.status === 'crashed') && (
                            <button onClick={() => handleRetry(detail.id)} disabled={retrying === detail.id} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-n2f-accent text-white rounded-lg hover:bg-n2f-accent/90 disabled:opacity-50">
                              {retrying === detail.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                              Retry
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(detail)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 border border-red-700 rounded-lg hover:bg-red-900/30">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>

                        {/* Full data */}
                        <JsonViewer data={detail} title="Execution Data" />
                      </>
                    ) : <div className="text-center text-n2f-text-muted text-sm">Failed to load detail</div>}
                  </div>
                )}
              </div>
            );
          })}
          {executions.length === 0 && (
            <div className="text-center py-8 text-n2f-text-secondary">No executions found</div>
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
