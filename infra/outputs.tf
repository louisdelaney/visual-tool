output "project_id" {
  description = "The Google Cloud project (the GCP_PROJECT repository variable)."
  value       = var.project_id
}

output "region" {
  description = "Region everything runs in (the GCP_REGION repository variable)."
  value       = var.region
}

output "service_name" {
  description = "Name of the Cloud Run API service (the SERVICE_NAME repository variable)."
  value       = google_cloud_run_v2_service.api.name
}

output "export_job_name" {
  description = "Name of the Cloud Run export job (the EXPORT_JOB_NAME repository variable)."
  value       = google_cloud_run_v2_job.export.name
}

output "artifact_repository" {
  description = "Where CI pushes images (the ARTIFACT_REPO repository variable)."
  value       = "${google_artifact_registry_repository.images.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}

output "export_bucket" {
  description = "Name of the public export bucket."
  value       = google_storage_bucket.export.name
}

output "service_url" {
  description = "Base URL of the API (the API_URL repository variable)."
  value       = google_cloud_run_v2_service.api.uri
}

output "export_url" {
  description = "Public URL of the nightly export file."
  value       = "https://storage.googleapis.com/${google_storage_bucket.export.name}/visual-data.json"
}

output "wif_provider" {
  description = "Full name of the workload identity provider (the WIF_PROVIDER repository variable)."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account" {
  description = "Email of the account GitHub Actions deploys as (the DEPLOYER_SA repository variable)."
  value       = google_service_account.deployer.email
}
