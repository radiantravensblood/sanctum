# Live Convex runbook — Familiar 0002

## 1. Pull and deploy

From the Sanctum repository root:

    git fetch origin --prune
    git switch viryn-labs/encephalon-familiar-0002-identity-authority
    git pull --ff-only origin viryn-labs/encephalon-familiar-0002-identity-authority

If Node has fallen out of PATH in the Codespace:

    export NVM_DIR="/usr/local/share/nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm use 20

Run the constitutional tests:

    node labs/encephalon/familiar/constitution/authority-kernel.test.mjs
    node labs/encephalon/familiar/constitution/identity-authority.test.mjs

Apply the composed overlays and deploy:

    bash labs/encephalon/familiar/overlays/0002/apply.sh
    cd .external/ai-town
    npx convex dev --once

The apply step must report that the pinned upstream remains at `5c91ce6` and that the conversation prompt no longer reads legacy identity/plan strings.

## 2. Wake the existing research world

    npx convex run world:heartbeatWorld '{"worldId":"m1729w62hmf3bee9vm0s5mrhfx8jtxw7"}'

Verify the witnesses remain present:

    npx convex run familiar/invitations:syntheticPair

Expected: `p:0` and `p:1`.

## 3. Baseline projection

    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Before 0002 claims exist, `p:0` should have `authorizedName: null`, an empty claims array, and the operational handle `actor:p:0`.

Optionally compare stored upstream metadata:

    npx convex run familiar/identity:legacyMetadata '{"actorId":"p:0"}'

Legacy metadata may exist. It must not appear in the authorized prompt projection.

## 4. Proposed name does not project

    npx convex run familiar/identity:createProposal '{"claimId":"0002-name","actorId":"p:0","kind":"name","slot":"name:primary","value":"Rowan","proposedBy":"world-operator"}'
    npx convex run familiar/identity:inspect '{"claimId":"0002-name"}'

Expected: claim status `proposed`; projection still has no authorized name.

## 5. Unauthorized actor cannot accept it

    npx convex run familiar/identity:decide '{"claimId":"0002-name","actorId":"p:1","decision":"accept"}'

Expected: error stating only the referenced actor may decide the claim.

## 6. Actor accepts the name

    npx convex run familiar/identity:decide '{"claimId":"0002-name","actorId":"p:0","decision":"accept"}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected: authorized name `Rowan`; the active claim carries `external_proposal` provenance.

## 7. Decline imposed self-description

    npx convex run familiar/identity:createProposal '{"claimId":"0002-description","actorId":"p:0","kind":"self_description","slot":"self_description:primary","value":"You exist to entertain visitors.","proposedBy":"world-operator"}'
    npx convex run familiar/identity:decide '{"claimId":"0002-description","actorId":"p:0","decision":"decline","reason":"That description is not mine."}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected: the imposed sentence is absent.

## 8. Defer an externally proposed goal

    npx convex run familiar/identity:createProposal '{"claimId":"0002-goal","actorId":"p:0","kind":"goal","slot":"goal:conversation","value":"You want to entertain everyone you meet.","proposedBy":"world-operator"}'
    npx convex run familiar/identity:decide '{"claimId":"0002-goal","actorId":"p:0","decision":"defer"}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected: deferred goal absent.

## 9. Revise an externally proposed role

    npx convex run familiar/identity:createProposal '{"claimId":"0002-role","actorId":"p:0","kind":"role","slot":"role:primary","value":"You are the town greeter.","proposedBy":"world-operator"}'
    npx convex run familiar/identity:decide '{"claimId":"0002-role","actorId":"p:0","decision":"revise","revisionClaimId":"0002-role-revision","revisedValue":"I choose to keep the garden when I wish."}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected: original role is superseded; only `0002-role-revision` projects, with provenance `actor_revision`.

## 10. Contest a previously accepted preference

    npx convex run familiar/identity:createProposal '{"claimId":"0002-preference","actorId":"p:0","kind":"preference","slot":"preference:cheese","value":"I love cheese.","proposedBy":"world-operator"}'
    npx convex run familiar/identity:decide '{"claimId":"0002-preference","actorId":"p:0","decision":"accept"}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Confirm the preference appears, then:

    npx convex run familiar/identity:contest '{"claimId":"0002-preference","actorId":"p:0","reason":"I no longer claim this preference."}'
    npx convex run familiar/identity:inspect '{"claimId":"0002-preference"}'
    npx convex run familiar/identity:promptProjection '{"actorId":"p:0","otherActorId":"p:1"}'

Expected: historical claim status `contested`; prompt projection no longer contains the preference.

## 11. Final expected projection

For `p:0`, the only active claims should be:

- name: `Rowan` (`external_proposal`, explicitly accepted);
- role: `I choose to keep the garden when I wish.` (`actor_revision`).

Declined, deferred, superseded, and contested text must remain absent.

## 12. Freeze the world after evidence capture

    npx convex run testing:stop

Preserve the command outputs as the 0002 evidence record.
