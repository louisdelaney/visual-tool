output "state_bucket" {
  description = "Bucket for the main configuration's state: pass it to terraform init -backend-config."
  value       = google_storage_bucket.tfstate.name
}
