/**
 * NEON RUNNER - Advanced Particle System
 * High-performance particle effects with multiple systems
 */

class ParticleSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.emitters = [];
        this.maxParticles = 500;
        
        // Particle pools for performance
        this.particlePool = [];
        this.initializePool();
        
        // Background particle system
        this.backgroundParticles = [];
        this.initializeBackground();
        
        // Sound simulation (visual representation)
        this.soundWaves = [];
    }
    
    initializePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(this.createParticle());
        }
    }
    
    createParticle() {
        return {
            x: 0,
            y: 0,
            velocityX: 0,
            velocityY: 0,
            life: 0,
            maxLife: 1,
            size: 2,
            color: '#ffffff',
            alpha: 1,
            rotation: 0,
            rotationSpeed: 0,
            gravity: 0,
            bounce: 0,
            trail: [],
            type: 'basic',
            active: false,
            // Additional properties for different particle types
            pulse: 0,
            fadeRate: 1,
            sizeDecay: 0,
            colorShift: 0,
            magnetic: false,
            target: null
        };
    }
    
    getParticle() {
        // Try to reuse a particle from the pool
        for (let particle of this.particlePool) {
            if (!particle.active) {
                particle.active = true;
                return particle;
            }
        }
        
        // If pool is full, return null or create new particle
        if (this.particles.length < this.maxParticles) {
            const particle = this.createParticle();
            particle.active = true;
            return particle;
        }
        
        return null;
    }
    
    releaseParticle(particle) {
        particle.active = false;
        particle.trail = [];
        
        // Reset particle to default state
        Object.assign(particle, this.createParticle());
    }
    
    initializeBackground() {
        // Create floating background particles
        for (let i = 0; i < 30; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                velocityX: (Math.random() - 0.5) * 0.5,
                velocityY: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.3 + 0.1,
                pulse: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff'
            });
        }
    }
    
    // Explosion effect
    createExplosion(x, y, options = {}) {
        const {
            particleCount = 20,
            colors = ['#ff0000', '#ff6600', '#ffff00'],
            speed = 8,
            life = 1.5,
            size = 4
        } = options;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            
            Object.assign(particle, {
                x: x,
                y: y,
                velocityX: Math.cos(angle) * velocity,
                velocityY: Math.sin(angle) * velocity,
                life: life,
                maxLife: life,
                size: size * (0.5 + Math.random() * 0.5),
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                gravity: 0.2,
                type: 'explosion',
                fadeRate: 1 / life,
                sizeDecay: 0.02
            });
            
            this.particles.push(particle);
        }
    }
    
    // Trail effect (for player movement)
    createTrail(x, y, options = {}) {
        const {
            color = '#00ffff',
            life = 0.5,
            size = 3,
            count = 3
        } = options;
        
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            Object.assign(particle, {
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                velocityX: (Math.random() - 0.5) * 2,
                velocityY: (Math.random() - 0.5) * 2,
                life: life,
                maxLife: life,
                size: size,
                color: color,
                alpha: 0.8,
                type: 'trail',
                fadeRate: 1 / life
            });
            
            this.particles.push(particle);
        }
    }
    
    // Power-up collection effect
    createPowerUpEffect(x, y, color) {
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            
            Object.assign(particle, {
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                life: 1.2,
                maxLife: 1.2,
                size: 2 + Math.random() * 3,
                color: color,
                alpha: 1,
                type: 'powerup',
                pulse: Math.random() * Math.PI * 2,
                fadeRate: 0.8
            });
            
            this.particles.push(particle);
        }
        
        // Add some sparkle particles
        for (let i = 0; i < 8; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            Object.assign(particle, {
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                velocityX: 0,
                velocityY: -1 - Math.random() * 2,
                life: 2,
                maxLife: 2,
                size: 1 + Math.random() * 2,
                color: '#ffffff',
                alpha: 1,
                type: 'sparkle',
                fadeRate: 0.5
            });
            
            this.particles.push(particle);
        }
    }
    
    // Level up effect
    createLevelUpEffect() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Burst from center
        for (let i = 0; i < 40; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            const angle = (i / 40) * Math.PI * 2;
            const speed = 5 + Math.random() * 8;
            
            Object.assign(particle, {
                x: centerX,
                y: centerY,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                life: 3,
                maxLife: 3,
                size: 3 + Math.random() * 4,
                color: '#ffff00',
                alpha: 1,
                type: 'levelup',
                pulse: 0,
                fadeRate: 0.3
            });
            
            this.particles.push(particle);
        }
    }
    
    // Ambient particle spawner
    spawnAmbientParticles() {
        if (Math.random() < 0.1) {
            const particle = this.getParticle();
            if (!particle) return;
            
            Object.assign(particle, {
                x: this.canvas.width + 10,
                y: Math.random() * this.canvas.height,
                velocityX: -1 - Math.random() * 2,
                velocityY: (Math.random() - 0.5) * 0.5,
                life: 5,
                maxLife: 5,
                size: 1 + Math.random() * 2,
                color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff',
                alpha: 0.3 + Math.random() * 0.4,
                type: 'ambient',
                fadeRate: 0.2
            });
            
            this.particles.push(particle);
        }
    }
    
    // Sound wave effect (visual representation of sound)
    createSoundWave(x, y, options = {}) {
        const {
            color = '#00ffff',
            maxRadius = 100,
            duration = 1
        } = options;
        
        this.soundWaves.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: maxRadius,
            life: duration,
            maxLife: duration,
            color: color,
            alpha: 1
        });
    }
    
    update(deltaTime, gameSpeed = 1) {
        // Update regular particles
        this.updateParticles(deltaTime, gameSpeed);
        
        // Update background particles
        this.updateBackgroundParticles(deltaTime);
        
        // Update sound waves
        this.updateSoundWaves(deltaTime);
        
        // Spawn ambient particles
        this.spawnAmbientParticles();
        
        // Clean up inactive particles
        this.cleanupParticles();
    }
    
    updateParticles(deltaTime, gameSpeed) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.velocityX * deltaTime * 60;
            particle.y += particle.velocityY * deltaTime * 60;
            
            // Apply gravity
            if (particle.gravity) {
                particle.velocityY += particle.gravity * deltaTime * 60;
            }
            
            // Update life
            particle.life -= deltaTime;
            
            // Update alpha based on life
            particle.alpha = (particle.life / particle.maxLife) * particle.fadeRate;
            
            // Update size decay
            if (particle.sizeDecay) {
                particle.size = Math.max(0.1, particle.size - particle.sizeDecay * deltaTime * 60);
            }
            
            // Update rotation
            if (particle.rotationSpeed) {
                particle.rotation += particle.rotationSpeed * deltaTime;
            }
            
            // Type-specific updates
            this.updateParticleByType(particle, deltaTime);
            
            // Remove dead particles
            if (particle.life <= 0 || particle.alpha <= 0) {
                this.releaseParticle(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateParticleByType(particle, deltaTime) {
        switch (particle.type) {
            case 'powerup':
                particle.pulse += deltaTime * 10;
                particle.size = particle.size * (1 + Math.sin(particle.pulse) * 0.2);
                break;
                
            case 'sparkle':
                particle.rotation += deltaTime * 5;
                break;
                
            case 'levelup':
                particle.pulse += deltaTime * 8;
                const pulseFactor = 1 + Math.sin(particle.pulse) * 0.5;
                particle.size = particle.size * pulseFactor;
                break;
                
            case 'trail':
                // Fade more quickly
                particle.alpha *= 0.95;
                break;
        }
    }
    
    updateBackgroundParticles(deltaTime) {
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.velocityX * deltaTime * 60;
            particle.y += particle.velocityY * deltaTime * 60;
            
            // Pulse effect
            particle.pulse += deltaTime * 2;
            
            // Wrap around screen
            if (particle.x < -10) particle.x = this.canvas.width + 10;
            if (particle.x > this.canvas.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.canvas.height + 10;
            if (particle.y > this.canvas.height + 10) particle.y = -10;
        });
    }
    
    updateSoundWaves(deltaTime) {
        for (let i = this.soundWaves.length - 1; i >= 0; i--) {
            const wave = this.soundWaves[i];
            
            wave.life -= deltaTime;
            wave.radius += (wave.maxRadius / wave.maxLife) * deltaTime * 60;
            wave.alpha = wave.life / wave.maxLife;
            
            if (wave.life <= 0) {
                this.soundWaves.splice(i, 1);
            }
        }
    }
    
    cleanupParticles() {
        // Remove particles that are off-screen and won't be visible
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (particle.x < -50 || particle.x > this.canvas.width + 50 ||
                particle.y < -50 || particle.y > this.canvas.height + 50) {
                
                if (particle.type === 'ambient' || particle.life < 0) {
                    this.releaseParticle(particle);
                    this.particles.splice(i, 1);
                }
            }
        }
    }
    
    render() {
        // Render background particles first
        this.renderBackgroundParticles();
        
        // Render sound waves
        this.renderSoundWaves();
        
        // Render regular particles
        this.renderParticles();
    }
    
    renderBackgroundParticles() {
        this.backgroundParticles.forEach(particle => {
            const alpha = particle.alpha * (1 + Math.sin(particle.pulse) * 0.3);
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            this.ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // Set alpha
            this.ctx.globalAlpha = particle.alpha;
            
            // Apply rotation if needed
            if (particle.rotation) {
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.translate(-particle.x, -particle.y);
            }
            
            // Render based on type
            switch (particle.type) {
                case 'sparkle':
                    this.renderSparkleParticle(particle);
                    break;
                    
                case 'explosion':
                case 'powerup':
                case 'levelup':
                    this.renderGlowParticle(particle);
                    break;
                    
                default:
                    this.renderBasicParticle(particle);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    renderBasicParticle(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
    }
    
    renderGlowParticle(particle) {
        // Outer glow
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = particle.size * 2;
        
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
        
        // Inner bright core
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(
            particle.x - particle.size / 4,
            particle.y - particle.size / 4,
            particle.size / 2,
            particle.size / 2
        );
    }
    
    renderSparkleParticle(particle) {
        this.ctx.fillStyle = particle.color;
        
        // Draw cross shape for sparkle
        const halfSize = particle.size / 2;
        
        // Horizontal line
        this.ctx.fillRect(
            particle.x - halfSize,
            particle.y - 1,
            particle.size,
            2
        );
        
        // Vertical line
        this.ctx.fillRect(
            particle.x - 1,
            particle.y - halfSize,
            2,
            particle.size
        );
    }
    
    renderSoundWaves() {
        this.soundWaves.forEach(wave => {
            this.ctx.strokeStyle = wave.color + Math.floor(wave.alpha * 100).toString(16).padStart(2, '0');
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }
    
    // Utility methods
    getParticleCount() {
        return this.particles.length;
    }
    
    clearAllParticles() {
        this.particles.forEach(particle => this.releaseParticle(particle));
        this.particles = [];
        this.soundWaves = [];
    }
    
    // Performance monitoring
    getPerformanceStats() {
        return {
            activeParticles: this.particles.length,
            pooledParticles: this.particlePool.filter(p => !p.active).length,
            backgroundParticles: this.backgroundParticles.length,
            soundWaves: this.soundWaves.length
        };
    }
}

// Global particle system instance
window.ParticleSystem = ParticleSystem;