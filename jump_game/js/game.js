/**
 * NEON RUNNER - Core Game Engine
 * Modern HTML5 Canvas Game with Advanced Mechanics
 */

class NeonRunner {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game State
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Game Settings
        this.settings = {
            gravity: 0.5,
            jumpForce: -12,
            gameSpeed: 3,
            baseSpeed: 3,
            speedIncrement: 0.1,
            levelThreshold: 1000
        };
        
        // Player Object
        this.player = {
            x: 100,
            y: 250,
            width: 30,
            height: 30,
            velocityY: 0,
            onGround: false,
            trail: [],
            color: '#00ffff',
            glowIntensity: 1
        };
        
        // Game Objects
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        this.backgroundObjects = [];
        
        // Input Handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // Animation
        this.lastTime = 0;
        this.animationId = null;
        
        // Visual Effects
        this.screenShake = 0;
        this.flash = 0;
        this.backgroundOffset = 0;
        
        // Performance Tracking
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.generateBackground();
        this.loadFromStorage();
    }
    
    setupCanvas() {
        // Set canvas size with device pixel ratio for crisp rendering
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Set canvas display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupEventListeners() {
        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleInput(e.code, true);
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse/Touch Events
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.clicked = true;
            this.handleInput('mouse', true);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
        });
        
        // Touch Events for Mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.handleInput('touch', true);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
        
        // Window Resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }
    
    handleInput(input, pressed) {
        if (!pressed) return;
        
        switch (this.gameState) {
            case 'playing':
                if (input === 'Space' || input === 'ArrowUp' || input === 'mouse' || input === 'touch') {
                    this.jump();
                }
                if (input === 'ArrowDown') {
                    this.duck();
                }
                if (input === 'Escape') {
                    this.pauseGame();
                }
                break;
        }
    }
    
    jump() {
        if (this.player.onGround || this.player.y > this.canvas.height / 2) {
            this.player.velocityY = this.settings.jumpForce;
            this.player.onGround = false;
            
            // Create jump particles
            this.createParticles(this.player.x, this.player.y + this.player.height, '#00ffff', 8);
            
            // Screen effect
            this.flash = 0.3;
        }
    }
    
    duck() {
        if (this.player.onGround) {
            this.player.velocityY = 5;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.settings.gameSpeed = this.settings.baseSpeed;
        
        // Reset player
        this.player.x = 100;
        this.player.y = 250;
        this.player.velocityY = 0;
        this.player.onGround = false;
        this.player.trail = [];
        
        // Clear game objects
        this.obstacles = [];
        this.powerUps = [];
        this.particles = [];
        
        // Reset effects
        this.screenShake = 0;
        this.flash = 0;
        this.backgroundOffset = 0;
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
        
        // Update UI
        this.updateUI();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            cancelAnimationFrame(this.animationId);
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    endGame() {
        this.gameState = 'gameOver';
        cancelAnimationFrame(this.animationId);
        
        // Save high score
        this.saveToStorage();
        
        // Create explosion effect
        this.createParticles(this.player.x, this.player.y, '#ff0000', 20);
        this.screenShake = 20;
        
        // Update final score display
        document.getElementById('finalScore').textContent = this.score;
        
        // Generate achievements
        this.generateAchievements();
        
        // Show game over screen
        setTimeout(() => {
            document.getElementById('gameOverScreen').classList.add('active');
        }, 1000);
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 1/30);
        
        this.update(cappedDeltaTime);
        this.render();
        
        // Calculate FPS
        this.frameCount++;
        this.fpsTime += cappedDeltaTime;
        if (this.fpsTime >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update game speed and level
        this.updateGameProgress();
        
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update game objects
        this.updateObstacles(deltaTime);
        this.updatePowerUps(deltaTime);
        this.updateParticles(deltaTime);
        
        // Spawn new objects
        this.spawnObjects();
        
        // Check collisions
        this.checkCollisions();
        
        // Update visual effects
        this.updateEffects(deltaTime);
        
        // Update background
        this.updateBackground(deltaTime);
        
        // Update UI
        this.updateUI();
    }
    
    updateGameProgress() {
        // Increase speed gradually
        this.settings.gameSpeed = this.settings.baseSpeed + (this.score * 0.001);
        
        // Level progression
        const newLevel = Math.floor(this.score / this.settings.levelThreshold) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.createLevelUpEffect();
        }
    }
    
    updatePlayer(deltaTime) {
        // Physics
        this.player.velocityY += this.settings.gravity;
        this.player.y += this.player.velocityY;
        
        // Ground collision
        const groundY = this.canvas.height - 100 - this.player.height;
        if (this.player.y >= groundY) {
            this.player.y = groundY;
            this.player.velocityY = 0;
            this.player.onGround = true;
        }
        
        // Ceiling collision
        if (this.player.y <= 0) {
            this.player.y = 0;
            this.player.velocityY = 0;
        }
        
        // Update trail
        this.player.trail.push({ x: this.player.x, y: this.player.y, alpha: 1 });
        
        // Limit trail length
        if (this.player.trail.length > 10) {
            this.player.trail.shift();
        }
        
        // Fade trail
        this.player.trail.forEach((point, index) => {
            point.alpha = (index + 1) / this.player.trail.length * 0.5;
        });
        
        // Update glow effect
        this.player.glowIntensity = 1 + Math.sin(Date.now() * 0.01) * 0.3;
    }
    
    updateObstacles(deltaTime) {
        this.obstacles.forEach((obstacle, index) => {
            obstacle.x -= this.settings.gameSpeed;
            
            // Animate obstacle
            if (obstacle.type === 'laser') {
                obstacle.intensity = 0.5 + Math.sin(Date.now() * 0.01 + obstacle.phase) * 0.5;
            }
            
            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(index, 1);
                this.score += 10;
            }
        });
    }
    
    updatePowerUps(deltaTime) {
        this.powerUps.forEach((powerUp, index) => {
            powerUp.x -= this.settings.gameSpeed;
            powerUp.rotation += deltaTime * 5;
            powerUp.bob += deltaTime * 8;
            powerUp.y = powerUp.baseY + Math.sin(powerUp.bob) * 10;
            
            // Remove off-screen power-ups
            if (powerUp.x + powerUp.width < 0) {
                this.powerUps.splice(index, 1);
            }
        });
    }
    
    updateParticles(deltaTime) {
        this.particles.forEach((particle, index) => {
            particle.x += particle.velocityX * deltaTime * 60;
            particle.y += particle.velocityY * deltaTime * 60;
            particle.velocityY += 0.2; // Gravity for particles
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    spawnObjects() {
        // Spawn obstacles
        if (Math.random() < 0.02 + (this.level * 0.005)) {
            this.spawnObstacle();
        }
        
        // Spawn power-ups
        if (Math.random() < 0.008) {
            this.spawnPowerUp();
        }
    }
    
    spawnObstacle() {
        const types = ['block', 'spike', 'laser'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const obstacle = {
            type: type,
            x: this.canvas.width,
            y: this.canvas.height - 100 - 40,
            width: 40,
            height: 40,
            color: '#ff0000',
            intensity: 1,
            phase: Math.random() * Math.PI * 2
        };
        
        // Adjust properties based on type
        switch (type) {
            case 'spike':
                obstacle.y -= 20;
                obstacle.height = 60;
                obstacle.color = '#ff6600';
                break;
            case 'laser':
                obstacle.width = 20;
                obstacle.height = this.canvas.height - 100;
                obstacle.y = 0;
                obstacle.color = '#ff00ff';
                break;
        }
        
        this.obstacles.push(obstacle);
    }
    
    spawnPowerUp() {
        const types = ['speed', 'shield', 'score', 'jump'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerUp = {
            type: type,
            x: this.canvas.width,
            y: Math.random() * (this.canvas.height - 200) + 50,
            baseY: 0,
            width: 25,
            height: 25,
            rotation: 0,
            bob: 0,
            color: this.getPowerUpColor(type)
        };
        
        powerUp.baseY = powerUp.y;
        this.powerUps.push(powerUp);
    }
    
    getPowerUpColor(type) {
        const colors = {
            speed: '#00ff00',
            shield: '#0099ff',
            score: '#ffff00',
            jump: '#ff9900'
        };
        return colors[type] || '#ffffff';
    }
    
    checkCollisions() {
        // Player vs Obstacles
        this.obstacles.forEach((obstacle, index) => {
            if (this.isColliding(this.player, obstacle)) {
                this.handleObstacleCollision(obstacle, index);
            }
        });
        
        // Player vs PowerUps
        this.powerUps.forEach((powerUp, index) => {
            if (this.isColliding(this.player, powerUp)) {
                this.handlePowerUpCollision(powerUp, index);
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    handleObstacleCollision(obstacle, index) {
        this.lives--;
        this.obstacles.splice(index, 1);
        
        // Visual feedback
        this.screenShake = 15;
        this.flash = 0.8;
        
        // Create impact particles
        this.createParticles(obstacle.x, obstacle.y, '#ff0000', 15);
        
        if (this.lives <= 0) {
            this.endGame();
        }
    }
    
    handlePowerUpCollision(powerUp, index) {
        this.powerUps.splice(index, 1);
        
        // Apply power-up effect
        this.applyPowerUp(powerUp.type);
        
        // Visual feedback
        this.createParticles(powerUp.x, powerUp.y, powerUp.color, 10);
        
        // Show notification
        this.showPowerUpNotification(powerUp.type);
    }
    
    applyPowerUp(type) {
        switch (type) {
            case 'speed':
                this.settings.gameSpeed *= 0.7; // Slow down obstacles
                setTimeout(() => {
                    this.settings.gameSpeed /= 0.7;
                }, 5000);
                break;
            case 'shield':
                // Temporary invincibility (implement as needed)
                break;
            case 'score':
                this.score += 100;
                break;
            case 'jump':
                this.settings.jumpForce *= 1.5;
                setTimeout(() => {
                    this.settings.jumpForce /= 1.5;
                }, 3000);
                break;
        }
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: (Math.random() - 0.5) * 10,
                color: color,
                life: 1,
                maxLife: 1,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    updateEffects(deltaTime) {
        // Screen shake
        this.screenShake = Math.max(0, this.screenShake - deltaTime * 30);
        
        // Flash effect
        this.flash = Math.max(0, this.flash - deltaTime * 2);
    }
    
    updateBackground(deltaTime) {
        this.backgroundOffset += this.settings.gameSpeed;
        if (this.backgroundOffset > 100) {
            this.backgroundOffset = 0;
        }
    }
    
    generateBackground() {
        this.backgroundObjects = [];
        for (let i = 0; i < 50; i++) {
            this.backgroundObjects.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.1,
                color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff'
            });
        }
    }
    
    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('currentLevel').textContent = this.level;
        
        // Update progress bar
        const progress = (this.score % this.settings.levelThreshold) / this.settings.levelThreshold * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }
    
    createLevelUpEffect() {
        // Screen flash
        this.flash = 0.5;
        
        // Particle burst
        this.createParticles(this.canvas.width / 2, this.canvas.height / 2, '#ffff00', 25);
        
        // Show notification (implement if needed)
    }
    
    showPowerUpNotification(type) {
        const notifications = {
            speed: 'SLOW MOTION!',
            shield: 'SHIELD ACTIVE!',
            score: 'BONUS POINTS!',
            jump: 'SUPER JUMP!'
        };
        
        // This would be implemented with DOM manipulation
        console.log(notifications[type] || 'POWER UP!');
    }
    
    generateAchievements() {
        const achievements = [];
        
        if (this.score > 500) achievements.push('🏆 Score Master - Reached 500 points!');
        if (this.level > 3) achievements.push('🎯 Level Champion - Reached level 3!');
        if (this.score > 1000) achievements.push('💎 Neon Legend - Scored over 1000!');
        
        const container = document.getElementById('achievements');
        container.innerHTML = achievements.map(achievement => 
            `<div class="achievement-item">${achievement}</div>`
        ).join('');
    }
    
    loadFromStorage() {
        const highScore = localStorage.getItem('neonRunnerHighScore');
        if (highScore) {
            document.getElementById('highScore').textContent = highScore;
        }
    }
    
    saveToStorage() {
        const currentHigh = parseInt(localStorage.getItem('neonRunnerHighScore')) || 0;
        if (this.score > currentHigh) {
            localStorage.setItem('neonRunnerHighScore', this.score.toString());
            document.getElementById('highScore').textContent = this.score;
        }
    }
    
    // Rendering Methods
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Render background
        this.renderBackground();
        
        // Render game objects
        this.renderPlayer();
        this.renderObstacles();
        this.renderPowerUps();
        this.renderParticles();
        
        // Apply flash effect
        if (this.flash > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flash})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Reset transformations
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    renderBackground() {
        // Render scrolling background objects
        this.backgroundObjects.forEach(obj => {
            obj.x -= obj.speed;
            if (obj.x < 0) obj.x = this.canvas.width;
            
            this.ctx.fillStyle = obj.color + '33';
            this.ctx.fillRect(obj.x, obj.y, obj.size, obj.size);
        });
        
        // Render grid lines
        this.ctx.strokeStyle = '#00ffff22';
        this.ctx.lineWidth = 1;
        
        for (let x = -this.backgroundOffset; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    renderPlayer() {
        // Render player trail
        this.player.trail.forEach(point => {
            this.ctx.fillStyle = `rgba(0, 255, 255, ${point.alpha})`;
            this.ctx.fillRect(point.x, point.y, this.player.width * 0.8, this.player.height * 0.8);
        });
        
        // Render player glow
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 20 * this.player.glowIntensity;
        
        // Render player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.shadowColor = obstacle.color;
            this.ctx.shadowBlur = 15;
            
            if (obstacle.type === 'laser') {
                this.ctx.fillStyle = obstacle.color + Math.floor(obstacle.intensity * 255).toString(16);
            } else {
                this.ctx.fillStyle = obstacle.color;
            }
            
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            this.ctx.shadowBlur = 0;
        });
    }
    
    renderPowerUps() {
        this.powerUps.forEach(powerUp => {
            this.ctx.save();
            
            // Translate to power-up center
            this.ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
            this.ctx.rotate(powerUp.rotation);
            
            // Render glow
            this.ctx.shadowColor = powerUp.color;
            this.ctx.shadowBlur = 20;
            
            // Render power-up
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
            
            this.ctx.restore();
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16);
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
    }
}

// Export for use in main.js
window.NeonRunner = NeonRunner;