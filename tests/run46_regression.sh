#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: > reports/UPDATE_46_FULL_REGRESSION.txt
names=(update42a update42b update42c update43a update43b update43c update44a update44_cross_system update45_world_production update45_rights update45_business update45_streaming_wallet update45_industry update46_commissions_gate update46_publishing_gate update46_investments_gate update46_streaming_gate update46_finance_gate update46_acquisitions_gate update46_governance_gate update46_delegation_gate)
for n in "${names[@]}"; do
 printf '\n=== %s ===\n' "$n" | tee -a reports/UPDATE_46_FULL_REGRESSION.txt
 node "tests/$n.test.js" >> reports/UPDATE_46_FULL_REGRESSION.txt 2>&1
 tail -1 reports/UPDATE_46_FULL_REGRESSION.txt
 done
printf 'ALL 21 SUITES PASS\n' | tee -a reports/UPDATE_46_FULL_REGRESSION.txt
