[CmdletBinding()]
param(
    [string]$Owner = $(if ($env:SLIDECATCH_GITHUB_OWNER) { $env:SLIDECATCH_GITHUB_OWNER } else { 'shuaij864-web' }),
    [string]$Repository = $(if ($env:SLIDECATCH_GITHUB_REPO) { $env:SLIDECATCH_GITHUB_REPO } else { 'slidecatch' }),
    [ValidateSet('public', 'private', 'internal')]
    [string]$Visibility = $(if ($env:SLIDECATCH_GITHUB_VISIBILITY) { $env:SLIDECATCH_GITHUB_VISIBILITY } else { 'public' }),
    [string]$Tag = $(if ($env:SLIDECATCH_GITHUB_TAG) { $env:SLIDECATCH_GITHUB_TAG } else { 'v0.1.0' })
)

$ErrorActionPreference = 'Stop'
$full = "$Owner/$Repository"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git is required.' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'GitHub CLI (gh) is required.' }
if (-not (Test-Path .git)) { throw 'Run this script from the SlideCatch repository root.' }

gh auth status | Out-Null
npm run check

if (git status --porcelain) { throw 'Refusing to publish a dirty working tree. Commit or discard changes first.' }
if ((git rev-parse --abbrev-ref HEAD).Trim() -ne 'main') { throw 'The publish script must run from the main branch.' }
& git rev-parse --verify "$Tag^{commit}" *> $null
if ($LASTEXITCODE -ne 0) { throw "Tag $Tag does not exist." }

& gh repo view $full *> $null
if ($LASTEXITCODE -ne 0) {
    & gh repo create $full "--$Visibility" --description 'Privacy-first Chrome extension for collecting web slide images already loaded in the browser.' --source . --remote origin
} else {
    & git remote get-url origin *> $null
    if ($LASTEXITCODE -ne 0) {
        git remote add origin "https://github.com/$full.git"
    } else {
        git remote set-url origin "https://github.com/$full.git"
    }
}

git push -u origin main
& git rev-parse $Tag *> $null
if ($LASTEXITCODE -eq 0) { git push origin $Tag }

$archive = Join-Path release "slidecatch-$Tag.zip"
if (Test-Path $archive) {
    $sourceArchive = Join-Path release "slidecatch-$Tag-source.zip"
    $bundle = Join-Path release "slidecatch-$Tag.git.bundle"
    $validation = Join-Path release 'validation-report.md'
    git archive --format=zip "--prefix=slidecatch-$Tag/" -o $sourceArchive $Tag
    git bundle create $bundle --all
    git bundle verify $bundle
    Copy-Item VALIDATION_REPORT.md $validation -Force

    $assets = @($archive, $sourceArchive, $bundle, $validation)
    $sumPath = Join-Path release 'SHA256SUMS.txt'
    $lines = foreach ($asset in $assets) {
        $hash = (Get-FileHash -Algorithm SHA256 $asset).Hash.ToLowerInvariant()
        "$hash  $(Split-Path $asset -Leaf)"
    }
    $lines | Set-Content -Encoding ascii $sumPath
    $assets += $sumPath

    & gh release view $Tag --repo $full *> $null
    if ($LASTEXITCODE -eq 0) {
        gh release upload $Tag @assets --clobber --repo $full
    } else {
        gh release create $Tag @assets --repo $full --verify-tag --generate-notes --title "SlideCatch $Tag"
    }
}

Write-Host "Published: https://github.com/$full"
