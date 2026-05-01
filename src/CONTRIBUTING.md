# Contributing to PulseHR

Thank you for considering contributing to PulseHR! Here's how to get started.

## Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/pulsehr.git
cd pulsehr

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Start development server
npm run dev
```

## Code Standards

### Git Commit Messages
```
type(scope): description

feat(attendance): add geofence validation
fix(chat): resolve message sync issue
docs(readme): update installation steps
test(chat): add message component tests
refactor(performance): optimize bundle size
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`

### Code Style
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Testing
```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Follow code standards
   - Add/update tests
   - Update documentation
   - Run linter & formatter

3. **Commit Changes**
   ```bash
   git commit -m "feat(scope): description"
   ```

4. **Push to Remote**
   ```bash
   git push origin feature/my-feature
   ```

5. **Create Pull Request**
   - Clear description
   - Link related issues
   - Request reviewers
   - Add PR labels

6. **Code Review**
   - Address feedback
   - Re-request review
   - Merge when approved

## Project Structure

```
pulsehr/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities & hooks
│   ├── entities/          # Data schemas
│   ├── functions/         # Backend functions
│   ├── tests/             # Test files
│   └── App.jsx            # Root component
├── docs/                  # Documentation
├── public/                # Static assets
└── package.json
```

## Component Guidelines

### Naming
- Components: PascalCase (`ChatWindow.jsx`)
- Utilities: camelCase (`useFormValidation.js`)
- Constants: UPPER_CASE (`CHART_COLORS`)

### Structure
```jsx
/**
 * Component description
 * Features: ...
 */
import { dependencies } from '@/...';

export default function ComponentName({ prop1, prop2 }) {
  // Logic
  const [state, setState] = useState(null);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleAction = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## Testing Guidelines

### Unit Tests
```js
describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});
```

### Test Coverage
- Components: >80% coverage
- Utils: >90% coverage
- Critical paths: 100%

## Documentation

- **Code Comments:** Why, not what
- **Functions:** JSDoc format
- **Components:** Prop documentation
- **README:** Keep updated

## Issues & Discussions

- Check existing issues first
- Use clear titles & descriptions
- Provide reproduction steps
- Label appropriately

## Code Review Checklist

- [ ] Tests passing
- [ ] Code style consistent
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security best practices
- [ ] Mobile responsive

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release PR
4. Tag release in Git
5. Deploy to production

## Questions?

- **Docs:** [Full Documentation](./docs)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/pulsehr/discussions)
- **Email:** dev@pulsehr.app

---

**Thank you for contributing! 🚀**