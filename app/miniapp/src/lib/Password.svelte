<!-- vim: expandtab ts=2 sts=2
  A widget to unlock a wallet (currently: only password method is supported).
  Input: wallet
  Output: opened wallet
-->
<script lang="ts">
  import ng from "../../../../sdk/js/api-web"

  let { wallet, opened_wallet = $bindable() } = $props()
  let wallet_pwd = $state('secret')
  let busy = $state(false)
  let error = $state('')

  async function submit() {
    busy = true
    error = ''
    try {
      const w =
        await ng.wallet_open_with_password($state.snapshot(wallet), wallet_pwd)
      console.log("Opened wallet: ", w)
      let client = await ng.wallet_was_opened(w)
      console.log("Client: ", client)
      opened_wallet = w
    } catch (e) {
      error = String(e)
    } finally {
      busy = false
    }
  }
</script>

{#if error}
  <p>Error: {error}</p>
{:else if busy}
  <p>Opening the wallet…</p>
{:else}
  <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <p><label>Password: <input type="password" bind:value={wallet_pwd} /></label></p>
    <p><button type="submit">Submit</button></p>
  </form>
{/if}
