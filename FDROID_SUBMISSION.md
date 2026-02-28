# F-Droid Submission Guide

This document outlines the steps to submit FCL Finance App to the official F-Droid repository.

## Current Status

✅ **Preparation Complete**:

- App metadata configured in `fastlane/metadata/android/en-US/`
- Android build verified (`yarn build:android`)
- Source code on GitHub ready for submission
- Version tracking aligned (versionCode: 1, versionName: 1.0)

## Step-by-Step Submission Process

### 1. Set License in Your Repository

Ensure your project has a LICENSE file. Add one if missing:

```bash
# Common open-source licenses for apps:
# GPL-3.0 (copyleft) - good for community projects
# MIT (permissive) - simpler alternative
# Apache-2.0 (permissive with patent protection)

# Example: Copy a GPL-3.0 license to your repo root
```

### 2. Create Release Tag

Tag your current code on GitHub:

```bash
git tag -a v1.0.0 -m "Release v1.0.0 - Initial FCL Finance App release"
git push origin v1.0.0
```

### 3. Verify Build from Source

F-Droid builds from your source code tag. Ensure the build command works:

```bash
# Navigate to your repo root
yarn install
yarn build:android

# Check that APK was created at:
# src-capacitor/android/app/build/outputs/apk/release/app-release.apk
```

### 4. Fork F-Droid Metadata Repository

1. Go to https://gitlab.com/fdroid/fdroiddata
2. Fork the repository to your GitLab account
3. Clone your fork locally:
   ```bash
   git clone https://gitlab.com/yourusername/fdroiddata.git
   cd fdroiddata
   ```

### 5. Add App Metadata

Create file: `metadata/org.capacitor.fcl.finance.app.yml`

```yaml
Categories:
  - Finance

License: GPL-3.0-only

AuthorName: Your Name
AuthorEmail: your.email@example.com

WebSite: https://github.com/yourusername/fcl-finance-app
SourceCode: https://github.com/yourusername/fcl-finance-app
IssueTracker: https://github.com/yourusername/fcl-finance-app/issues
Changelog: https://github.com/yourusername/fcl-finance-app/releases

# This tells F-Droid how to build your app
Builds:
  - versionName: '1.0.0'
    versionCode: 1
    commit: v1.0.0
    sudo: false
    build: yarn install && yarn build:android
    ndk: r21e
```

### 6. Commit and Push Metadata

```bash
cd fdroiddata
git add metadata/org.capacitor.fcl.finance.app.yml
git commit -m "Add FCL Finance App"
git push origin master
```

### 7. Create Merge Request

1. Go to your fork on GitLab
2. Click "New merge request"
3. Set:
   - Source branch: `master` (your fork)
   - Target branch: `master` (fdroid/fdroiddata)
4. Fill in title: "Add FCL Finance App"
5. Fill in description with app details and GitHub link
6. Submit the merge request

### 8. Wait for Review

F-Droid maintainers will:

- ✅ Review your metadata
- ✅ Build your app from source
- ✅ Verify it matches the source code
- ✅ Check for privacy and security issues
- ⏱️ Timeline: typically 2-4 weeks

## After Approval

Once approved:

1. Your app appears in the official F-Droid client
2. Users can install from F-Droid app
3. For future releases:
   - Create new version tags: `git tag -a v1.0.1 -m "..."`
   - Push to GitHub: `git push origin v1.0.1`
   - Update fdroiddata metadata with new version
   - Create new MR with updated metadata

## Helpful Resources

- **F-Droid Metadata Format**: https://f-droid.org/en/docs/Build_Metadata_Reference/
- **App Submission Guide**: https://f-droid.org/en/docs/Submitting_Apps/
- **Build Server Issues**: https://f-droid.org/en/docs/Build_Server_Setup/
- **NDK Selection Guide**: https://f-droid.org/en/docs/Recommended_Applications/

## Common Issues & Solutions

**Build fails with gradle errors**:

- Ensure `src-capacitor/android/` has `gradle.properties` with correct SDK paths
- Check `versionCode` and `versionName` in `src-capacitor/android/app/build.gradle`

**F-Droid can't find source**:

- Verify GitHub repo is public
- Check that commit hash matches the tag

**App didn't update after new release**:

- Update fdroiddata with new versionCode/versionName
- Push new tag to GitHub
- Create new MR in fdroiddata

## Questions?

- Post in F-Droid forums: https://forum.f-droid.org/
- Check existing issues: https://gitlab.com/fdroid/fdroiddata/-/issues
- Email: team@f-droid.org
