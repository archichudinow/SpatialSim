PERFORMANCE SYSTEM DEVELOPMENT


Purpose

This document defines how performance instrumentation is applied in our r3f / Three.js codebase without polluting feature code.

Performance tooling is opt-in, centralized, and removable.
Feature modules never own performance logic.

Core Mental Model

Performance issues fall into four independent layers:

React – re-renders, state churn

r3f / Three.js CPU – scene graph, buffer uploads

GPU – draw calls, fragment cost, shader passes

Sync – CPU↔GPU stalls

Instrumentation exists to attribute cost to systems, not to measure everything.

Architecture (Non-Negotiable)

We use three layers only:

Performance Runtime

Central collector

Frame-aware

No React state

Aggregates, downsamples, exports metrics

Instrumentation API

Minimal “scope” and “counter” abstractions

No business logic

Zero-cost when disabled

Feature Modules

Opt-in usage only

Declare what is being measured, never how

Feature code must remain readable even if all perf tooling is removed.

What Gets Instrumented

We instrument boundaries, not internals.

Valid instrumentation boundaries

Per-frame update blocks

Buffer upload/update steps

Shader pass execution

Postprocessing passes

Data ingestion / simulation steps

Invalid instrumentation

Inside tight loops

Inside shaders

Inside React render bodies

Per-object or per-entity updates

If something runs per entity, measure the system, not the entity.

Scoping Rules

One scope = one meaningful system

Scopes must be stable and named

Scopes represent ownership, not implementation detail

Examples of valid scope names:

heatmap:update

particles:simulation

buffers:upload

postprocess:bloom

Avoid:

Function names

File paths

Dynamic labels

Levels of Instrumentation
Level 1 – Frame health

FPS

Frame time

GPU time

Level 2 – System attribution

React render cost

r3f update cost

CPU render cost

GPU render cost

Level 3 – Subsystems

Heatmap accumulation

Buffer updates

Instancing systems

Postprocessing passes

Instrumentation level must be configurable.

Performance Runtime Rules

Runs outside React

Uses ring buffers, not logs

Aggregates over time windows

Samples at reduced frequency

Disabled by default in production

Performance data must never drive core logic directly.

UI & Visualization Rules

Performance UI polls data periodically

UI updates at low frequency (5–10 Hz)

No per-frame React state updates

UI is diagnostic, not authoritative

What This System Prevents

Scattered performance.now() calls

Debug code leaking into production

React re-render storms

Misattributed bottlenecks

Performance fixes based on guesses

Design Goal

The system should answer:

“Which system is responsible for this frame being slow?”

—not—

“What is the FPS?”

Final Rule

If performance tooling makes feature code harder to read,
the instrumentation is wrong.