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

  if (!activeConnection) return <div className="text-center py-12 text-n2f-text-secondary">Select a connection from the sidebar to manage workflows.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n2f-text">Workflows</h1>
          <p className="text-n2f-text-secondary mt-1">{activeConnection.name} - {workflows.length} workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 text-sm bg-n2f-accent text-white rounded-lg hover:bg-n2f-accent/90">
            <Plus className="h-4 w-4" /> Create
          </button>
          <button onClick={fetchList} className="p-2 border border-n2f-border rounded-lg hover:bg-n2f-elevated" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-n2f-card border border-n2f-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-n2f-text">Create Workflow</h3>
            <button onClick={() => setShowCreate(false)} className="text-n2f-text-muted hover:text-n2f-text-secondary"><X className="h-4 w-4" /></button>
          </div>
          <textarea
            value={createJson}
            onChange={(e) => setCreateJson(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 text-sm border border-n2f-border rounded-lg font-mono focus:ring-2 focus:ring-n2f-accent bg-n2f-elevated text-n2f-text"
          />
          <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Workflow
          </button>
        </div>
      )}

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
          {workflows.map((wf) => (
            <div key={wf.id} className="bg-n2f-card border border-n2f-border rounded-lg overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-n2f-elevated">
                <button onClick={() => loadDetail(wf.id)} className="text-n2f-text-muted">
                  {expandedId === wf.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button onClick={() => loadDetail(wf.id)} className="flex-1 text-left text-sm font-medium text-n2f-text hover:text-n2f-accent">
                  {wf.name}
                </button>
                <span className="text-xs text-n2f-text-muted font-mono hidden sm:block">{wf.id}</span>
                <span className="text-xs text-n2f-text-muted hidden md:block">{wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : ''}</span>
                <button onClick={() => handleToggle(wf)} title={wf.active ? 'Deactivate' : 'Activate'}>
                  <StatusBadge status={wf.active ? 'active' : 'inactive'} />
                </button>
                <button onClick={() => handleExecute(wf.id)} disabled={executing === wf.id} className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded" title="Execute">
                  {executing === wf.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                </button>
                <button onClick={() => setDeleteTarget(wf)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded detail */}
              {expandedId === wf.id && (
                <div className="border-t border-n2f-border bg-n2f-elevated p-4 space-y-4">
                  {detailLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-n2f-accent" /></div>
                  ) : detail ? (
                    <>
                      {/* Info cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                          <p className="text-xs text-n2f-text-secondary">Status</p>
                          <StatusBadge status={detail.active ? 'active' : 'inactive'} />
                        </div>
                        <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                          <p className="text-xs text-n2f-text-secondary">Nodes</p>
                          <p className="text-sm font-medium text-n2f-text">{detail.nodes?.length || 0}</p>
                        </div>
                        <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                          <p className="text-xs text-n2f-text-secondary">Created</p>
                          <p className="text-sm font-medium text-n2f-text">{detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '-'}</p>
                        </div>
                        <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                          <p className="text-xs text-n2f-text-secondary">Updated</p>
                          <p className="text-sm font-medium text-n2f-text">{detail.updatedAt ? new Date(detail.updatedAt).toLocaleString() : '-'}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="bg-n2f-card rounded-lg border border-n2f-border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-n2f-text-muted" />
                          <span className="text-sm font-medium text-n2f-text-secondary">Tags</span>
                          {!editingTags && (
                            <button onClick={startEditTags} className="ml-auto text-xs text-n2f-accent hover:underline flex items-center gap-1">
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
                                      ? 'bg-n2f-accent/10 text-n2f-accent border-n2f-accent/30'
                                      : 'bg-n2f-elevated text-n2f-text-secondary border-n2f-border hover:border-n2f-accent/30'
                                  }`}
                                >
                                  {t.name}
                                </button>
                              ))}
                              {allTags.length === 0 && <span className="text-xs text-n2f-text-muted">No tags available</span>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSaveTags} disabled={savingTags} className="px-3 py-1 text-xs bg-n2f-accent text-white rounded-lg hover:bg-n2f-accent/90 disabled:opacity-50">
                                {savingTags ? 'Saving...' : 'Save Tags'}
                              </button>
                              <button onClick={() => setEditingTags(false)} className="px-3 py-1 text-xs border border-n2f-border rounded-lg hover:bg-n2f-elevated">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {detailTags.length > 0 ? detailTags.map((t: any) => (
                              <span key={t.id || t.name} className="px-2 py-0.5 bg-n2f-accent/10 text-n2f-accent text-xs rounded-full">{t.name}</span>
                            )) : <span className="text-xs text-n2f-text-muted">No tags</span>}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleToggle(detail)} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border ${detail.active ? 'text-amber-400 border-amber-700 hover:bg-amber-900/30' : 'text-emerald-400 border-emerald-700 hover:bg-emerald-900/30'}`}>
                          {detail.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          {detail.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleExecute(detail.id)} disabled={executing === detail.id} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                          {executing === detail.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          Execute
                        </button>
                        <button onClick={() => { setEditing(!editing); setEditJson(JSON.stringify(detail, null, 2)); }} className="flex items-center gap-2 px-3 py-1.5 text-xs text-n2f-accent border border-n2f-accent/30 rounded-lg hover:bg-n2f-accent/10">
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
                            className="w-full px-3 py-2 text-xs border border-n2f-border rounded-lg font-mono focus:ring-2 focus:ring-n2f-accent bg-n2f-elevated text-n2f-text"
                          />
                          <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-n2f-accent text-white rounded-lg hover:bg-n2f-accent/90 disabled:opacity-50">
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
            <div className="text-center py-8 text-n2f-text-secondary">No workflows found</div>
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
