# Socket.IO Messaging Fixes for Production

## Issues Identified and Fixed

### 1. **Pending User Socket Authentication Issue**
**Problem:**
- The socket auth middleware required `userId` to be present in the token
- Pending users (those who selected a role but didn't complete registration) have `pendingSessionKey` instead
- This caused pending users to be rejected from socket connections entirely

**Solution:**
- Updated `requireAuthSocket` middleware to accept both `userId` and `pendingSessionKey`
- Added `socket.isPending` flag to track pending users
- Prevented pending users from sending messages (but allow them to view messages page)

### 2. **Socket Transport Configuration**
**Problem:**
- Client socket only tried WebSocket transport
- In production, WebSocket might be blocked/unavailable
- No fallback to HTTP polling or other transports
- Failed connections would not retry effectively

**Solution:**
- Added multiple transports: `["websocket", "polling"]`
- Configured reconnection parameters:
  - `reconnectionDelay: 1000` - initial delay
  - `reconnectionDelayMax: 5000` - max delay
  - `reconnectionAttempts: Infinity` - keep retrying
- Added `timeout: 20000` for connection attempts
- Added upgrade path for transport fallback

### 3. **Missing Error Handling**
**Problem:**
- Socket connection errors weren't being caught or logged
- Message send failures had no user-friendly error messages
- Connection state wasn't properly tracked
- No way to debug production socket issues

**Solution:**
- Added socket error event listeners in handler and context
- Implemented `connectionError` state in SocketContext
- Added timeout handling for message sends (10-second timeout)
- Added error logging on socket errors
- Show meaningful error messages to users

### 4. **Message Delivery Reliability**
**Problem:**
- No validation of receiver existence before creating conversation
- Self-messaging was possible
- Duplicate unread count updates could occur
- No timeout for stuck message sends
- Input wasn't restored on failure

**Solution:**
- Added receiver validation before accepting message
- Added self-messaging prevention
- Improved unread count logic with Map operations
- Implemented promise-based message send with timeout
- Restore message input on send failure for retry

### 5. **Pending User Socket Connection**
**Problem:**
- Pending users were still trying to connect to socket
- This caused unnecessary connection attempts and errors

**Solution:**
- Updated SocketContext to disconnect pending users
- Only fully authenticated users can use socket features
- Clear separation between pending and authenticated states

### 6. **Socket Handler Syntax Error**
**Problem:**
- Missing formatting in handler.socket.js
- Line 11 had missing newline causing parse issues

**Solution:**
- Fixed socket room joining with proper syntax
- Added conditional check for userId before joining room

---

## Files Modified

### Backend Files

#### 1. `Backend/middleware/authSocket.middleware.js`
- Allow both `userId` and `pendingSessionKey` in token
- Add `socket.isPending` flag
- Better error messages

#### 2. `Backend/sockets/handler.socket.js`
- Fixed syntax error
- Added check for pending users before joining room
- Added error event handler
- Better logging

#### 3. `Backend/sockets/event.socket.js`
- Prevent pending users from sending messages
- Validate receiver exists
- Prevent self-messaging
- Improved unread count logic
- Better error handling
- Timeout for stuck messages
- Clear error messages

### Frontend Files

#### 1. `Frontend/src/sockets/socketHandler.js`
- Added multiple transport configuration
- Configured reconnection parameters
- Added error event listeners
- Added connection monitoring

#### 2. `Frontend/src/contexts/SocketContext.jsx`
- Added `connectionError` state
- Added error event handling
- Disconnect pending users
- Better logging
- Only connect fully authenticated users

#### 3. `Frontend/src/pages/Messages.jsx`
- Added timeout for message send (10 seconds)
- Promise-based message handling
- Restore input on send failure
- Try to reconnect on disconnect
- Better error messages

---

## Socket Connection Flow (Fixed)

```
User Authentication
    ↓
checkJwt endpoint
    ↓
Auth token issued (with userId or pendingSessionKey)
    ↓
SocketProvider checks isAuthentication && !isPending
    ├─ If pending: disconnect socket
    ├─ If authenticated: connect socket
    └─ If unauthenticated: disconnect socket
    ↓
Socket connects with credentials (WebSocket or polling)
    ↓
requireAuthSocket middleware validates token
    ├─ Requires userId (for fully authenticated users)
    └─ Blocks pendingSessionKey (for pending users)
    ↓
Socket joins user's personal room (userId)
    ↓
Socket listeners registered:
    ├─ sendMessage → validates & delivers
    ├─ receiveMessage → updates UI
    └─ disconnect → cleanup
```

---

## Message Send Flow (Fixed)

```
User types message and clicks send
    ↓
handleSendMessage validation:
    ├─ Check message content not empty
    ├─ Check socket connected (auto-reconnect if needed)
    ├─ Check valid conversation selected
    └─ Clear input immediately
    ↓
socket.emit("sendMessage", {...}, callback)
    ↓
Backend validation:
    ├─ Check user is fully authenticated (not pending)
    ├─ Check message content not empty
    ├─ Check receiver exists
    ├─ Check not self-messaging
    └─ Check conversation exists
    ↓
Create message in database
    ↓
Update conversation metadata
    ↓
Send acknowledgment callback → frontend
    ↓
Emit to sender's room
    ↓
Emit to receiver's personal room
    ↓
Frontend receives message:
    ├─ Update conversation list
    ├─ Update message history
    └─ Show notification
    ↓
If send fails or times out:
    ├─ Show error to user
    └─ Restore message input for retry
```

---

## Production Deployment Checklist

- [ ] Both backend and frontend deployed
- [ ] Environment variables set correctly:
  - `VITE_SOCKET_URL` or `VITE_API_URL` on frontend
  - `FRONTEND_URL` and `FRONTEND_REDIRECT_URL` on backend
- [ ] CORS configured for socket connections
- [ ] Check browser console for connection errors
- [ ] Test message sending in production
- [ ] Verify reconnection works after network interruption
- [ ] Check that pending users cannot access messaging

---

## Testing Production Socket Issues

### Check Browser Console
```javascript
// Should show connection messages
// Look for errors like:
// - "Unauthorized: No token"
// - "Connection error" 
// - Timeouts
```

### Monitor Network Tab
- WebSocket connection should show in Network tab
- Status should be "101 Switching Protocols"
- If not, check for HTTP polling fallback

### Test Scenarios
1. **Initial Connection**
   - Open Messages page
   - Should connect socket within 1-2 seconds
   - No errors in console

2. **Send Message**
   - Type and send message
   - Should appear in chat immediately
   - Recipient gets notification

3. **Network Disruption**
   - Disconnect network (turn off Wi-Fi)
   - Should show reconnection message
   - Reconnect network
   - Socket should auto-reconnect within 5 seconds

4. **Browser Refresh**
   - Socket should reconnect automatically

5. **Pending User**
   - User selects role but doesn't complete registration
   - Try to go to Messages page
   - Should redirect to /getting-started
   - Socket should not connect

---

## Debugging Socket Issues

### Enable Debug Logging
Frontend (`socketHandler.js`):
```javascript
// Already configured in dev mode via: ...(import.meta.env.DEV && { debug: true })
// In production, check browser console
```

### Check Socket State
```javascript
// In browser console:
import socket from "src/sockets/socketHandler"
console.log(socket.connected) // true/false
console.log(socket.auth) // { userId, role }
console.log(socket.id) // current socket id
```

### Monitor Server Socket Logs
```bash
# Backend logs show:
# "User USERID connected and joined personal room"
# "Message sent from SENDER to RECEIVER"
# "Socket error: message"
```

### Common Issues and Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| Socket won't connect | Network tab, browser console | Check VITE_SOCKET_URL, CORS settings |
| Messages won't send | Socket connected? | Verify receiver exists, try reconnect |
| Stuck messages | Network tab, 10s timeout | Timeout triggers, message restored |
| Pending user socket errors | Auth state | Pending users are disconnected (expected) |
| WebSocket fails, polling slow | Network conditions | Polling is fallback, slower but works |
| User receives duplicate messages | Message listener code | Should not happen with current fix |

---

## Environment Variables Required

### Backend (.env)
```bash
FRONTEND_URL=https://your-frontend.com
FRONTEND_REDIRECT_URL=https://your-frontend.com
# CORS will be applied to socket connections
```

### Frontend (.env)
```bash
VITE_SOCKET_URL=https://your-backend.com
# OR use VITE_API_URL if socket at same domain
VITE_API_URL=https://your-backend.com
```

---

## Performance Considerations

- **WebSocket preferred**: Lower latency, lower bandwidth
- **HTTP Polling fallback**: Works in restricted networks
- **Auto-reconnection**: Handles network interruptions
- **10-second timeout**: Prevents hung messages
- **Message queue in DB**: Conversations load from database not socket

---

## Security Notes

- Socket requires valid JWT with `userId`
- Pending users cannot send messages (only view)
- Self-messaging prevented
- Receiver validation ensures valid messages
- CORS and credentials protection in place

---

## Future Improvements

1. **Message Queuing**: Store failed messages and retry
2. **Typing Indicators**: Add "user is typing" notifications
3. **Read Receipts**: Show when message was read
4. **Message Encryption**: E2E encryption for messages
5. **Offline Support**: Service worker for offline message storage
6. **Message Persistence**: Keep message history queryable
7. **Search**: Full-text search on messages
8. **Media Sharing**: File/image uploads
