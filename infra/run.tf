locals {
  # Placeholder so the services can exist before the first build. CI replaces the
  # image on every deploy, and Terraform leaves it alone afterwards.
  placeholder_image = "us-docker.pkg.dev/cloudrun/container/hello"
}

resource "google_cloud_run_v2_service" "api" {
  name                = local.service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false # stateless: CI rebuilds it, and the data lives in Firestore

  template {
    service_account                  = google_service_account.api.email
    timeout                          = "30s"
    max_instance_request_concurrency = 80

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = local.placeholder_image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "ALLOWED_ORIGIN"
        value = var.pages_origin
      }

      env {
        name  = "EXPORT_URL"
        value = local.export_url
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }

      env {
        name  = "FIRESTORE_DATABASE"
        value = var.firestore_database
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }

  depends_on = [
    google_project_service.apis,
    google_project_iam_member.api_datastore,
  ]
}

# The site calls the API from visitors' browsers with no sign-in, so it has to be public.
# This needs constraints/iam.allowedPolicyMemberDomains to allow allUsers.
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
