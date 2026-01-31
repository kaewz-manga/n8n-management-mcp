import { useState } from 'react';
import { createCredential, updateCredential, deleteCredential, getCredentialSchema } from '../../lib/n8n-api';
import { useConnection } from '../../contexts/ConnectionContext';
import JsonViewer from '../../components/n8n/JsonViewer';
import ConfirmDialog from '../../components/n8n/ConfirmDialog';
import { Loader2, Plus, Trash2, Search, X, Pencil, Save } from 'lucide-react';

export default function CredentialList() {
  const { activeConnection } = useConnection();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create credential
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('');
  const [createData, setCreateData] = useState('{}');
  const [creating, setCreating] = useState(false);

  // Update credential
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateId, setUpdateId] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateType, setUpdateType] = useState('');
  const [updateData, setUpdateData] = useState('{}');
  const [updating, setUpdating] = useState(false);

  // Schema lookup
  const [schemaType, setSchemaType] = useState('');
  const [schema, setSchema] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  async function handleCreate() {
    if (!createName || !createType) return alert('Name and type are required');
    setCreating(true);
    try {
      const data = JSON.parse(createData);
      const res = await createCredential({ name: createName, type: createType, data });
      if (res.success) {
        alert('Credential created');
        setShowCreate(false);
        setCreateName(''); setCreateType(''); setCreateData('{}');
      } else alert(res.error?.message || 'Failed');
    } catch { alert('Invalid JSON in data field'); }
    setCreating(false);
  }

  async function handleUpdate() {
    if (!updateId) return alert('Credential ID is required');
    setUpdating(true);
    try {
      const data: any = {};
      if (updateName) data.name = updateName;
      if (updateType) data.type = updateType;
      if (updateData && updateData !== '{}') data.data = JSON.parse(updateData);
      const res = await updateCredential(updateId, data);
      if (res.success) {
        alert('Credential updated');
        setShowUpdate(false);
        setUpdateId(''); setUpdateName(''); setUpdateType(''); setUpdateData('{}');
      } else alert(res.error?.message || 'Failed');
    } catch { alert('Invalid JSON in data field'); }
    setUpdating(false);
  }

  async function handleSchemaLookup() {
    if (!schemaType) return;
    setLoadingSchema(true);
    const res = await getCredentialSchema(schemaType);
    if (res.success && res.data) setSchema(res.data);
    else alert(res.error?.message || 'Schema not found');
    setLoadingSchema(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteCredential(deleteTarget);
    if (res.success) { setDeleteTarget(null); alert('Credential deleted'); }
    else alert(res.error?.message || 'Failed');
  }

  if (!activeConnection) return <div className="text-center py-12 text-gray-500">Select a connection first.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          <p className="text-gray-500 mt-1">Create, update, delete credentials on {activeConnection.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowUpdate(!showUpdate); setShowCreate(false); }} className="flex items-center gap-2 px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50">
            <Pencil className="h-4 w-4" /> Update
          </button>
          <button onClick={() => { setShowCreate(!showCreate); setShowUpdate(false); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Create
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Create Credential</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="My API Key" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type *</label>
              <input value={createType} onChange={(e) => setCreateType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="httpBasicAuth" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data (JSON)</label>
            <textarea value={createData} onChange={(e) => setCreateData(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono" placeholder='{"user": "...", "password": "..."}' />
          </div>
          <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
          </button>
        </div>
      )}

      {/* Update form */}
      {showUpdate && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Update Credential</h3>
            <button onClick={() => setShowUpdate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Credential ID *</label>
              <input value={updateId} onChange={(e) => setUpdateId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono" placeholder="123" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Name (optional)</label>
              <input value={updateName} onChange={(e) => setUpdateName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Updated Name" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Type (optional)</label>
              <input value={updateType} onChange={(e) => setUpdateType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="httpBasicAuth" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">New Data (JSON, optional)</label>
            <textarea value={updateData} onChange={(e) => setUpdateData(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono" placeholder='{"user": "new_user", "password": "new_pass"}' />
          </div>
          <button onClick={handleUpdate} disabled={updating} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update
          </button>
        </div>
      )}

      {/* Schema lookup */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-gray-900">Credential Schema Lookup</h3>
        <div className="flex gap-2">
          <input
            value={schemaType}
            onChange={(e) => setSchemaType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSchemaLookup(); }}
            placeholder="e.g. httpBasicAuth, slackApi, openAiApi"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
          <button onClick={handleSchemaLookup} disabled={loadingSchema} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {loadingSchema ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Lookup
          </button>
        </div>
        {schema && <JsonViewer data={schema} title={`Schema: ${schemaType}`} />}
      </div>

      {/* Delete by ID */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-gray-900">Delete Credential by ID</h3>
        <div className="flex gap-2">
          <input
            id="delete-cred-id"
            placeholder="Credential ID"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
            onKeyDown={(e) => { if (e.key === 'Enter') setDeleteTarget((e.target as HTMLInputElement).value); }}
          />
          <button onClick={() => {
            const input = document.getElementById('delete-cred-id') as HTMLInputElement;
            if (input?.value) setDeleteTarget(input.value);
          }} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Credential"
        message={`Delete credential "${deleteTarget}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
