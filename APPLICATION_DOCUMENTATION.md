# Pomodoro Timer Application Documentation

## Overview

The Pomodoro Timer is a web-based productivity application that implements the Pomodoro Technique - a time management method that uses a timer to break work into focused intervals (typically 25 minutes) separated by short breaks.

## Architecture

### Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3
- **Data Storage**: Text file (JSON logs)
- **Communication**: RESTful API

### Application Structure

```
pomodoro_app/
├── app.py                 # Flask backend server
├── pomodoro_log.txt       # Session logs storage
├── static/
│   ├── style.css         # Application styling
│   └── timer.js          # Frontend timer logic
└── templates/
    └── index.html        # Main HTML page
```

## How It Works

### Core Functionality

#### 1. Timer Management

The application manages three types of timed sessions:
- **Work Session**: 25 minutes of focused work
- **Short Break**: 5 minutes of rest
- **Long Break**: 15 minutes of rest (after every 4 work sessions)

#### 2. Session Flow

The timer follows the classic Pomodoro Technique pattern:
1. Start with a Work Session
2. After completion, take a Short Break
3. Return to Work Session
4. After 4 completed work sessions, take a Long Break
5. Repeat the cycle

#### 3. User Controls

- **Start**: Begin or resume the current session
- **Pause**: Temporarily pause the running timer
- **Reset**: Reset the current session to its initial duration
- **Skip**: Skip to the next session type

#### 4. Session Logging

Every significant event is logged to `pomodoro_log.txt`:
- Session started
- Session completed
- Session skipped
- Session reset

Each log entry contains:
- `session_type`: work, short_break, or long_break
- `action`: started, completed, skipped, or reset
- `timestamp`: ISO 8601 formatted timestamp

#### 5. Statistics Tracking

The application tracks and displays:
- Total completed work sessions
- Total work time (in minutes)
- Total break time (in minutes)

## User Flow Diagram

```mermaid
flowchart TD
    Start([User Opens Application]) --> Load[Load Timer Interface]
    Load --> Init[Initialize Timer<br/>25:00 Work Session]
    
    Init --> UserAction{User Action?}
    
    UserAction -->|Click Start| StartTimer[Start Timer<br/>Log 'started' event]
    UserAction -->|Click Skip| SkipSession[Skip to Next Session<br/>Log 'skipped' event]
    UserAction -->|Click Reset| ResetTimer[Reset to Initial Time<br/>Log 'reset' event]
    
    StartTimer --> Running{Timer Running?}
    
    Running -->|Time > 0| Tick[Decrease Time by 1s<br/>Update Display<br/>Update Progress Bar]
    Tick --> UserPause{User Pauses?}
    
    UserPause -->|Yes| Paused[Pause Timer]
    Paused --> Resume{Resume?}
    Resume -->|Yes| Running
    Resume -->|No - Reset| ResetTimer
    
    UserPause -->|No| Running
    
    Running -->|Time = 0| Complete[Session Complete<br/>Log 'completed' event<br/>Show Notification]
    
    Complete --> DetermineNext{Current<br/>Session?}
    
    DetermineNext -->|Work Session| CheckCount{Completed<br/>4 Work<br/>Sessions?}
    CheckCount -->|Yes| LongBreak[Switch to<br/>Long Break<br/>15:00]
    CheckCount -->|No| ShortBreak[Switch to<br/>Short Break<br/>5:00]
    
    DetermineNext -->|Break Session| WorkSession[Switch to<br/>Work Session<br/>25:00<br/>Increment Session #]
    
    LongBreak --> UpdateUI[Update UI<br/>Load Statistics]
    ShortBreak --> UpdateUI
    WorkSession --> UpdateUI
    ResetTimer --> UpdateUI
    SkipSession --> DetermineNext
    
    UpdateUI --> UserAction
    
    style Start fill:#e1f5e1
    style Complete fill:#ffe1e1
    style UpdateUI fill:#e1e5ff
```

## Sequence Diagrams

