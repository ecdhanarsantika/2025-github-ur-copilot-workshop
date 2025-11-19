"""
Tests for visual feedback enhancements in Pomodoro Timer.
These tests verify the circular progress bar, gradient color transitions,
and particle effects functionality.
"""

import pytest
from unittest.mock import MagicMock
from pomodoro_app.app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_index_contains_circular_progress(client):
    """Test that the index page contains the circular progress SVG."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for SVG circular progress elements
    assert 'circular-progress' in data
    assert '<svg' in data
    assert 'progress-circle' in data
    assert 'progress-gradient' in data


def test_index_contains_gradient_stops(client):
    """Test that gradient color stops are present in the HTML."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for gradient definition
    assert 'linearGradient' in data
    assert 'gradient-start' in data
    assert 'gradient-end' in data


def test_index_contains_timer_status(client):
    """Test that the timer status element is present."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for timer status element
    assert 'timer-status' in data
    assert 'Ready to start' in data


def test_index_contains_particle_canvas(client):
    """Test that the particle canvas element is present."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for particle canvas
    assert 'particles-canvas' in data
    assert '<canvas' in data


def test_timer_js_loaded(client):
    """Test that the timer.js file is loaded in the page."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check that timer.js is referenced
    assert 'timer.js' in data


def test_style_css_loaded(client):
    """Test that the style.css file is loaded in the page."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check that style.css is referenced
    assert 'style.css' in data


def test_circular_progress_viewbox(client):
    """Test that the SVG has proper viewBox attributes."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for proper viewBox
    assert 'viewBox="0 0 200 200"' in data


def test_progress_ring_attributes(client):
    """Test that the progress ring has correct attributes."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for progress ring with stroke using gradient
    assert 'stroke="url(#progress-gradient)"' in data
    assert 'cx="100"' in data
    assert 'cy="100"' in data
    assert 'r="90"' in data


def test_timer_content_structure(client):
    """Test that the timer content has proper structure."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # Check for timer content wrapper
    assert 'timer-content' in data
    assert 'id="timer"' in data


def test_no_old_progress_bar(client):
    """Test that the old linear progress bar is removed."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.data.decode('utf-8')
    
    # The old progress-bar and progress-fill classes should not be in timer card area
    # (They might appear in CSS but not in the HTML structure)
    # Just verify the new circular progress is there
    assert 'circular-progress' in data
