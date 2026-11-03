resource "google_firestore_database" "default" {
  name                              = var.firestore_database
  type                              = "FIRESTORE_NATIVE"
  location_id                       = var.region
  delete_protection_state           = "DELETE_PROTECTION_ENABLED"
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"

  depends_on = [google_project_service.apis]
}

# What backends deployed before summaries_by_pseudonym_newest query with. Remove it once the
# backend that uses the newest-first index is deployed.
resource "google_firestore_index" "summaries_by_pseudonym" {
  database    = google_firestore_database.default.name
  collection  = "summaries"
  query_scope = "COLLECTION"

  fields {
    field_path = "pseudonym"
    order      = "ASCENDING"
  }

  fields {
    field_path = "started_at"
    order      = "ASCENDING"
  }
}

# Lets the API list one person's newest sessions, so the 50-session limit leaves out the oldest.
# Apply this before deploying the backend that uses it: until it's built, /history fails.
resource "google_firestore_index" "summaries_by_pseudonym_newest" {
  database    = google_firestore_database.default.name
  collection  = "summaries"
  query_scope = "COLLECTION"

  fields {
    field_path = "pseudonym"
    order      = "ASCENDING"
  }

  fields {
    field_path = "started_at"
    order      = "DESCENDING"
  }
}
