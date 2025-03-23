# ZKPoker Sound Implementation

This document provides information about the sound system in ZKPoker and how to add or customize sounds.

## Sound Structure

The application uses Howler.js for audio playback. Sounds are organized into two categories:

1. **Background Music** - Located in `/public/sounds/music/`
2. **Sound Effects** - Located in `/public/sounds/sfx/`

## Required Sound Files

Place the following files in their respective directories:

### Background Music

- `/public/sounds/music/lobby.mp3` - Ambient music for the lobby/dashboard
- `/public/sounds/music/table.mp3` - Music for the poker table

### Sound Effects

- `/public/sounds/sfx/card_deal.mp3` - Sound of dealing cards
- `/public/sounds/sfx/card_flip.mp3` - Sound of flipping cards
- `/public/sounds/sfx/chip_stack.mp3` - Sound of chips stacking
- `/public/sounds/sfx/button_click.mp3` - UI button click sound
- `/public/sounds/sfx/bet.mp3` - Betting sound
- `/public/sounds/sfx/check.mp3` - Check action sound
- `/public/sounds/sfx/call.mp3` - Call action sound
- `/public/sounds/sfx/raise.mp3` - Raise action sound
- `/public/sounds/sfx/fold.mp3` - Fold action sound
- `/public/sounds/sfx/win.mp3` - Winning sound

## Recommended Sound Sources

You can obtain royalty-free poker sound effects and ambient music from:

1. [Freesound.org](https://freesound.org/) - Search for "poker", "cards", or "chips"
2. [Pixabay](https://pixabay.com/sound-effects/) - Free sound effects
3. [Zapsplat](https://www.zapsplat.com/) - Free sound effects (requires account)
4. [Mixkit](https://mixkit.co/free-sound-effects/) - Free sound effects

For background music, consider:

1. [Pixabay Music](https://pixabay.com/music/)
2. [Free Music Archive](https://freemusicarchive.org/)

## Sound File Requirements

- Format: MP3 or OGG (MP3 recommended for wider compatibility)
- Background music: 1-3 minutes loopable tracks, around 128kbps
- Sound effects: Short, clear sounds (0.5-2 seconds), around 192kbps
- Keep file sizes small (under 1MB for music, under 100KB for effects)

## Using the Sound Service

The sound system is implemented as a singleton service at `src/services/SoundService.ts`.

You can use it in your components like this:

```typescript
// Import the service
import soundService from "@/services/SoundService";

// Initialize on component mount
useEffect(() => {
  soundService.preloadSounds();
  soundService.playMusic("LOBBY"); // or 'TABLE'

  // Cleanup on unmount
  return () => {
    soundService.stopMusic();
  };
}, []);

// Play a sound effect
const handleClick = () => {
  soundService.playSfx("BUTTON_CLICK");
};
```

## Sound Control UI

The application includes a sound control UI component that lets users:

- Mute/unmute all sounds
- Adjust music volume
- Adjust sound effects volume

This component is implemented in `src/components/SoundToggle.tsx`.
