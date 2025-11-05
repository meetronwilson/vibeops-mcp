# Contributing to VibeOps MCP Server

Thank you for your interest in contributing to VibeOps MCP Server!

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Claude Code (for testing)

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/vibeops.git
cd vibeops/vibeops
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Start development mode**

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Project Structure

```
vibeops/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # Tool implementations
│   │   ├── read.ts           # READ operations
│   │   ├── create.ts         # CREATE operations
│   │   ├── update.ts         # UPDATE operations
│   │   ├── delete.ts         # DELETE operations
│   │   ├── parse.ts          # Smart import/parse
│   │   ├── implementation.ts # Code tracking
│   │   └── queries.ts        # Enhanced queries
│   ├── lib/                  # Core libraries
│   │   ├── file-manager.ts   # File I/O
│   │   └── id-generator.ts   # ID generation
│   └── types/                # TypeScript types
│       └── contracts.ts      # Contract interfaces
├── build/                    # Compiled JavaScript
└── package.json
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/vibeops/vibeops/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version, Claude Code version)
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been suggested in [Issues](https://github.com/vibeops/vibeops/issues)
2. Create a new issue with:
   - Clear use case
   - Proposed API/interface
   - Why this would be valuable
   - Any implementation ideas

### Submitting Changes

1. **Create a branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

2. **Make your changes**

- Follow the existing code style
- Add TypeScript types for new code
- Keep functions small and focused
- Update documentation as needed

3. **Test your changes**

- Build successfully: `npm run build`
- Test manually with Claude Code
- Ensure no TypeScript errors

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add new feature description"
# or
git commit -m "fix: bug description"
```

Use conventional commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

5. **Push and create PR**

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots/examples if applicable

## Code Style

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and returns
- Use interfaces for object shapes
- Avoid `any` - use `unknown` if type is truly unknown

### Naming Conventions

- Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

### Example

```typescript
// Good
export interface CreateModuleInput {
  name: string;
  description: string;
  type: 'theme' | 'initiative';
}

export function createModule(input: CreateModuleInput): Module {
  const id = generateNextId('module');
  // ...
}

// Avoid
function createmodule(data: any) {
  // ...
}
```

## Adding New Tools

When adding a new MCP tool:

1. **Implement the function** in appropriate file in `src/tools/`

```typescript
export function myNewTool(input: MyInput): MyOutput {
  // Implementation
  return result;
}
```

2. **Add type definitions** in `src/types/contracts.ts` if needed

3. **Register the tool** in `src/index.ts`:

```typescript
// In ListToolsRequestSchema handler
{
  name: 'my_new_tool',
  description: 'Clear description of what this does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' },
    },
    required: ['param1'],
  },
}

// In CallToolRequestSchema handler
case 'my_new_tool': {
  const { param1 } = args;
  const result = myNewTool({ param1 });
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
```

4. **Update documentation**:
   - Add to README.md tool list
   - Add example to WORKFLOW.md
   - Update CHANGELOG.md

## Testing

### Manual Testing

1. Build the project: `npm run build`

2. Configure Claude Code to use local build:

```json
{
  "mcpServers": {
    "vibeops": {
      "command": "node",
      "args": ["/path/to/your/vibeops/build/index.js"],
      "cwd": "/path/to/test/project"
    }
  }
}
```

3. Restart Claude Code

4. Test your changes through conversation

### Test Cases

When testing new features, verify:
- Happy path works correctly
- Edge cases handled gracefully
- Error messages are helpful
- TypeScript types are correct
- Documentation is accurate

## Documentation

### Code Comments

- Add JSDoc comments for public functions
- Explain "why" not "what"
- Document assumptions and edge cases

```typescript
/**
 * Creates a new module with auto-generated ID and timestamps.
 *
 * Automatically generates a sequential module ID (MOD-####) by
 * scanning all existing modules for the highest ID.
 *
 * @param input - Module creation parameters
 * @returns The created module contract
 * @throws Error if module with same name exists
 */
export function createModule(input: CreateModuleInput): Module {
  // ...
}
```

### User Documentation

When adding features, update:
- **README.md** - Feature list, quick examples
- **WORKFLOW.md** - Detailed usage examples
- **CHANGELOG.md** - Version history entry

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Commit: `git commit -m "chore: release v1.1.0"`
4. Tag: `git tag v1.1.0`
5. Push: `git push origin main --tags`
6. Publish: `npm publish`

## Questions?

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
