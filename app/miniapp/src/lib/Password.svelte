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
  <div role="alert" class="alert alert-error">
    <span>Error: {error}</span>
  </div>
{:else if busy}
  <div class="flex items-center gap-2 text-base-content/60">
    <span class="loading loading-spinner loading-sm"></span> Opening the wallet…
  </div>
{:else}
  <form
    class="flex flex-col gap-3"
    onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <label class="form-control w-full">
      <span class="label-text mb-1">Password</span>
      <input class="input input-bordered w-full" type="password" bind:value={wallet_pwd} />
    </label>
    <button class="btn btn-primary self-start" type="submit">Unlock</button>
  </form>
{/if}
