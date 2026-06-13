<!-- vim: expandtab ts=2 sts=2
  A widget to display the list of brokers defined in a wallet and select one.
  Input: opened wallet and its id, user identifiers.
  Output: the selected broker URL as a string.
-->
<script lang="ts">
  import ng from "../../../../sdk/js/api-web"
  import { privKey, pubKey, type UserIds } from "../tools"

  let { opened_wallet, user_ids, selected_broker = $bindable() } = $props()

  async function get_urls(opened_wallet: any, user_ids: UserIds) {
    let urls = []
    for (const brokers of Object.values(opened_wallet.V0.brokers as any[])) {
      for (const broker of brokers) {
        const { Localhost, BoxPrivate, Public, BoxPublicDyn, Domain } =
          broker.ServerV0.server_type
        if (Localhost !== undefined) { urls.push('http://127.0.0.1:' + Localhost) }
        // FIXME: actually those won't work. Fix user_connect to take an IP instead!
        else if (BoxPrivate !== undefined) { urls.push(BoxPrivate) }
        else if (Public !== undefined) { urls.push(Public) }
        else if (BoxPublicDyn !== undefined) { urls.push(BoxPublicDyn) }
        else if (Domain !== undefined) {
          console.error("Unsupported broker server type 'Domain'")
        }
      }
    }
    return urls
  }

  let urls_prom = $derived(get_urls($state.snapshot(opened_wallet), user_ids))
</script>

{#await urls_prom}
  <div class="flex items-center gap-2 text-base-content/60">
    <span class="loading loading-spinner loading-sm"></span> Building list of brokers…
  </div>
{:then urls}
  {#if urls.length === 0}
    <p class="text-base-content/60 italic">No broker found in this wallet.</p>
  {:else}
    <div class="flex flex-col gap-2">
      {#each urls as url}
        <label class="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 px-3 py-2 hover:bg-base-200">
          <input type="radio" name="url" value={url}
                 class="radio radio-primary radio-sm"
                 bind:group={selected_broker} />
          <span class="font-mono text-sm break-all">{url}</span>
        </label>
      {/each}
    </div>
  {/if}
{:catch err}
  <div role="alert" class="alert alert-error">
    <span>Error: {String(err)}</span>
  </div>
{/await}
