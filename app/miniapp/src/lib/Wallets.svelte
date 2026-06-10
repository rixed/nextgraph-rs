<!-- vim: expandtab ts=2 sts=2
  A widget that displays the list of known (ie. local) wallets.
  Input: nothing
  Output: selected wallet (and its id)
-->
<script lang="ts">
  let { wallet = $bindable(null),
        wallet_id = $bindable(null) } = $props();

  import { onMount } from 'svelte';
  import ng from "../../../../sdk/js/api-web";
  // The list of all know wallets (fetched once at the beginning)
  let wallets: any = $state({});
  let loading = $state(true);
  let error: string | null = $state(null);

  let selected_id = $state(null);
  $effect(() => {
    if (selected_id !== null) {
      wallet_id = selected_id;
      wallet = wallets[selected_id].wallet;
    } else {
      wallet_id = null;
      wallet = null;
    }
  });

  onMount(async () => {
    try {
      wallets = await ng.get_wallets();
    } catch (e) {
      error = String(e);
    }
    loading = false;
  });
</script>

{#if loading}
  <p>loading…</p>
{:else if error}
  <p>Error: {error}</p>
{:else}
  <ul>
    {#each Object.keys(wallets) as id}
      <li>
        <label>
          <input type="radio" name="wallet" value={id}
                 bind:group={selected_id} />
          {id}
        </label>
      </li>
    {/each}
  </ul>
{/if}
