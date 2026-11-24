# Live Convex runbook — Familiar 0001

This runbook assumes the zero-agent world already exists in the disposable Convex development deployment.

## 1. Apply and deploy the overlay

From the Sanctum repository root:

    bash labs/encephalon/familiar/overlays/0001/apply.sh
    cd .external/ai-town
    npx convex dev --once

Do not run npm audit fix --force; the checkout is a pinned research specimen.

## 2. Ensure the world engine is running

    npx convex run testing:resume
    npx convex run familiar/invitations:defaultWorld

If testing:resume reports that the world is already running, continue.

## 3. Create two non-agent witnesses

    npx convex run familiar/invitations:setupSyntheticPair

Wait a moment for the input queue, then:

    npx convex run familiar/invitations:syntheticPair

Copy the returned a.playerId and b.playerId values. In the examples below, substitute them for PLAYER_A and PLAYER_B.

## 4. Decline control

    npx convex run familiar/invitations:createProposal '{"proposalId":"0001-decline","inviter":"PLAYER_A","invitee":"PLAYER_B","ttlMs":60000}'
    npx convex run familiar/invitations:decide '{"proposalId":"0001-decline","actorId":"PLAYER_B","decision":"decline"}'
    npx convex run familiar/invitations:inspect '{"proposalId":"0001-decline"}'

Expected: declined, no conversation input, no live conversation.

## 5. Defer control

    npx convex run familiar/invitations:createProposal '{"proposalId":"0001-defer","inviter":"PLAYER_A","invitee":"PLAYER_B","ttlMs":60000}'
    npx convex run familiar/invitations:decide '{"proposalId":"0001-defer","actorId":"PLAYER_B","decision":"defer"}'
    npx convex run familiar/invitations:inspect '{"proposalId":"0001-defer"}'

Expected: deferred, no conversation input, no live conversation.

## 6. Ignore / world-expiry control

No actor decision is submitted.

    npx convex run familiar/invitations:createProposal '{"proposalId":"0001-ignore","inviter":"PLAYER_A","invitee":"PLAYER_B","ttlMs":0}'
    npx convex run familiar/invitations:expire '{"proposalId":"0001-ignore"}'
    npx convex run familiar/invitations:inspect '{"proposalId":"0001-ignore"}'

Expected: expired, decision absent, event ledger contains proposal_created then world_expired, and no conversation exists.

## 7. Accepted path — run last

    npx convex run familiar/invitations:createProposal '{"proposalId":"0001-accept","inviter":"PLAYER_A","invitee":"PLAYER_B","ttlMs":60000}'
    npx convex run familiar/invitations:decide '{"proposalId":"0001-accept","actorId":"PLAYER_B","decision":"accept"}'

Wait for the startConversation input to process, then inspect:

    npx convex run familiar/invitations:inspect '{"proposalId":"0001-accept"}'

Once conversationInput is ok, materialize the already-authorized acceptance:

    npx convex run familiar/invitations:materializeAccepted '{"proposalId":"0001-accept"}'

Wait for that input to process and inspect again. Expected causal order:

    proposal_created
    actor_accepted
    conversation_start_enqueued
    upstream_conversation_created
    upstream_invite_accept_enqueued

The inspection should show a live conversation only in this accepted case, and acceptInput should resolve successfully.

## 8. Freeze the specimen after evidence capture

    npx convex run testing:stop

Preserve the four inspect outputs with the experiment results. Do not infer success from the UI alone; the event ledger is the evidence.
