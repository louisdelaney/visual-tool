# Runtime: the identity the API runs as. It can read and write Firestore, and nothing else.
resource "google_service_account" "api" {
  account_id   = local.api_account_id
  display_name = "${local.display_name} API"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "api_datastore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = google_service_account.api.member
}

# Exporter: what the nightly export workflow (.github/workflows/export.yml) acts as. It can
# only read Firestore; the workflow publishes the file with GitHub's own token.
resource "google_service_account" "exporter" {
  account_id   = local.exporter_account_id
  display_name = "${local.display_name} exporter (GitHub Actions)"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "exporter_datastore" {
  project = var.project_id
  role    = "roles/datastore.viewer"
  member  = google_service_account.exporter.member
}

# Deployer: what GitHub Actions acts as to push images and roll out revisions.
resource "google_service_account" "deployer" {
  account_id   = local.deployer_account_id
  display_name = "${local.display_name} deployer (GitHub Actions)"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "deployer_run" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = google_service_account.deployer.member
}

# Scoped to the one repository rather than the whole project.
resource "google_artifact_registry_repository_iam_member" "deployer_push" {
  project    = var.project_id
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.name
  role       = "roles/artifactregistry.writer"
  member     = google_service_account.deployer.member
}

# Deploying a revision that runs as the runtime account needs permission to act as it.
resource "google_service_account_iam_member" "deployer_acts_as_api" {
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.deployer.member
}

# Keyless sign-in from GitHub Actions. Only workflow runs on main in this
# repository are accepted: the attribute condition is checked before any
# service account is considered.
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = local.wif_id
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = local.wif_id
  display_name                       = "GitHub"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  attribute_condition = "assertion.repository == \"${var.github_repository}\" && assertion.ref == \"refs/heads/main\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "deployer_from_github" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_service_account_iam_member" "exporter_from_github" {
  service_account_id = google_service_account.exporter.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}
