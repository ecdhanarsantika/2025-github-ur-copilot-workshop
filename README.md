# GitHub Copilot Workshop

This is a sample repository for Github Copilot Workshop in Github Universe Recap 2025, Jakarta, Indonesia.

Using the files in this repository, we are going to create a web application for Pomodoro Technique using Python, JavaScript, HTML, and CSS.

## Installation

We need to have `uv` and `venv` installed for this project.

### uv

`uv` is an extremely fast Python package and project manager, written in Rust. Open  [this link](https://docs.astral.sh/uv/#installation) for the installation information.


### venv

`venv` is a module included with Python (version 3.3 and later) used to create isolated Python virtual environments.

After `uv` is available on your system, install `venv` to create a virtual environment for this work project. Go to the root of your project and run this command:
```bash
uv venv
```

Then, activate virtual environment:
```bash
source .venv/bin/activate
```

Note: to deactivate virtual environment:
```bash
deactivate
```

## Running Unit Tests

To run the unit tests for this project, follow these steps:

1. Ensure that the virtual environment is activated:
   ```bash
   source .venv/bin/activate
   ```

2. Run the tests using `pytest`:
   ```bash
   uv run pytest
   ```

This will execute all the test cases located in the `tests` directory and display the results in the terminal.