# Cloud Run writes a request log line for every call, including the caller's IP
# address, user agent and referrer, and the privacy page promises none of that is
# kept. These exclusions on the _Default sink drop the lines before they're stored.
#
# What stays: run.googleapis.com/stderr and stdout, which hold the app's own error
# lines (the app never logs request bodies, pseudonyms or headers). Those are kept
# only for var.log_retention_days.
resource "google_logging_project_exclusion" "cloud_run_requests" {
  name        = "${var.name_prefix}-cloud-run-requests"
  description = "Cloud Run request logs, which include caller IP addresses"
  filter      = "resource.type=\"cloud_run_revision\" AND logName:\"logs/run.googleapis.com%2Frequests\""

  depends_on = [google_project_service.apis]
}

# Keep whatever does reach the _Default bucket for a short time only. (The _Required
# bucket holds admin audit logs, which record the maintainer's own IP when they change
# infrastructure; Google fixes its retention at 400 days.)
resource "google_logging_project_bucket_config" "default" {
  project        = var.project_id
  location       = "global"
  bucket_id      = "_Default"
  retention_days = var.log_retention_days

  depends_on = [google_project_service.apis]
}
