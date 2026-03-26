# Husky Configuration Guide

**Last Updated**: 2026-03-27  
**Status**: ✅ Configured and Working

---

## Overview

Husky is configured to run pre-commit checks using pnpm. The hook automatically validates TypeScript compilation before allowing commits.

## Configuration

### Pre-commit Hook
**Location**: `.husky/pre-commit`

**What it does**:
1. Runs TypeScript compilation check (`pnpm exec tsc --noEmit`)
2. Reports status with clear messages
3. Lists staged TypeScript files
4. Blocks commits if TypeScript errors are found

**Output example**:
```
🔍 Running pre-commit checks...
  → TypeScript compilation...
  ✓ TypeScript clean
  → Checking staged TypeScript files...
  backend/src/routes/api.ts
✅ Pre-commit checks passed!
```

## Usage

### Normal Commit (with checks)
```bash
git add .
git commit -m "feat: Add new feature"
# Pre-commit hooks run automatically
```

### Skip Hooks (if needed)
```bash
SKIP_HUSKY=1 git commit -m "feat: Add new feature"
```

## Why This Configuration?

### Simplicity
- **TypeScript compilation** is the most critical check
- Catches type errors before they reach the repo
- Fast (typically < 5 seconds)

### Not Included (and why)
- **ESLint**: Not installed in root directory, would require complex setup
- **Prettier**: Code formatting is nice to have but not critical
- **Tests**: Running all tests on every commit is too slow

### Alternative Approaches Considered
1. **lint-staged in root**: Rejected (ESLint/Prettier not in root)
2. **Separate hooks per directory**: Rejected (too complex)
3. **Full test suite**: Rejected (too slow for pre-commit)

## Testing

### Verify Hook is Working
```bash
# 1. Check hook exists
ls -la .husky/pre-commit

# 2. View hook content
cat .husky/pre-commit

# 3. Test with a commit
git add .
git commit -m "test: Verify husky"
# Should see: ✅ Pre-commit checks passed!
```

### Troubleshooting

**Problem**: Hook doesn't run
```bash
# Solution: Verify permissions
chmod +x .husky/pre-commit
```

**Problem**: TypeScript errors but hook passes
```bash
# Solution: Manually run check
cd backend && pnpm exec tsc --noEmit
```

**Problem**: Hook is too slow
```bash
# Solution: Skip temporarily
SKIP_HUSKY=1 git commit -m "message"
```

## Future Improvements

Possible enhancements:
1. Add frontend TypeScript checks
2. Add ESLint for specific file patterns
3. Add fast unit tests for changed files
4. Add branch name validation
5. Add commit message linting

## Related Files

- `.husky/pre-commit` - Hook script
- `.husky/_/husky.sh` - Deprecated (will fail in v10)
- `package.json` - Husky installation
- `backend/tsconfig.json` - TypeScript config

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

**Maintainer**: IoTDB Enhanced Team  
**Last Modified**: 2026-03-27
