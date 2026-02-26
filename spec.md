# Game Vault

## Current State
The app has a basic loading screen (LoadingScreen.tsx) with a sunset gradient background, floating game controller emoji particles, the Game Vault logo image, a tagline, and a 3.6-second loading bar animation before fading out to the store.

## Requested Changes (Diff)

### Add
- A 60-second cinematic CSS/Canvas-based loading screen that simulates a "fly-through" into an Apple Store
- Scene 1 (0-15s): Exterior/entrance of an artistic Apple Store -- minimalist white + warm painterly light rays, ambient glow, glass doors
- Scene 2 (15-35s): Camera glides into the store interior, past wooden display tables with glowing devices
- Scene 3 (35-50s): Camera lands on an iPhone 17 on a display stand, screen lights up, Game Vault app "boots"
- Scene 4 (50-60s): "Game Vault" graffiti-style glowing logo appears on the phone screen with sunset neon colors (purple, orange, pink), then the whole screen fades out into the main store
- Generated static assets: Apple Store exterior scene, Apple Store interior scene, iPhone 17 on stand
- All animation done with CSS keyframes + layered divs (no video file needed)

### Modify
- Replace LoadingScreen.tsx entirely with the new cinematic version
- Duration extended from ~3.6s to 60s with auto-fade at 55s and complete at 60s

### Remove
- Old particle/emoji floating animation
- Old loading bar at the bottom
- Old gradient background (replaced by scene imagery)

## Implementation Plan
1. Generate 3 artistic images: Apple Store exterior, Apple Store interior with display tables, iPhone 17 on stand
2. Rewrite LoadingScreen.tsx using layered scene divs with CSS keyframe animations:
   - Scene transitions using opacity/scale to simulate camera fly-in
   - Parallax-style depth layers for the store fly-through
   - iPhone mockup layer with screen glow effect
   - Graffiti Game Vault logo on the phone screen with neon glow pulse
3. Fade-out at 55s, onComplete at 60s

## UX Notes
- The animation should feel cinematic but not jarring -- smooth easing throughout
- The Apple Store aesthetic is artistic/painterly, not photorealistic corporate
- The iPhone screen glow should match the Game Vault sunset palette (purple, orange, hot pink)
- After the logo appears on phone screen, a subtle "tap to enter" is NOT shown -- it auto-fades
