# The public download. The nightly job writes the export here and anyone can read
# it, so it holds nothing that isn't meant to be public.
#
# Making it public needs the organization policy constraints/iam.allowedPolicyMemberDomains
# to allow allUsers (it blocks it by default in organizations that enforce
# domain-restricted sharing); apply fails on the IAM binding below otherwise.
resource "google_storage_bucket" "export" {
  name                        = local.export_bucket
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"

  # No versioning and no logging block, so no old copies or access logs are kept.
  # Soft delete is off for the same reason: each night's export replaces the last.
  soft_delete_policy {
    retention_duration_seconds = 0
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket_iam_member" "export_public_read" {
  bucket = google_storage_bucket.export.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
