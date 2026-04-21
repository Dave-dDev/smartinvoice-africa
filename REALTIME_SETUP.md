# Real-Time Data Setup Guide

## ✅ What's Been Implemented

Your SmartInvoice Africa app now has **full real-time data synchronization** across all pages! Here's what was added:

### 1. **Enhanced Real-Time Hooks**

#### `useRealtimeInvoices` (Enhanced)

- **File**: `src/hooks/useRealtimeInvoices.js`
- **Features**:
  - Connection status tracking
  - Update count metrics
  - Last update timestamp
  - Better error handling
  - Detailed console logging

#### `useRealtimeCustomers` (New)

- **File**: `src/hooks/useRealtimeCustomers.js`
- **Features**: Same as invoices, but for customer data

#### `useRealtimeExpenses` (New)

- **File**: `src/hooks/useRealtimeExpenses.js`
- **Features**: Same as invoices, but for expense data

#### `useRealtimeData` (Generic)

- **File**: `src/hooks/useRealtimeData.js`
- **Features**: Generic hook for any table with custom handlers

### 2. **Real-Time Status Component**

- **File**: `src/components/RealtimeStatus.jsx`
- **Exported from**: `src/components/UI.jsx`
- **Features**:
  - Visual connection status indicator (🟢 Live, 🟡 Connecting, 🔴 Disconnected)
  - Shows update count and last update time
  - Two variants: `RealtimeStatus` (detailed) and `RealtimeBadge` (compact)

### 3. **Updated Pages**

All pages now display real-time status indicators and automatically sync data:

- ✅ **Dashboard** - Shows real-time status in hero strip
- ✅ **Invoices** - Shows real-time status in toolbar
- ✅ **Customers** - Shows real-time status in toolbar
- ✅ **Expenses** - Shows real-time status in toolbar

## 🎯 How It Works

### Automatic Updates

When data changes in your Supabase database (from any client or direct DB change), all connected browsers will automatically update within milliseconds. No refresh needed!

**Example scenarios:**

1. You create an invoice in one tab → appears instantly in all other tabs
2. Customer updates their email → all views update immediately
3. Expense is deleted → removed from all connected clients

### Connection Status

The status indicator shows:

- **🟢 Live** - Connected and receiving real-time updates
- **🟡 Connecting** - Establishing connection to Supabase
- **🔴 Disconnected** - Connection failed or unsubscribed

## 📝 Usage Examples

### Basic Hook Usage

```javascript
import { useRealtimeInvoices } from "../hooks/useRealtimeInvoices.js";

function MyComponent() {
  const [invoices, setInvoices] = useState([]);

  // Enable real-time updates
  const realtime = useRealtimeInvoices(setInvoices);

  // Access connection info
  console.log(realtime.connectionStatus); // "SUBSCRIBED"
  console.log(realtime.updateCount); // Number of updates received
  console.log(realtime.lastUpdate); // Date of last update
}
```

### Using the Status Component

```javascript
import { RealtimeStatus } from "../components/UI.jsx";

function MyComponent() {
  const realtime = useRealtimeInvoices(setInvoices);

  return (
    <div>
      <h1>Invoices</h1>
      <RealtimeStatus
        connectionStatus={realtime.connectionStatus}
        lastUpdate={realtime.lastUpdate}
        updateCount={realtime.updateCount}
        showDetails // Optional: shows update count and time
      />
    </div>
  );
}
```

### Generic Hook for Any Table

```javascript
import { useRealtimeData } from "../hooks/useRealtimeData.js";

function MyComponent() {
  const [payments, setPayments] = useState([]);

  // Subscribe to any table
  const realtime = useRealtimeData("payments", setPayments);
}
```

## 🔧 Configuration

### Supabase Setup (Already Done)

Your `src/lib/supabase.js` is already configured. Make sure your Supabase project has:

1. **Realtime enabled** for tables:
   - Go to Supabase Dashboard → Database → Replication
   - Enable realtime for: `invoices`, `customers`, `expenses`

