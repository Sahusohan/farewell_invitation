// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize everything
    initParticles();
    initEventListeners();
    initMemoryWall();
    initMusic();
    initSmoothScrolling();
});

// Particle Background Effect
function initParticles() {
    const container = document.getElementById('particles');
    const particleCount = window.innerWidth < 768 ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 5 + 2;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    const colors = ['#2563eb', '#7c3aed', '#06b6d4', '#10b981'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${posX}%;
        top: ${posY}%;
        opacity: ${Math.random() * 0.4 + 0.1};
        animation: floatParticle ${duration}s linear infinite ${delay}s;
        pointer-events: none;
    `;
    
    container.appendChild(particle);
}

// Add CSS for particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        10% {
            opacity: 0.5;
        }
        90% {
            opacity: 0.5;
        }
        100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(particleStyle);

// Initialize Event Listeners
function initEventListeners() {
    // RSVP Buttons
    const rsvpBtn = document.getElementById('rsvpBtn');
    const submitRsvpBtn = document.getElementById('submitRsvp');
    
    if (rsvpBtn) {
        rsvpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToElement('rsvpForm');
            showNotification('Scroll to RSVP form');
        });
    }
    
    if (submitRsvpBtn) {
        submitRsvpBtn.addEventListener('click', handleRSVPSubmit);
    }
    
    // Memory Post
    const postMemoryBtn = document.getElementById('postMemory');
    if (postMemoryBtn) {
        postMemoryBtn.addEventListener('click', postMemory);
    }
    
    // Modal Controls
    const closeModal = document.getElementById('closeModal');
    const modalOkBtn = document.getElementById('modalOkBtn');
    const modal = document.getElementById('confirmationModal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Form input validation
    initFormValidation();
    
    // Add touch effects
    initTouchEffects();
}

// Smooth Scrolling
function initSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                scrollToElement(targetId);
            }
        });
    });
}

function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const yOffset = -80; // Adjust for fixed header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
    }
}

// RSVP Form Handling
function handleRSVPSubmit() {
    // Get form values
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const category = document.getElementById('categoryInput').value;
    const guests = parseInt(document.getElementById('guestsInput').value) || 0;
    const message = document.getElementById('messageInput').value.trim();
    
    // Validation
    if (!name || !email || !category) {
        showNotification('Please fill all required fields!', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (guests < 0 || guests > 2) {
        showNotification('Additional guests must be between 0-2', 'error');
        return;
    }
    
    // Generate confirmation code
    const inviteCode = 'KVBP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Update modal
    document.getElementById('confirmGreeting').textContent = `Thank you, ${name}!`;
    document.getElementById('inviteCode').textContent = inviteCode;
    
    // Show modal
    document.getElementById('confirmationModal').style.display = 'flex';
    
    // Play success sound
    playSuccessSound();
    
    // Show success notification
    showNotification('RSVP submitted successfully!');
    
    // Clear form (optional)
    setTimeout(() => {
        clearRSVPForm();
    }, 500);
}

function clearRSVPForm() {
    document.getElementById('nameInput').value = '';
    document.getElementById('emailInput').value = '';
    document.getElementById('categoryInput').value = '';
    document.getElementById('guestsInput').value = '';
    document.getElementById('messageInput').value = '';
}

// Memory Wall Functions
function initMemoryWall() {
    // Add some sample memories
    const sampleMemories = [
        {
            name: "Batch 2025-26",
            message: "The best years of our lives! Let's make this farewell unforgettable.",
            time: "2 hours ago"
        },
        {
            name: "Science Club",
            message: "Remember our winning project at the science fair! Proud moments.",
            time: "Yesterday"
        },
        {
            name: "Sports Team",
            message: "From practice sessions to championship wins - what a journey!",
            time: "2 days ago"
        }
    ];
    
    sampleMemories.forEach(memory => {
        addMemoryToWall(memory.name, memory.message, memory.time);
    });
}

function postMemory() {
    const name = document.getElementById('memoryName').value.trim() || 'Anonymous';
    const message = document.getElementById('memoryText').value.trim();
    
    if (!message) {
        showNotification('Please write a memory to share!', 'error');
        return;
    }
    
    if (message.length > 500) {
        showNotification('Memory is too long (max 500 characters)', 'error');
        return;
    }
    
    const time = 'Just now';
    addMemoryToWall(name, message, time);
    
    // Clear inputs
    document.getElementById('memoryName').value = '';
    document.getElementById('memoryText').value = '';
    
    // Show success
    showNotification('Memory posted successfully!');
    playPostSound();
}

function addMemoryToWall(name, message, time) {
    const container = document.getElementById('memoriesContainer');
    const memoryItem = document.createElement('div');
    memoryItem.className = 'memory-item';
    
    memoryItem.innerHTML = `
        <div class="memory-header">
            <span class="memory-author">${name}</span>
            <span class="memory-time">${time}</span>
        </div>
        <p class="memory-content">${message}</p>
    `;
    
    // Add at the beginning
    container.insertBefore(memoryItem, container.firstChild);
    
    // Add animation
    memoryItem.style.animation = 'fadeIn 0.5s ease-out';
    
    // Limit number of memories
    if (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

// Music Player
function initMusic() {
    const musicToggle = document.querySelector('.music-toggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    if (!musicToggle || !backgroundMusic) return;
    
    // Try to play music (autoplay policy)
    backgroundMusic.volume = 0.3;
    
    musicToggle.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (backgroundMusic.paused) {
            backgroundMusic.play().then(() => {
                musicToggle.innerHTML = '<i class="fas fa-volume-up"></i> Music ON';
                showNotification('Background music enabled');
            }).catch(error => {
                showNotification('Click anywhere to enable music', 'warning');
                // Enable on user interaction
                document.addEventListener('click', enableMusicOnce, { once: true });
            });
        } else {
            backgroundMusic.pause();
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i> Music';
            showNotification('Background music paused');
        }
    });
    
    function enableMusicOnce() {
        backgroundMusic.play().then(() => {
            musicToggle.innerHTML = '<i class="fas fa-volume-up"></i> Music ON';
            showNotification('Background music enabled');
        });
    }
}

// Form Validation
function initFormValidation() {
    const emailInput = document.getElementById('emailInput');
    const guestsInput = document.getElementById('guestsInput');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = '#ef4444';
                showNotification('Please check your email format', 'warning');
            } else {
                this.style.borderColor = '';
            }
        });
    }
    
    if (guestsInput) {
        guestsInput.addEventListener('change', function() {
            const value = parseInt(this.value) || 0;
            if (value < 0 || value > 2) {
                this.style.borderColor = '#ef4444';
                showNotification('Additional guests must be 0-2', 'warning');
            } else {
                this.style.borderColor = '';
            }
        });
    }
}

// Touch Effects for Mobile
function initTouchEffects() {
    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Utility Functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icon based on type
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Style the notification
    const bgColor = type === 'error' ? '#ef4444' : 
                   type === 'warning' ? '#f59e0b' : 
                   '#10b981';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 3000;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // Add animation styles
    const notifStyle = document.createElement('style');
    notifStyle.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notifStyle);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Sound Effects
function playSuccessSound() {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed'));
}

function playPostSound() {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3');
    audio.volume = 0.2;
    audio.play().catch(e => console.log('Audio play failed'));
}

// Add responsive adjustments
function handleResize() {
    // Adjust particle count on resize
    const particles = document.querySelectorAll('.particle');
    const idealCount = window.innerWidth < 768 ? 30 : 50;
    
    if (particles.length < idealCount) {
        const container = document.getElementById('particles');
        const needed = idealCount - particles.length;
        for (let i = 0; i < needed; i++) {
            createParticle(container);
        }
    } else if (particles.length > idealCount) {
        const container = document.getElementById('particles');
        const toRemove = particles.length - idealCount;
        for (let i = 0; i < toRemove; i++) {
            if (container.lastChild) {
                container.removeChild(container.lastChild);
            }
        }
    }
}

// Debounce resize handler
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
});

// Add CSS for particles animation
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @media (max-width: 768px) {
        .glitch-text {
            font-size: 24px;
        }
        
        .school-info h1 {
            font-size: 18px;
        }
        
        .section-title {
            font-size: 18px;
        }
        
        .invitation-card,
        .timeline-section,
        .rsvp-form-section,
        .memory-wall {
            padding: 20px;
        }
        
        .detail-text p {
            font-size: 14px;
        }
        
        .message-content h4 {
            font-size: 15px;
        }
        
        .footer-content {
            gap: 25px;
        }
    }
    
    @media (max-width: 480px) {
        .container {
            padding: 0 12px;
        }
        
        .glitch-text {
            font-size: 22px;
        }
        
        .school-info h1 {
            font-size: 16px;
        }
        
        .invitation-details {
            gap: 12px;
        }
        
        .detail-item {
            padding: 12px;
        }
        
        .rsvp-button,
        .submit-btn,
        .post-btn {
            padding: 16px;
            font-size: 15px;
        }
        
        .input-with-icon input,
        .input-with-icon select,
        .input-with-icon textarea {
            padding: 12px 12px 12px 40px;
            font-size: 15px;
        }
        
        .modal-content {
            max-width: 320px;
        }
        
        .creator-badge {
            font-size: 13px;
        }
        
        .creator-badge strong {
            font-size: 14px;
        }
    }
    
    @media (max-width: 360px) {
        .glitch-text {
            font-size: 20px;
        }
        
        .logo-circle {
            width: 70px;
            height: 70px;
            font-size: 32px;
        }
        
        .invite-tag {
            font-size: 13px;
            padding: 6px 14px;
        }
        
        .card-header h3 {
            font-size: 16px;
        }
        
        .detail-icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
        }
        
        .footer-info h4 {
            font-size: 15px;
        }
    }
    
    /* Prevent text selection on buttons */
    button {
        -webkit-tap-highlight-color: transparent;
        user-select: none;
    }
    
    /* Improve scrolling on iOS */
    .memories-container {
        -webkit-overflow-scrolling: touch;
    }
    
    /* Fix for mobile keyboard */
    @media (max-width: 768px) {
        input, textarea, select {
            font-size: 16px !important; /* Prevents zoom on iOS */
        }
    }
`;
document.head.appendChild(additionalStyles);

// Initialize on load
window.addEventListener('load', function() {
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Check if mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});

// Export functions if needed (for debugging)
window.FarewellApp = {
    submitRSVP: handleRSVPSubmit,
    postMemory: postMemory,
    showNotification: showNotification,
    validateEmail: validateEmail
};
