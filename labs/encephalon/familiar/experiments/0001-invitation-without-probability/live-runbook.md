# Live Convex runbook — Familiar 0001 / 0001.1

This runbook assumes the zero-agent world already exists in the disposable Convex development deployment.

## 1. Apply and deploy the overlay

From the Sanctum repository root:

    bash labs/encephalon/familiar/overlays/0001/apply.sh
    cd .external/ai-town
    npx convex dev --once

Do not run `npm audit fix --force`; the checkout is a pinned research specimen.

## 2. Ensure the world engine is running

    npx convex run testing:resume
    npx convex run familiar/invitations:defaultWorld

If queued inputs do not process even while world status reports `running`, refresh observation state:

    npx convex run world:heartbeatWorld '{"worldId":"WORLD_ID"}'

AI Town's inactivity cron can stop the engine when `lastViewed` is stale even after `testing:resume`; the heartbeat refreshes `lastViewed` and restarts an inactive world.

## 3. Create two non-agent witnesses

    npx convex run familiar/invitations:setupSyntheticPair
    npx convex run familiar/invitations:syntheticPair

Copy the returned `a.playerId` and `b.playerId` values.

## 4. Negative controls

Run decline, defer, and ignore/expiry as documented in the original 0001 evidence. Each must show no conversation input and no live conversation.

## 5. Clear any prior positive-control conversation

If the earlier 0001 positive control left `c:2` active between the witnesses, close that specimen before creating the v2 proposal:

    npx convex run aiTown/main:sendInput '{"worldId":"WORLD_ID","name":"leaveConversation","args":{"playerId":"PLAYER_A","conversationId":"c:2"}}'
    sleep 2
    npx convex run familiar/invitations:defaultWorld

Expected before the v2 proposal: `conversations: 0`.

## 6. 0001.1 accepted path — run last

    npx convex run familiar/invitations:createProposal '{"proposalId":"0001-accept-v2","inviter":"PLAYER_A","invitee":"PLAYER_B","ttlMs":60000}'
    npx convex run familiar/invitations:decide '{"proposalId":"0001-accept-v2","actorId":"PLAYER_B","decision":"accept"}'
    npx convex run familiar/invitations:inspect '{"proposalId":"0001-accept-v2"}'

At this inspection the required state is:

- `actor_accepted` exists;
- `conversationInput` is null;
- `liveConversation` is null.

Only then enact the accepted proposal:

    npx convex run familiar/invitations:enactAccepted '{"proposalId":"0001-accept-v2"}'
    sleep 2
    npx convex run familiar/invitations:inspect '{"proposalId":"0001-accept-v2"}'

Once `conversationInput` is `ok`, materialize the already-authorized upstream invitation acceptance:

    npx convex run familiar/invitations:materializeAccepted '{"proposalId":"0001-accept-v2"}'
    sleep 2
    npx convex run familiar/invitations:inspect '{"proposalId":"0001-accept-v2"}'

Expected causal order:

    proposal_created
    actor_accepted
    enactment_requested
    conversation_start_enqueued
    upstream_conversation_created
    upstream_invite_accept_enqueued

## 7. Freeze after evidence capture

    npx convex run testing:stop

Preserve the inspect outputs. Do not infer success from the UI alone; the event ledger is the evidence.
