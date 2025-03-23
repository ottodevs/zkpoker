import { Howl } from 'howler';

// Sound categories
const MUSIC = {
  LOBBY: '/sounds/music/lobby.mp3',
  TABLE: '/sounds/music/table.mp3',
};

const SFX = {
  CLICKFX: '/sounds/sfx/clickfx.mp3',
  CARD_DEAL: '/sounds/sfx/deal.mp3',
  CARD_FLIP: '/sounds/sfx/flopcard.mp3',
  CHIP_STACK: '/sounds/sfx/chip_stack.mp3',
  BUTTON_CLICK: '/sounds/sfx/clickfx.mp3',
  BET: '/sounds/sfx/bet.mp3',
  CHECK: '/sounds/sfx/clickfx.mp3',
  CALL: '/sounds/sfx/smallbet.mp3',
  RAISE: '/sounds/sfx/bet.mp3',
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

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  // Create a sound with error handling
  private createSound(key: string, path: string, options: Partial<{
    html5: boolean;
    volume: number;
    loop: boolean;
    preload: boolean;
  }> = {}) {
    try {
      const sound = new Howl({
        src: [path],
        ...options,
        onloaderror: () => {
          console.warn(`Failed to load sound: ${path}`);
          this.sounds.delete(key); // Remove failed sound from the map
        }
      });
      
      this.sounds.set(key, sound);
    } catch (error) {
      console.warn(`Error creating sound for ${path}:`, error);
    }
  }

  // Preload lobby music only
  public preloadLobbyMusic() {
    // Only load if not already loaded
    if (this.sounds.has('LOBBY')) return;
    
    this.createSound('LOBBY', MUSIC.LOBBY, {
      html5: true,
      volume: this.musicVolume,
      loop: true,
      preload: true,
    });
  }

  // Preload all game sounds (for use in the poker room)
  public preloadGameSounds() {
    if (this.soundsLoaded) return;
    
    // Load table music
    this.createSound('TABLE', MUSIC.TABLE, {
      html5: true,
      volume: this.musicVolume,
      loop: true,
      preload: true,
    });

    // Load sound effects
    Object.entries(SFX).forEach(([key, path]) => {
      this.createSound(key, path, {
        volume: this.sfxVolume,
        preload: true,
      });
    });

    this.soundsLoaded = true;
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
    }
  }

  // Stop background music
  public stopMusic() {
    if (currentMusic) {
      currentMusic.stop();
      currentMusic = null;
    }
  }

  // Play a sound effect with error handling
  public playSfx(type: keyof typeof SFX) {
    if (this.muted) return;
    
    const sound = this.sounds.get(type);
    if (sound) {
      sound.play();
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