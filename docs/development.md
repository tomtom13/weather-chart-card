# Development, releases and HACS previews

## Repository and channels

- Maintained repository: `tomtom13/weather-chart-card`.
- Current development/default branch: `feature/container-space-utilisation`.
- Historical baseline/PR target: `master`; it is not updated automatically when a PR is opened.
- Normal users should install a published stable GitHub Release through HACS. Tags without a full GitHub Release are not equivalent.

HACS downloads the committed distribution; it does not compile source or follow a live checkout. A Git push is not a HASS deployment. Browser clients can retain the old JavaScript until reloaded.

## Per-change workflow

1. Inspect branch/worktree/remotes and preserve unrelated changes. Work on a feature branch and open a PR against the intended base.
2. Exercise the changed behavior in an isolated HASS instance. A second dashboard in the same HASS installation does not isolate JavaScript versions.
3. Run `npm ci` for a clean setup, then `npm run build` (ESLint plus Rollup). Commit the generated `dist/weather-chart-card.js` alongside source changes. Bundled SVG directories under `dist` must also remain available.
4. Review the exact source/distribution diff and verify the effective Git author/committer. Commit explicit owned files and push the branch.
5. Wait for the exact-head build, distribution, dependency-audit and HACS checks. Do not disable or ignore checks to qualify a registry submission.
6. For a stable publication, create a full GitHub Release from the verified commit, with its built distribution asset. For a future preview, publish an explicitly labelled prerelease; HACS users can enable beta versions and choose it through the normal download dialog. Do not assume HACS can select an arbitrary Git branch.
7. In HASS, use **HACS → Weather Chart Card → Update information → Update/Redownload**, choose the intended published version, then accept **Reload**. Refresh other clients/kiosks as well. No Core restart is needed for this frontend card.
8. Verify the rendered daily/hourly cards and any existing renderer at its actual resolution. Retain the served bundle hash/version and visual evidence. Do not restart a shared renderer merely to refresh a screenshot.

`npm start` watches the same Rollup configuration and serves development assets on loopback port 5000. It is an asset server, not a standalone HASS instance, and is not the production installation procedure.

## Earlier no-release preview workflow

Before releases existed, this fork used the GitHub default branch as its preview channel. HACS could download its commit through **Update information → Redownload**. That is why the current default branch is the feature branch. Once Releases exist, use HACS’s version dialog and published prereleases instead of assuming a default-branch change will keep selecting the same content. No private HACS APIs, hidden copy jobs or manual `.storage` edits belong in either workflow.

## Shared-instance boundary and rollback

One HASS installation has one HACS-managed bundle for this custom element. Installing a preview affects all dashboards using it after their browsers reload. Do not load two forks/builds of `weather-chart-card` on the same frontend page.

Use HACS’s normal version selection to redownload an earlier published version and reload clients. This does not require deleting the custom repository or rewriting Git history. Preserve `master` until the PR is accepted; merge only when explicitly authorized. A release from a verified feature commit does not itself merge that branch.

## References

- [HACS versions and manifest](https://hacs.xyz/docs/publish/start/)
- [HACS repository downloads](https://hacs.xyz/docs/use/repositories/dashboard/)
- [HACS custom repositories](https://hacs.xyz/docs/faq/custom_repositories/)
- [HACS default-registry submission requirements](https://hacs.xyz/docs/publish/include/)