### Starting a Work Session

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser UI
    participant Timer as Timer.js
    participant Backend as Flask Backend
    participant Log as pomodoro_log.txt
    
    User->>UI: Click "Start" button
    UI->>Timer: start()
    
    Timer->>Timer: Set isRunning = true
    Timer->>UI: Disable Start button
    Timer->>UI: Enable Pause button
    
    Timer->>Backend: POST /log-session
    Note over Timer,Backend: {"session_type": "work",<br/>"action": "started",<br/>"timestamp": "2025-11-19T..."}
    
    Backend->>Backend: validate_session_data()
    Backend->>Log: append_log_entry()
    Log-->>Backend: Success
    Backend-->>Timer: 200 OK {"success": true}
    
    Timer->>Timer: Start interval (1s)
    
    loop Every Second
        Timer->>Timer: tick()
        Timer->>Timer: timeRemaining--
        Timer->>UI: Update display (MM:SS)
        Timer->>UI: Update progress bar
    end
```

### Completing a Session

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser UI
    participant Timer as Timer.js
    participant Backend as Flask Backend
    participant Log as pomodoro_log.txt
    
    Timer->>Timer: tick() → timeRemaining = 0
    Timer->>Timer: sessionComplete()
    Timer->>Timer: stop() - clear interval
    
    Timer->>Backend: POST /log-session
    Note over Timer,Backend: {"session_type": "work",<br/>"action": "completed",<br/>"timestamp": "2025-11-19T..."}
    
    Backend->>Backend: validate_session_data()
    Backend->>Log: append_log_entry()
    Log-->>Backend: Success
    Backend-->>Timer: 200 OK
    
    Timer->>Timer: completedWorkSessions++
    Timer->>UI: Show notification
    UI->>User: Browser notification<br/>"Work Session complete!"
    
    Timer->>Timer: switchSession()
    
    alt 4 work sessions completed
        Timer->>Timer: currentSession = 'long_break'
    else Less than 4 work sessions
        Timer->>Timer: currentSession = 'short_break'
    end
    
    Timer->>UI: Update session type display
    Timer->>UI: Reset timer display
    Timer->>Timer: loadStatistics()
    
    Timer->>Backend: GET /history
    Backend->>Log: parse_log_file()
    Log-->>Backend: All log entries
    Backend->>Backend: aggregate_statistics()
    Backend-->>Timer: Statistics JSON
    
    Timer->>UI: Update statistics display
```

### Loading Statistics

```mermaid
sequenceDiagram
    participant UI as Browser UI
    participant Timer as Timer.js
    participant Backend as Flask Backend
    participant Log as pomodoro_log.txt
    
    Timer->>Backend: GET /history
    activate Backend
    
    Backend->>Log: parse_log_file()
    activate Log
    Log-->>Backend: List of log entries
    deactivate Log
    
    Backend->>Backend: aggregate_statistics(entries)
    
    Note over Backend: Calculate:<br/>- Completed work sessions<br/>- Total work time<br/>- Total break time<br/>- Sessions by type
    
    Backend-->>Timer: JSON Response
    deactivate Backend
    
    Note over Backend,Timer: {<br/>  "entries": [...],<br/>  "statistics": {<br/>    "completed_work_sessions": 5,<br/>    "total_work_time_minutes": 125,<br/>    "total_break_time_minutes": 25<br/>  }<br/>}
    
    Timer->>UI: Update "Completed Sessions"
    Timer->>UI: Update "Work Time"
    Timer->>UI: Update "Break Time"
    
    UI-->>Timer: Display updated statistics
```

