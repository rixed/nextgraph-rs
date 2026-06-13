<!-- vim: expandtab ts=2 sts=2
  A widget to get a list of users from the remote broker, and return one.
  Input: user credentials, a wallet's id, a broker's IP
  Output: the selected user public key, as a PubKey object, and the conn object that
          will be useful to call the admin sdk.
-->
<script lang="ts">
  import ng from "../../../../sdk/js/api-web"
  import { privKey, pubKey, type UserIds } from "../tools"

  let { selected_broker, wallet_id, user_ids,
        selected_user = $bindable(), conn = $bindable() } = $props();

  async function fetch_users(selected_broker: string, wallet_id: string, user_ids: UserIds) {
    console.warn("Fetching users for wallet ", wallet_id);
    const pub_key_obj = pubKey(user_ids.pub_key);
    const priv_key_obj = privKey(user_ids.priv_key);

    /* So far, we still haven't contacted the real broker. Let's try that. */

    console.warn("Starting a session to the local broker (wtv that means)...");
    const session_info = await ng.session_start(wallet_id, pub_key_obj);
    console.log("SessionInfo: ", session_info);

    console.warn("Connecting the local broker to the actual one...");
    const client_info = {
      'V0': {
        'client_type': 'Web',
        'details': 'miniapp',
        'version': '1.2.3', // wtv
        'timestamp_install': 123, // wtv
        'timestamp_updated': 123, // wtv
      },
    };
    const connection_info =
      await ng.user_connect(client_info, user_ids.pub_key, selected_broker);
    console.log("ConnectionInfo: ", connection_info);
    const num_conns = Object.keys(connection_info).length;
    if (num_conns == 0) {
      console.error("No connections!?");
      throw "No connection!";
    } else {
      conn = Object.values(connection_info)[0];
      console.warn("Listing all remote users (admins or not)");
      const server_id = pubKey(conn.server_id);
      const admins =
        await ng.admin_list_users(server_id, priv_key_obj, conn.server_ip, true);
      console.log("remote admins: ", admins);
      const noadmins =
        await ng.admin_list_users(server_id, priv_key_obj, conn.server_ip, false);
      console.log("remote users: ", noadmins);
      return [
        ...admins.map((name: object) => ({ name, admin: true })),
        ...noadmins.map((name: object) => ({ name, admin: false })),
      ].sort((x, y) => JSON.stringify(x.name).localeCompare(JSON.stringify(y.name)));
    }
  }

  let users_prom = $derived(fetch_users(selected_broker, wallet_id, user_ids));
</script>

{#await users_prom}
  <div class="flex items-center gap-2 text-base-content/60">
    <span class="loading loading-spinner loading-sm"></span> Loading list of users…
  </div>
{:then users}
  {#if users.length === 0}
    <p class="text-base-content/60 italic">No user found on this broker.</p>
  {:else}
    <div class="flex flex-col gap-2">
      {#each users as user}
        <label class="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 px-3 py-2 hover:bg-base-200">
          <input type="radio" name="user" value={user.name}
                 class="radio radio-primary radio-sm"
                 bind:group={selected_user} />
          <span class="font-mono text-sm break-all grow">
            {#await ng.pubkey_to_string(user.name)}…
            {:then name}{name}
            {:catch err}Error: {String(err)}{/await}
          </span>
          {#if user.admin}
            <span class="badge badge-secondary badge-sm">ADMIN</span>
          {/if}
        </label>
      {/each}
    </div>
  {/if}
{:catch err}
  <div role="alert" class="alert alert-error">
    <span>Error: {String(err)}</span>
  </div>
{/await}
