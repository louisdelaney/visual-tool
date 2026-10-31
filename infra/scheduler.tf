resource "google_cloud_scheduler_job" "export" {
  name        = local.export_job_name
  description = "Starts the nightly export of the stored sessions"
  region      = var.region
  schedule    = "0 3 * * *"
  time_zone   = "Europe/London"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.export.name}:run"

    # Google APIs want an access token, not an ID token (oidc_token).
    oauth_token {
      service_account_email = google_service_account.scheduler.email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_job_iam_member.scheduler_invoker,
  ]
}