### User Pauses and Resumes

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser UI
    participant Timer as Timer.js
    
    Note over Timer: Timer is running...
    
    User->>UI: Click "Pause" button
    UI->>Timer: pause()
    
    Timer->>Timer: isPaused = true
    Timer->>Timer: clearInterval()
    Timer->>UI: Enable Start button
    Timer->>UI: Disable Pause button
    
    Note over Timer,UI: Timer is paused<br/>Time preserved
    
    User->>UI: Click "Start" button
    UI->>Timer: start()
    
    Timer->>Timer: isPaused = false
    Timer->>Timer: Start interval again
    Timer->>UI: Disable Start button
    Timer->>UI: Enable Pause button
    
    Note over Timer: Timer continues from<br/>where it was paused
```

### Skipping a Session

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser UI
    participant Timer as Timer.js
    participant Backend as Flask Backend
    participant Log as pomodoro_log.txt
    
    User->>UI: Click "Skip" button
    UI->>Timer: skip()
    
    alt Timer is running
        Timer->>Backend: POST /log-session
        Note over Timer,Backend: {"session_type": "work",<br/>"action": "skipped",<br/>"timestamp": "..."}
        Backend->>Log: append_log_entry()
        Log-->>Backend: Success
        Backend-->>Timer: 200 OK
    end
    
    Timer->>Timer: stop() - clear interval
    Timer->>Timer: switchSession()
    
    Note over Timer: Same logic as completion<br/>but without logging "completed"
    
    Timer->>UI: Update to next session type
    Timer->>UI: Reset timer display
    Timer->>UI: Reset progress bar
```

## API Endpoints

### POST `/log-session`

Logs a session event to the log file.

**Request Body:**
```json
{
  "session_type": "work|short_break|long_break",
  "action": "started|completed|skipped|reset",
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session logged successfully"
}
```

**Error Response:**
```json
{
  "error": "Invalid session_type. Must be one of: ['work', 'short_break', 'long_break']"
}
```

### GET `/history`

Retrieves all session history and aggregated statistics.

**Response:**
```json
{
  "entries": [
    {
      "session_type": "work",
      "action": "completed",
      "timestamp": "2025-11-19T10:30:00.000Z"
    }
  ],
  "statistics": {
    "total_sessions": 5,
    "completed_work_sessions": 5,
    "completed_break_sessions": 4,
    "skipped_sessions": 0,
    "total_work_time_minutes": 125,
    "total_break_time_minutes": 25,
    "by_type": {
      "work": {"started": 5, "completed": 5, "skipped": 0},
      "short_break": {"started": 4, "completed": 4, "skipped": 0},
      "long_break": {"started": 0, "completed": 0, "skipped": 0}
    }
  },
  "total_entries": 14
}
```

### GET `/`

Serves the main HTML page with the timer interface.

## Key Frontend Classes and Methods

### Timer Class (`timer.js`)

#### Properties
- `durations`: Object containing session durations in seconds
- `currentSession`: Current session type (work/short_break/long_break)
- `timeRemaining`: Seconds remaining in current session
- `isRunning`: Boolean indicating if timer is active
- `isPaused`: Boolean indicating if timer is paused
- `completedWorkSessions`: Counter for completed work sessions
- `sessionCount`: Current session number

#### Methods

**Control Methods:**
- `start()`: Start or resume the timer
- `pause()`: Pause the running timer
- `reset()`: Reset the current session
- `skip()`: Skip to the next session

**Core Logic:**
- `tick()`: Decrements time and updates UI (called every second)
- `sessionComplete()`: Handles session completion
- `switchSession()`: Determines and switches to next session type

**UI Updates:**
- `updateDisplay()`: Updates the timer display (MM:SS)
- `updateProgress()`: Updates the progress bar
- `updateSessionInfo()`: Updates session type and count displays

**Backend Communication:**
- `logSessionEvent()`: Sends session events to backend
- `loadStatistics()`: Fetches and displays statistics

**Notifications:**
- `notify()`: Shows browser notifications and visual feedback

## Key Backend Functions

### Validation
- `validate_session_data(data)`: Validates incoming session data

### Logging
- `format_log_entry(data)`: Formats session data as JSON
- `append_log_entry(data)`: Writes log entry to file
- `parse_log_file()`: Reads and parses all log entries

