# IoTDB Enhanced - Scripts

**Version**: 1.0.0
**Last Updated**: 2026-03-27

---

## Core Scripts

### Root Level Scripts

| Script | Purpose | Usage | Status |
|--------|---------|-------|--------|
| `start.sh` | Start all services | `./start.sh` | Required |
| `stop.sh` | Stop all services | `./stop.sh` | Required |
| `check.sh` | Health check | `./check.sh` | Required |

---

## Operations Scripts

### Location: `scripts/`

#### Database & Data

| Script | Purpose | Usage |
|--------|---------|-------|
| `auto-backup.sh` | Automated database backup | `scripts/auto-backup.sh` |
| `seed-data.sh` | Seed initial data | `scripts/seed-data.sh` |

#### System Setup

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-env.sh` | Environment configuration | `scripts/setup-env.sh` |
| `user-management.sh` | User administration | `scripts/user-management.sh` |

#### AI Node Management

| Script | Purpose | Usage |
|--------|---------|-------|
| `start-ainode.sh` | Start AI Node service | `scripts/start-ainode.sh` |
| `stop-ainode.sh` | Stop AI Node service | `scripts/stop-ainode.sh` |

#### Health & Monitoring

| Script | Purpose | Usage |
|--------|---------|-------|
| `health-check.sh` | System health verification | `scripts/health-check.sh` |

---

## Systemd Service Scripts

### Location: `scripts/systemd/`

| Script | Purpose | Usage |
|--------|---------|-------|
| `start-all-services.sh` | Start all systemd services | `scripts/systemd/start-all-services.sh` |
| `stop-all-services.sh` | Stop all systemd services | `scripts/systemd/stop-all-services.sh` |
| `check-services.sh` | Check systemd service status | `scripts/systemd/check-services.sh` |

---

## Usage Examples

### Starting Services

**Development (PM2)**:
```bash
./start.sh
./check.sh
```

**Production (Systemd)**:
```bash
./scripts/systemd/start-all-services.sh
./scripts/systemd/check-services.sh
```

### Stopping Services

**Development (PM2)**:
```bash
./stop.sh
```

**Production (Systemd)**:
```bash
./scripts/systemd/stop-all-services.sh
```

### Database Operations

```bash
# Automated backup
./scripts/auto-backup.sh

# Health verification
./scripts/health-check.sh
```

### User Management

```bash
# Create admin user
./scripts/user-management.sh create-admin

# Change password
./scripts/user-management.sh change-password
```

---

## Script Standards

### Standard Template

All scripts follow this structure:

```bash
#!/bin/bash

#
# {script-name} - {brief description}
#
# Usage: {script-name} [options] [arguments]
#
# Options:
#   -h, --help     Show help message
#   -v, --verbose  Enable verbose output
#
# Examples:
#   {script-name} --help
#   {script-name} --verbose
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Main function
main() {
    log_info "Starting..."
}

# Help
show_help() {
    grep '^#' "$0" | cut -c4-
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

main "$@"
```

### Error Handling

**Required**:
- `set -euo pipefail`
- Exit codes on errors
- Error logging
- Parameter validation

**Example**:
```bash
# Validate environment variables
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set"
    exit 1
fi

# Check command availability
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL not installed"
    exit 1
fi
```

---

## Maintenance

### Regular Tasks

- Monthly: Verify script functionality
- Quarterly: Remove deprecated scripts
- As needed: Optimize performance, update documentation

### Script Lifecycle

1. **Create** - New script with standard template
2. **Test** - Verify in development environment
3. **Document** - Add to this index
4. **Maintain** - Regular updates and optimization
5. **Deprecate** - Mark as deprecated, remove after 3 months

---

## Statistics

**Current Scripts**: 10 total
- Core: 3 (root level)
- Operations: 4
- Systemd: 3

**Quality Targets**:
- Error handling: 100%
- Documentation: 100%
- Help information: 100%

---

## Getting Help

### Script Issues

1. Run with `--help` flag
2. Check [documentation standards](../DOCUMENTATION-STANDARDS.md)
3. Review script comments

### System Issues

1. Run `./check.sh` for diagnostics
2. Check service logs: `pm2 logs` or `journalctl -u iotdb-backend`
3. Review [deployment checklist](deployment/DEPLOYMENT-CHECKLIST.md)

---

**Maintainer**: DevOps Team
**Last Updated**: 2026-03-27
**Version**: 1.0.0
