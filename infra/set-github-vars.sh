#!/usr/bin/env bash
# Sets the GitHub repository variables the deploy and export workflows read, from the
# Terraform outputs in this folder.
#
#   ./set-github-vars.sh [owner/name]
#
# Without an argument, gh uses the repository of the current git checkout.
# Needs jq and gh (signed in with `gh auth login`).
set -euo pipefail

missing=()
for tool in jq gh terraform; do
  command -v "$tool" >/dev/null || missing+=("$tool")
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "Missing: ${missing[*]}. Install them and run this again." >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")"

repo_args=()
if [ -n "${1:-}" ]; then
  repo_args=(--repo "$1")
fi

outputs=$(terraform output -json)

set_var() {
  local name=$1 output=$2 value
  value=$(jq -er --arg k "$output" '.[$k].value' <<<"$outputs") || {
    echo "No Terraform output named $output: apply the configuration first." >&2
    exit 1
  }
  gh variable set "$name" ${repo_args[@]+"${repo_args[@]}"} --body "$value"
  echo "Set $name"
}

set_var API_URL service_url
set_var GCP_PROJECT project_id
set_var GCP_REGION region
set_var SERVICE_NAME service_name
set_var FIRESTORE_DATABASE firestore_database
set_var ARTIFACT_REPO artifact_repository
set_var WIF_PROVIDER wif_provider
set_var DEPLOYER_SA deployer_service_account
set_var EXPORTER_SA exporter_service_account
