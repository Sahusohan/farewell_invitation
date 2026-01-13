// =====================
// DEBUG MODE
// =====================
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// =====================
// FIREBASE CONFIGURATION
// =====================

const firebaseConfig = {
    apiKey: "AIzaSyAisU7STb4UAJmcpuFtvp520OrX0of-THI",
    authDomain: "anonymousconfession-19707.firebaseapp.com",
    projectId: "anonymousconfession-19707",
    storageBucket: "anonymousconfession-19707.firebasestorage.app",
    messagingSenderId: "513711142017",
    appId: "1:513711142017:web:a54387faff58ba03644980"
};

debugLog('Firebase config loaded');

// =====================
// INITIALIZE FIREBASE
// =====================

let db;
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    debugLog('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    showNotification('Failed to initialize database', 'error');
}

// Firebase Collections
const RSVPS_COLLECTION = "rsvps";
const MEMORIES_COLLECTION = "memories";

// =====================
// FIREBASE FUNCTIONS
// =====================

async function saveRSVPToFirebase(rsvpData) {
    try {
        const docRef = await db.collection(RSVPS_COLLECTION).add({
            ...rsvpData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "confirmed"
        });
        
        debugLog("RSVP saved with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving RSVP:", error);
        return { success: false, error: error.message };
    }
}

