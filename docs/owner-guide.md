# Owner's Guide: Editing and Publishing the Portfolio

This site is a static Hugo/Blowfish website hosted on Firebase Hosting. The public pages are generated from hand-maintained Hugo pages plus published records in Firestore. Use the private editor at <https://sounddesignportfolio.web.app/admin/> for portfolio, project, credit, and blog records. Do not edit generated `public/` files or the generated `content/<section>/cms/` files.

## 1. Activate your owner login (one time)

Email/Password sign-in is enabled. The editor only grants access to a Firebase Authentication account with the `admin: true` custom claim.

1. In [Firebase Authentication → Users](https://console.firebase.google.com/project/sounddesignportfolio/authentication/users), create the one account you will use to manage the site. Choose an email and password you control. The editor does not have a public sign-up form.
2. Copy that account's **UID** from the user list.
3. Open [Provision portfolio owner](https://github.com/Hyeur/hyeur.github.io/actions/workflows/provision-owner.yml). Choose the `main` branch, select **Run workflow**, and enter the UID. Only the repository owner can run the provisioning job, and it uses the existing GitHub service-account secret without exposing its key.
4. Wait for the run to succeed. Sign in at <https://sounddesignportfolio.web.app/admin/>. If it says the account is not the site owner, sign out and sign back in to refresh the Firebase token, then check the provisioning run and UID.

Do not create a second editor account. Other Firebase accounts, even if they can sign in, cannot read or change entries unless an owner-only provisioning run gives them the owner claim.

## 2. Create an entry

Sign in at `/admin/` and choose **New entry**. Select one of these types:

| Type | Use for | Required special field |
| --- | --- | --- |
| `portfolio` | A selected sound-design or technical-audio work sample | Year |
| `project` | A personal project or experiment | Year |
| `blog` | An article or process note | Publication date |
| `credit` | A project credit and your role | Role |

Use a unique lowercase slug with hyphens, such as `creature-movement-audio`. It becomes part of the page URL; avoid changing it after publishing. Enter an English and Vietnamese title and Markdown body. Both languages are required. Summaries are optional but useful for listing cards and search previews.

Optional fields include category, comma-separated tags, sort order, featured image (a local site path like `/images/work.jpg` or an HTTPS URL), external HTTPS link, medium, YouTube URL, and SoundCloud URL. Sort order should be an integer. Use Markdown in the body; the editor shows a preview for each language. Keep client, employer, unreleased-project, and internal production details out of public entries unless you have approval to share them.

For a new entry, click **Save** first. It is saved as a draft and appears in the entry list. Open it again to publish. The editor requires a title and body in both languages, a valid slug, and the type-specific required field before saving.

## 3. Add video and sound samples

Upload videos to your YouTube account and use the supported HTTPS YouTube URL in **YouTube URL**. Upload audio to SoundCloud and use its supported HTTPS track URL in **SoundCloud URL**. The site creates the embed; do not paste iframe or script code into the Markdown body. The embeds do not autoplay.

An **unlisted** YouTube video or SoundCloud private-share link is still accessible to visitors who can open the public page. Anyone who can view the embed may be able to play it or share its URL. Treat those links as public portfolio material, even when they are not searchable on the hosting platform. Do not embed material that must remain private.

Before publishing, check that the embedded media is approved for public use, has an appropriate title/thumbnail on its platform, and plays correctly on desktop and mobile. The website does not upload or store the media files itself.

## 4. Publish or update content

1. Save your entry. For an existing entry, **Save** stores edits in Firestore. A draft remains private from the public Hugo site. Saving edits to an already published entry keeps it published.
2. For a new or draft entry, open the saved entry and click **Publish**. Its Firestore status changes immediately, but the public page updates after the publishing workflow succeeds. For an already published entry, do not click the status button to apply edits; that button is **Unpublish**. Save the edits instead.
3. GitHub Actions checks for content changes every ten minutes at minutes 7, 17, 27, 37, 47, and 57 UTC. GitHub can delay scheduled runs. A push to `main` also starts a site build.
4. To publish immediately, open [Publish portfolio content](https://github.com/Hyeur/hyeur.github.io/actions/workflows/publish-content.yml), select the `main` branch, and choose **Run workflow**. Production runs from other branches are skipped.
5. Watch that run in the Actions tab. A successful run means the new version deployed. If it reports that the release is unchanged, there was no generated-content or source-commit difference to deploy. If it fails, the previously deployed site remains live; fix the reported error and run again.
6. Confirm the result at <https://sounddesignportfolio.web.app/>. Check both languages, page links, and embedded media.

Publishing only includes entries whose status is exactly `published`. Changes saved to Firestore do not appear on the site until a successful sync. Do not deploy a local `public/` directory manually; GitHub Actions is the production deployment path.

## 5. Unpublish and delete safely

Click **Unpublish** to change a published entry back to a draft. The current public page may remain live until the next successful workflow run. Wait for that run to succeed, then confirm the page is gone before deleting the record.

Firestore rules block deletion while the last deployed version still contains the entry. They also briefly block draft deletion while a publisher run is in flight, including the first deploy. If deletion is denied, wait for the run to finish and retry. A draft that has never been published can normally be deleted immediately when no publisher run is active.

## 6. Keep the site healthy

- Check the latest **Publish portfolio content** run after an urgent publish, failed sync, or suspected schedule delay.
- Scheduled workflows in public GitHub repositories may be disabled after 60 days without repository activity. If the schedule stops, re-enable it in the Actions tab; you can still run the workflow manually from `main`.
- If sign-in works but the editor says **Access denied**, confirm the correct UID was provisioned and sign out/in. Never grant the owner claim to another account just to bypass an error.
- If a publishing job fails at the Firestore lock/export/state step, check that the GitHub service account still has Firestore data access (`roles/datastore.user`) and Hosting deploy access. Keep its key in GitHub Actions Secrets; never commit it or paste it into the editor.
- Make code and design changes in the Hugo source, theme/config, or editor directories. A push to `main` publishes those source changes to production. Hugo theme checkout is handled by the workflow; leave the theme submodule pointer unchanged unless you intend to update Blowfish.
- The live site has no published Firestore entries yet. Populate the editor with approved portfolio/blog records to replace the empty CMS lists. The hand-maintained biography, navigation, and other site pages remain in Hugo source.

For the data fields, security rules, and lower-level maintenance commands, see [the content model and publishing notes](content-model.md) and [the maintenance plan](maintenance-plan.md).
