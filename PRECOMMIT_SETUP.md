# Pre-commit Hooks Setup for PulseHR

This document describes how to enable and configure pre-commit hooks for both frontend and backend development.

## Prerequisites

Ensure you have the following installed:
- Python 3.11+
- Node.js 18+ (for frontend ESLint)
- Git

## Quick Setup (All Components)

```bash
# Navigate to project root
cd C:\Users\shedd\Desktop\webApp

# Install pre-commit
pip install pre-commit

# Install git hooks (root level)
pre-commit install

# Update hooks to latest versions
pre-commit autoupdate
```

## Backend Only Setup

```bash
cd backend
pre-commit install
```

## Frontend Only Setup

```bash
cd frontend
npx husky install
```

## Available Hooks

### Root/Frontend Config (`.pre-commit-config.yaml`)

| Hook | Purpose |
|------|---------|
| `trailing-whitespace` | Removes trailing whitespace |
| `end-of-file-fixer` | Ensures files end with newline |
| `check-yaml` | Validates YAML syntax |
| `check-added-large-files` | Prevents large file commits |
| `check-merge-conflict` | Detects merge conflict markers |
| `debug-statements` | Catches debug statements |
| `black` | Python code formatter |
| `isort` | Python import sorter |
| `eslint` | JavaScript/TypeScript linter |

### Backend Config (`backend/.pre-commit-config.yaml`)

| Hook | Purpose |
|------|---------|
| `trailing-whitespace` | Removes trailing whitespace |
| `end-of-file-fixer` | Ensures files end with newline |
| `check-yaml` | Validates YAML syntax |
| `check-added-large-files` | Prevents large file commits |
| `check-merge-conflict` | Detects merge conflict markers |
| `black` | Python code formatter |
| `isort` | Python import sorter |
| `flake8` | Python linting |

## Running Hooks Manually

```bash
# Run all hooks on staged files
pre-commit run

# Run specific hook
pre-commit run black

# Run on all files (not just staged)
pre-commit run --all-files
```

## Skipping Hooks

To skip pre-commit hooks for a specific commit:

```bash
git commit --no-verify -m "Your commit message"
```

## Troubleshooting

### Hooks not running
```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install
```

### Update to latest hook versions
```bash
pre-commit autoupdate
```

### Clean cached environments
```bash
pre-commit clean
```
