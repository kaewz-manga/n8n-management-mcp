---
name: dashboard-components
description: React Dashboard patterns for dark theme, auth context, and component structure
user-invocable: false
---

# Dashboard Components

## Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- React Router v6
- Tailwind CSS (dark theme)

## Theme Colors (n2f-* classes)

```css
/* Dark theme with orange accent */
--n2f-bg: #0a0a0a;           /* Page background */
--n2f-card: #141414;         /* Card background */
--n2f-elevated: #1f1f1f;     /* Elevated surfaces */
--n2f-border: #2a2a2a;       /* Borders */
--n2f-accent: #f97316;       /* Orange accent */
--n2f-text: #fafafa;         /* Primary text */
--n2f-text-secondary: #a3a3a3; /* Secondary text */
--n2f-text-muted: #737373;   /* Muted text */
```

## Common Patterns

### Card Component
```tsx
<div className="bg-n2f-card border border-n2f-border rounded-lg p-6">
  <h2 className="text-lg font-semibold text-n2f-text mb-4">Title</h2>
  <p className="text-n2f-text-secondary">Content</p>
</div>
```

### Button Styles
```tsx
// Primary (orange)
<button className="bg-n2f-accent hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
  Save
</button>

// Secondary (outline)
<button className="border border-n2f-border hover:bg-n2f-elevated text-n2f-text px-4 py-2 rounded-lg">
  Cancel
</button>

// Danger
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
  Delete
</button>
```

### Input Fields
```tsx
<input
  type="text"
  className="w-full px-3 py-2 bg-n2f-elevated border border-n2f-border rounded-lg
             text-n2f-text placeholder-n2f-text-muted focus:outline-none
             focus:ring-2 focus:ring-n2f-accent"
  placeholder="Enter value"
/>
```

### Loading Spinner
```tsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-n2f-accent" />
```

## Auth Context

```tsx
import { useAuth } from '../contexts/AuthContext';

function Component() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return <div>Hello, {user?.email}</div>;
}
```

## Sudo Context (Protected Actions)

```tsx
import { useSudo } from '../hooks/useSudo';

function Component() {
  const { withSudo } = useSudo();

  const handleDelete = async () => {
    await withSudo(async () => {
      // This runs only after TOTP verification
      await api.deleteConnection(id);
    });
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## API Calls

```tsx
import { api } from '../lib/api';

// All methods return Promise
const connections = await api.getConnections();
const user = await api.getCurrentUser();
await api.createConnection({ name, url, apiKey });
```

## Page Structure

```tsx
export default function MyPage() {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-n2f-text mb-6">Page Title</h1>
      {/* Content */}
    </div>
  );
}
```

## File Structure

```
dashboard/src/
├── components/     # Reusable components
├── contexts/       # React contexts (Auth, Sudo)
├── hooks/          # Custom hooks
├── lib/            # Utilities (api.ts)
├── pages/          # Page components
│   ├── admin/      # Admin panel pages
│   └── n8n/        # n8n management pages
└── App.tsx         # Router configuration
```
