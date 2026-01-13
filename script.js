// =====================
// FIREBASE CONFIGURATION
// =====================

// Replace with YOUR Firebase Config
const firebaseConfig = {
   apiKey: "AIzaSyAisU7STb4UAJmcpuFtvp520OrX0of-THI",
  authDomain: "anonymousconfession-19707.firebaseapp.com",
  projectId: "anonymousconfession-19707",
  storageBucket: "anonymousconfession-19707.firebasestorage.app",
  messagingSenderId: "513711142017",
  appId: "1:513711142017:web:a54387faff58ba03644980"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Firebase Collections
const RSVPS_COLLECTION = "rsvps";
const MEMORIES_COLLECTION = "memories";

// =====================
// FIREBASE FUNCTIONS
// =====================

// Save RSVP to Firebase
async function saveRSVPToFirebase(rsvpData) {
    try {
        const docRef = await db.collection(RSVPS_COLLECTION).add({
            ...rsvpData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "confirmed"
        });
        
        console.log("RSVP saved with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving RSVP:", error);
        return { success: false, error: error.message };
    }
}

// Save Memory to Firebase
async function saveMemoryToFirebase(memoryData) {
    try {
        const docRef = await db.collection(MEMORIES_COLLECTION).add({
            ...memoryData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("Memory saved with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving memory:", error);
        return { success: false, error: error.message };
    }
}

// Load RSVPs from Firebase with real-time updates
function loadRSVPsFromFirebase() {
    const unsubscribe = db.collection(RSVPS_COLLECTION)
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            const rsvps = [];
            let students = 0;
            let teachers = 0;
            let totalGuests = 0;
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                rsvps.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date()
                });
                
                // Update counters
                if (data.category === "student") students++;
                if (data.category === "teacher") teachers++;
                totalGuests += 1 + (data.guests || 0);
            });
            
            // Update UI
            updateRSVPsUI(rsvps);
            updateStats(students, teachers, totalGuests, rsvps.length);
            
            // Update Firebase status
            updateFirebaseStatus(true, `${rsvps.length} RSVPs loaded`);
        }, (error) => {
            console.error("Error loading RSVPs:", error);
            updateFirebaseStatus(false, "Failed to load RSVPs");
        });
    
    return unsubscribe;
}

// Load Memories from Firebase with real-time updates
function loadMemoriesFromFirebase() {
    const unsubscribe = db.collection(MEMORIES_COLLECTION)
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            const memories = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                memories.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date()
                });
            });
            
            // Update UI
            updateMemoriesUI(memories);
            updateFirebaseStatus(true, `${memories.length} memories loaded`);
        }, (error) => {
            console.error("Error loading memories:", error);
            updateFirebaseStatus(false, "Failed to load memories");
        });
    
    return unsubscribe;
}

// =====================
// UI UPDATE FUNCTIONS
// =====================