### Statistics
- `aggregate_statistics(entries)`: Calculates statistics from log entries

### Routes
- `index()`: Serves the main page
- `log_session()`: Handles session logging
- `history()`: Returns session history and statistics

## Data Flow

1. **User Interaction** → Browser UI captures button clicks
2. **Frontend Logic** → Timer class manages state and logic
3. **API Communication** → Async fetch calls to Flask backend
4. **Data Persistence** → Flask writes to text file (JSON lines)
5. **Statistics** → Backend aggregates data from log file
6. **Display Update** → Frontend updates UI with latest data

## Session State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Initialize
    
    Idle --> Running: Start clicked
    Running --> Paused: Pause clicked
    Paused --> Running: Start clicked (resume)
    
    Running --> SessionComplete: Time reaches 0
    Paused --> Idle: Reset clicked
    Running --> Idle: Reset clicked
    
    Idle --> SwitchSession: Skip clicked
    Running --> SwitchSession: Skip clicked
    Paused --> SwitchSession: Skip clicked
    
    SessionComplete --> DetermineNext: Evaluate session count
    SwitchSession --> DetermineNext
    
    DetermineNext --> Idle: Switch to next session type
    
    note right of Running
        Timer decrements every second
        UI updates continuously
        Progress bar animates
    end note
    
    note right of SessionComplete
        Log "completed" event
        Show notification
        Update statistics
    end note
```

## Features

### ✅ Implemented Features

1. **Timer Functionality**
   - Configurable work/break durations
   - Start, pause, reset, and skip controls
   - Automatic session switching
   - Visual progress bar

2. **Session Management**
   - Tracks work sessions
   - Alternates between short and long breaks
   - Long break after every 4 work sessions

3. **Logging & Persistence**
   - All session events logged with timestamps
   - JSON-formatted log file
   - Historical data preserved

4. **Statistics**
   - Real-time statistics display
   - Completed sessions counter
   - Total work and break time tracking
   - Detailed breakdown by session type

5. **User Experience**
   - Browser notifications
   - Visual feedback for session completion
   - Dynamic document title updates
   - Responsive design

### 🔄 Session Type Logic

```javascript
// After work session:
if (completedWorkSessions % 4 === 0) {
    nextSession = 'long_break'  // Every 4th work session
} else {
    nextSession = 'short_break'
}

// After any break:
nextSession = 'work'
sessionCount++
```

## Running the Application

### Prerequisites
- Python 3.7+
- Flask installed (`pip install flask`)

### Start the Server
```bash
python pomodoro_app/app.py
```

The application will be available at `http://localhost:5000`

### Configuration
Default durations are set in `timer.js`:
```javascript
this.durations = {
    work: 25 * 60,         // 25 minutes
    short_break: 5 * 60,   // 5 minutes
    long_break: 15 * 60    // 15 minutes
};
```

## File Structure Details

### `pomodoro_log.txt`
Each line contains a JSON object:
```json
{"session_type": "work", "action": "started", "timestamp": "2025-11-19T10:00:00.000Z"}
{"session_type": "work", "action": "completed", "timestamp": "2025-11-19T10:25:00.000Z"}
{"session_type": "short_break", "action": "started", "timestamp": "2025-11-19T10:25:00.000Z"}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Notification API support (Chrome, Firefox, Edge, Safari)
- Fetch API support (all modern browsers)

## Error Handling

### Frontend
- Failed API calls are logged to console
- Statistics load failures are handled gracefully
- Timer continues to work even if logging fails

### Backend
- Input validation on all endpoints
- Malformed JSON entries are skipped when parsing
- File I/O errors are caught and logged
- Proper HTTP status codes returned

## Future Enhancement Ideas

- User authentication
- Customizable session durations
- Task/project association with sessions
- Charts and analytics
- Sound customization
- Dark mode toggle
- Export statistics to CSV
- Mobile app version
- Keyboard shortcuts

---

**Last Updated**: November 19, 2025
**Version**: 1.0
