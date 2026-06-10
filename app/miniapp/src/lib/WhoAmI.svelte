<!-- vim: expandtab ts=2 sts=2
  A widget to ask for user private key and wallet password.
  (Note: in theory, we should wait for a wallet to be selected before asking
  for a password or whatever this wallet uses for authorization).
  Input: nothing
  Output: UserIds
-->
<script lang="ts">
  import { type UserIds } from "../tools"

  let { on_submit } = $props();

  let pub_key = $state('9XI0ja0aPMXwzf8T7xmaL_50ofiyjqNaqrzyZIQeryMA');
  let priv_key = $state('qdU5BdYmGzQbc0ZlG4Tzc1U82vzUNXBkTx95cVzI7vIA');

  function submit() {
    on_submit({ pub_key, priv_key } as UserIds);
  }
</script>

<div>
  <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <p><label>Public key: <input bind:value={pub_key} /></label></p>
    <p><label>Private key: <input type="password" bind:value={priv_key} /></label></p>
    <p><button type="submit">Submit</button></p>
  </form>
</div>
