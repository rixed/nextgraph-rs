function fromBase64Url(s: string): Uint8Array {
	return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
		.slice(0, -1)  // drop the trailing tag byte
		.reverse()
}

export type PrivKey =
	| { Ed25519PrivKey: Uint8Array }
	| { X25519PrivKey: Uint8Array }

export type PubKey =
	| { Ed25519PubKey: Uint8Array }
	| { X25519PubKey: Uint8Array }

// All the things needed to connect anywhere:
export type UserIds = {
	// User public key
	pub_key: string,
	// User private key
	priv_key: string,
	// Wallet password (TODO: other authorization schemes)
	wallet_pwd: string,
}

// Mirrors the struct ConnectionInfo defined in lib-wasm/src/lib.rs:
export type ConnectionInfo = {
	server_id: string,
	server_ip: string, // FIXME
	error: string | undefined,
	since: Date,
}

export function privKey(s: string): PrivKey {
	return { Ed25519PrivKey: fromBase64Url(s) }
}

export function pubKey(s: string): PubKey {
	return { Ed25519PubKey: fromBase64Url(s) }
}

export type UsageStats = {
  net: { ingress: number, egress: number },
  storage: { current: number, max: number },
  last_seen: number,
}
