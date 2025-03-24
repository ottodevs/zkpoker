import { Howl, Howler } from 'howler'

// Set the global HTML5 pool size to a higher value to avoid pool exhaustion
// Default is 5, increasing to prevent "HTML5 Audio pool exhausted" errors
Howler.html5PoolSize = 20

// Sound asset paths
const MUSIC_ASSETS = {
    LOBBY: '/sounds/music/lobby.mp3',
    TABLE: '/sounds/music/table.mp3',
}

const SFX_ASSETS = {
    CLICKFX: '/sounds/sfx/clickfx.mp3',
    CARD_DEAL: '/sounds/sfx/deal.mp3',
    CARD_FLIP: '/sounds/sfx/flopcard.mp3',
    CHIP_STACK: '/sounds/sfx/bet.mp3',
    BUTTON_CLICK: '/sounds/sfx/clickfx.mp3',
    BET: '/sounds/sfx/bet.mp3',
    CHECK: '/sounds/sfx/clickfx.mp3',
    CALL: '/sounds/sfx/smallbet.mp3',
    RAISE: '/sounds/sfx/bet.mp3',
    FOLD: '/sounds/sfx/smallbet.mp3',
    WIN: '/sounds/sfx/win.mp3',
    RAKE: '/sounds/sfx/rake.mp3',
}

// Sound player interface
interface ISoundPlayer {
    load(key: string, path: string, options: SoundOptions): void
    play(key: string): void
    stop(key: string): void
    setVolume(key: string, volume: number): void
    setMuted(muted: boolean): void
}

// Options for sound creation
interface SoundOptions {
    html5?: boolean
    volume?: number
    loop?: boolean
    preload?: boolean
}

// Base sound player class
class SoundPlayer implements ISoundPlayer {
    protected sounds: Map<string, Howl> = new Map()
    protected loadedResources: Set<string> = new Set() // Track loaded resources by key
    protected muted: boolean = false
    protected initialized: boolean = false

    public load(key: string, path: string, options: SoundOptions = {}): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        // Skip if this resource has already been loaded
        if (this.loadedResources.has(key)) return

        // Mark resource as loaded to prevent duplicate loading
        this.loadedResources.add(key)

        try {
            // Create the Howl instance with the sound
            const sound = new Howl({
                src: [path],
                ...options,
                html5: false, // Use Web Audio API by default to avoid HTML5 Audio pool issues
                onload: () => {
                    this.initialized = true
                },
                onloaderror: () => {
                    this.sounds.delete(key)
                    this.loadedResources.delete(key) // Allow retry on error
                },
            })

            this.sounds.set(key, sound)
        } catch {
            // Silent error handling
            this.loadedResources.delete(key) // Allow retry on error
        }
    }

    public play(key: string): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        if (this.muted) return

        const sound = this.sounds.get(key)
        if (sound) {
            sound.play()
        }
    }

    public stop(key: string): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        const sound = this.sounds.get(key)
        if (sound) {
            sound.stop()
        }
    }

    public setVolume(key: string, volume: number): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        const sound = this.sounds.get(key)
        if (sound) {
            sound.volume(volume)
        }
    }

    public setMuted(muted: boolean): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        this.muted = muted

        this.sounds.forEach(sound => {
            sound.mute(this.muted)
        })
    }

    public isMuted(): boolean {
        return this.muted
    }

    public isInitialized(): boolean {
        return this.initialized
    }

    // Check if a specific sound is loaded
    public isLoaded(key: string): boolean {
        return this.loadedResources.has(key)
    }
}

// Music player class
class MusicPlayer extends SoundPlayer {
    private volume: number = 0.3
    private enabled: boolean = false // Music is disabled by default
    private currentTrack: string | null = null

    // Load a music track
    public loadTrack(key: string, path: string): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        // Skip if already loaded
        if (this.isLoaded(key)) return

        this.load(key, path, {
            volume: this.volume,
            loop: true,
            preload: true,
            html5: true, // For streaming music, we need to use HTML5 mode
        })
    }

    // Play a specific music track
    public playTrack(trackKey: string): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        if (this.muted || !this.enabled) return

        // Stop current track if playing
        this.stopCurrentTrack()

        this.play(trackKey)
        this.currentTrack = trackKey
    }

    // Stop the currently playing track
    public stopCurrentTrack(): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        if (this.currentTrack) {
            this.stop(this.currentTrack)
            this.currentTrack = null
        }
    }

    // Set the volume for all music tracks
    public setMusicVolume(volume: number): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        this.volume = Math.max(0, Math.min(1, volume))

        this.sounds.forEach(sound => {
            sound.volume(this.volume)
        })
    }

    // Enable or disable music
    public setEnabled(enabled: boolean): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        this.enabled = enabled

        if (!this.enabled) {
            this.stopCurrentTrack()
        } else if (this.currentTrack) {
            // Restart current track if it was playing
            this.play(this.currentTrack)
        }
    }

    // Get music enabled state
    public isEnabled(): boolean {
        return this.enabled
    }
}

