import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkflow, activateWorkflow, deactivateWorkflow, executeWorkflow, deleteWorkflow, getWorkflowTags } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import JsonViewer from '../../components/n8n/JsonViewer';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, Play, Trash2, ArrowLeft, Power, PowerOff } from 'lucide-react';

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeConnection } = useConnection();
  const [workflow, setWorkflow] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [executing, setExecuting] = useState(false);

  async function fetch() {
    if (!id) return;
    setLoading(true);
    const [wfRes, tagRes] = await Promise.all([
      getWorkflow(id),
      getWorkflowTags(id),
    ]);
    if (wfRes.success && wfRes.data) setWorkflow(wfRes.data);
    else setError(wfRes.error?.message || 'Failed');
    if (tagRes.success && tagRes.data) {
      const d = tagRes.data as any;
      setTags(Array.isArray(d) ? d : d.data || []);
    }
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [id, activeConnection?.id]);

  async function handleToggle() {
    if (!workflow) return;
    const fn = workflow.active ? deactivateWorkflow : activateWorkflow;
    const res = await fn(workflow.id);
    if (res.success) fetch();
    else alert(res.error?.message || 'Failed');
  }

  async function handleExecute() {
    if (!workflow) return;
    setExecuting(true);
    const res = await executeWorkflow(workflow.id);
    setExecuting(false);
    if (res.success) alert('Executed successfully');
    else alert(res.error?.message || 'Failed');
  }

  async function handleDelete() {
    if (!workflow) return;
    const res = await deleteWorkflow(workflow.id);
    if (res.success) navigate('/n8n/workflows');
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection first.</div>;
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!workflow) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/n8n/workflows')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
          <p className="text-gray-500 text-sm">ID: {workflow.id}</p>
        </div>
        <StatusBadge status={workflow.active ? 'active' : 'inactive'} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleToggle} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border ${workflow.active ? 'text-yellow-700 border-yellow-300 hover:bg-yellow-50' : 'text-green-700 border-green-300 hover:bg-green-50'}`}>
          {workflow.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          {workflow.active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={handleExecute} disabled={executing} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Execute
        </button>
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tags.map((t: any) => (
            <span key={t.id || t.name} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{t.name}</span>
          ))}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Created</p>
          <p className="text-sm font-medium">{workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : '-'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Updated</p>
          <p className="text-sm font-medium">{workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : '-'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 mb-1">Nodes</p>
          <p className="text-sm font-medium">{workflow.nodes?.length || 0} nodes</p>
        </div>
      </div>

      {/* Workflow JSON */}
      <JsonViewer data={workflow} title="Workflow Definition" />

      <ConfirmDialog open={showDelete} title="Delete Workflow" message={`Delete "${workflow.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}
