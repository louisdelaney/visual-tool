resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = local.repository_id
  format        = "DOCKER"
  description   = "Images for the API and the nightly export job"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = 5
    }
  }

  cleanup_policies {
    id     = "delete-rest"
    action = "DELETE"

    condition {
      tag_state = "ANY"
    }
  }

  depends_on = [google_project_service.apis]
}
