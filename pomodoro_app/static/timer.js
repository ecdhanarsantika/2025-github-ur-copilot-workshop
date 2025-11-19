/**
 * Pomodoro Timer - Frontend Logic
 * Manages timer state, UI updates, and backend communication
 */

class Timer {
    constructor() {
        // Timer configuration (in seconds)
        this.durations = {
            work: 25 * 60,
            short_break: 5 * 60,
            long_break: 15 * 60
        };

        // State
        this.currentSession = 'work';
        this.timeRemaining = this.durations.work;
        this.isRunning = false;
        this.isPaused = false;
        this.intervalId = null;
        this.sessionCount = 1;
        this.completedWorkSessions = 0;
        this.totalDuration = this.durations.work;

        // DOM elements
        this.timerDisplay = document.getElementById('timer');
        this.sessionTypeDisplay = document.getElementById('session-type');
        this.sessionCountDisplay = document.getElementById('session-count');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.skipBtn = document.getElementById('skip-btn');
        this.progressBar = document.getElementById('progress');

        // Bind event listeners
        this.initializeEventListeners();
        
        // Initialize UI
        this.updateDisplay();
        this.loadStatistics();
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.skipBtn.addEventListener('click', () => this.skip());
    }

    start() {
        if (this.isRunning && !this.isPaused) return;

        if (!this.isRunning) {
            // Log session start
            this.logSessionEvent(this.currentSession, 'started');
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;

        this.intervalId = setInterval(() => this.tick(), 1000);
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        clearInterval(this.intervalId);
    }

    reset() {
        this.stop();
        this.timeRemaining = this.durations[this.currentSession];
        this.totalDuration = this.durations[this.currentSession];
        this.updateDisplay();
        this.updateProgress();

        if (this.isRunning || this.isPaused) {
            this.logSessionEvent(this.currentSession, 'reset');
        }

        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    skip() {
        if (this.isRunning) {
            this.logSessionEvent(this.currentSession, 'skipped');
        }
        this.stop();
        this.switchSession();
    }

    tick() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.updateDisplay();
            this.updateProgress();
        } else {
            this.sessionComplete();
        }
    }

    stop() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    sessionComplete() {
        this.stop();
        this.logSessionEvent(this.currentSession, 'completed');

        // Update completed work sessions counter
        if (this.currentSession === 'work') {
            this.completedWorkSessions++;
        }

        // Play notification sound (optional)
        this.notify();

        // Switch to next session
        this.switchSession();
    }

    switchSession() {
        // Determine next session type
        if (this.currentSession === 'work') {
            // After work session, alternate between short and long breaks
            // Long break after every 4 work sessions
            if (this.completedWorkSessions % 4 === 0 && this.completedWorkSessions > 0) {
                this.currentSession = 'long_break';
            } else {
                this.currentSession = 'short_break';
            }
        } else {
            // After break, return to work
            this.currentSession = 'work';
            this.sessionCount++;
        }

        // Reset timer for new session
        this.timeRemaining = this.durations[this.currentSession];
        this.totalDuration = this.durations[this.currentSession];
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;

        this.updateDisplay();
        this.updateProgress();
        this.updateSessionInfo();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateProgress() {
        const progress = ((this.totalDuration - this.timeRemaining) / this.totalDuration) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    updateSessionInfo() {
        // Update session type display
        const sessionNames = {
            work: 'Work Session',
            short_break: 'Short Break',
            long_break: 'Long Break'
        };
        this.sessionTypeDisplay.textContent = sessionNames[this.currentSession];

        // Update session count
        this.sessionCountDisplay.textContent = `Session #${this.sessionCount}`;

        // Update document title
        document.title = `${sessionNames[this.currentSession]} - Pomodoro Timer`;
    }

    notify() {
        // Browser notification (if permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
            const sessionNames = {
                work: 'Work Session',
                short_break: 'Short Break',
                long_break: 'Long Break'
            };
            new Notification('Pomodoro Timer', {
                body: `${sessionNames[this.currentSession]} complete! Time for a break.`,
                icon: '🍅'
            });
        }

        // Visual/audio feedback
        document.body.classList.add('session-complete');
        setTimeout(() => {
            document.body.classList.remove('session-complete');
        }, 1000);
    }

    async logSessionEvent(sessionType, action) {
        const data = {
            session_type: sessionType,
            action: action,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('/log-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error('Failed to log session:', await response.text());
            } else {
                // Refresh statistics after logging
                if (action === 'completed') {
                    this.loadStatistics();
                }
            }
        } catch (error) {
            console.error('Error logging session:', error);
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch('/history');
            if (!response.ok) {
                console.error('Failed to load statistics');
                return;
            }

            const data = await response.json();
            const stats = data.statistics;

            // Update statistics display
            document.getElementById('completed-sessions').textContent = 
                stats.completed_work_sessions;
            document.getElementById('work-time').textContent = 
                stats.total_work_time_minutes;
            document.getElementById('break-time').textContent = 
                stats.total_break_time_minutes;
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
}

// Initialize timer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const timer = new Timer();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
