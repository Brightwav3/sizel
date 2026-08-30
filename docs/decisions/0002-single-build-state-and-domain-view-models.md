# ADR 0002: The active build has one state owner and domain-specific view-models

- **Status:** Accepted
- **Date:** 2026-08-30
- **Decision owners:** Rigsmith project

## Context

The application previously had two independent PC builds. `RigsmithApp` owned the build used by totals, compatibility, the floating summary, and checkout, while `BuilderScreen` created a separate local `Picks` state. The large `buildVals` function also assembled data for every route in one 700-line return object. A future WebMCP tool and the visible UI need to observe and mutate the same build deterministically.

## Decision

`AppState.picks` is the only owner of the active PC build. Every UI surface changes it through `RigsmithApp` actions. Shared calculations are created once in `buildContext.ts`, and route-specific value bags are assembled in `app/vals/*Vals.ts`. `buildVals.ts` is only the composition boundary.

## Rejected alternatives

- Keep local builder state and synchronize it with `AppState`: rejected because two writable copies can diverge and require conflict rules.
- Move all state into `BuilderScreen`: rejected because catalog, floating summary, cart, checkout, and WebMCP also need the build.
- Keep one large `buildVals` function: rejected because unrelated route changes would continue to share one high-conflict module.
- Introduce a third-party state library: rejected because the existing React class state already owns the required data and another dependency would not solve the ownership problem.

## Consequences

### Positive

- Builder changes immediately update compatibility, totals, the floating summary, and checkout.
- WebMCP can use the same stable state boundary as the UI.
- Route-specific view-model code can change independently.

### Costs

- Domain value builders share a typed calculation context.
- `RigsmithApp` remains the lifecycle owner until a deliberate state-management migration is accepted.

## Enforced in

- `src/app/state/AppState.ts`
- `src/app/App.tsx`
- `src/features/pc-builder/BuilderScreen.tsx`
- `src/entities/build/buildContext.ts`
- `src/entities/build/buildVals.ts`

## Explicit non-decisions

- This ADR does not define the WebMCP tool API.
- This ADR does not authorize a new global state library.
- This ADR does not require every screen to share one visual component system.
- This ADR does not change catalog records or compatibility rules.
