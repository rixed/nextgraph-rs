<!-- vim: expandtab ts=2 sts=2
Objective:
Try out the admin SDK, especially the new metrology functions.
Show the minimum steps to connect the local broker to the remote broker
and call admin functions of the SDK to display users usage statistics.
-->
<script lang="ts">
  import { type UserIds, type PubKey, type PrivKey, type ConnectionInfo } from './tools'
  import WhoAmI from './lib/WhoAmI.svelte'
  import Wallets from './lib/Wallets.svelte'
  import Password from './lib/Password.svelte'
  import Brokers from './lib/Brokers.svelte'
  import Users from './lib/Users.svelte'
  import UserStats from './lib/UserStats.svelte'

  /* All informations needed to actually connect a user to the broker.
   * This user must be an admin to be allowed to read other users stats. */
  let user_ids: UserIds | null = $state(null)
  /* Although we don't need a wallet for testing admin commands, that's the only
   * way to initialize the local-broker, so let's pretend we are interrested.
   * The wallet object (not typed by rust's wasm-bindgen) */
  let wallet: any = $state(null)
  /* The wallet identifier (pub key, as a string) of a wallet belonging to
   * that user. Required to select the broker to connect to: */
  let wallet_id: string | null = $state(null)
  /* Once a wallet has been selected, the Password component will open it: */
  let opened_wallet: any | null = $state(null)
  /* The selected broker where to send admin calls to: */
  let selected_broker: string | null = $state(null)
  /* The remote user public key (as a PubKey object) of the user whose stats
   * we want to display: */
  let selected_user: PubKey | null = $state(null)
  /* The object representing a ConnectionInfo (as defined in lib-wasm/src/lib.rs): */
  let conn: ConnectionInfo | null = $state(null)

  // Reset opened_wallet whenever another wallet is selected
  $effect(() => {
    if (wallet !== null) opened_wallet = null;
  });

  function set_user_ids(s: UserIds) { user_ids = s }
</script>

<div class="min-h-screen bg-base-200">
  <div class="max-w-3xl mx-auto px-4 py-8 sm:py-12">
    <header class="mb-8 text-center">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight">
        NextGraph <span class="text-primary">Admin</span>
      </h1>
      <p class="mt-2 text-base-content/60">
        Connect through your local broker and read users&lsquo; usage statistics.
      </p>
    </header>

    <ol class="flex flex-col gap-5">
      <li class="card bg-base-100 shadow-md">
        <div class="card-body gap-4">
          <div class="flex items-center gap-3">
            <span class="badge badge-primary badge-lg font-semibold">1</span>
            <h2 class="card-title grow">Identify yourself</h2>
            {#if user_ids !== null}
              <span class="badge badge-success gap-1">✓ done</span>
            {/if}
          </div>
          <p class="text-sm text-base-content/70">
            In order to connect to the remote broker, you need to be a registered
            user (ideally with admin rights to be able to read users&lsquo; stats),
            and be able to open (one of) your wallet(s).
          </p>
          <WhoAmI on_submit={set_user_ids} />
        </div>
      </li>

      <li class="card bg-base-100 shadow-md">
        <div class="card-body gap-4">
          <div class="flex items-center gap-3">
            <span class="badge badge-primary badge-lg font-semibold">2</span>
            <h2 class="card-title grow">Pick your wallet</h2>
            {#if wallet !== null}
              <span class="badge badge-success gap-1">✓ done</span>
            {/if}
          </div>
          <p class="text-sm text-base-content/70">
            Pick the wallet matching the password you entered above:
          </p>
          <Wallets bind:wallet={wallet} bind:wallet_id={wallet_id} />
        </div>
      </li>

      {#if wallet !== null && opened_wallet === null}
        <li class="card bg-base-100 shadow-md">
          <div class="card-body gap-4">
            <div class="flex items-center gap-3">
              <span class="badge badge-primary badge-lg font-semibold">3</span>
              <h2 class="card-title grow">Unlock your wallet</h2>
            </div>
            <Password bind:opened_wallet={opened_wallet} {wallet} />
          </div>
        </li>
      {/if}

      {#if opened_wallet !== null && user_ids !== null}
        <li class="card bg-base-100 shadow-md">
          <div class="card-body gap-4">
            <div class="flex items-center gap-3">
              <span class="badge badge-primary badge-lg font-semibold">4</span>
              <h2 class="card-title grow">Select a broker</h2>
              {#if selected_broker !== null}
                <span class="badge badge-success gap-1">✓ done</span>
              {/if}
            </div>
            <p class="text-sm text-base-content/70">Select the broker to connect to:</p>
            <Brokers
              bind:selected_broker={selected_broker}
              {opened_wallet} {user_ids} />
          </div>
        </li>
      {/if}

      {#if selected_broker !== null && wallet_id !== null && user_ids !== null}
        <li class="card bg-base-100 shadow-md">
          <div class="card-body gap-4">
            <div class="flex items-center gap-3">
              <span class="badge badge-primary badge-lg font-semibold">5</span>
              <h2 class="card-title grow">Select a user</h2>
              {#if selected_user !== null}
                <span class="badge badge-success gap-1">✓ done</span>
              {/if}
            </div>
            <p class="text-sm text-base-content/70">Select a user to display her usage stats:</p>
            <Users
              bind:selected_user={selected_user} bind:conn={conn}
              {selected_broker} {wallet_id} {user_ids} />
          </div>
        </li>
      {/if}

      {#if user_ids !== null && selected_user !== null && conn !== null}
        <li class="card bg-base-100 shadow-md">
          <div class="card-body gap-4">
            <div class="flex items-center gap-3">
              <span class="badge badge-primary badge-lg font-semibold">6</span>
              <h2 class="card-title grow">Usage statistics</h2>
            </div>
            <UserStats user_priv_key={user_ids.priv_key} {conn} {selected_user} />
          </div>
        </li>
      {/if}
    </ol>
  </div>
</div>
