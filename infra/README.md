# Infrastructure

Terraform for the backend: Cloud Run API, Firestore, a budget shutoff, and keyless sign-in for GitHub Actions (the deploy, and the nightly export, which publishes to a GitHub release rather than anything here). Two configurations: `bootstrap/` (local state, applied once) and this folder (state in the bucket bootstrap makes).

1. Install Terraform 1.9+ and `gcloud`, then run `gcloud auth application-default login`.
2. In `bootstrap/`, copy `terraform.tfvars.example` to `terraform.tfvars`, fill it in, then `terraform init && terraform apply`. It makes the `<project>-tfstate` bucket (and the project, with `create_project = true`).
3. Here, copy `terraform.tfvars.example` to `terraform.tfvars` and fill it in.
4. Point the backend at the bucket: `terraform init -backend-config="bucket=$(terraform -chdir=bootstrap output -raw state_bucket)"`.
5. `terraform apply`. Resources are named `<prefix>-api`, `<prefix>-deployer` and so on, from `name_prefix` (default `visual-tool`), so a fork sets its own; `firestore_database` (default `(default)`) names the database. It starts with a placeholder image; CI replaces it on the first deploy. The API starts closed to the internet; set `api_public = true` and apply again to open it. It's public then, so the organization policy `constraints/iam.allowedPolicyMemberDomains` must allow `allUsers`.
6. Run `./set-github-vars.sh` (or `./set-github-vars.sh owner/name`) to copy the outputs into the repository's Actions variables the deploy and export workflows read. It needs `jq` and `gh`, signed in with `gh auth login`.
7. Push to `main`: only runs on `main` in `github_repository` can deploy. `WIF_PROVIDER` is set last, which is what switches the deploy and export workflows on. Run the export once by hand (Actions → Export data → Run workflow) to create the `data` release.

The budget shutoff (`shutoff.tf`) closes the API (ingress internal only) once the month's cost reaches `budget_amount`. Billing data runs a few hours behind, so it limits a bad month rather than stopping at exactly the budget. To check it works without spending anything, publish a fake budget update and watch the API close: `gcloud pubsub topics publish <prefix>-shutoff --message='{"costAmount": 10, "budgetAmount": 5}'`, then apply again to reopen. To reopen after a real shutoff, raise `budget_amount` or wait for the next month, then apply.

Request logs (which carry caller IPs) are excluded in `logging.tf`; keep that in place. The app's own error lines are kept for `log_retention_days` (default 7). `.tfvars` and state files are git-ignored; commit `.terraform.lock.hcl`.
