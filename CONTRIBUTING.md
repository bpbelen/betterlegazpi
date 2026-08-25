# Contributing to BetterLegazpi.org

Thank you for your interest in contributing to BetterLegazpi.org! This civic-tech project thrives on community participation. Whether you're a developer, designer, translator, or a concerned citizen of Legazpi City, your contributions are welcome.

This repository is a static HTML/CSS/JS site — no build framework, no bundler. It began as a fork of [BetterSolano.org](https://github.com/BetterSolano/bettersolano), retrofitted for LGU Legazpi City, Albay.

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- Python 3 (for local development server)
- Git

### Setup

```bash
git clone https://github.com/bpbelen/betterlegazpi.git
cd betterlegazpi
npm install
npm run dev
```

Open http://localhost:8000 in your browser.

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/bpbelen/betterlegazpi/issues) to avoid duplicates
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and device information
   - Screenshots if applicable

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its benefit to users
3. Include mockups or examples if possible

### Submitting Code

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make** your changes
4. **Test** on multiple browsers (Chrome, Firefox, Safari, Edge)
5. **Commit** with a descriptive message
   ```bash
   git commit -m "Add: brief description of changes"
   ```
6. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open** a Pull Request

### Commit Message Format

```
Type: Brief description

Types:
- Add: New feature or content
- Fix: Bug fix
- Update: Changes to existing feature
- Remove: Removed feature or content
- Docs: Documentation changes
- Style: CSS/formatting changes (no logic change)
- Refactor: Code restructuring
```

## Contribution Areas

| Area               | Description                          |
| ------------------ | ------------------------------------- |
| Bug Fixes          | Fix reported issues                  |
| Features           | Implement new functionality          |
| Content            | Update municipal service information |
| Translations       | Help build out planned English/Filipino/Bicol support |
| Design             | Improve UI/UX and accessibility      |
| Data               | Verify and update statistics         |
| Documentation      | Improve guides and comments          |
| Data Visualization | Enhance charts and graphs            |

## Code Guidelines

### HTML

- Use semantic HTML5 elements
- Include proper ARIA labels for accessibility
- Validate HTML before submitting

### CSS

- Follow existing naming conventions
- Use CSS custom properties (variables)
- Ensure responsive design
- Test on mobile devices

### JavaScript

- Keep vanilla JS (no frameworks unless approved)
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid global variables

### Accessibility

- Maintain WCAG 2.1 compliance
- Include alt text for images
- Ensure keyboard navigation works
- Test with screen readers if possible

### Data Accuracy

- Only use data from official government sources
- Include source attribution
- Verify information before submitting
- Do not include unverified or speculative data

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Update documentation if needed
3. Test thoroughly before submitting
4. Fill out the PR template completely
5. Link related issues
6. Wait for review and address feedback

## Review Criteria

Pull requests are reviewed for:

- Code quality and style consistency
- Functionality and bug-free operation
- Accessibility compliance
- Mobile responsiveness
- Data accuracy (for content changes)
- Security considerations

## Community

Questions or discussion happen on [GitHub Issues](https://github.com/bpbelen/betterlegazpi/issues) — feel free to open one.

## Recognition

All contributors are recognized in our repository. Significant contributions may be highlighted on the website.

---

Thank you for helping make government information accessible to the people of Legazpi City.
