/**
 * NEON RUNNER - Main Game Controller
 * Orchestrates all game systems and UI interactions
 */

class GameController {
    constructor() {
        this.game = null;
        this.powerUpManager = null;
        this.particleSystem = null;
        this.audioManager = null;
        
        // UI Elements
        this.elements = {
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            startBtn: document.getElementById('startBtn'),
            restartBtn: document.getElementById('restartBtn'),
            menuBtn: document.getElementById('menuBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            pauseMenuBtn: document.getElementById('pauseMenuBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            soundBtn: document.getElementById('soundBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn')
        };
        
        this.soundEnabled = true;
        this.isFullscreen = false;
        
        this.init();
    }
    
    init() {
        this.setupUI();
        this.setupAudio();
        this.initializeGame();
    }
    
    setupUI() {
        // Button event listeners
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.elements.menuBtn.addEventListener('click', () => this.showMainMenu());
        this.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.elements.pauseMenuBtn.addEventListener('click', () => this.pauseToMenu());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.soundBtn.addEventListener('click', () => this.toggleSound());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Escape':
                    if (this.game && this.game.gameState === 'playing') {
                        this.togglePause();
                    }
                    break;
                case 'Space':
                    e.preventDefault();
                    if (this.game && this.game.gameState === 'menu') {
                        this.startGame();
                    }
                    break;
                case 'KeyM':
                    this.toggleSound();
                    break;
                case 'KeyF':
                    this.toggleFullscreen();
                    break;
            }
        });
        
        // Prevent context menu on canvas
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle window focus/blur for auto-pause
        window.addEventListener('blur', () => {
            if (this.game && this.game.gameState === 'playing') {
                this.game.pauseGame();
                this.showPauseScreen();
            }
        });
        
        // Handle fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenButton();
        });
    }
    
    setupAudio() {
        // Initialize Web Audio API for sound effects
        this.audioManager = new AudioManager();
        this.updateSoundButton();
    }
    
    initializeGame() {
        // Create game instance
        this.game = new NeonRunner('gameCanvas');
        
        // Initialize managers
        this.powerUpManager = new PowerUpManager(this.game);
        this.particleSystem = new ParticleSystem(this.game.canvas, this.game.ctx);
        
        // Integrate systems with the game
        this.integrateGameSystems();
        
        // Load saved settings
        this.loadSettings();
    }
    
    integrateGameSystems() {
        // Override game methods to integrate particle system
        const originalCreateParticles = this.game.createParticles.bind(this.game);
        this.game.createParticles = (x, y, color, count, options = {}) => {
            this.particleSystem.createExplosion(x, y, {
                particleCount: count,
                colors: [color],
                ...options
            });
        };
        
        // Override power-up spawning
        const originalSpawnPowerUp = this.game.spawnPowerUp.bind(this.game);
        this.game.spawnPowerUp = () => {
            const powerUp = this.powerUpManager.spawnPowerUp();
            powerUp.baseY = powerUp.y;
            this.game.powerUps.push(powerUp);
        };
        
        // Override power-up collision handling
        const originalHandlePowerUpCollision = this.game.handlePowerUpCollision.bind(this.game);
        this.game.handlePowerUpCollision = (powerUp, index) => {
            // Remove from game array
            this.game.powerUps.splice(index, 1);
            
            // Apply power-up effect through manager
            this.powerUpManager.activatePowerUp(powerUp);
            
            // Create visual effect
            this.particleSystem.createPowerUpEffect(powerUp.x, powerUp.y, powerUp.color);
            
            // Play sound
            this.audioManager.playSound('powerup');
        };
        
        // Override obstacle collision
        const originalHandleObstacleCollision = this.game.handleObstacleCollision.bind(this.game);
        this.game.handleObstacleCollision = (obstacle, index) => {
            // Check if player has shield
            if (this.game.player.invulnerable) {
                // Destroy obstacle instead
                this.game.obstacles.splice(index, 1);
                this.particleSystem.createExplosion(obstacle.x, obstacle.y, {
                    colors: ['#0099ff', '#ffffff']
                });
                this.audioManager.playSound('shield');
                return;
            }
            
            // Normal collision
            originalHandleObstacleCollision(obstacle, index);
            this.audioManager.playSound('hit');
        };
        
        // Override jump method
        const originalJump = this.game.jump.bind(this.game);
        this.game.jump = () => {
            if (this.game.player.onGround || this.game.player.y > this.game.canvas.height / 2) {
                originalJump();
                
                // Add sound and particles
                this.audioManager.playSound('jump');
                this.particleSystem.createTrail(
                    this.game.player.x,
                    this.game.player.y + this.game.player.height,
                    { color: '#00ffff', count: 5 }
                );
            }
        };
        
        // Override level up
        const originalCreateLevelUpEffect = this.game.createLevelUpEffect.bind(this.game);
        this.game.createLevelUpEffect = () => {
            originalCreateLevelUpEffect();
            this.particleSystem.createLevelUpEffect();
            this.audioManager.playSound('levelup');
        };
        
        // Override game update to include new systems
        const originalUpdate = this.game.update.bind(this.game);
        this.game.update = (deltaTime) => {
            originalUpdate(deltaTime);
            
            // Update integrated systems
            this.powerUpManager.updatePowerUps(deltaTime);
            this.particleSystem.update(deltaTime, this.game.settings.gameSpeed);
        };
        
        // Override rendering to include new systems
        const originalRender = this.game.render.bind(this.game);
        this.game.render = () => {
            // Clear canvas
            this.game.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            
            // Apply screen shake
            if (this.game.screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * this.game.screenShake;
                const shakeY = (Math.random() - 0.5) * this.game.screenShake;
                this.game.ctx.translate(shakeX, shakeY);
            }
            
            // Render particle system background
            this.particleSystem.render();
            
            // Render game background
            this.game.renderBackground();
            
            // Render player trail
            if (this.game.player.trail.length > 0) {
                this.game.player.trail.forEach(point => {
                    this.game.ctx.fillStyle = `rgba(0, 255, 255, ${point.alpha})`;
                    this.game.ctx.fillRect(point.x, point.y, this.game.player.width * 0.8, this.game.player.height * 0.8);
                });
            }
            
            // Render game objects
            this.game.renderPlayer();
            this.game.renderObstacles();
            
            // Render power-ups with enhanced effects
            this.game.powerUps.forEach(powerUp => {
                this.powerUpManager.renderPowerUp(powerUp);
            });
            
            // Render active power-up indicators
            this.powerUpManager.renderActivePowerUpIndicators();
            
            // Apply flash effect
            if (this.game.flash > 0) {
                this.game.ctx.fillStyle = `rgba(255, 255, 255, ${this.game.flash})`;
                this.game.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
            }
            
            // Reset transformations
            this.game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        };
    }
    
    startGame() {
        this.hideAllScreens();
        this.game.startGame();
        this.audioManager.playSound('start');
        
        // Create start effect
        this.particleSystem.createExplosion(
            this.game.canvas.width / 2,
            this.game.canvas.height / 2,
            { colors: ['#00ffff', '#ff00ff', '#ffffff'], particleCount: 30 }
        );
    }
    
    restartGame() {
        this.hideAllScreens();
        this.powerUpManager.clearAllPowerUps();
        this.particleSystem.clearAllParticles();
        this.game.startGame();
        this.audioManager.playSound('start');
    }
    
    showMainMenu() {
        this.hideAllScreens();
        this.game.gameState = 'menu';
        this.elements.startScreen.classList.add('active');
        
        if (this.game.animationId) {
            cancelAnimationFrame(this.game.animationId);
        }
    }
    
    togglePause() {
        if (this.game.gameState === 'playing') {
            this.game.pauseGame();
            this.showPauseScreen();
            this.audioManager.playSound('pause');
        } else if (this.game.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        this.hideAllScreens();
        this.game.resumeGame();
        this.audioManager.playSound('resume');
    }
    
    pauseToMenu() {
        this.powerUpManager.clearAllPowerUps();
        this.showMainMenu();
    }
    
    showPauseScreen() {
        this.hideAllScreens();
        this.elements.pauseScreen.classList.add('active');
    }
    
    hideAllScreens() {
        this.elements.startScreen.classList.remove('active');
        this.elements.gameOverScreen.classList.remove('active');
        this.elements.pauseScreen.classList.remove('active');
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.audioManager.setEnabled(this.soundEnabled);
        this.updateSoundButton();
        this.saveSettings();
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen not supported:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    updateSoundButton() {
        const icon = this.elements.soundBtn.querySelector('i');
        if (this.soundEnabled) {
            icon.className = 'fas fa-volume-up';
            this.elements.soundBtn.classList.remove('muted');
        } else {
            icon.className = 'fas fa-volume-mute';
            this.elements.soundBtn.classList.add('muted');
        }
    }
    
    updateFullscreenButton() {
        const icon = this.elements.fullscreenBtn.querySelector('i');
        icon.className = this.isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
    }
    
    loadSettings() {
        const settings = localStorage.getItem('neonRunnerSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.soundEnabled = parsed.soundEnabled !== false;
            this.audioManager.setEnabled(this.soundEnabled);
            this.updateSoundButton();
        }
    }
    
    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled
        };
        localStorage.setItem('neonRunnerSettings', JSON.stringify(settings));
    }
    
    // Performance monitoring
    showPerformanceStats() {
        const stats = {
            fps: this.game.fps,
            particles: this.particleSystem.getPerformanceStats(),
            activePowerUps: this.powerUpManager.activePowerUps.size
        };
        
        console.log('Performance Stats:', stats);
        return stats;
    }
}

