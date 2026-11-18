#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
log=reports/UPDATE_51_FOCUSED_REGRESSION.txt
start=${STUDIO51_FROM:-1}
stop=${STUDIO51_TO:-35}
if (( start <= 1 ));then : > "$log";fi
names=(update42a update42b update42c update43a update43b update43c update44a update44_cross_system update45_world_production update45_rights update45_business update45_streaming_wallet update45_industry update46_commissions_gate update46_publishing_gate update46_investments_gate update46_streaming_gate update46_finance_gate update46_acquisitions_gate update46_governance_gate update46_delegation_gate update47_careers_gate update47_disputes_gate update47_editorial_gate update47_lenders_gate update47_rivals_gate update47_succession_gate update48_archive_gate update48_film_gate update48_franchise_gate update48_games_gate update48_store_gate update48_tv_gate update49_platform_gate update49_long_platform)
i=0
for n in "${names[@]}"; do
 i=$((i+1))
 if (( i<start ));then continue;fi
 if (( i>stop ));then break;fi
 echo "=== $n ===" >> "$log"
 node "tests/$n.test.js" >> "$log" 2>&1 || { echo "FAIL $n"; tail -40 "$log"; exit 1; }
 echo "PASS $n";
done
echo "SUITES ${start}-${stop} PASS against current v34 source" | tee -a "$log"