async function saveMemoryToFirebase(memoryData) {
    try {
        const docRef = await db.collection(MEMORIES_COLLECTION).add({
            ...memoryData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        debugLog("Memory saved with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving memory:", error);
        return { success: false, error: error.message };
    }
}

function loadRSVPsFromFirebase() {
    debugLog('Loading RSVPs from Firebase...');
    
    return db.collection(RSVPS_COLLECTION)
        .orderBy("timestamp", "desc")
        .onSnapshot(
            (snapshot) => {
                debugLog('RSVPs snapshot received:', snapshot.size, 'documents');
                
                const rsvps = [];
                let students = 0;
                let teachers = 0;
                let totalGuests = 0;
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    debugLog('RSVP data:', data);
                    
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
                updateFirebaseStatus(true, `${rsvps.length} RSVPs loaded`);
                
            },
            (error) => {
                console.error("Error loading RSVPs:", error);
                updateFirebaseStatus(false, "Failed to load RSVPs: " + error.message);
                showNotification('Cannot load guest list', 'error');
            }
        );
}

function loadMemoriesFromFirebase() {
    debugLog('Loading memories from Firebase...');
    
    return db.collection(MEMORIES_COLLECTION)
        .orderBy("timestamp", "desc")
        .onSnapshot(
            (snapshot) => {
                debugLog('Memories snapshot received:', snapshot.size, 'documents');
                
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
            },
            (error) => {
                console.error("Error loading memories:", error);
                updateFirebaseStatus(false, "Failed to load memories");
                showNotification('Cannot load memories', 'error');
            }
        );
}

// =====================
// UI UPDATE FUNCTIONS
// =====================

function updateRSVPsUI(rsvps) {
    const guestsList = document.getElementById('guestsList');
    
    if (!guestsList) {
        console.error('guestsList element not found!');
        return;
    }
    
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
    
    debugLog('Updated RSVPs UI:', rsvps.length, 'items');
}

function updateMemoriesUI(memories) {
    const container = document.getElementById('memoriesContainer');
    
    if (!container) {
        console.error('memoriesContainer element not found!');
        return;
    }
    
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
    debugLog('Updating stats:', {students, teachers, totalGuests, totalRSVPs});
    
    // Update counter elements
    updateCounter('totalStudents', students);
    updateCounter('totalTeachers', teachers);
    updateCounter('totalRSVP', totalRSVPs);
    updateCounter('guestCount', totalGuests);
    updateCounter('studentCount', students);
    updateCounter('teacherCount', teachers);
    
    // Update mobile stats
    updateCounter('mobileTotalGuests', totalGuests);
    updateCounter('mobileTeachers', teachers);
}

function updateCounter(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function updateFirebaseStatus(connected, message) {
    const statusElement = document.getElementById('firebaseStatusText');
    if (!statusElement) return;
    
    const statusDot = document.querySelector('.status-dot');
    
    if (connected) {
        statusElement.style.color = '#00ff88';
        if (statusDot) {
            statusDot.style.background = '#00ff88';
            statusDot.style.boxShadow = '0 0 10px #00ff88';
        }
    } else {
        statusElement.style.color = '#ff4444';
        if (statusDot) {
            statusDot.style.background = '#ff4444';
            statusDot.style.boxShadow = '0 0 10px #ff4444';
        }
    }
    
    statusElement.textContent = message;
}

// =====================
// UTILITY FUNCTIONS
// =====================

function formatTimeAgo(date) {
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffMs = now - (date instanceof Date ? date : new Date(date));
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

function generateInvitationCode(name) {
    const nameCode = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const timestamp = Date.now().toString(36).substr(-3).toUpperCase();
    return `KVBP-${nameCode}-${randomNum}-${timestamp}`;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// =====================
// EVENT HANDLERS
// =====================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM Content Loaded');
    
    if (!db) {
        showNotification('Database connection failed', 'error');
        return;
    }
    
    // Initialize Firebase listeners
    const unsubscribeRSVPs = loadRSVPsFromFirebase();
    const unsubscribeMemories = loadMemoriesFromFirebase();
    
    debugLog('Firebase listeners initialized');
    
    // RSVP Form Handler
    const rsvpForm = document.getElementById('rsvpForm');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            debugLog('RSVP form submitted');
            
            const formData = {
                fullName: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim(),
                category: document.getElementById('category').value,
                guests: parseInt(document.getElementById('guests').value) || 0,
                message: document.getElementById('message').value.trim()
            };
            
            debugLog('Form data:', formData);
            
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
            const submitBtn = document.querySelector('.submit-rsvp');
            if (!submitBtn) {
                showNotification('Submit button not found', 'error');
                return;
            }
            
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            try {
                const result = await saveRSVPToFirebase(formData);
                
                if (result.success) {
                    const invitationCode = generateInvitationCode(formData.fullName);
                    showConfirmationModal(formData.fullName, invitationCode);
                    rsvpForm.reset();
                    showNotification('RSVP confirmed successfully!', 'success');
                } else {
                    showNotification('Failed to save RSVP. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    } else {
        debugLog('RSVP form not found');
    }
    
    // Memory Post Handler
    const postMemoryBtn = document.getElementById('postMemory');
    if (postMemoryBtn) {
        postMemoryBtn.addEventListener('click', async function() {
            const author = document.getElementById('memoryAuthor')?.value.trim() || 'Anonymous';
            const text = document.getElementById('memoryText')?.value.trim();
            
            if (!text) {
                showNotification('Please write a memory to share!', 'error');
                return;
            }
            
            if (text.length > 500) {
                showNotification('Memory is too long (max 500 characters)', 'error');
                return;
            }
            
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
                    document.getElementById('memoryAuthor').value = '';
                    document.getElementById('memoryText').value = '';
                    showNotification('Memory posted successfully!', 'success');
                } else {
                    showNotification('Failed to post memory. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('Error: ' + error.message, 'error');
            } finally {
                postMemoryBtn.innerHTML = originalText;
                postMemoryBtn.disabled = false;
            }
        });
    }
    
    // Filter Guests
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterGuests(filter);
        });
    });
    
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeMenu = document.getElementById('closeMenu');
    
    if (mobileMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuOverlay.style.display = 'flex';
        });
        
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                mobileMenuOverlay.style.display = 'none';
            });
        }
        
        mobileMenuOverlay.addEventListener('click', (e) => {
            if (e.target === mobileMenuOverlay) {
                mobileMenuOverlay.style.display = 'none';
            }
        });
    }
    
    // RSVP Trigger
    const confirmAttendance = document.getElementById('confirmAttendance');
    if (confirmAttendance) {
        confirmAttendance.addEventListener('click', () => {
            const rsvpSection = document.getElementById('rsvp-section');
            if (rsvpSection) {
                rsvpSection.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('fullName')?.focus();
            }
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
    
    // Initialize particles
    initParticles();
    
    // Set current date in footer
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Clean up listeners on page unload
    window.addEventListener('beforeunload', () => {
        if (typeof unsubscribeRSVPs === 'function') unsubscribeRSVPs();
        if (typeof unsubscribeMemories === 'function') unsubscribeMemories();
    });
});

// =====================
// UI HELPER FUNCTIONS
// =====================

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
    
    // Add animation styles
    if (!document.querySelector('#notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
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
    }
    
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

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
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
            pointer-events: none;
        `;
        
        container.appendChild(particle);
    }
    
    // Add particle animation
    if (!document.querySelector('#particle-animations')) {
        const style = document.createElement('style');
        style.id = 'particle-animations';
        style.textContent = `
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
        document.head.appendChild(style);
    }
}

// Initialize on load
window.addEventListener('load', () => {
    debugLog('Page loaded');
    updateFirebaseStatus(false, 'Connecting to database...');
    
    // Test Firebase connection after 1 second
    setTimeout(() => {
        if (db) {
            db.collection(RSVPS_COLLECTION).limit(1).get()
                .then(() => {
                    updateFirebaseStatus(true, 'Connected to Firebase');
                    showNotification('Database connected successfully', 'success');
                })
                .catch((error) => {
                    updateFirebaseStatus(false, 'Connection failed: ' + error.code);
                    showNotification('Database connection error: ' + error.code, 'error');
                    console.error('Firebase connection error:', error);
                });
        } else {
            updateFirebaseStatus(false, 'Database not initialized');
        }
    }, 1000);
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    console.error('Error at:', e.filename, 'line:', e.lineno);
});

// Unhandled promise rejection
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
