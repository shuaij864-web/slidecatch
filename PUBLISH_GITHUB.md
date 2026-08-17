# Publishing this prepared repository to GitHub

The repository is prepared for:

```text
owner: shuaij864-web
repository: slidecatch
branch: main
tag: v0.1.0
license: MIT
```

## Automated publish

### PowerShell

```powershell
./scripts/publish-github.ps1
```

### Bash

```bash
./scripts/publish-github.sh
```

The scripts require the official GitHub CLI (`gh`) to be installed and authenticated. They create the public repository if it does not exist, add/update the `origin` remote, push `main`, push `v0.1.0`, and optionally create a GitHub Release with the extension ZIP and checksums.

## Manual publish without GitHub CLI

1. Create an empty public repository named `slidecatch` in the `shuaij864-web` account. Do not initialize it with a README, license, or `.gitignore`.
2. From this source directory:

```bash
git remote add origin git@github.com:shuaij864-web/slidecatch.git
git push -u origin main
git push origin v0.1.0
```

3. Create a release for tag `v0.1.0` and attach:

```text
release/slidecatch-v0.1.0.zip
release/SHA256SUMS.txt
```

## Restore from the supplied Git bundle

```bash
git clone slidecatch-v0.1.0.git.bundle slidecatch
cd slidecatch
git remote add origin git@github.com:shuaij864-web/slidecatch.git
git push -u origin main
git push origin v0.1.0
```
