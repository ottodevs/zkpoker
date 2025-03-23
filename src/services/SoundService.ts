import { Howl } from 'howler';

// Sound categories
const MUSIC = {
  LOBBY: '/sounds/music/lobby.mp3',
  TABLE: '/sounds/music/table.mp3',
};

const SFX = {
  CARD_DEAL: '/sounds/sfx/card_deal.mp3',
  CARD_FLIP: '/sounds/sfx/card_flip.mp3',
  CHIP_STACK: '/sounds/sfx/chip_stack.mp3',
  BUTTON_CLICK: '/sounds/sfx/button_click.mp3',
  BET: '/sounds/sfx/bet.mp3',
  CHECK: '/sounds/sfx/check.mp3',
  CALL: '/sounds/sfx/call.mp3',
  RAISE: '/sounds/sfx/raise.mp3',
  FOLD: '/sounds/sfx/fold.mp3',
  WIN: '/sounds/sfx/win.mp3',
};

// Track currently playing sounds
let currentMusic: Howl | null = null;

class SoundService {
  private static instance: SoundService;
  private muted: boolean = false;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  private soundsLoaded: boolean = false;
  private sounds: Map<string, Howl> = new Map();
  private filesExist: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  // Check if a file exists
  private async fileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`Error checking if file exists: ${url}`, error);
      return false;
    }
  }

  // Preload all sounds
  public preloadSounds() {
    if (this.soundsLoaded) return;
    
    // Create sounds with error handling
    const createSound = (key: string, path: string, options: any) => {
      const sound = new Howl({
        src: [path],
        ...options,
        onloaderror: () => {
          console.warn(`Failed to load sound: ${path}`);
        }
      });
      
      this.sounds.set(key, sound);
    };

    // Load music
    Object.entries(MUSIC).forEach(([key, path]) => {
      createSound(key, path, {
        html5: true,
        volume: this.musicVolume,
        loop: true,
        preload: true,
      });
    });

    // Load sound effects
    Object.entries(SFX).forEach(([key, path]) => {
      createSound(key, path, {
        volume: this.sfxVolume,
        preload: true,
      });
    });

    this.soundsLoaded = true;
    
    // Log a notice for the user about missing sound files
    console.info('Sound system initialized. To hear sounds, you need to add sound files to the public/sounds directory.');
  }

  // Play background music
  public playMusic(type: keyof typeof MUSIC) {
    if (this.muted) return;
    
    // Stop current music if any
    this.stopMusic();

    const music = this.sounds.get(type);
    if (music) {
      music.play();
      currentMusic = music;
    } else {
      console.warn(`Music ${type} not found`);
    }
  }

  // Stop background music
  public stopMusic() {
    if (currentMusic) {
      currentMusic.stop();
      currentMusic = null;
    }
  }

  // Play a sound effect
  public playSfx(type: keyof typeof SFX) {
    if (this.muted) return;
    
    const sound = this.sounds.get(type);
    if (sound) {
      sound.play();
    } else {
      console.warn(`Sound effect ${type} not found`);
    }
  }

  // Mute/unmute all sounds
  public toggleMute() {
    this.muted = !this.muted;
    
    this.sounds.forEach(sound => {
      sound.mute(this.muted);
    });
    
    return this.muted;
  }

  // Set music volume (0-1)
  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    Object.keys(MUSIC).forEach(key => {
      const sound = this.sounds.get(key);
      if (sound) {
        sound.volume(this.musicVolume);
      }
    });
  }

  // Set SFX volume (0-1)
  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    Object.keys(SFX).forEach(key => {
      const sound = this.sounds.get(key);
      if (sound) {
        sound.volume(this.sfxVolume);
      }
    });
  }
}

export default SoundService.getInstance();
export { MUSIC, SFX }; 