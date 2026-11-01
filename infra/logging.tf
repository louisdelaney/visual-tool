# Cloud Run writes a request log line for every call, including the caller's IP
# address, and the privacy page promises no IP addresses are kept. These
# exclusions on the _Default sink drop them before they're stored.
#
# What stays: run.googleapis.com/stderr and stdout, which hold the app's own error
# lines (the app never logs request bodies, pseudonyms or headers).
resource "google_logging_project_exclusion" "cloud_run_requests" {
  name        = "${var.name_prefix}-cloud-run-requests"
  description = "Cloud Run request logs, which include caller IP addresses"
  filter      = "resource.type=\"cloud_run_revision\" AND logName:\"logs/run.googleapis.com%2Frequests\""

  depends_on = [google_project_service.apis]
}

resource "google_logging_project_exclusion" "cloud_scheduler" {
  name        = "${var.name_prefix}-cloud-scheduler"
  description = "Cloud Scheduler job logs"
  filter      = "resource.type=\"cloud_scheduler_job\""

  depends_on = [google_project_service.apis]
}