// Sound effects player class
class SfxPlayer extends SoundPlayer {
    private volume: number = 0.5

    // Load a sound effect
    public loadEffect(key: string, path: string): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        this.load(key, path, {
            volume: this.volume,
            preload: true,
        })
    }

    // Play a sound effect
    public playEffect(effectKey: string): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        if (this.muted) return

        this.play(effectKey)
    }

    // Set the volume for all sound effects
    public setSfxVolume(volume: number): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return

        this.volume = Math.max(0, Math.min(1, volume))

        this.sounds.forEach(sound => {
            sound.volume(this.volume)
        })
    }
}

// Main sound service that orchestrates both music and sound effects
class SoundService {
    private static instance: SoundService
    private musicPlayer: MusicPlayer
    private sfxPlayer: SfxPlayer
    private soundsLoaded: boolean = false
    private lobbyMusicLoaded: boolean = false

    private constructor() {
        this.musicPlayer = new MusicPlayer()
        this.sfxPlayer = new SfxPlayer()
    }

    public static getInstance(): SoundService {
        if (!SoundService.instance) {
            SoundService.instance = new SoundService()
        }
        return SoundService.instance
    }

    // Check if we're in browser environment
    private isClient(): boolean {
        return typeof window !== 'undefined'
    }

    // Preload only lobby music
    public preloadLobbyMusic(): void {
        if (!this.isClient()) return

        // Skip if already loaded
        if (this.lobbyMusicLoaded) return
        this.lobbyMusicLoaded = true

        // Load only lobby music
        this.musicPlayer.loadTrack('LOBBY', MUSIC_ASSETS.LOBBY)
    }

    // Preload all game sounds
    public preloadGameSounds(): void {
        if (!this.isClient()) return

        // Skip if already loaded
        if (this.soundsLoaded) return
        this.soundsLoaded = true

        // Load table music
        this.musicPlayer.loadTrack('TABLE', MUSIC_ASSETS.TABLE)

        // Load all sound effects
        Object.entries(SFX_ASSETS).forEach(([key, path]) => {
            this.sfxPlayer.loadEffect(key, path)
        })
    }

    // Play background music
    public playMusic(type: keyof typeof MUSIC_ASSETS): void {
        if (!this.isClient()) return

        this.musicPlayer.playTrack(type)
    }

    // Stop background music
    public stopMusic(): void {
        if (!this.isClient()) return

        this.musicPlayer.stopCurrentTrack()
    }

    // Play a sound effect
    public playSfx(type: keyof typeof SFX_ASSETS): void {
        if (!this.isClient()) return

        this.sfxPlayer.playEffect(type)
    }

    // Toggle mute state for all sounds
    public toggleMute(): boolean {
        if (!this.isClient()) return false

        const newMutedState = !this.isMuted()
        this.setMuted(newMutedState)
        return newMutedState
    }

    // Set muted state for all sounds
    public setMuted(muted: boolean): void {
        if (!this.isClient()) return

        this.musicPlayer.setMuted(muted)
        this.sfxPlayer.setMuted(muted)
    }

    // Check if sounds are muted
    public isMuted(): boolean {
        if (!this.isClient()) return false

        return this.musicPlayer.isMuted()
    }

    // Toggle music enabled/disabled
    public toggleMusicEnabled(): boolean {
        if (!this.isClient()) return false

        const newState = !this.musicPlayer.isEnabled()
        this.musicPlayer.setEnabled(newState)
        return newState
    }

    // Set music enabled state
    public setMusicEnabled(enabled: boolean): void {
        if (!this.isClient()) return

        this.musicPlayer.setEnabled(enabled)
    }

    // Check if music is enabled
    public isMusicEnabled(): boolean {
        if (!this.isClient()) return false

        return this.musicPlayer.isEnabled()
    }

    // Set music volume (0-1)
    public setMusicVolume(volume: number): void {
        if (!this.isClient()) return

        this.musicPlayer.setMusicVolume(volume)
    }

    // Set SFX volume (0-1)
    public setSfxVolume(volume: number): void {
        if (!this.isClient()) return

        this.sfxPlayer.setSfxVolume(volume)
    }

    // Check if sound system is initialized
    public isInitialized(): boolean {
        if (!this.isClient()) return false

        return this.musicPlayer.isInitialized() || this.sfxPlayer.isInitialized()
    }
}

export default SoundService.getInstance()
export { MUSIC_ASSETS as MUSIC, SFX_ASSETS as SFX }
