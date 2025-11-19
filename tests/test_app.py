import pytest
from unittest.mock import patch, mock_open
from pomodoro_app.app import (
    validate_session_data,
    format_log_entry,
    append_log_entry,
    parse_log_file,
    aggregate_statistics
)

def test_validate_session_data():
    valid_data = {
        'session_type': 'work',
        'action': 'started',
        'timestamp': '2025-11-19T12:00:00Z'
    }
    invalid_data = {
        'session_type': 'invalid',
        'action': 'started',
        'timestamp': '2025-11-19T12:00:00Z'
    }

    assert validate_session_data(valid_data) == (True, None)
    assert validate_session_data(invalid_data) == (False, "Invalid session_type. Must be one of: ['work', 'short_break', 'long_break']")

def test_format_log_entry():
    data = {
        'session_type': 'work',
        'action': 'started',
        'timestamp': '2025-11-19T12:00:00Z'
    }
    expected = '{"session_type": "work", "action": "started", "timestamp": "2025-11-19T12:00:00Z"}\n'
    assert format_log_entry(data) == expected

def test_append_log_entry():
    data = {
        'session_type': 'work',
        'action': 'started',
        'timestamp': '2025-11-19T12:00:00Z'
    }
    with patch("builtins.open", mock_open()) as mocked_file:
        assert append_log_entry(data) is True
        mocked_file.assert_called_once_with('pomodoro_log.txt', 'a', encoding='utf-8')

def test_parse_log_file():
    mock_log_content = '{"session_type": "work", "action": "started", "timestamp": "2025-11-19T12:00:00Z"}\n'
    with patch("builtins.open", mock_open(read_data=mock_log_content)):
        with patch("os.path.exists", return_value=True):
            entries = parse_log_file()
            assert len(entries) == 1
            assert entries[0]['session_type'] == 'work'

def test_aggregate_statistics():
    entries = [
        {'session_type': 'work', 'action': 'completed'},
        {'session_type': 'short_break', 'action': 'completed'},
        {'session_type': 'work', 'action': 'skipped'}
    ]
    stats = aggregate_statistics(entries)
    assert stats['total_sessions'] == 2
    assert stats['completed_work_sessions'] == 1
    assert stats['completed_break_sessions'] == 1
    assert stats['skipped_sessions'] == 1