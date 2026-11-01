# The budget shutoff. The budget (budget.tf) publishes its state to this topic several times
# an hour; a workflow reads each message and, once the month's cost has reached the budget,
# sets the API's ingress to internal only, so requests from the internet stop before they
# start an instance. Nothing is deleted. Billing data runs a few hours behind, so it limits
# the damage rather than stopping it at exactly the budget.
#
# To reopen: raise budget_amount (or wait for next month, when the cost starts again from
# zero) and apply with api_public = true. Reopening while still over budget is undone by the
# next message.
resource "google_pubsub_topic" "shutoff" {
  name = local.shutoff_name

  depends_on = [google_project_service.apis]
}

# Cloud Billing publishes budget updates as this Google-managed account.
resource "google_pubsub_topic_iam_member" "shutoff_budget_publisher" {
  topic  = google_pubsub_topic.shutoff.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:billing-budget-alert@system.gserviceaccount.com"
}

# What the workflow runs as: it can update the API service and nothing else. Updating a
# service keeps it running as the API account, which needs permission to act as that account.
resource "google_service_account" "shutoff" {
  account_id   = local.shutoff_account_id
  display_name = "${local.display_name} budget shutoff"

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service_iam_member" "shutoff_developer" {
  project  = var.project_id
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.developer"
  member   = google_service_account.shutoff.member
}

# The update sends the service back whole, container image included, and Cloud Run checks
# that the caller can pull that image.
resource "google_artifact_registry_repository_iam_member" "shutoff_image_reader" {
  project    = var.project_id
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.name
  role       = "roles/artifactregistry.reader"
  member     = google_service_account.shutoff.member
}

resource "google_service_account_iam_member" "shutoff_acts_as_api" {
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.shutoff.member
}

# Eventarc starts the workflow as the same account.
resource "google_project_iam_member" "shutoff_invoker" {
  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = google_service_account.shutoff.member
}

resource "google_project_iam_member" "shutoff_event_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = google_service_account.shutoff.member
}

resource "google_workflows_workflow" "shutoff" {
  name                = local.shutoff_name
  region              = var.region
  description         = "Closes the API when the month's cost reaches the budget"
  service_account     = google_service_account.shutoff.id
  call_log_level      = "LOG_NONE"
  deletion_protection = false

  source_contents = <<-YAML
    main:
      params: [event]
      steps:
        - read:
            assign:
              - budget: $${json.decode(base64.decode(event.data.message.data))}
              - service: "projects/${var.project_id}/locations/${var.region}/services/${google_cloud_run_v2_service.api.name}"
        - underBudget:
            switch:
              - condition: $${budget.costAmount < budget.budgetAmount}
                return: "under budget"
        - get:
            call: googleapis.run.v2.projects.locations.services.get
            args:
              name: $${service}
            result: api
        - alreadyClosed:
            switch:
              - condition: $${api.ingress == "INGRESS_TRAFFIC_INTERNAL_ONLY"}
                return: "already closed"
        - close:
            assign:
              - api.ingress: "INGRESS_TRAFFIC_INTERNAL_ONLY"
        - update:
            call: googleapis.run.v2.projects.locations.services.patch
            args:
              name: $${service}
              body: $${api}
        - done:
            return: "closed the API"
  YAML

  depends_on = [google_project_service.apis]
}

resource "google_eventarc_trigger" "shutoff" {
  name            = local.shutoff_name
  location        = var.region
  service_account = google_service_account.shutoff.email

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.pubsub.topic.v1.messagePublished"
  }

  transport {
    pubsub {
      topic = google_pubsub_topic.shutoff.id
    }
  }

  destination {
    workflow = google_workflows_workflow.shutoff.id
  }

  depends_on = [
    google_project_iam_member.shutoff_invoker,
    google_project_iam_member.shutoff_event_receiver,
  ]
}
