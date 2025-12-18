# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of mitosis-plugins seriously. If you discover a security vulnerability, please follow these steps:

### Do NOT report security vulnerabilities in public issues

Please do not file a public issue on GitHub for security vulnerabilities. This includes:
- Bug reports describing the vulnerability
- Pull requests that fix security issues
- Comments on existing issues that reveal security problems

### Private Reporting Process

1. **Email**: Send a detailed report to svallory@me.com with the subject line: "Security Vulnerability - mitosis-plugins"

2. **What to include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Possible remediation (if known)
   - Your contact information for follow-up

3. **Response Time**:
   - Initial acknowledgment within 48 hours
   - Detailed response within 5 business days
   - Regular updates as the issue is addressed

### What Happens Next

1. **Verification**: We'll verify the vulnerability and assess its severity
2. **Fix Development**: We'll develop a fix for the vulnerability
3. **Testing**: We'll thoroughly test the fix
4. **Release**: We'll prepare a security release
5. **Coordination**: We may request a coordinated disclosure with you

## Security Best Practices for Users

### For Plugin Developers

- Always validate and sanitize inputs from user-provided configuration
- Be cautious when executing code from configuration (eval, exec, etc.)
- Follow the principle of least privilege
- Keep dependencies up to date

### For Users of mitosis-plugins

- Keep mitosis-plugins updated to the latest version
- Review plugin configuration for security implications
- Only use plugins from trusted sources
- Monitor your build output for unexpected changes

## Known Security Considerations

### Code Generation

mitosis-plugins modifies code during the build process. This means:
- Plugin configuration can affect generated code security
- Malicious configuration could inject unsafe code
- Always review plugin sources before use

### Dependency Management

- Plugins may require additional dependencies
- These dependencies need to be secured separately
- Use lockfiles (package-lock.json, yarn.lock, bun.lock) to ensure consistent versions

## Vulnerability Disclosure for Maintainers

If you're a maintainer handling security reports:

1. **Triage**: Assess severity using CVSS v3.0
2. **Fix**: Develop and test patches privately
3. **Prepare Release**: Create security releases for supported versions
4. **Coordinate**: Work with reporters on disclosure timing
5. **Announce**: Publish security advisory after fix is released

## Security Update Release Process

1. **Development**: Fix developed in private branch
2. **Review**: Security fix reviewed by multiple maintainers
3. **Pre-release Testing**: Test with real projects when possible
4. **Release**:
   - Tag release with security fix
   - Mark as security update in release notes
   - Update changelog
5. **Notification**: Notify users via:
   - GitHub Security Advisory
   - Release notes
   - Email list (if available)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web application security risks
- [Snyk Security](https://snyk.io/) - Vulnerability scanner
- [npm Security](https://docs.npmjs.com/getting-started/keeping-your-dependencies-secure) - npm security best practices

## Contact

- Security issues: svallory@me.com
- General questions: Use GitHub Discussions
- Bug reports (non-security): GitHub Issues

Thank you for helping keep mitosis-plugins and our users safe!