2. **Proper RLS policies** (Row Level Security):

   ```sql
   -- Example for invoices table
   CREATE POLICY "Users can view their own invoices"
   ON invoices FOR SELECT
   USING (auth.uid() = profile_id);

   CREATE POLICY "Users can insert their own invoices"
   ON invoices FOR INSERT
   WITH CHECK (auth.uid() = profile_id);

   CREATE POLICY "Users can update their own invoices"
   ON invoices FOR UPDATE
   USING (auth.uid() = profile_id);

   CREATE POLICY "Users can delete their own invoices"
   ON invoices FOR DELETE
   USING (auth.uid() = profile_id);
   ```

## 🎨 Styling

The real-time status component matches your existing design:

- Uses your color palette (Forest Green, Gold, etc.)
- DM Sans font family
- Smooth animations and transitions
- Responsive design

## 🚀 Next Steps (Optional Enhancements)

### 1. Optimistic Updates

For even better UX, implement optimistic updates:

```javascript
const handleCreate = async (formData) => {
  // Optimistically add to UI first
  const tempId = `temp-${Date.now()}`;
  const tempInvoice = { ...formData, id: tempId, pending: true };
  setInvoices((prev) => [tempInvoice, ...prev]);

  try {
    const newInvoice = await createInvoice(formData);
    // Replace temp with real invoice from DB
    setInvoices((prev) => prev.filter((i) => i.id !== tempId));
    setInvoices((prev) => [newInvoice, ...prev]);
  } catch (e) {
    // Remove temp on error
    setInvoices((prev) => prev.filter((i) => i.id !== tempId));
    setError(e.message);
  }
};
```

### 2. Offline Support

Add offline queue for actions performed while disconnected.

### 3. Selective Subscriptions

Only subscribe to real-time updates when the page is visible:

```javascript
import { useRealtimeInvoices } from "../hooks/useRealtimeInvoices.js";
import { useEffect } from "react";

function MyComponent() {
  const [invoices, setInvoices] = useState([]);
  const [shouldSubscribe, setShouldSubscribe] = useState(true);

  const realtime = useRealtimeInvoices(shouldSubscribe ? setInvoices : null);

  useEffect(() => {
    const handleVisibility = () => {
      setShouldSubscribe(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);
}
```

## 📊 Performance Tips

1. **Cleanup is automatic** - Hooks properly unsubscribe when components unmount
2. **Efficient updates** - Only changed data is transmitted
3. **Minimal re-renders** - Updates use functional state updates
4. **Console logging** - Check browser console for real-time events (🔄 📡 🔌)

## 🐛 Troubleshooting

### Not seeing updates?

1. Check browser console for connection status
2. Verify Supabase realtime is enabled for the table
3. Check RLS policies allow the user to read the data
4. Ensure you're using the same Supabase project

### Connection keeps dropping?

1. Check your internet connection
2. Verify Supabase project status
3. Check browser console for error messages
4. Try refreshing the page

### Updates not showing in UI?

1. Make sure you're passing `setInvoices` (or equivalent) to the hook
2. Check that your state setter is being called
3. Verify the data structure matches what your components expect

## 📚 Files Modified/Created

### Created:

- `src/hooks/useRealtimeCustomers.js`
- `src/hooks/useRealtimeExpenses.js`
- `src/hooks/useRealtimeData.js`
- `src/components/RealtimeStatus.jsx`

### Modified:

- `src/hooks/useRealtimeInvoices.js` (enhanced)
- `src/components/UI.jsx` (exports RealtimeStatus)
- `src/pages/Dashboard.jsx`
- `src/pages/Invoices.jsx`
- `src/pages/Customers.jsx`
- `src/pages/Expenses.jsx`
- `src/App.jsx`

---

**Need help?** Check the console logs for real-time events or inspect the RealtimeStatus component on each page to see connection details!
