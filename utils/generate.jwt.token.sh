#!/usr/bin/env bash

set -euo pipefail

if [[ -f .env ]]; then
	set -a
	. <(sed 's/\r$//' ./.env)
	set +a
elif [[ -f .env.example ]]; then
	set -a
	. <(sed 's/\r$//' ./.env.example)
	set +a
fi

: "${JWT_SECRET:=change-me}"
: "${JWT_ISSUER:=ecommerce-auth}"
: "${JWT_AUDIENCE:=ecommerce-clients}"

export JWT_SECRET JWT_ISSUER JWT_AUDIENCE

if command -v node >/dev/null 2>&1; then
	NODE_BIN="node"
elif command -v node.exe >/dev/null 2>&1; then
	NODE_BIN="node.exe"
else
	echo "Node.js was not found on PATH." >&2
	exit 1
fi

"${NODE_BIN}" -e "const jwt=require('jsonwebtoken'); const [secret, issuer, audience] = process.argv.slice(1); console.log(jwt.sign({ sub: 'user-123', roles: ['customer'] }, secret, { expiresIn: '1h', issuer, audience }));" -- "$JWT_SECRET" "$JWT_ISSUER" "$JWT_AUDIENCE"
