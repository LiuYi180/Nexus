# Contributing to Nexus

Thanks for your interest in contributing to Nexus!

## Getting Started

```bash
git clone https://github.com/LiuYi180/Nexus.git
cd Nexus
npm install
npm test
```

## Development

```bash
npm run build       # Compile TypeScript
npm test            # Run tests
npm run test:watch  # Watch mode
```

## Pull Requests

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Ensure `npm test` passes
5. Submit a PR with a clear description

## Code Style

- TypeScript strict mode
- English only (code, comments, docs)
- Meaningful variable names over abbreviations
- Test coverage for new features

## Areas We Need Help With

- Redis-backed pheromone field implementation
- WebSocket transport for distributed nodes
- LLM integration for intelligent task decomposition
- Benchmark suite
- Documentation improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
