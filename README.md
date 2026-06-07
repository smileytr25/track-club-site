# track-club-site
Development of Genesee Swift Track Club website

## Gallery uploads

CMS gallery uploads are sent to the image repository by default:

```text
GALLERY_IMAGE_TOKEN=your_github_token
GALLERY_IMAGE_REPO_OWNER=smileytr25
GALLERY_IMAGE_REPO=GeneseeSwiftImages
GALLERY_IMAGE_BRANCH=main
```

Create a fine-grained GitHub token with Contents read/write access to the image repository. CMS deletes also use this token to remove the image file from the repository before deleting the gallery row. For local-only testing, set `GALLERY_UPLOAD_STORAGE=local`.
