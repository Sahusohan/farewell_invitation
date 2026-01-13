// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles
    initParticles();
    
    // Initialize counters
    initCounters();
    
    // Initialize event listeners
    initEventListeners();
    
    // Set current date in footer
    setCurrentDate();
    
    // Initialize memory wall with sample memories
    initMemoryWall();
    
    // Initialize RSVP stats
    updateRSVPStats();
});

// Particle System
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 4 + 1;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${Math.random() > 0.5 ? 'var(--primary)' : 'var(--accent)'};
        border-radius: 50%;
        left: ${posX}%;
        top: ${posY}%;
        opacity: ${Math.random() * 0.5 + 0.1};
        animation: float-particle ${duration}s linear infinite ${delay}s;
    `;
    
    container.appendChild(particle);
}

// Counter Animation
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const increment = target / 200;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 10);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start counter when in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// Event Listeners
function initEventListeners() {
    // Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // RSVP Buttons
    const rsvpBtn = document.getElementById('rsvpBtn');
    const confirmBtn = document.getElementById('confirmAttendance');
    const submitRsvpBtn = document.getElementById('submitRsvp');
    
    [rsvpBtn, confirmBtn].forEach(btn => {
        btn?.addEventListener('click', () => {
            scrollToSection('.rsvp-section');
        });
    });
    
    // Submit RSVP
    submitRsvpBtn?.addEventListener('click', submitRSVP);
    
    // Memory Post
    document.getElementById('postMemory')?.addEventListener('click', postMemory);
    
    // Modal
    const modal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const downloadPass = document.getElementById('downloadPass');
    
    closeModal?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    downloadPass?.addEventListener('click', () => {
        showNotification('Digital pass downloaded successfully!');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 1000);
    });
    
    // Music Toggle
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    musicToggle?.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            showNotification('Background music enabled');
        } else {
            backgroundMusic.pause();
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            showNotification('Background music muted');
        }
    });
    
    // Scroll to Top
    const scrollTopBtn = document.getElementById('scrollTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.style.display = 'flex';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    });
    
    scrollTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Form validation
    initFormValidation();
}

// Scroll to Section
function scrollToSection(selector) {
    const section = document.querySelector(selector);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Set Current Date
function setCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('en-US', options);
    
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
}

// RSVP Submission
function submitRSVP() {
    const name = document.getElementById('attendeeName').value.trim();
    const email = document.getElementById('attendeeEmail').value.trim();
    const type = document.getElementById('attendeeType').value;
    const guests = parseInt(document.getElementById('guestCount').value) || 0;
    const message = document.getElementById('rsvpMessage').value.trim();
    
    // Validation
    if (!name || !email || !type) {
        showNotification('Please fill all required fields!', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address!', 'error');
        return;
    }
    
    // Generate confirmation
    const passCode = 'KVBP-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Update modal
    document.getElementById('confirmName').textContent = name;
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('passCode').textContent = passCode;
    
    // Show modal
    document.getElementById('confirmationModal').style.display = 'flex';
    
    // Update stats
    updateRSVPStats();
    
    // Clear form
    clearRSVPForm();
    
    // Show success notification
    showNotification(`RSVP confirmed! Welcome ${name}!`);
    
    // Play confirmation sound
    playConfirmationSound();
}

// Clear RSVP Form
function clearRSVPForm() {
    document.getElementById('attendeeName').value = '';
    document.getElementById('attendeeEmail').value = '';
    document.getElementById('attendeeType').value = '';
    document.getElementById('guestCount').value = '';
    document.getElementById('rsvpMessage').value = '';
}

// Update RSVP Stats
function updateRSVPStats() {
    // In a real app, this would come from a server
    // For demo, we'll use random numbers
    const teacherCount = Math.floor(Math.random() * 20) + 15;
    const studentCount = Math.floor(Math.random() * 80) + 40;
    const totalCount = teacherCount + studentCount;
    const seatsLeft = Math.max(0, 150 - totalCount);
    
    document.getElementById('teacherCount').textContent = teacherCount;
    document.getElementById('studentCount').textContent = studentCount;
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('seatsLeft').textContent = seatsLeft;
}

// Post Memory
function postMemory() {
    const name = document.getElementById('memoryName').value.trim() || 'Anonymous';
    const text = document.getElementById('memoryText').value.trim();
    
    if (!text) {
        showNotification('Please write a memory to post!', 'error');
        return;
    }
    
    const memoryWall = document.getElementById('memoryWall');
    const memoryItem = document.createElement('div');
    memoryItem.className = 'memory-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    memoryItem.innerHTML = `
        <div class="memory-header">
            <span class="memory-author">${name}</span>
            <span class="memory-time">${timeString}</span>
        </div>
        <p class="memory-content">${text}</p>
    `;
    
    memoryWall.insertBefore(memoryItem, memoryWall.firstChild);
    
    // Clear form
    document.getElementById('memoryName').value = '';
    document.getElementById('memoryText').value = '';
    
    // Show notification
    showNotification('Memory posted to the wall!');
    
    // Add animation
    memoryItem.style.animation = 'fadeIn 0.5s ease-out';
}

// Initialize Memory Wall with sample memories
function initMemoryWall() {
    const sampleMemories = [
        {
            name: "Class XII Student",
            text: "The science fair where our project won first prize! Mrs. Sharma's guidance made it possible."
        },
        {
            name: "Batch 2025-26",
            text: "Sports day 2024 - the cheers, the competition, the unity. We'll miss these moments!"
        },
        {
            name: "Future Alumni",
            text: "Late night study sessions in the library before board exams. Worth every minute!"
        }
    ];
    
    sampleMemories.forEach(memory => {
        const memoryItem = document.createElement('div');
        memoryItem.className = 'memory-item';
        
        memoryItem.innerHTML = `
            <div class="memory-header">
                <span class="memory-author">${memory.name}</span>
                <span class="memory-time">Yesterday</span>
            </div>
            <p class="memory-content">${memory.text}</p>
        `;
        
        document.getElementById('memoryWall').appendChild(memoryItem);
    });
}

// Form Validation
function initFormValidation() {
    const emailInput = document.getElementById('attendeeEmail');
    emailInput?.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            this.style.borderColor = 'var(--neon-pink)';
            showNotification('Please enter a valid email address', 'error');
        } else {
            this.style.borderColor = '';
        }
    });
}

// Utility Functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(0, 217, 255, 0.9)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid var(--glass-border);
    `;
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function playConfirmationSound() {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes float-particle {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification.error {
        background: rgba(255, 50, 50, 0.9) !important;
    }
`;
document.head.appendChild(style);
