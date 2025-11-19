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
        this.progressCircle = document.getElementById('progress-circle');
        this.timerStatus = document.getElementById('timer-status');
        this.timerCard = document.querySelector('.timer-card');
        this.gradientStart = document.getElementById('gradient-start');
        this.gradientEnd = document.getElementById('gradient-end');
        
        // Particle system
        this.particleCanvas = document.getElementById('particles-canvas');
        this.particleCtx = this.particleCanvas ? this.particleCanvas.getContext('2d') : null;
        this.particles = [];
        this.particleAnimationId = null;

        // Bind event listeners
        this.initializeEventListeners();
        
        // Initialize UI
        this.updateDisplay();
        this.loadStatistics();
        this.initializeParticleCanvas();
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.skipBtn.addEventListener('click', () => this.skip());
        
        // Resize particle canvas on window resize
        window.addEventListener('resize', () => this.initializeParticleCanvas());
    }

    initializeParticleCanvas() {
        if (!this.particleCanvas) return;
        
        const rect = this.particleCanvas.getBoundingClientRect();
        this.particleCanvas.width = rect.width;
        this.particleCanvas.height = rect.height;
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
        this.timerCard.classList.add('active');
        
        // Start particle animation for work sessions
        if (this.currentSession === 'work') {
            this.startParticleAnimation();
        }

        this.intervalId = setInterval(() => this.tick(), 1000);
        this.updateTimerStatus();
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timerCard.classList.remove('active');

        clearInterval(this.intervalId);
        this.stopParticleAnimation();
        this.updateTimerStatus();
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
        this.timerCard.classList.remove('active');
        this.stopParticleAnimation();
        this.updateTimerStatus();
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
        this.timerCard.classList.remove('active');
        this.stopParticleAnimation();
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
        const progress = (this.totalDuration - this.timeRemaining) / this.totalDuration;
        const circumference = 2 * Math.PI * 90; // r=90
        const offset = circumference * (1 - progress);
        
        if (this.progressCircle) {
            this.progressCircle.style.strokeDashoffset = offset;
        }
        
        // Update gradient colors based on progress
        this.updateProgressColor(progress);
    }
    
    updateProgressColor(progress) {
        if (!this.gradientStart || !this.gradientEnd) return;
        
        // Blue (0%) -> Yellow (50%) -> Red (100%)
        let startColor, endColor;
        
        if (progress < 0.5) {
            // Blue to Yellow transition
            const localProgress = progress * 2; // 0 to 1
            startColor = this.interpolateColor('#3498db', '#f39c12', localProgress);
            endColor = this.interpolateColor('#2980b9', '#e67e22', localProgress);
        } else {
            // Yellow to Red transition
            const localProgress = (progress - 0.5) * 2; // 0 to 1
            startColor = this.interpolateColor('#f39c12', '#e74c3c', localProgress);
            endColor = this.interpolateColor('#e67e22', '#c0392b', localProgress);
        }
        
        this.gradientStart.style.stopColor = startColor;
        this.gradientEnd.style.stopColor = endColor;
    }
    
    interpolateColor(color1, color2, factor) {
        // Parse hex colors
        const c1 = {
            r: parseInt(color1.slice(1, 3), 16),
            g: parseInt(color1.slice(3, 5), 16),
            b: parseInt(color1.slice(5, 7), 16)
        };
        const c2 = {
            r: parseInt(color2.slice(1, 3), 16),
            g: parseInt(color2.slice(3, 5), 16),
            b: parseInt(color2.slice(5, 7), 16)
        };
        
        // Interpolate
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    updateTimerStatus() {
        if (!this.timerStatus) return;
        
        if (this.isRunning && !this.isPaused) {
            const statusTexts = {
                work: '🎯 Focus time',
                short_break: '☕ Take a break',
                long_break: '🌟 Long break'
            };
            this.timerStatus.textContent = statusTexts[this.currentSession];
        } else if (this.isPaused) {
            this.timerStatus.textContent = '⏸ Paused';
        } else {
            this.timerStatus.textContent = '▶ Ready to start';
        }
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

    // Particle Animation System
    startParticleAnimation() {
        if (!this.particleCtx) return;
        
        this.particles = [];
        // Create initial particles
        for (let i = 0; i < 30; i++) {
            this.particles.push(this.createParticle());
        }
        
        this.animateParticles();
    }
    
    stopParticleAnimation() {
        if (this.particleAnimationId) {
            cancelAnimationFrame(this.particleAnimationId);
            this.particleAnimationId = null;
        }
        
        // Clear canvas
        if (this.particleCtx) {
            this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        }
        
        this.particles = [];
    }
    
    createParticle() {
        return {
            x: Math.random() * this.particleCanvas.width,
            y: Math.random() * this.particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.3,
            color: `rgba(52, 152, 219, ${Math.random() * 0.5 + 0.3})`
        };
    }
    
    animateParticles() {
        if (!this.isRunning || this.isPaused || !this.particleCtx) {
            return;
        }
        
        const ctx = this.particleCtx;
        const width = this.particleCanvas.width;
        const height = this.particleCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = width;
            if (particle.x > width) particle.x = 0;
            if (particle.y < 0) particle.y = height;
            if (particle.y > height) particle.y = 0;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.opacity;
            ctx.fill();
        });
        
        ctx.globalAlpha = 1;
        
        // Draw connections between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 80) {
                    ctx.beginPath();
                    ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    ctx.strokeStyle = `rgba(52, 152, 219, ${0.2 * (1 - distance / 80)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        this.particleAnimationId = requestAnimationFrame(() => this.animateParticles());
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
