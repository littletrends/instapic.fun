#!/usr/bin/env bash
set -euo pipefail
preview_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(hostname)" == motherpc ]] && [[ -x "$HOME/instapic_admin/open_penny_fever_preview.sh" ]]; then
  exec "$HOME/instapic_admin/open_penny_fever_preview.sh"
fi
preview_url='http://127.0.0.1:4191/index.html?style=paper&rail=paper&v=paper-alley-live-1#door'
if ! curl --fail --silent --max-time 2 http://127.0.0.1:4191/index.html >/dev/null; then
  nohup python3 "$preview_root/ops/preview-server.py" 4191 > /tmp/penny-fever-restyled-server.log 2>&1 < /dev/null &
fi
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl --fail --silent --max-time 1 http://127.0.0.1:4191/index.html >/dev/null; then
    exec chromium --new-window "$preview_url"
  fi
  sleep 0.2
done
printf '%s\n' 'Preview server did not start. See /tmp/penny-fever-restyled-server.log.' >&2
exit 1
