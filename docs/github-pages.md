# GitHub Pages (download site)

The download center deploys automatically when `packages/download-site` changes on `main`.

## One-time setup (if 404)

1. Open [Repository Settings → Pages](https://github.com/AmmarJamshed/monillegence-ai/settings/pages)
2. **Build and deployment → Source**: select **GitHub Actions**
3. Re-run the workflow: **Actions → Deploy download site → Run workflow**

Or enable via CLI:

```bash
gh api repos/AmmarJamshed/monillegence-ai/pages -X POST -f build_type=workflow
gh workflow run deploy-download-site.yml -R AmmarJamshed/monillegence-ai
```

## Live URL

https://ammarjamshed.github.io/monillegence-ai/

Propagation can take 1–3 minutes after a successful deploy.
