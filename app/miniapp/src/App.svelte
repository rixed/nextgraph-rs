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

<section id="whoAmI">
  <p>
    In order to connect to the remote broker, you need to be a registered user
    (ideally with admin rights to be able to read users&lsquo; stats), and
    be able to open (one of) your wallet(s).
  </p>
  <WhoAmI on_submit={set_user_ids} />
  {#if user_ids !== null}✓{/if}
</section>

<section id="wallets">
  <p>
    Pick your wallet (which password you entered above):
  </p>
  <Wallets bind:wallet={wallet} bind:wallet_id={wallet_id} />
</section>

{#if wallet !== null && opened_wallet === null}
  <section id="password">
    <Password bind:opened_wallet={opened_wallet} {wallet} />
  </section>
{/if}

{#if opened_wallet !== null && user_ids !== null}
  <section id="brokers">
    <p>Select the broker to connect to:</p>
    <Brokers
      bind:selected_broker={selected_broker}
      {opened_wallet} {user_ids} />
  </section>
{/if}

{#if selected_broker !== null && wallet_id !== null && user_ids !== null}
  <section id="users">
    <p>Select a user to display her usage stats:</p>
    <Users
      bind:selected_user={selected_user} bind:conn={conn}
      {selected_broker} {wallet_id} {user_ids} />
  </section>
{/if}

{#if user_ids !== null && selected_user !== null && conn !== null}
  <section id="stats">
    <UserStats user_priv_key={user_ids.priv_key} {conn} {selected_user} />
  </section>
{/if}
