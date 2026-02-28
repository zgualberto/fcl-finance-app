# FCL Finance App

A comprehensive financial management application designed for faith communities and churches.

**FCL Finance** helps organizations track collections, manage expenses, maintain member records, and generate financial reports—all with offline-first functionality and secure local data storage.

## Features

- **Weekly Collections Tracking**: Record tithes, offerings, and other weekly giving categories
- **Expense Management**: Log and categorize church expenses with detailed tracking
- **Member Management**: Maintain member information and contribution history
- **Activity Logs**: Comprehensive audit trail of all financial transactions
- **Financial Reports**: Generate and export financial summaries for analysis
- **Offline-First**: Work seamlessly offline and sync when connected
- **Secure Storage**: SQLite database on device with optional backup functionality
- **Multi-Category Support**: Flexible categorization for both collections and expenses

## Technology Stack

- **Framework**: [Quasar](https://quasar.dev/) (Vue 3)
- **Mobile**: [Capacitor](https://capacitorjs.com/) for Android/iOS
- **Database**: SQLite (via @capacitor-community/sqlite)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Build Tool**: Vite
- **Language**: TypeScript

## Minimum Requirements

- **Node.js**: v22 or higher
- **Android**: SDK 24+, targetSDK 36
- **Gradle**: 8.14.3+

## Getting Started

### Installation

```bash
# Install dependencies
yarn install
# or
npm install
```

### Development

```bash
# Web development (hot reload)
yarn dev

# Android development
yarn dev:android

# Sync Capacitor changes to Android
yarn cap:sync:android

# Open Android Studio
yarn cap:open:android
```

### Code Quality

```bash
# Lint files
yarn lint

# Format code
yarn format

# Run linter and formatter
yarn lint && yarn format
```

### Building for Production

```bash
# Build web version
yarn build

# Build Android APK (release)
yarn build:android

# Build Android with Gradle directly
yarn build:android:gradle-release
```

### Project Structure

```
src/
  ├── components/     # Reusable Vue components
  ├── databases/      # SQLite entities and repositories
  ├── enums/          # Type-safe enumerations
  ├── pages/          # Page components
  ├── composables/    # Vue composition utilities
  ├── services/       # Business logic and API calls
  ├── stores/         # Pinia state management
  └── App.vue         # Root component

src-capacitor/       # Capacitor Android/iOS source
  └── android/        # Android project (Gradle)
```

## Android Development

The project uses **Capacitor** to bridge Vue.js code with native Android capabilities.

### Key Scripts

```bash
# Sync web build to Capacitor
yarn cap:sync:android

# Open Android Studio
yarn cap:open:android

# Run on connected device/emulator
yarn cap:run:android

# View live logs
yarn cap:logs:android
```

### Build Configuration

- **Gradle**: `src-capacitor/android/gradle/wrapper/gradle-wrapper.properties`
- **Variables**: `src-capacitor/android/variables.gradle`
- **Signing**: `src-capacitor/android/keystore.properties` (create from `.example`)
- **Package**: `org.capacitor.fcl.finance.app`

### Signing the APK

For release builds:

```bash
# Copy keystore properties template
cp src-capacitor/android/keystore.properties.example src-capacitor/android/keystore.properties

# Edit with your keystore details
nano src-capacitor/android/keystore.properties

# Build signed release APK
yarn build:android
```

## Distribution

### F-Droid Official Repository

This app is prepared for distribution through the official F-Droid repository at https://f-droid.org.

#### Prerequisites ✅

- [x] MIT License file in repository root
- [x] Git tags for releases (e.g., `v1.0.0`)
- [x] F-Droid metadata in `fastlane/metadata/android/en-US/`
- [x] AndroidManifest with correct package name
- [x] Android SDK 24+ (minSdk) and 36 (targetSdk)

#### Metadata

F-Droid uses these files for app store listings:

- **`title.txt`** - App name (max 50 chars)
- **`short_description.txt`** - One-liner summary (max 80 chars)
- **`full_description.txt`** - Detailed description (max 4000 chars)
- **`changelogs/1.txt`** - Version 1 changelog

**Location**: `fastlane/metadata/android/en-US/`

#### Submission Process

For a complete step-by-step guide, see [FDROID_SUBMISSION.md](FDROID_SUBMISSION.md).

**Quick overview**:

1. **Fork** fdroiddata: https://gitlab.com/fdroid/fdroiddata
2. **Create branch**: `org.capacitor.fcl.finance.app`
3. **Add metadata file**: `metadata/org.capacitor.fcl.finance.app.yml`
4. **Verify on CI/CD**: Check GitLab pipeline passes
5. **Create Merge Request** to `fdroid/fdroiddata:master`
6. **Wait for review** (2-4 weeks typically)

#### Metadata Template

For your fdroiddata fork, create `metadata/org.capacitor.fcl.finance.app.yml`:

```yaml
Categories:
  - Finance

License: MIT

AuthorName: Your Name or Organization
AuthorEmail: your.email@example.com

WebSite: https://github.com/yourusername/fcl-finance-app
SourceCode: https://github.com/yourusername/fcl-finance-app
IssueTracker: https://github.com/yourusername/fcl-finance-app/issues
Changelog: https://github.com/yourusername/fcl-finance-app/releases

Builds:
  - versionName: '1.0.0'
    versionCode: 1
    commit: v1.0.0
    sudo: false
    build: yarn install && yarn build:android
    ndk: r21e

AutoUpdateMode: Version
UpdateCheckMode: Tags
```

#### After Approval

Once merged into official F-Droid:

- ✅ F-Droid automatically builds releases from your git tags
- ✅ App appears in F-Droid client and website
- ✅ F-Droid handles signing, hosting, and distribution
- ✅ Users can install and auto-update from F-Droid app

**For future releases**: Simply push new version tags to your GitHub repository, then update the metadata in fdroiddata with the new version.

## Version Management

Maintain consistency across your builds:

- **Android** (`src-capacitor/android/app/build.gradle`):

  ```gradle
  versionCode 1
  versionName "1.0.0"
  ```

- **Node** (`package.json`):

  ```json
  "version": "1.0.0"
  ```

- **Git** (tags):
  ```bash
  git tag -a v1.0.0 -m "Release v1.0.0"
  ```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Contributing

Contributions are welcome! This is an open-source project built for faith communities.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to your branch (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (run `yarn format` before committing)
- Add/update tests for new features
- Update documentation as needed
- Keep commits atomic and meaningful

## License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

The MIT License allows:

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

Requires:

- ⚠️ License and copyright notice

## Support

- **Issues**: Report bugs on [GitHub Issues](https://github.com/ziegfrid/fcl-finance-app/issues)
- **Discussions**: Start a discussion on [GitHub Discussions](https://github.com/ziegfrid/fcl-finance-app/discussions)
- **Documentation**: See [FDROID_SUBMISSION.md](FDROID_SUBMISSION.md) for distribution info

## Roadmap

- [ ] Advanced reporting and analytics

## Authors

- **Ziegfrid Gualberto** - Initial development

## Acknowledgments

- [Quasar Framework](https://quasar.dev/) - Excellent Vue.js framework
- [Capacitor](https://capacitorjs.com/) - Mobile cross-platform bridge
- [F-Droid](https://f-droid.org/) - Open-source app distribution
- Faith communities everywhere using this app

---

**Last Updated**: February 28, 2026 | **Version**: 1.0.0
