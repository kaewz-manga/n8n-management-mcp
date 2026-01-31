import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExecution, retryExecution, deleteExecution } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import JsonViewer from '../../components/n8n/JsonViewer';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeConnection } = useConnection();
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function fetch() {
    if (!id) return;
    setLoading(true);
    const res = await getExecution(id);
    if (res.success && res.data) setExecution(res.data);
    else setError(res.error?.message || 'Failed');
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [id, activeConnection?.id]);

  async function handleRetry() {
    if (!execution) return;
    setRetrying(true);
    const res = await retryExecution(execution.id);
    setRetrying(false);
    if (res.success) { alert('Retry queued'); fetch(); }
    else alert(res.error?.message || 'Retry failed');
  }

  async function handleDelete() {
    if (!execution) return;
    const res = await deleteExecution(execution.id);
    if (res.success) navigate('/n8n/executions');
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection first.</div>;
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!execution) return null;

  const status = execution.status || (execution.finished ? 'success' : 'running');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/n8n/executions')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Execution #{execution.id}</h1>
          <p className="text-gray-500 text-sm">{execution.workflowData?.name || `Workflow ${execution.workflowId}`}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {(status === 'error' || status === 'crashed') && (
          <button onClick={handleRetry} disabled={retrying} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Retry
          </button>
        )}
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <StatusBadge status={status} />
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Started</p>
          <p className="text-sm font-medium">{execution.startedAt ? new Date(execution.startedAt).toLocaleString() : '-'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Finished</p>
          <p className="text-sm font-medium">{execution.stoppedAt ? new Date(execution.stoppedAt).toLocaleString() : '-'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-sm font-medium">
            {execution.startedAt && execution.stoppedAt
              ? `${((new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000).toFixed(1)}s`
              : '-'}
          </p>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && execution.data?.resultData?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-1">Error</p>
          <p className="text-sm text-red-700 font-mono">{execution.data.resultData.error.message}</p>
          {execution.data.resultData.error.node && (
            <p className="text-xs text-red-500 mt-1">Node: {execution.data.resultData.error.node}</p>
          )}
        </div>
      )}

      {/* Execution data */}
      <JsonViewer data={execution} title="Execution Data" />

      <ConfirmDialog open={showDelete} title="Delete Execution" message={`Delete execution #${execution.id}?`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}
