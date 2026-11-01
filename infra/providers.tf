provider "google" {
  project = var.project_id
  region  = var.region

  # The Billing Budgets API refuses calls without a quota project, so bill the
  # API calls to this project.
  user_project_override = true
  billing_project       = var.project_id
}
