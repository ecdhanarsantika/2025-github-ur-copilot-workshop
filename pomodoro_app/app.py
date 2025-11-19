"""
Flask backend for Pomodoro Timer Web Application.
Handles session logging and history retrieval.
"""

from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Log file path
LOG_FILE = 'pomodoro_log.txt'


def validate_session_data(data):
    """
    Validate incoming session data.
    
    Args:
        data: Dictionary containing session data
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not data:
        return False, "No data provided"
    
    required_fields = ['session_type', 'action', 'timestamp']
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    valid_session_types = ['work', 'short_break', 'long_break']
    if data['session_type'] not in valid_session_types:
        return False, f"Invalid session_type. Must be one of: {valid_session_types}"
    
    valid_actions = ['started', 'completed', 'skipped', 'reset']
    if data['action'] not in valid_actions:
        return False, f"Invalid action. Must be one of: {valid_actions}"
    
    return True, None


def format_log_entry(data):
    """
    Format session data into a log entry string.
    
    Args:
        data: Dictionary containing session data
        
    Returns:
        str: Formatted log entry
    """
    return json.dumps(data) + '\n'


def append_log_entry(data):
    """
    Append a log entry to the log file.
    
    Args:
        data: Dictionary containing session data
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        log_entry = format_log_entry(data)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_entry)
        return True
    except Exception as e:
        print(f"Error writing to log file: {e}")
        return False


def parse_log_file():
    """
    Parse the log file and return all entries.
    
    Returns:
        list: List of parsed log entries
    """
    if not os.path.exists(LOG_FILE):
        return []
    
    entries = []
    try:
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entry = json.loads(line)
                        entries.append(entry)
                    except json.JSONDecodeError:
                        # Skip malformed entries
                        continue
    except Exception as e:
        print(f"Error reading log file: {e}")
    
    return entries


def aggregate_statistics(entries):
    """
    Aggregate statistics from log entries.
    
    Args:
        entries: List of log entries
        
    Returns:
        dict: Aggregated statistics
    """
    stats = {
        'total_sessions': 0,
        'completed_work_sessions': 0,
        'completed_break_sessions': 0,
        'skipped_sessions': 0,
        'total_work_time_minutes': 0,
        'total_break_time_minutes': 0,
        'by_type': {
            'work': {'started': 0, 'completed': 0, 'skipped': 0},
            'short_break': {'started': 0, 'completed': 0, 'skipped': 0},
            'long_break': {'started': 0, 'completed': 0, 'skipped': 0}
        }
    }
    
    # Time durations in minutes (standard Pomodoro)
    durations = {
        'work': 25,
        'short_break': 5,
        'long_break': 15
    }
    
    for entry in entries:
        session_type = entry.get('session_type')
        action = entry.get('action')
        
        if session_type in stats['by_type'] and action in stats['by_type'][session_type]:
            stats['by_type'][session_type][action] += 1
        
        if action == 'completed':
            stats['total_sessions'] += 1
            if session_type == 'work':
                stats['completed_work_sessions'] += 1
                stats['total_work_time_minutes'] += durations['work']
            elif session_type in ['short_break', 'long_break']:
                stats['completed_break_sessions'] += 1
                stats['total_break_time_minutes'] += durations[session_type]
        elif action == 'skipped':
            stats['skipped_sessions'] += 1
    
    return stats


@app.route('/')
def index():
    """Serve the main HTML page."""
    return render_template('index.html')


@app.route('/log-session', methods=['POST'])
def log_session():
    """
    Log a session event.
    
    Expected JSON format:
    {
        "session_type": "work|short_break|long_break",
        "action": "started|completed|skipped|reset",
        "timestamp": "ISO 8601 timestamp"
    }
    """
    try:
        data = request.get_json()
        
        # Validate data
        is_valid, error_message = validate_session_data(data)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Append to log
        success = append_log_entry(data)
        if not success:
            return jsonify({'error': 'Failed to write to log file'}), 500
        
        return jsonify({'success': True, 'message': 'Session logged successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/history', methods=['GET'])
def history():
    """
    Retrieve session history and statistics.
    
    Returns:
        JSON response with entries and statistics
    """
    try:
        entries = parse_log_file()
        stats = aggregate_statistics(entries)
        
        return jsonify({
            'entries': entries,
            'statistics': stats,
            'total_entries': len(entries)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
