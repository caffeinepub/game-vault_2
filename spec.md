# Game Vault

## Current State
The loading screen (`LoadingScreen.tsx`) is an Xbox One-style boot sequence (Xbox green background, "G" logo, "Game Vault" text, startup chime) that runs for 35 seconds before calling `onComplete` to transition to the store. There is no way for users to skip it.

## Requested Changes (Diff)

### Add
- A "Skip" button visible on the loading screen that, when clicked, immediately calls `onComplete` and transitions to the store.

### Modify
- `LoadingScreen.tsx`: Add a skip button (bottom-center of screen) that clears all pending timers and calls `onComplete` immediately.

### Remove
- Nothing removed.

## Implementation Plan
1. Add a `useRef` to hold the timer IDs so they can be cleared on skip.
2. Extract the `skip` handler: clear all timers, close audio context, fade out immediately, call `onComplete`.
3. Render a "Skip" button in the bottom-center of the loading screen with subtle styling matching the Xbox green theme (white text, semi-transparent background).
