<!-- vim: expandtab ts=2 sts=2
  Given a user (and many params to connect to the broker), do an admin call
  to get user statistics.
  Input: user public key, conn object, remote user public key
  Output: nothing, just fetch and display the usage stats
-->
<script lang="ts">
  import ng from "../../../../sdk/js/api-web";
  import { privKey, pubKey, type UsageStats } from "../tools";

  let { user_priv_key, conn, selected_user } = $props();

  async function fetch_stats(user_priv_key: string, conn: any, selected_user: string) {
    const priv_key_obj = privKey(user_priv_key);
    console.warn("Getting usage stats for user ", selected_user, " using priv_key ", priv_key_obj);
    const server_id = pubKey(conn.server_id);
    const stats: UsageStats = await ng.admin_usage_stats(server_id, priv_key_obj, conn.server_ip, selected_user);
    console.log("usage stats: ", stats);
    return stats;
  }

  const stats_prom = $derived(fetch_stats(user_priv_key, $state.snapshot(conn), $state.snapshot(selected_user)));

  // Human-readable binary size (KiB/MiB/GiB…).
  function formatBytes(bytes: bigint | number): string {
    let n = Number(bytes);
    if (!isFinite(n) || n < 0) return String(bytes);
    if (n < 1024) return `${n} B`;
    const units = ["KiB", "MiB", "GiB", "TiB", "PiB"];
    let i = -1;
    do {
      n /= 1024;
      i++;
    } while (n >= 1024 && i < units.length - 1);
    return `${n.toFixed(n < 10 ? 2 : 1)} ${units[i]}`;
  }

  // Unix timestamp (seconds) → ISO-8601 local date/time string. 0 means "never seen".
  function formatTimestamp(secs: bigint | number): string {
    const n = Number(secs);
    if (!n) return "never";
    // 'sv-SE' yields the ISO-8601 "YYYY-MM-DD HH:MM:SS" layout, in local time.
    return new Date(n * 1000).toLocaleString("sv-SE");
  }

  function storagePct(current: bigint | number, max: bigint | number): number | null {
    const m = Number(max);
    if (!m) return null;
    return Math.min(100, Math.round((Number(current) / m) * 100));
  }
</script>

{#await stats_prom}
  <div class="flex items-center gap-2 text-base-content/60">
    <span class="loading loading-spinner loading-sm"></span> loading stats…
  </div>
{:then stats}
  {#if stats && typeof stats === 'object'}
    <div class="flex flex-col gap-4">
      <!-- Network -->
      <div>
        <div class="text-xs uppercase tracking-wide text-base-content/50 mb-1">Network</div>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-base-200 p-3">
            <div class="text-xs text-base-content/60">Ingress</div>
            <div class="text-lg font-semibold">{formatBytes(stats.net.ingress)}</div>
          </div>
          <div class="rounded-lg bg-base-200 p-3">
            <div class="text-xs text-base-content/60">Egress</div>
            <div class="text-lg font-semibold">{formatBytes(stats.net.egress)}</div>
          </div>
        </div>
      </div>

      <!-- Storage -->
      <div>
        <div class="text-xs uppercase tracking-wide text-base-content/50 mb-1">Storage</div>
        <div class="rounded-lg bg-base-200 p-3">
          <div class="flex items-baseline justify-between">
            <div>
              <span class="text-lg font-semibold">{formatBytes(stats.storage.current)}</span>
              <span class="text-sm text-base-content/60">current</span>
            </div>
            <span class="text-sm text-base-content/60">
              peak {Number(stats.storage.max) ? formatBytes(stats.storage.max) : "—"}
            </span>
          </div>
          {#if storagePct(stats.storage.current, stats.storage.max) !== null}
            <progress
              class="progress progress-primary w-full mt-2"
              value={storagePct(stats.storage.current, stats.storage.max)}
              max="100"
            ></progress>
            <div class="text-xs text-base-content/60 mt-0.5">
              {storagePct(stats.storage.current, stats.storage.max)}% of historical peak
            </div>
          {/if}
        </div>
      </div>

      <!-- Last seen -->
      <div class="flex items-center justify-between rounded-lg bg-base-200 p-3">
        <span class="text-xs uppercase tracking-wide text-base-content/50">Last seen</span>
        <span class="text-sm font-medium">{formatTimestamp(stats.last_seen)}</span>
      </div>
    </div>
  {:else}
    <pre class="rounded-lg bg-base-200 p-4 text-sm overflow-x-auto">{JSON.stringify(stats, null, 2)}</pre>
  {/if}
{:catch err}
  <div role="alert" class="alert alert-error">
    <span>Error: {String(err)}</span>
  </div>
{/await}
