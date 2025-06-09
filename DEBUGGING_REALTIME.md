# Debugging Realtime Issues

If realtime updates aren't working when removing signups, follow these steps to identify the issue:

## Step 1: Check Browser Console

Open your browser's developer tools and look for console logs when you remove a signup:

### Expected Logs for removeSignup:
```
Attempting to remove signup: [name] from event: [publicId]
Found event with ID: [uuid]
Found signup to delete: [signup object]
Successfully deleted signup with ID: [uuid]
Returning updated event: [updated event object]
```

### Expected Logs for Realtime:
```
Realtime connected, fetching initial data
Signup DELETE received: [payload object]
Fetched updated event: [updated event object]
```

## Step 2: Verify Database Changes

1. Go to your Supabase dashboard → Table Editor
2. Look at the `signups` table
3. Try removing a signup from the UI
4. Refresh the table view to see if the record was actually deleted

## Step 3: Check Realtime Configuration

In your Supabase dashboard:

1. Go to **Database** → **Replication**
2. Verify that both `events` and `signups` tables are listed under "Source"
3. If they're not there, add them manually:
   - Click "Add tables to replication"
   - Select both `events` and `signups`
   - Save

## Step 4: Test Realtime Connection

Add this temporary component to test realtime:

```typescript
// Add this to your event page temporarily
useEffect(() => {
  const channel = supabase
    .channel('test-realtime')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'signups' },
      (payload) => console.log('Global signup change:', payload)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

## Common Issues & Solutions

### Issue 1: Realtime Not Enabled
**Symptoms**: No realtime logs in console
**Solution**: Re-run the migration or manually enable realtime in Supabase dashboard

### Issue 2: DELETE Events Not Triggered  
**Symptoms**: INSERT/UPDATE work but DELETE doesn't
**Solution**: Check RLS policies - they might be blocking DELETE events

### Issue 3: Network/Connection Issues
**Symptoms**: Realtime works intermittently
**Solution**: Check your internet connection and Supabase project status

### Issue 4: Multiple Subscriptions
**Symptoms**: Multiple duplicate events
**Solution**: Make sure you're properly cleaning up subscriptions

## Quick Fix: Force Refresh

As a temporary workaround, you can force a refresh after delete operations:

```typescript
// In your remove function
const handleRemove = async (nameToRemove: string) => {
  // ... existing code ...
  try {
    await removeSignup(event.public_id, nameToRemove)
    // Force refresh if realtime doesn't work
    window.location.reload()
  } catch (err) {
    // ... error handling ...
  }
}
```

## Testing Realtime Manually

You can test realtime by manually inserting/deleting records in the Supabase dashboard while having the app open in another tab. 