/**
 * Simple Audio Manager using Web Audio API
 */
class AudioManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.audioContext = null;
        
        // Initialize audio context on first user interaction
        this.initializeAudio();
        this.createSounds();
    }
    
    initializeAudio() {
        // Audio will be initialized on first user interaction due to browser policies
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createSounds();
            }
        }, { once: true });
    }
    
    createSounds() {
        // Create procedural audio for web game (no external files needed)
        this.sounds = {
            jump: () => this.createTone(440, 0.1, 'square'),
            hit: () => this.createNoise(0.2, 0.1),
            powerup: () => this.createChord([523, 659, 784], 0.3, 'sine'),
            levelup: () => this.createSweep(220, 880, 0.5),
            start: () => this.createChord([261, 329, 392], 0.4, 'triangle'),
            pause: () => this.createTone(330, 0.2, 'sine'),
            resume: () => this.createTone(440, 0.2, 'sine'),
            shield: () => this.createTone(880, 0.15, 'sawtooth')
        };
    }
    
    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createNoise(volume, duration) {
        if (!this.audioContext || !this.enabled) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
    }
    
    createChord(frequencies, duration, type = 'sine') {
        frequencies.forEach(freq => {
            this.createTone(freq, duration, type);
        });
    }
    
    createSweep(startFreq, endFreq, duration) {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSound(soundName) {
        if (this.sounds[soundName] && this.enabled) {
            this.sounds[soundName]();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
    
    // Add performance monitoring in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Show performance stats every 5 seconds in development
        setInterval(() => {
            if (window.gameController) {
                window.gameController.showPerformanceStats();
            }
        }, 5000);
    }
});

// Add keyboard shortcut info to console
console.log(`
🎮 NEON RUNNER - Keyboard Shortcuts:
  SPACE - Start Game / Jump
  ↑/↓   - Jump / Duck
  ESC   - Pause/Resume
  M     - Toggle Sound
  F     - Toggle Fullscreen
  
💡 Pro Tips:
  • Collect power-ups for special abilities
  • Score increases speed and difficulty
  • Use shield power-up to pass through obstacles
  • Try the magnet power-up to collect more items
`);

// Export for global access
window.GameController = GameController;
window.AudioManager = AudioManager;