function updateRSVPsUI(rsvps) {
    const guestsList = document.getElementById('guestsList');
    
    if (rsvps.length === 0) {
        guestsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>No RSVPs yet. Be the first to confirm!</p>
            </div>
        `;
        return;
    }
    
    guestsList.innerHTML = rsvps.map(rsvp => `
        <div class="guest-item" data-category="${rsvp.category}">
            <div class="guest-header">
                <h3 class="guest-name">${rsvp.fullName}</h3>
                <span class="guest-category ${rsvp.category}">
                    ${rsvp.category === 'student' ? '🎓 Student' : 
                      rsvp.category === 'teacher' ? '👨‍🏫 Teacher' : 
                      rsvp.category === 'alumni' ? '🌟 Alumni' : '👋 Guest'}
                </span>
            </div>
            <div class="guest-info">
                <span><i class="fas fa-envelope"></i> ${rsvp.email}</span>
                ${rsvp.guests > 0 ? `<span><i class="fas fa-user-plus"></i> +${rsvp.guests} guests</span>` : ''}
            </div>
            <div class="guest-time">
                <i class="fas fa-clock"></i> 
                ${formatTimeAgo(rsvp.timestamp)}
            </div>
        </div>
    `).join('');
}

function updateMemoriesUI(memories) {
    const container = document.getElementById('memoriesContainer');
    
    if (memories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <p>No memories shared yet. Share yours first!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = memories.map(memory => `
        <div class="memory-item">
            <div class="memory-header">
                <span class="memory-author">
                    ${memory.author || 'Anonymous'}
                </span>
                <span class="memory-time">
                    ${formatTimeAgo(memory.timestamp)}
                </span>
            </div>
            <p class="memory-content">${memory.text}</p>
        </div>
    `).join('');
}

function updateStats(students, teachers, totalGuests, totalRSVPs) {
    // Update counter elements with animation
    animateCounter('totalStudents', students);
    animateCounter('totalTeachers', teachers);
    animateCounter('totalRSVP', totalRSVPs);
    animateCounter('guestCount', totalGuests);
    animateCounter('studentCount', students);
    animateCounter('teacherCount', teachers);
    
    // Update mobile stats
    animateCounter('mobileTotalGuests', totalGuests);
    animateCounter('mobileTeachers', teachers);
}

function updateFirebaseStatus(connected, message) {
    const statusElement = document.getElementById('firebaseStatus');
    if (!statusElement) return;
    
    const statusDot = statusElement.querySelector('.status-dot');
    const statusText = statusElement.querySelector('span');
    
    if (connected) {
        statusElement.style.color = '#00ff88';
        statusDot.style.background = '#00ff88';
        statusDot.style.boxShadow = '0 0 10px #00ff88';
    } else {
        statusElement.style.color = '#ff4444';
        statusDot.style.background = '#ff4444';
        statusDot.style.boxShadow = '0 0 10px #ff4444';
    }
    
    statusText.textContent = message;
}

// =====================
// UTILITY FUNCTIONS
// =====================

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    const increment = target > current ? 1 : -1;
    let currentValue = current;
    
    const update = () => {
        currentValue += increment;
        element.textContent = currentValue;
        
        if ((increment > 0 && currentValue < target) || 
            (increment < 0 && currentValue > target)) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    };
    
    update();
}

function generateInvitationCode(name) {
    const nameCode = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const timestamp = Date.now().toString(36).substr(-3).toUpperCase();
    return `KVBP-${nameCode}-${randomNum}-${timestamp}`;
}

// =====================
// EVENT HANDLERS
// =====================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase listeners
    const unsubscribeRSVPs = loadRSVPsFromFirebase();
    const unsubscribeMemories = loadMemoriesFromFirebase();
    
    // RSVP Form Handler
    const rsvpForm = document.getElementById('rsvpForm');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                fullName: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim(),
                category: document.getElementById('category').value,
                guests: parseInt(document.getElementById('guests').value) || 0,
                message: document.getElementById('message').value.trim()
            };
            
            // Validation
            if (!formData.fullName || !formData.email || !formData.category) {
                showNotification('Please fill all required fields!', 'error');
                return;
            }
            
            if (!validateEmail(formData.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            if (formData.guests < 0 || formData.guests > 2) {
                showNotification('Additional guests must be between 0-2', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                // Save to Firebase
                const result = await saveRSVPToFirebase(formData);
                
                if (result.success) {
                    // Show confirmation modal
                    const invitationCode = generateInvitationCode(formData.fullName);
                    showConfirmationModal(formData.fullName, invitationCode);
                    
                    // Clear form
                    rsvpForm.reset();
                    
                    // Show success notification
                    showNotification('RSVP confirmed successfully!', 'success');
                } else {
                    showNotification('Failed to save RSVP. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            } finally {
                // Restore button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Memory Post Handler
    const postMemoryBtn = document.getElementById('postMemory');
    if (postMemoryBtn) {
        postMemoryBtn.addEventListener('click', async function() {
            const author = document.getElementById('memoryAuthor').value.trim() || 'Anonymous';
            const text = document.getElementById('memoryText').value.trim();
            
            if (!text) {
                showNotification('Please write a memory to share!', 'error');
                return;
            }
            
            if (text.length > 500) {
                showNotification('Memory is too long (max 500 characters)', 'error');
                return;
            }
            
            // Show loading state
            const originalText = postMemoryBtn.innerHTML;
            postMemoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            postMemoryBtn.disabled = true;
            
            try {
                const memoryData = {
                    author: author,
                    text: text,
                    timestamp: new Date()
                };
                
                const result = await saveMemoryToFirebase(memoryData);
                
                if (result.success) {
                    // Clear form
                    document.getElementById('memoryAuthor').value = '';
                    document.getElementById('memoryText').value = '';
                    
                    // Show success
                    showNotification('Memory posted successfully!', 'success');
                } else {
                    showNotification('Failed to post memory. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            } finally {
                // Restore button
                postMemoryBtn.innerHTML = originalText;
                postMemoryBtn.disabled = false;
            }
        });
    }
    
    // Filter Guests
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterGuests(filter);
        });
    });
    
    // Mobile Menu
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
        
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileMenu.classList.remove('active');
            }
        });
    }
    
    // RSVP Trigger
    const rsvpTrigger = document.getElementById('rsvpTrigger');
    if (rsvpTrigger) {
        rsvpTrigger.addEventListener('click', () => {
            document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('fullName').focus();
        });
    }
    
    // View Guests
    const viewGuests = document.getElementById('viewGuests');
    if (viewGuests) {
        viewGuests.addEventListener('click', () => {
            document.getElementById('guests').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Modal Controls
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('confirmationModal');
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Scroll to Top
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.style.display = 'flex';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        });
        
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Music Control
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    if (musicToggle && backgroundMusic) {
        backgroundMusic.volume = 0.3;
        
        musicToggle.addEventListener('click', function() {
            if (backgroundMusic.paused) {
                backgroundMusic.play().then(() => {
                    musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                    showNotification('Music enabled', 'success');
                }).catch(error => {
                    showNotification('Click anywhere to enable music', 'warning');
                    document.addEventListener('click', enableMusicOnce, { once: true });
                });
            } else {
                backgroundMusic.pause();
                musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
                showNotification('Music paused', 'info');
            }
        });
        
        function enableMusicOnce() {
            backgroundMusic.play().then(() => {
                musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                showNotification('Music enabled', 'success');
            });
        }
    }
    
    // Clean up listeners on page unload
    window.addEventListener('beforeunload', () => {
        unsubscribeRSVPs();
        unsubscribeMemories();
    });
});

// =====================
// HELPER FUNCTIONS
// =====================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showConfirmationModal(name, code) {
    const modal = document.getElementById('confirmationModal');
    const message = document.getElementById('confirmationMessage');
    const codeElement = document.getElementById('invitationCode');
    
    if (modal && message && codeElement) {
        message.textContent = `Thank you, ${name}!`;
        codeElement.textContent = code;
        modal.style.display = 'flex';
    }
}

function filterGuests(filter) {
    const guests = document.querySelectorAll('.guest-item');
    
    guests.forEach(guest => {
        if (filter === 'all' || guest.dataset.category === filter) {
            guest.style.display = 'block';
            setTimeout(() => {
                guest.style.opacity = '1';
                guest.style.transform = 'translateY(0)';
            }, 10);
        } else {
            guest.style.opacity = '0';
            guest.style.transform = 'translateY(10px)';
            setTimeout(() => {
                guest.style.display = 'none';
            }, 300);
        }
    });
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Style notification
    const colors = {
        success: '#00ff88',
        error: '#ff4444',
        warning: '#ffaa00',
        info: '#00d9ff'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${colors[type]}20;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 2000;
        backdrop-filter: blur(10px);
        border: 1px solid ${colors[type]}40;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
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
    `;
    document.head.appendChild(style);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize particles background
function initParticles() {
    const container = document.getElementById('particles');
    const count = window.innerWidth < 768 ? 20 : 30;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 1;
        const x = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${Math.random() > 0.5 ? '#00d9ff' : '#9d00ff'};
            border-radius: 50%;
            left: ${x}%;
            top: -20px;
            opacity: ${Math.random() * 0.4 + 0.1};
            animation: particleFall ${duration}s linear infinite ${delay}s;
        `;
        
        container.appendChild(particle);
    }
    
    // Add particle animation
    const particleStyle = document.createElement('style');
    particleStyle.textContent = `
        @keyframes particleFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.5;
            }
            90% {
                opacity: 0.5;
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(particleStyle);
}

// Initialize when page loads
window.addEventListener('load', () => {
    initParticles();
    updateFirebaseStatus(false, 'Connecting to database...');
    
    // Test Firebase connection
    setTimeout(() => {
        db.collection('test').limit(1).get()
            .then(() => updateFirebaseStatus(true, 'Connected to Firebase'))
            .catch(() => updateFirebaseStatus(false, 'Connection failed'));
    }, 1000);
});
