# Development and HACS previews

## Current channel

- Repository: `tomtom13/weather-chart-card`.
- Active feature and preview branch: `feature/container-space-utilisation`.
- Preserved baseline branch: `master`.
- The preview branch is configured as this fork's GitHub default branch so HACS can download it using its normal GUI. No GitHub Releases are currently published.

HACS is a downloader, not a compiler or a live Git checkout. Pushing JavaScript source alone does not deploy a new card. HACS downloads the committed distribution from the selected repository/version, and existing browser sessions can retain the old JavaScript until reloaded.

The HACS download dialog for this repository currently offers the default branch's commit, not an arbitrary branch picker. Merely creating another branch is not enough to expose it there. There is no need to change HASS files or use private HACS APIs.

## Per-change workflow

1. Work on the active feature branch. Inspect the worktree before switching branches and preserve unrelated work.
2. Exercise the intended behavior in the isolated development environment first when practical.
3. Run `npm run build` in the checkout. This runs the source ESLint check and Rollup, producing `dist/weather-chart-card.js` and copying the icon assets.
4. Review the source and generated distribution changes. Include the applicable `dist` files in the same commit as the source changes; never publish a source-only preview expecting HACS to compile it.
5. Verify the effective Git author and committer, commit the explicit changed file set, and push to `origin/feature/container-space-utilisation`.
6. In HASS, open HACS -> Weather Chart Card (owner `tomtom13`) -> three-dot menu -> **Update information**. This refreshes metadata only; it does not install the new code.
7. Open the menu again -> **Redownload**. Check that the displayed short commit is the pushed branch head, then choose **Download**.
8. Accept HACS's browser **Reload** prompt. Refresh other clients as needed. No HASS Core restart is needed for this frontend card.
9. Check the designated test dashboard's daily and hourly cards, then the actual e-paper/kiosk renderer at its configured resolution and scaling. Use the renderer's supported single-page refresh when necessary; do not casually restart or reconfigure the shared renderer.
10. Verify the served `/hacsfiles/weather-chart-card/weather-chart-card.js` bytes against this commit's distribution and retain the observed commit/hash and visual evidence privately.

Git push does not automatically execute steps 6-10. Updating through the GUI is intentional: the installation remains owned and managed by HACS. No hidden copy job, background deployment service, development HTTP resource, or manual `.storage` edit is part of this workflow.

## Shared-instance boundary

One HASS installation has one HACS-managed bundle for `weather-chart-card`. Switching its version affects every dashboard that uses that custom element after clients reload, including ordinary and kiosk displays. A separate dashboard is not JavaScript version isolation. Do not register two builds of the same custom element in one frontend page.

Keep unverified work in the isolated test HASS. Installing a preview in the shared HASS instance is an explicit promotion affecting all uses of the card; checking the designated test view does not make that shared installation test-view-only.

## Finishing or changing a feature

Keep `master` unchanged until a feature is accepted. After acceptance, merge the verified change using ordinary Git history; do not force-push or rewrite the baseline. When selecting a different preview branch, push the branch first, change the fork's GitHub default branch deliberately, then repeat HACS Update information -> Redownload -> Reload and verify the displayed commit.

If GitHub Releases are introduced later, revisit the channel: HACS uses published Releases for selectable versions. Tags alone are not enough. Do not assume the no-release branch workflow will keep selecting the same content after release policy changes.

## Rollback

For the current no-release branch channel, switch the fork's GitHub default branch back to preserved `master`, use HACS **Update information -> Redownload -> Reload**, and verify its displayed commit and served distribution. This does not require deleting the custom repository or editing dashboard configuration. Do not reset or delete the feature branch to roll back HASS.

## References

- [HACS versions and manifest](https://hacs.xyz/docs/publish/start/)
- [HACS download, update information and redownload](https://hacs.xyz/docs/use/repositories/dashboard/)
- [HACS custom repositories](https://hacs.xyz/docs/faq/custom_repositories/)
