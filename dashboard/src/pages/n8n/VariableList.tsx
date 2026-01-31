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

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variables</h1>
          <p className="text-gray-500 mt-1">{activeConnection.name} - {variables.length} variables</p>
        </div>
        <button onClick={fetch} className="p-2 border rounded-lg hover:bg-gray-100" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Create variable */}
      <div className="flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
          className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          placeholder="Value"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleCreate} disabled={creating || !newKey.trim()} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
        </button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {variables.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  {editingId === v.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editKey} onChange={(e) => setEditKey(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(v.id); if (e.key === 'Escape') setEditingId(null); }} className="w-full px-2 py-1 text-sm border border-gray-300 rounded" autoFocus />
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-400 font-mono">{v.id}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdate(v.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 font-mono">{v.key}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{v.value}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{v.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingId(v.id); setEditKey(v.key); setEditValue(v.value); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(v)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {variables.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No variables found</td></tr>
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
