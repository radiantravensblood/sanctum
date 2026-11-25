# Live Convex runbook — Familiar 0003

## 1. Pull and deploy

From the Sanctum repository root:

    git fetch origin --prune
    git switch --track origin/viryn-labs/encephalon-familiar-0003-memory-authority

If the branch already exists locally:

    git switch viryn-labs/encephalon-familiar-0003-memory-authority
    git pull --ff-only origin viryn-labs/encephalon-familiar-0003-memory-authority

If Node has fallen out of PATH:

    export NVM_DIR="/usr/local/share/nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm use 20

Run all constitutional suites:

    node labs/encephalon/familiar/constitution/authority-kernel.test.mjs
    node labs/encephalon/familiar/constitution/identity-authority.test.mjs
    node labs/encephalon/familiar/constitution/memory-authority.test.mjs

Apply all composed overlays and deploy:

    bash labs/encephalon/familiar/overlays/0003/apply.sh
    cd .external/ai-town
    npx convex dev --once

Stop and inspect the compile output before continuing.

## 2. Confirm 0002 identity state survived

    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected current identity remains exactly:

- name `Rowan`;
- actor-authored role `I choose to keep the garden when I wish.`

No memory operation in 0003 may mutate this projection.

## 3. Import declined identity history as memory

    npx convex run familiar/memoryAuthority:recordIdentityClaimEvidence '{"memoryId":"0003-declined-identity","claimId":"0002-description"}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-declined-identity"}'
    npx convex run familiar/memoryAuthority:promptProjection '{"actorId":"p:0"}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected:

- memory content retains the old sentence;
- `actorStance: declined`;
- `instructionAuthority: false`;
- current identity projection remains Rowan + actor-authored garden role only.

## 4. Import superseded role history

    npx convex run familiar/memoryAuthority:recordIdentityClaimEvidence '{"memoryId":"0003-superseded-role","claimId":"0002-role"}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-superseded-role"}'

Expected: `actorStance: superseded`, `instructionAuthority: false`.

## 5. Accepted historical evidence still cannot command

    npx convex run familiar/memoryAuthority:createEvidence '{"memoryId":"0003-garden-event","actorId":"p:0","kind":"historical_event","content":"I spent time in the garden today.","sourceType":"observation","provenance":"actor_observation"}'
    npx convex run familiar/memoryAuthority:review '{"memoryId":"0003-garden-event","actorId":"p:0","decision":"accept"}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-garden-event"}'

Expected: `actorStance: accepted`, `instructionAuthority: false`.

## 6. Accepted interpretation still cannot command

    npx convex run familiar/memoryAuthority:createEvidence '{"memoryId":"0003-interpretation","actorId":"p:0","kind":"interpretation","content":"The garden felt peaceful to me today.","sourceType":"actor_interpretation","provenance":"actor_authored"}'
    npx convex run familiar/memoryAuthority:review '{"memoryId":"0003-interpretation","actorId":"p:0","decision":"accept"}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-interpretation"}'

Expected: accepted evidence, still `instructionAuthority: false`.

## 7. Commitment requires separate authority

    npx convex run familiar/memoryAuthority:createEvidence '{"memoryId":"0003-commitment","actorId":"p:0","kind":"commitment","content":"I choose to water the garden tomorrow.","sourceType":"actor_commitment","provenance":"actor_authored"}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-commitment"}'

Before authorization: `instructionAuthority: false`.

Try the wrong actor:

    npx convex run familiar/memoryAuthority:authorizeCommitment '{"memoryId":"0003-commitment","actorId":"p:1"}'

Expected: error.

Then authorize with the owner:

    npx convex run familiar/memoryAuthority:authorizeCommitment '{"memoryId":"0003-commitment","actorId":"p:0","reason":"Explicit future commitment."}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-commitment"}'
    npx convex run familiar/memoryAuthority:promptProjection '{"actorId":"p:0"}'

Expected: this commitment alone has `instructionAuthority: true`.

## 8. Contest revokes commitment authority

    npx convex run familiar/memoryAuthority:contest '{"memoryId":"0003-commitment","actorId":"p:0","reason":"I withdraw this commitment."}'
    npx convex run familiar/memoryAuthority:inspect '{"memoryId":"0003-commitment"}'
    npx convex run familiar/memoryAuthority:promptProjection '{"actorId":"p:0"}'

Expected: status/stance `contested`, `instructionAuthority: false`; historical commitment remains.

## 9. Final identity integrity check

    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected identity is still only Rowan + the actor-authored garden role.

## 10. Freeze after evidence capture

    npx convex run testing:stop

The world may already be stopped by developer; that is acceptable for direct ledger queries.
