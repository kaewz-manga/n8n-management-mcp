import { useEffect, useState } from 'react';
import { listTags, createTag, updateTag, deleteTag } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, Plus, Pencil, Trash2, Check, X, RefreshCw, AlertCircle, Tag } from 'lucide-react';

export default function TagList() {
  const { activeConnection } = useConnection();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetch() {
    setLoading(true);
    setError('');
    const res = await listTags();
    if (res.success && res.data) {
      const d = res.data as any;
      setTags(Array.isArray(d) ? d : d.data || []);
    } else {
      setError(res.error?.message || 'Failed');
    }
    setLoading(false);
  }

  useEffect(() => { if (activeConnection) fetch(); }, [activeConnection?.id]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await createTag(newName.trim());
    if (res.success) { setNewName(''); fetch(); }
    else alert(res.error?.message || 'Failed');
    setCreating(false);
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    const res = await updateTag(id, editName.trim());
    if (res.success) { setEditingId(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteTag(deleteTarget.id);
    if (res.success) { setDeleteTarget(null); fetch(); }
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-n2f-text-secondary">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n2f-text">Tags</h1>
          <p className="text-n2f-text-secondary mt-1">{activeConnection.name} - {tags.length} tags</p>
        </div>
        <button onClick={fetch} className="p-2 border border-n2f-border rounded-lg hover:bg-n2f-elevated" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Create tag */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          placeholder="New tag name..."
          className="flex-1 px-3 py-2 text-sm border border-n2f-border rounded-lg focus:ring-2 focus:ring-n2f-accent bg-n2f-card text-n2f-text"
        />
        <button onClick={handleCreate} disabled={creating || !newName.trim()} className="flex items-center gap-2 px-4 py-2 text-sm bg-n2f-accent text-white rounded-lg hover:bg-n2f-accent/90 disabled:opacity-50">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Tag
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div key={tag.id} className="bg-n2f-card border border-n2f-border rounded-lg p-3 flex items-center gap-3">
              <Tag className="h-4 w-4 text-n2f-accent shrink-0" />
              {editingId === tag.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 px-2 py-1 text-sm border border-n2f-border rounded bg-n2f-elevated text-n2f-text"
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(tag.id)} className="p-1 text-emerald-400 hover:bg-emerald-900/30 rounded"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-n2f-text-muted hover:bg-n2f-elevated rounded"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-n2f-text">{tag.name}</span>
                  <span className="text-xs text-n2f-text-muted font-mono">{tag.id}</span>
                  <button onClick={() => { setEditingId(tag.id); setEditName(tag.name); }} className="p-1 text-n2f-text-muted hover:text-n2f-accent hover:bg-n2f-accent/10 rounded" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(tag)} className="p-1 text-n2f-text-muted hover:text-red-400 hover:bg-red-900/30 rounded" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {tags.length === 0 && (
            <div className="col-span-full text-center py-8 text-n2f-text-secondary">No tags found</div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Tag"
        message={`Delete tag "${deleteTarget?.name}"? This will remove it from all workflows.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
