/**
 * NEON RUNNER - Power-up System
 * Advanced power-up mechanics with visual effects
 */

class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.activePowerUps = new Map();
        this.powerUpDefinitions = this.initializePowerUps();
        this.notificationContainer = document.getElementById('powerupNotifications');
    }
    
    initializePowerUps() {
        return {
            speed: {
                name: 'Time Warp',
                description: 'Slows down time',
                color: '#00ff00',
                icon: '⚡',
                duration: 5000,
                rarity: 0.3,
                effect: (game) => {
                    const originalSpeed = game.settings.gameSpeed;
                    game.settings.gameSpeed *= 0.6;
                    return () => {
                        game.settings.gameSpeed = originalSpeed;
                    };
                }
            },
            
            shield: {
                name: 'Neon Shield',
                description: 'Temporary invincibility',
                color: '#0099ff',
                icon: '🛡️',
                duration: 4000,
                rarity: 0.2,
                effect: (game) => {
                    game.player.invulnerable = true;
                    game.player.shieldActive = true;
                    return () => {
                        game.player.invulnerable = false;
                        game.player.shieldActive = false;
                    };
                }
            },
            
            score: {
                name: 'Score Multiplier',
                description: 'Double points for 10 seconds',
                color: '#ffff00',
                icon: '💎',
                duration: 10000,
                rarity: 0.25,
                effect: (game) => {
                    game.scoreMultiplier = (game.scoreMultiplier || 1) * 2;
                    return () => {
                        game.scoreMultiplier = (game.scoreMultiplier || 2) / 2;
                    };
                }
            },
            
            jump: {
                name: 'Anti-Gravity',
                description: 'Enhanced jumping ability',
                color: '#ff9900',
                icon: '🚀',
                duration: 8000,
                rarity: 0.25,
                effect: (game) => {
                    const originalJumpForce = game.settings.jumpForce;
                    const originalGravity = game.settings.gravity;
                    game.settings.jumpForce *= 1.4;
                    game.settings.gravity *= 0.7;
                    return () => {
                        game.settings.jumpForce = originalJumpForce;
                        game.settings.gravity = originalGravity;
                    };
                }
            },
            
            magnet: {
                name: 'Power Magnet',
                description: 'Attracts nearby power-ups',
                color: '#ff00ff',
                icon: '🧲',
                duration: 12000,
                rarity: 0.15,
                effect: (game) => {
                    game.player.magnetActive = true;
                    return () => {
                        game.player.magnetActive = false;
                    };
                }
            },
            
            ghost: {
                name: 'Phase Shift',
                description: 'Pass through obstacles',
                color: '#9999ff',
                icon: '👻',
                duration: 3000,
                rarity: 0.1,
                effect: (game) => {
                    game.player.ghostMode = true;
                    return () => {
                        game.player.ghostMode = false;
                    };
                }
            },
            
            lightning: {
                name: 'Lightning Rush',
                description: 'Destroys obstacles in path',
                color: '#ffff99',
                icon: '⚡',
                duration: 6000,
                rarity: 0.12,
                effect: (game) => {
                    game.player.lightningMode = true;
                    return () => {
                        game.player.lightningMode = false;
                    };
                }
            }
        };
    }
    
    spawnPowerUp(x, y) {
        // Select random power-up based on rarity
        const powerUpTypes = Object.keys(this.powerUpDefinitions);
        const raritySum = powerUpTypes.reduce((sum, type) => 
            sum + this.powerUpDefinitions[type].rarity, 0
        );
        
        let random = Math.random() * raritySum;
        let selectedType = null;
        
        for (const type of powerUpTypes) {
            random -= this.powerUpDefinitions[type].rarity;
            if (random <= 0) {
                selectedType = type;
                break;
            }
        }
        
        const powerUpDef = this.powerUpDefinitions[selectedType];
        
        return {
            type: selectedType,
            x: x || this.game.canvas.width,
            y: y || Math.random() * (this.game.canvas.height - 200) + 50,
            baseY: 0,
            width: 30,
            height: 30,
            rotation: 0,
            bob: Math.random() * Math.PI * 2,
            color: powerUpDef.color,
            pulseIntensity: 1,
            trailParticles: [],
            definition: powerUpDef
        };
    }
    
    updatePowerUps(deltaTime) {
        this.game.powerUps.forEach((powerUp, index) => {
            // Move power-up
            powerUp.x -= this.game.settings.gameSpeed;
            
            // Animate power-up
            powerUp.rotation += deltaTime * 3;
            powerUp.bob += deltaTime * 6;
            powerUp.y = powerUp.baseY + Math.sin(powerUp.bob) * 15;
            powerUp.pulseIntensity = 1 + Math.sin(Date.now() * 0.01) * 0.5;
            
            // Create trail particles
            if (Math.random() < 0.3) {
                powerUp.trailParticles.push({
                    x: powerUp.x + powerUp.width / 2,
                    y: powerUp.y + powerUp.height / 2,
                    life: 0.5,
                    maxLife: 0.5,
                    size: Math.random() * 3 + 1
                });
            }
            
            // Update trail particles
            powerUp.trailParticles.forEach((particle, particleIndex) => {
                particle.life -= deltaTime;
                if (particle.life <= 0) {
                    powerUp.trailParticles.splice(particleIndex, 1);
                }
            });
            
            // Magnet effect
            if (this.game.player.magnetActive) {
                this.applyMagnetEffect(powerUp);
            }
            
            // Remove off-screen power-ups
            if (powerUp.x + powerUp.width < -50) {
                this.game.powerUps.splice(index, 1);
            }
        });
        
        // Update active power-ups
        this.updateActivePowerUps(deltaTime);
    }
    
    applyMagnetEffect(powerUp) {
        const dx = this.game.player.x - powerUp.x;
        const dy = this.game.player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
            const force = 0.3;
            powerUp.x += (dx / distance) * force * (150 - distance) * 0.02;
            powerUp.y += (dy / distance) * force * (150 - distance) * 0.02;
        }
    }
    
    activatePowerUp(powerUp) {
        const definition = powerUp.definition;
        
        // Apply the power-up effect
        const cleanupFunction = definition.effect(this.game);
        
        // Store active power-up
        this.activePowerUps.set(powerUp.type, {
            endTime: Date.now() + definition.duration,
            cleanup: cleanupFunction,
            definition: definition
        });
        
        // Show notification
        this.showNotification(definition);
        
        // Create activation particles
        this.createActivationEffect(powerUp);
        
        // Update UI indicator
        this.updatePowerUpUI();
    }
    
    updateActivePowerUps(deltaTime) {
        const currentTime = Date.now();
        
        for (const [type, powerUp] of this.activePowerUps.entries()) {
            if (currentTime >= powerUp.endTime) {
                // Power-up expired, clean up
                if (powerUp.cleanup) {
                    powerUp.cleanup();
                }
                this.activePowerUps.delete(type);
                
                // Show expiration effect
                this.showExpirationEffect(powerUp.definition);
            }
        }
        
        // Update UI
        this.updatePowerUpUI();
    }
    
    showNotification(definition) {
        const notification = document.createElement('div');
        notification.className = 'powerup-notification';
        notification.innerHTML = `
            <span class="powerup-icon">${definition.icon}</span>
            <span class="powerup-text">${definition.name}</span>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    createActivationEffect(powerUp) {
        const particleCount = 20;
        const colors = [powerUp.color, '#ffffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 5 + Math.random() * 3;
            
            this.game.particles.push({
                x: powerUp.x + powerUp.width / 2,
                y: powerUp.y + powerUp.height / 2,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.5,
                maxLife: 1.5,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
        
        // Screen effect
        this.game.flash = 0.3;
    }
    
    showExpirationEffect(definition) {
        // Create subtle particles to indicate power-up ended
        for (let i = 0; i < 5; i++) {
            this.game.particles.push({
                x: this.game.player.x + this.game.player.width / 2,
                y: this.game.player.y + this.game.player.height / 2,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: (Math.random() - 0.5) * 4,
                color: definition.color,
                life: 0.8,
                maxLife: 0.8,
                alpha: 0.7,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    updatePowerUpUI() {
        // This could be expanded to show active power-ups in the UI
        // For now, we'll just update the player's visual state
        this.updatePlayerVisualEffects();
    }
    
    updatePlayerVisualEffects() {
        const player = this.game.player;
        
        // Reset visual effects
        player.glowColor = player.color;
        player.glowIntensity = 1;
        
        // Apply visual effects for active power-ups
        if (player.shieldActive) {
            player.glowColor = '#0099ff';
            player.glowIntensity = 2;
        }
        
        if (player.lightningMode) {
            player.glowColor = '#ffff99';
            player.glowIntensity = 2.5;
        }
        
        if (player.ghostMode) {
            player.alpha = 0.5;
        } else {
            player.alpha = 1;
        }
    }
    
    renderPowerUp(powerUp) {
        const ctx = this.game.ctx;
        
        // Render trail particles
        powerUp.trailParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = powerUp.color + Math.floor(alpha * 100).toString(16);
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
        });
        
        ctx.save();
        
        // Translate to power-up center
        ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        ctx.rotate(powerUp.rotation);
        
        // Render outer glow
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 25 * powerUp.pulseIntensity;
        
        // Render power-up base
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
        
        // Render inner glow
        ctx.shadowBlur = 0;
        ctx.fillStyle = powerUp.color + '88';
        ctx.fillRect(-powerUp.width / 2 + 4, -powerUp.height / 2 + 4, powerUp.width - 8, powerUp.height - 8);
        
        // Render icon (simplified as colored square for now)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -8, 16, 16);
        
        ctx.restore();
    }
    
    renderActivePowerUpIndicators() {
        const ctx = this.game.ctx;
        let yOffset = 10;
        
        for (const [type, activePowerUp] of this.activePowerUps.entries()) {
            const timeLeft = (activePowerUp.endTime - Date.now()) / 1000;
            const progress = timeLeft / (activePowerUp.definition.duration / 1000);
            
            // Render power-up indicator
            ctx.fillStyle = activePowerUp.definition.color;
            ctx.fillRect(10, yOffset, 100 * progress, 8);
            
            ctx.strokeStyle = activePowerUp.definition.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(10, yOffset, 100, 8);
            
            // Render name
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Orbitron';
            ctx.fillText(activePowerUp.definition.name, 120, yOffset + 8);
            
            yOffset += 20;
        }
    }
    
    // Check if a specific power-up is active
    isPowerUpActive(type) {
        return this.activePowerUps.has(type);
    }
    
    // Get remaining time for a power-up
    getPowerUpTimeLeft(type) {
        const powerUp = this.activePowerUps.get(type);
        if (!powerUp) return 0;
        
        return Math.max(0, powerUp.endTime - Date.now());
    }
    
    // Clear all active power-ups (for game reset)
    clearAllPowerUps() {
        for (const [type, powerUp] of this.activePowerUps.entries()) {
            if (powerUp.cleanup) {
                powerUp.cleanup();
            }
        }
        this.activePowerUps.clear();
    }
}

// Export for use in other modules
window.PowerUpManager = PowerUpManager;