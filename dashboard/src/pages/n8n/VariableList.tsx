import { useEffect, useState } from 'react';
import { listVariables, createVariable, updateVariable, deleteVariable } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, Plus, Pencil, Trash2, Check, X, RefreshCw, AlertCircle, Variable } from 'lucide-react';

export default function VariableList() {
  const { activeConnection } = useConnection();
  const [variables, setVariables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetch() {
    setLoading(true);
    setError('');
    const res = await listVariables();
    if (res.success && res.data) {
      const d = res.data as any;
      setVariables(Array.isArray(d) ? d : d.data || []);
    } else {
      setError(res.error?.message || 'Failed');
    }
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [activeConnection?.id]);

  async function handleCreate() {
    if (!newKey.trim()) return;
    setCreating(true);
    const res = await createVariable(newKey.trim(), newValue);
    if (res.success) { setNewKey(''); setNewValue(''); fetch(); }
    else alert(res.error?.message || 'Failed');
    setCreating(false);
  }

  async function handleUpdate(id: string) {
    if (!editKey.trim()) return;
    const res = await updateVariable(id, editKey.trim(), editValue);
    if (res.success) { setEditingId(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteVariable(deleteTarget.id);
    if (res.success) { setDeleteTarget(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-n2f-text-secondary">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n2f-text">Variables</h1>
          <p className="text-n2f-text-secondary mt-1">{activeConnection.name} - {variables.length} variables</p>
        </div>
        <button onClick={fetch} className="p-2 border border-n2f-border rounded-lg hover:bg-n2f-elevated" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Create variable */}
      <div className="flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
          className="w-48 px-3 py-2 text-sm border border-n2f-border rounded-lg focus:ring-2 focus:ring-n2f-accent bg-n2f-card text-n2f-text"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          placeholder="Value"
          className="flex-1 px-3 py-2 text-sm border border-n2f-border rounded-lg focus:ring-2 focus:ring-n2f-accent bg-n2f-card text-n2f-text"
        />
        <button onClick={handleCreate} disabled={creating || !newKey.trim()} className="flex items-center gap-2 px-4 py-2 text-sm bg-n2f-accent text-white rounded-lg hover:bg-n2f-accent/90 disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
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
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-n2f-text-secondary uppercase w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n2f-border">
              {variables.map((v) => (
                <tr key={v.id} className="hover:bg-n2f-elevated">
                  {editingId === v.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editKey} onChange={(e) => setEditKey(e.target.value)} className="w-full px-2 py-1 text-sm border border-n2f-border rounded bg-n2f-elevated text-n2f-text" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(v.id); if (e.key === 'Escape') setEditingId(null); }} className="w-full px-2 py-1 text-sm border border-n2f-border rounded bg-n2f-elevated text-n2f-text" autoFocus />
                      </td>
                      <td className="px-4 py-2 text-xs text-n2f-text-muted font-mono">{v.id}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdate(v.id)} className="p-1 text-emerald-400 hover:bg-emerald-900/30 rounded"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-n2f-text-muted hover:bg-n2f-elevated rounded"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-n2f-text font-mono">{v.key}</td>
                      <td className="px-4 py-3 text-sm text-n2f-text-secondary font-mono">{v.value}</td>
                      <td className="px-4 py-3 text-xs text-n2f-text-muted font-mono">{v.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingId(v.id); setEditKey(v.key); setEditValue(v.value); }} className="p-1.5 text-n2f-text-muted hover:text-n2f-accent hover:bg-n2f-accent/10 rounded" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(v)} className="p-1.5 text-n2f-text-muted hover:text-red-400 hover:bg-red-900/30 rounded" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {variables.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-n2f-text-secondary">No variables found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Variable"
        message={`Delete variable "${deleteTarget?.key}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
