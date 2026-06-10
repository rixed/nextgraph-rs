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
  <p>Building list of brokers...</p>
{:then urls}
  <ul>
    {#each urls as url}
      <li>
        <label>
          <input type="radio" name="url" value={url} bind:group={selected_broker} />
          {url}
        </label>
      </li>
    {/each}
  </ul>
{:catch err}
  <p>Error: {String(err)}</p>
{/await}
