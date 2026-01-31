import { useEffect, useState } from 'react';
import {
  listWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow,
  activateWorkflow, deactivateWorkflow, executeWorkflow,
  getWorkflowTags, updateWorkflowTags, listTags,
} from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import StatusBadge from '../../components/n8n/StatusBadge';
import JsonViewer from '../../components/n8n/JsonViewer';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import {
  Loader2, Play, Trash2, RefreshCw, Plus, AlertCircle,
  Power, PowerOff, ChevronDown, ChevronRight, X, Save, Pencil, Tag,
} from 'lucide-react';

export default function WorkflowList() {
  const { activeConnection } = useConnection();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  // Expanded detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTags, setDetailTags] = useState<any[]>([]);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editJson, setEditJson] = useState('');
  const [saving, setSaving] = useState(false);

  // Tag editing
  const [editingTags, setEditingTags] = useState(false);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  // Create workflow
  const [showCreate, setShowCreate] = useState(false);
  const [createJson, setCreateJson] = useState('{\n  "name": "New Workflow",\n  "nodes": [],\n  "connections": {},\n  "settings": {\n    "executionOrder": "v1"\n  }\n}');
  const [creating, setCreating] = useState(false);

  async function fetchList() {
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

  useEffect(() => { if (activeConnection) fetchList(); }, [activeConnection?.id]);

  async function loadDetail(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setDetailLoading(true);
    setEditing(false);
    setEditingTags(false);
    const [wfRes, tagRes] = await Promise.all([getWorkflow(id), getWorkflowTags(id)]);
    if (wfRes.success && wfRes.data) {
      setDetail(wfRes.data);
      setEditJson(JSON.stringify(wfRes.data, null, 2));
    }
    if (tagRes.success && tagRes.data) {
      const d = tagRes.data as any;
      setDetailTags(Array.isArray(d) ? d : d.data || []);
    }
    setDetailLoading(false);
  }

  async function handleToggle(wf: any) {
    const fn = wf.active ? deactivateWorkflow : activateWorkflow;
    const res = await fn(wf.id);
    if (res.success) fetchList();
    else alert(res.error?.message || 'Failed');
  }

  async function handleExecute(id: string) {
    setExecuting(id);
    const res = await executeWorkflow(id);
    setExecuting(null);
    if (res.success) alert('Executed successfully');
    else alert(res.error?.message || 'Execution failed');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteWorkflow(deleteTarget.id);
    if (res.success) {
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      fetchList();
    } else alert(res.error?.message || 'Failed');
  }

  async function handleUpdate() {
    if (!detail) return;
    setSaving(true);
    try {
      const data = JSON.parse(editJson);
      const res = await updateWorkflow(detail.id, data);
      if (res.success) {
        setEditing(false);
        loadDetail(detail.id); // force reload
        setExpandedId(null); // reset to re-expand
        setTimeout(() => loadDetail(detail.id), 100);
        fetchList();
      } else alert(res.error?.message || 'Update failed');
    } catch { alert('Invalid JSON'); }
    setSaving(false);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const data = JSON.parse(createJson);
      const res = await createWorkflow(data);
      if (res.success) {
        setShowCreate(false);
        setCreateJson('{\n  "name": "New Workflow",\n  "nodes": [],\n  "connections": {},\n  "settings": {\n    "executionOrder": "v1"\n  }\n}');
        fetchList();
      } else alert(res.error?.message || 'Create failed');
    } catch { alert('Invalid JSON'); }
    setCreating(false);
  }

  async function startEditTags() {
    setEditingTags(true);
    const res = await listTags();
    if (res.success && res.data) {
      const d = res.data as any;
      setAllTags(Array.isArray(d) ? d : d.data || []);
    }
    setSelectedTagIds(detailTags.map((t: any) => String(t.id)));
  }

  async function handleSaveTags() {
    if (!detail) return;
    setSavingTags(true);
    const res = await updateWorkflowTags(detail.id, selectedTagIds);
    if (res.success) {
      setEditingTags(false);
      const tagRes = await getWorkflowTags(detail.id);
      if (tagRes.success && tagRes.data) {
        const d = tagRes.data as any;
        setDetailTags(Array.isArray(d) ? d : d.data || []);
      }
    } else alert(res.error?.message || 'Failed');
    setSavingTags(false);
  }

  function toggleTagId(id: string) {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection from the sidebar to manage workflows.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 mt-1">{activeConnection.name} - {workflows.length} workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Create
          </button>
          <button onClick={fetchList} className="p-2 border rounded-lg hover:bg-gray-100" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Create Workflow</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <textarea
            value={createJson}
            onChange={(e) => setCreateJson(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Workflow
          </button>
        </div>
      )}

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
          {workflows.map((wf) => (
            <div key={wf.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <button onClick={() => loadDetail(wf.id)} className="text-gray-400">
                  {expandedId === wf.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button onClick={() => loadDetail(wf.id)} className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-blue-600">
                  {wf.name}
                </button>
                <span className="text-xs text-gray-400 font-mono hidden sm:block">{wf.id}</span>
                <span className="text-xs text-gray-400 hidden md:block">{wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : ''}</span>
                <button onClick={() => handleToggle(wf)} title={wf.active ? 'Deactivate' : 'Activate'}>
                  <StatusBadge status={wf.active ? 'active' : 'inactive'} />
                </button>
                <button onClick={() => handleExecute(wf.id)} disabled={executing === wf.id} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Execute">
                  {executing === wf.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                </button>
                <button onClick={() => setDeleteTarget(wf)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded detail */}
              {expandedId === wf.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {detailLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>
                  ) : detail ? (
                    <>
                      {/* Info cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg border p-3">
                          <p className="text-xs text-gray-500">Status</p>
                          <StatusBadge status={detail.active ? 'active' : 'inactive'} />
                        </div>
                        <div className="bg-white rounded-lg border p-3">
                          <p className="text-xs text-gray-500">Nodes</p>
                          <p className="text-sm font-medium">{detail.nodes?.length || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg border p-3">
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm font-medium">{detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '-'}</p>
                        </div>
                        <div className="bg-white rounded-lg border p-3">
                          <p className="text-xs text-gray-500">Updated</p>
                          <p className="text-sm font-medium">{detail.updatedAt ? new Date(detail.updatedAt).toLocaleString() : '-'}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="bg-white rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Tags</span>
                          {!editingTags && (
                            <button onClick={startEditTags} className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                          )}
                        </div>
                        {editingTags ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {allTags.map((t: any) => (
                                <button
                                  key={t.id}
                                  onClick={() => toggleTagId(String(t.id))}
                                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                    selectedTagIds.includes(String(t.id))
                                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {t.name}
                                </button>
                              ))}
                              {allTags.length === 0 && <span className="text-xs text-gray-400">No tags available</span>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSaveTags} disabled={savingTags} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {savingTags ? 'Saving...' : 'Save Tags'}
                              </button>
                              <button onClick={() => setEditingTags(false)} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {detailTags.length > 0 ? detailTags.map((t: any) => (
                              <span key={t.id || t.name} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{t.name}</span>
                            )) : <span className="text-xs text-gray-400">No tags</span>}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleToggle(detail)} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border ${detail.active ? 'text-yellow-700 border-yellow-300 hover:bg-yellow-50' : 'text-green-700 border-green-300 hover:bg-green-50'}`}>
                          {detail.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          {detail.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleExecute(detail.id)} disabled={executing === detail.id} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                          {executing === detail.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          Execute
                        </button>
                        <button onClick={() => { setEditing(!editing); setEditJson(JSON.stringify(detail, null, 2)); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
                          <Pencil className="h-3.5 w-3.5" /> {editing ? 'Cancel Edit' : 'Edit JSON'}
                        </button>
                      </div>

                      {/* Edit mode */}
                      {editing && (
                        <div className="space-y-2">
                          <textarea
                            value={editJson}
                            onChange={(e) => setEditJson(e.target.value)}
                            rows={20}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                          />
                          <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                          </button>
                        </div>
                      )}

                      {/* JSON viewer (read-only) */}
                      {!editing && <JsonViewer data={detail} title="Workflow Definition" />}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center py-8 text-gray-500">No workflows found</div>
          )}
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
