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
</script>

{#await stats_prom}
  <p>loading stats…</p>
{:then stats}
  <p>{JSON.stringify(stats)}</p>
{:catch err}
  <p>Error: {String(err)}</p>
{/await}
