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
  <div class="flex items-center gap-2 text-base-content/60">
    <span class="loading loading-spinner loading-sm"></span> loading…
  </div>
{:else if error}
  <div role="alert" class="alert alert-error">
    <span>Error: {error}</span>
  </div>
{:else if Object.keys(wallets).length === 0}
  <p class="text-base-content/60 italic">No local wallet found.</p>
{:else}
  <div class="flex flex-col gap-2">
    {#each Object.keys(wallets) as id}
      <label class="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 px-3 py-2 hover:bg-base-200">
        <input type="radio" name="wallet" value={id}
               class="radio radio-primary radio-sm"
               bind:group={selected_id} />
        <span class="font-mono text-sm break-all">{id}</span>
      </label>
    {/each}
  </div>
{/if}
