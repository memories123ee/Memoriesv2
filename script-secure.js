// ==================== Secure Memory Book - Main Script ====================
// This script handles authentication, encryption, and secure data management

// ==================== Global Variables ====================
let pages = [];
let currentPageIndex = 0;
let tempImages = [];
let editingPageIndex = null;
let currentPassword = null; // Store decryption password in memory (session only)

// ==================== Configuration ====================
const CONFIG = {
    MAX_IMAGES_PER_PAGE: 4,
    AUTO_SAVE_DELAY: 1000 // Auto-save after 1 second of inactivity
};

// ==================== DOM Elements ====================
const elements = {
    // Auth elements
    lockScreen: document.getElementById('lockScreen'),
    modeSelection: document.getElementById('modeSelection'),
    createNewBtn: document.getElementById('createNewBtn'),
    importExistingBtn: document.getElementById('importExistingBtn'),
    authForm: document.getElementById('authForm'),
    passwordInput: document.getElementById('passwordInput'),
    togglePassword: document.getElementById('togglePassword'),
    authSubmit: document.getElementById('authSubmit'),
    authBtnText: document.getElementById('authBtnText'),
    authMessage: document.getElementById('authMessage'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    passwordStrength: document.getElementById('passwordStrength'),
    passwordStrengthBar: document.getElementById('passwordStrengthBar'),
    passwordStrengthText: document.getElementById('passwordStrengthText'),
    securityNotice: document.getElementById('securityNotice'),
    backBtn: document.getElementById('backBtn'),
    
    // Main app elements
    mainApp: document.getElementById('mainApp'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    book: document.getElementById('book'),
    
    // Logout modal
    logoutModal: document.getElementById('logoutModal'),
    closeLogoutModal: document.getElementById('closeLogoutModal'),
    simpleLogoutBtn: document.getElementById('simpleLogoutBtn'),
    fullLogoutBtn: document.getElementById('fullLogoutBtn'),
    cancelLogoutBtn: document.getElementById('cancelLogoutBtn'),
    
    // Change password modal
    changePasswordModal: document.getElementById('changePasswordModal'),
    closeChangePasswordModal: document.getElementById('closeChangePasswordModal'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    oldPassword: document.getElementById('oldPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    changePasswordStrengthBar: document.getElementById('changePasswordStrengthBar'),
    changePasswordStrengthText: document.getElementById('changePasswordStrengthText'),
    cancelChangePasswordBtn: document.getElementById('cancelChangePasswordBtn'),
    currentPageNum: document.getElementById('currentPageNum'),
    totalPagesNum: document.getElementById('totalPagesNum'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    addPageBtn: document.getElementById('addPageBtn'),
    addImageBtn: document.getElementById('addImageBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importInput: document.getElementById('importInput'),
    
    // Content modal
    contentModal: document.getElementById('contentModal'),
    closeModal: document.getElementById('closeModal'),
    entryDate: document.getElementById('entryDate'),
    entryTitle: document.getElementById('entryTitle'),
    entryText: document.getElementById('entryText'),
    imageInput: document.getElementById('imageInput'),
    uploadImageBtn: document.getElementById('uploadImageBtn'),
    imagePreview: document.getElementById('imagePreview'),
    cancelBtn: document.getElementById('cancelBtn'),
    saveBtn: document.getElementById('saveBtn')
};

// ==================== Authentication ====================

/**
 * Initialize authentication
 */
function initAuth() {
    // Always show lock screen (no auto-login)
    // Clear any existing session
    SecureStorage.clearSession();
    
    // Always show mode selection to give user choice
    // بين إنشاء دفتر جديد أو استيراد موجود
    showModeSelection();
    
    attachAuthListeners();
}

/**
 * Show mode selection (first time only)
 */
function showModeSelection() {
    elements.authTitle.textContent = '🔒 مرحباً بك';
    elements.authSubtitle.textContent = 'اختر كيف تريد البدء';
    elements.modeSelection.style.display = 'flex';
    elements.authForm.style.display = 'none';
    elements.securityNotice.style.display = 'none';
}

/**
 * Show setup mode (create new)
 */
function showSetupMode() {
    elements.modeSelection.style.display = 'none';
    elements.authForm.style.display = 'block';
    elements.backBtn.style.display = 'block';
    
    elements.authTitle.textContent = '🔐 إنشاء كلمة مرور جديدة';
    elements.authSubtitle.textContent = 'قم بإنشاء كلمة مرور قوية لحماية ذكرياتك';
    elements.authBtnText.textContent = 'إنشاء وبدء';
    elements.passwordStrength.style.display = 'block';
    elements.securityNotice.style.display = 'block';
    elements.passwordInput.setAttribute('placeholder', 'أدخل كلمة مرور قوية (8 أحرف على الأقل)');
    elements.passwordInput.value = '';
    
    // Add password strength checker
    elements.passwordInput.removeEventListener('input', checkPasswordStrength);
    elements.passwordInput.addEventListener('input', checkPasswordStrength);
}

/**
 * Show login mode (import existing)
 */
function showLoginMode() {
    elements.modeSelection.style.display = 'none';
    elements.authForm.style.display = 'block';
    elements.backBtn.style.display = !SecureStorage.hasPassword() ? 'block' : 'none';
    
    elements.authTitle.textContent = '🔒 دفتر الذكريات';
    elements.authSubtitle.textContent = 'أدخل كلمة المرور للمتابعة';
    elements.authBtnText.textContent = 'دخول';
    elements.passwordStrength.style.display = 'none';
    elements.securityNotice.style.display = 'none';
    elements.passwordInput.setAttribute('placeholder', 'كلمة المرور');
    elements.passwordInput.value = '';
}

/**
 * Check password strength
 */
function checkPasswordStrength() {
    const password = elements.passwordInput.value;
    const strengthBar = elements.passwordStrengthBar;
    const strengthText = elements.passwordStrengthText;
    
    if (password.length === 0) {
        strengthBar.className = 'password-strength-bar';
        strengthBar.style.width = '0%';
        strengthText.textContent = '';
        return;
    }
    
    let strength = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // Complexity checks
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    // Set strength class
    if (strength < 40) {
        strengthBar.className = 'password-strength-bar weak';
        strengthText.textContent = 'ضعيفة - استخدم كلمة مرور أقوى';
        strengthText.style.color = '#e74c3c';
    } else if (strength < 70) {
        strengthBar.className = 'password-strength-bar medium';
        strengthText.textContent = 'متوسطة - جيدة لكن يمكن تحسينها';
        strengthText.style.color = '#f39c12';
    } else {
        strengthBar.className = 'password-strength-bar strong';
        strengthText.textContent = 'قوية - ممتاز! ✓';
        strengthText.style.color = '#27ae60';
    }
}

/**
 * Attach authentication event listeners
 */
let authListenersAttached = false;
function attachAuthListeners() {
    // Prevent duplicate listeners
    if (authListenersAttached) return;
    authListenersAttached = true;
    
    // Mode selection
    elements.createNewBtn.addEventListener('click', showSetupMode);
    elements.importExistingBtn.addEventListener('click', showLoginMode);
    
    // Back button - always return to mode selection
    elements.backBtn.addEventListener('click', () => {
        showModeSelection();
    });
    
    // Form submit
    elements.authForm.addEventListener('submit', handleAuth);
    
    // Toggle password visibility
    elements.togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Enter key
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAuth(e);
        }
    });
}

/**
 * Handle authentication (login or setup)
 */
async function handleAuth(e) {
    e.preventDefault();
    
    const password = elements.passwordInput.value.trim();
    
    if (!password) {
        showAuthError('الرجاء إدخال كلمة المرور');
        return;
    }
    
    // Show loading state
    elements.authSubmit.disabled = true;
    elements.authBtnText.innerHTML = 'جاري المعالجة... <span class="loading-spinner"></span>';
    
    try {
        if (!SecureStorage.hasPassword()) {
            // Setup mode
            if (password.length < 8) {
                showAuthError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
                resetAuthButton();
                return;
            }
            
            await SecureStorage.setPassword(password);
            currentPassword = password;
            
            // Create welcome page and save encrypted
            pages = [createWelcomePage()];
            await saveEncryptedData();
            
            showAuthSuccess('تم إنشاء كلمة المرور بنجاح!');
            setTimeout(() => showMainApp(), 1000);
        } else {
            // Login mode
            const isValid = await SecureStorage.verifyPassword(password);
            
            if (isValid) {
                currentPassword = password;
                await loadEncryptedData();
                showAuthSuccess('مرحباً بك! ✓');
                setTimeout(() => showMainApp(), 800);
            } else {
                showAuthError('كلمة المرور غير صحيحة');
                elements.passwordInput.classList.add('error');
                elements.passwordInput.value = '';
                setTimeout(() => {
                    elements.passwordInput.classList.remove('error');
                }, 500);
                resetAuthButton();
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
        showAuthError('حدث خطأ. حاول مرة أخرى.');
        resetAuthButton();
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const input = elements.passwordInput;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

/**
 * Show auth error message
 */
function showAuthError(message) {
    elements.authMessage.innerHTML = `<div class="auth-error">${message}</div>`;
    setTimeout(() => {
        elements.authMessage.innerHTML = '';
    }, 3000);
}

/**
 * Show auth success message
 */
function showAuthSuccess(message) {
    elements.authMessage.innerHTML = `<div class="auth-success">${message}</div>`;
}

/**
 * Reset auth button
 */
function resetAuthButton() {
    elements.authSubmit.disabled = false;
    elements.authBtnText.textContent = SecureStorage.hasPassword() ? 'دخول' : 'إنشاء وبدء';
}

/**
 * Show main application
 */
async function showMainApp() {
    try {
        // Load encrypted data if not already loaded
        if (currentPassword && pages.length === 0) {
            await loadEncryptedData();
        }
        
        // Hide lock screen
        elements.lockScreen.classList.add('hidden');
        
        // Show main app
        elements.mainApp.style.display = 'block';
        
        // Initialize app
        initApp();
    } catch (error) {
        console.error('Error showing main app:', error);
        showNotification('حدث خطأ في تحميل التطبيق', 'error');
    }
}

/**
 * Open logout modal
 */
function openLogoutModal() {
    elements.logoutModal.classList.add('active');
}

/**
 * Close logout modal
 */
function closeLogoutModal() {
    elements.logoutModal.classList.remove('active');
}

/**
 * Simple logout (keep data)
 */
function simpleLogout() {
    // Clear session only (keep password hash and data)
    SecureStorage.clearSession();
    currentPassword = null;
    pages = [];
    
    // Hide main app
    elements.mainApp.style.display = 'none';
    elements.lockScreen.classList.remove('hidden');
    
    // Close logout modal
    closeLogoutModal();
    
    // Reset login form
    elements.passwordInput.value = '';
    
    // Show login screen
    showLoginMode();
    
    showNotification('تم تسجيل الخروج بنجاح');
}

/**
 * Full logout (delete everything)
 */
function fullLogout() {
    if (confirm('⚠️ هذا سيحذف جميع البيانات وكلمة المرور نهائياً!\n\nهل أنت متأكد؟')) {
        // Clear everything
        if (SecureStorage.clearAll()) {
            currentPassword = null;
            pages = [];
            
            // Hide main app
            elements.mainApp.style.display = 'none';
            elements.lockScreen.classList.remove('hidden');
            
            // Close logout modal
            closeLogoutModal();
            
            // Reset login form
            elements.passwordInput.value = '';
            
            // Show mode selection (fresh start)
            showModeSelection();
            
            showNotification('تم حذف جميع البيانات بنجاح');
        }
    }
}

// ==================== Data Management ====================

/**
 * Load encrypted data
 */
async function loadEncryptedData() {
    try {
        if (!SecureStorage.hasData()) {
            pages = [createWelcomePage()];
            await saveEncryptedData();
            return;
        }
        
        const data = await SecureStorage.loadData(currentPassword);
        pages = data || [createWelcomePage()];
    } catch (error) {
        console.error('Load error:', error);
        throw new Error('فشل في تحميل البيانات. قد تكون كلمة المرور خاطئة.');
    }
}

/**
 * Save encrypted data
 */
async function saveEncryptedData() {
    try {
        await SecureStorage.saveData(pages, currentPassword);
    } catch (error) {
        console.error('Save error:', error);
        showNotification('حدث خطأ في حفظ البيانات', 'error');
    }
}

/**
 * Create welcome page
 */
function createWelcomePage() {
    return {
        id: Date.now(),
        date: new Date().toLocaleDateString('ar-EG'),
        title: 'مرحباً بك في دفتر مذكراتي المحمي 🔒',
        text: 'هذا هو دفتر مذكراتك الشخصي المشفّر.\n\n🔒 جميع بياناتك محمية بتشفير AES-256\n✅ كلمة المرور محفوظة بشكل آمن\n✅ لا يمكن لأحد رؤية محتوياتك بدون كلمة المرور\n\nاضغط على زر "+" لإضافة صفحة جديدة.\n\nيمكنك إضافة:\n• التاريخ والعنوان\n• نصوص بخط يدوي جميل\n• صور من جهازك (حتى 4 صور)\n• تحريك الصور بالسحب والإفلات\n\n⚠️ مهم: احتفظ بكلمة المرور في مكان آمن!\nإذا فقدتها، لن تتمكن من استرجاع بياناتك.',
        images: [],
        imagePositions: []
    };
}

// ==================== Application Logic (OLD DESIGN) ====================

/**
 * Initialize application
 */
function initApp() {
    renderBook();
    attachEventListeners();
    updateNavigation();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    elements.entryDate.value = today;
    
    console.log('تم تحميل دفتر المذكرات المحمي بنجاح!');
}

/**
 * Render book (OLD DESIGN)
 */
function renderBook() {
    elements.book.innerHTML = '';
    
    if (pages.length === 0) {
        renderEmptyBook();
        return;
    }
    
    // عرض الصفحة الحالية والصفحة التالية (تصميم الكتاب المفتوح)
    // دائماً نعرض صفحتين حتى لو كانت واحدة فارغة
    renderPage(currentPageIndex, 'left');
    
    // عرض الصفحة اليمنى (إما صفحة موجودة أو فارغة)
    if (currentPageIndex + 1 < pages.length) {
        renderPage(currentPageIndex + 1, 'right');
    } else {
        // إضافة صفحة فارغة على اليمين
        const emptyPage = document.createElement('div');
        emptyPage.className = 'page page-right';
        emptyPage.innerHTML = '<div class="page-content"></div>';
        elements.book.appendChild(emptyPage);
    }
    
    updatePageCounter();
}

/**
 * Render single page (OLD DESIGN)
 */
function renderPage(index, side) {
    if (index < 0 || index >= pages.length) return;
    
    const page = pages[index];
    const pageDiv = document.createElement('div');
    pageDiv.className = `page page-${side}`;
    pageDiv.dataset.pageIndex = index;
    pageDiv.innerHTML = `
        <div class="page-controls">
            <button class="page-control-btn edit-page-btn" onclick="editPage(${index})" title="تعديل الصفحة">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="page-control-btn delete-page-btn" onclick="deletePage(${index})" title="حذف الصفحة">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
        <div class="page-content">
            ${page.date ? `<div class="page-date">${page.date}</div>` : ''}
            ${page.title ? `<div class="page-title">${page.title}</div>` : ''}
            ${page.text ? `<div class="page-text">${page.text}</div>` : ''}
            ${page.images && page.images.length > 0 ? `
                <div class="page-images" id="page-images-${index}">
                    ${page.images.map((img, imgIndex) => {
                        const rotation = [-3, 2, -1.5, 2.5, -2, 1][imgIndex % 6];
                        const position = page.imagePositions && page.imagePositions[imgIndex] 
                            ? page.imagePositions[imgIndex] 
                            : { x: 0, y: 0 };
                        return `
                        <div class="page-image" draggable="true" 
                             data-img-index="${imgIndex}" 
                             data-page-index="${index}"
                             style="transform: translate(${position.x}px, ${position.y}px) rotate(${rotation}deg);">
                            <img src="${img}" alt="صورة" loading="lazy">
                        </div>
                    `}).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    elements.book.appendChild(pageDiv);
    
    // تفعيل drag and drop للصور
    if (page.images && page.images.length > 0) {
        initImageDragging(index);
    }
}

function renderEmptyBook() {
    elements.book.innerHTML = `
        <div class="page page-left">
            <div class="empty-page">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <p>ابدأ بإضافة صفحة جديدة</p>
            </div>
        </div>
        <div class="page page-right">
            <div class="empty-page">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <p>اضغط على زر +</p>
            </div>
        </div>
    `;
}

/**
 * Initialize image dragging (OLD DESIGN)
 */
function initImageDragging(pageIndex) {
    const pageImages = document.querySelectorAll(`#page-images-${pageIndex} .page-image`);
    
    pageImages.forEach(imgElement => {
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        let xOffset = 0, yOffset = 0;
        
        imgElement.addEventListener('mousedown', dragStart);
        imgElement.addEventListener('touchstart', dragStart);
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
        
        function dragStart(e) {
            const imgIndex = parseInt(imgElement.dataset.imgIndex);
            const pageIdx = parseInt(imgElement.dataset.pageIndex);
            
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
            
            if (e.target === imgElement || e.target.parentElement === imgElement) {
                isDragging = true;
                imgElement.style.cursor = 'grabbing';
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }
                
                xOffset = currentX;
                yOffset = currentY;
                
                const imgIndex = parseInt(imgElement.dataset.imgIndex);
                const rotation = [-3, 2, -1.5, 2.5, -2, 1][imgIndex % 6];
                imgElement.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
            }
        }
        
        function dragEnd() {
            if (isDragging) {
                isDragging = false;
                imgElement.style.cursor = 'grab';
                
                const imgIndex = parseInt(imgElement.dataset.imgIndex);
                const pageIdx = parseInt(imgElement.dataset.pageIndex);
                
                saveImagePosition(pageIdx, imgIndex, xOffset, yOffset);
            }
        }
    });
}

/**
 * Save image position
 */
async function saveImagePosition(pageIndex, imageIndex, x, y) {
    if (!pages[pageIndex]) return;
    
    if (!pages[pageIndex].imagePositions) {
        pages[pageIndex].imagePositions = [];
    }
    
    pages[pageIndex].imagePositions[imageIndex] = { x, y };
    await saveEncryptedData();
}

/**
 * Navigation (OLD DESIGN)
 */
function nextPage() {
    if (currentPageIndex + 2 < pages.length) {
        currentPageIndex += 2;
        animatePageFlip('next');
    }
}

function prevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex -= 2;
        animatePageFlip('prev');
    }
}

function animatePageFlip(direction) {
    elements.book.classList.add('page-flip-' + direction);
    setTimeout(() => {
        renderBook();
        elements.book.classList.remove('page-flip-' + direction);
    }, 600);
}

function updateNavigation() {
    elements.prevBtn.disabled = currentPageIndex === 0;
    elements.nextBtn.disabled = currentPageIndex + 2 >= pages.length;
}

function updatePageCounter() {
    elements.currentPageNum.textContent = currentPageIndex + 1;
    elements.totalPagesNum.textContent = pages.length;
    updateNavigation();
}

/**
 * Open content modal
 */
function openContentModal(editMode = false) {
    elements.contentModal.classList.add('active');
    
    if (!editMode) {
        resetContentModal();
    }
}

function closeContentModal() {
    elements.contentModal.classList.remove('active');
    resetContentModal();
}

function resetContentModal() {
    elements.entryDate.value = new Date().toISOString().split('T')[0];
    elements.entryTitle.value = '';
    elements.entryText.value = '';
    tempImages = [];
    editingPageIndex = null;
    renderImagePreview();
}

/**
 * Edit page (OLD DESIGN)
 */
function editPage(index) {
    const page = pages[index];
    if (!page) return;
    
    editingPageIndex = index;
    
    // Set form values
    elements.entryDate.value = page.date ? new Date(page.date).toISOString().split('T')[0] : '';
    elements.entryTitle.value = page.title || '';
    elements.entryText.value = page.text || '';
    tempImages = [...(page.images || [])];
    
    // Render preview
    renderImagePreview();
    
    // Open modal
    elements.contentModal.classList.add('active');
}

/**
 * Delete page
 */
async function deletePage(index) {
    if (confirm('هل تريد حذف هذه الصفحة؟')) {
        pages.splice(index, 1);
        
        if (pages.length === 0) {
            pages = [createWelcomePage()];
        }
        
        if (currentPageIndex >= pages.length) {
            currentPageIndex = pages.length - 1;
        }
        
        await saveEncryptedData();
        renderBook();
        showNotification('تم حذف الصفحة');
    }
}

/**
 * Save new page (OLD DESIGN)
 */
async function saveNewPage() {
    const date = elements.entryDate.value;
    const title = elements.entryTitle.value.trim();
    const text = elements.entryText.value.trim();
    
    if (!date) {
        alert('الرجاء إدخال التاريخ');
        return;
    }
    
    const pageData = {
        id: Date.now(),
        date: new Date(date).toLocaleDateString('ar-EG'),
        title: title,
        text: text,
        images: [...tempImages],
        imagePositions: []
    };
    
    if (editingPageIndex !== null) {
        // Update existing page
        pages[editingPageIndex] = {
            ...pageData,
            id: pages[editingPageIndex].id // Keep original ID
        };
        showNotification('تم تحديث الصفحة');
        editingPageIndex = null;
    } else {
        // Add new page
        pages.push(pageData);
        currentPageIndex = pages.length - 1;
        showNotification('تمت إضافة الصفحة');
    }
    
    await saveEncryptedData();
    closeContentModal();
    renderBook();
}

/**
 * Handle image selection
 */
function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    
    if (tempImages.length + files.length > CONFIG.MAX_IMAGES_PER_PAGE) {
        alert(`يمكنك إضافة ${CONFIG.MAX_IMAGES_PER_PAGE} صور كحد أقصى`);
        return;
    }
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                tempImages.push(e.target.result);
                renderImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
    
    e.target.value = '';
}

function renderImagePreview() {
    elements.imagePreview.innerHTML = '';
    tempImages.forEach((imgData, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-item';
        wrapper.innerHTML = `
            <img src="${imgData}" alt="صورة ${index + 1}">
            <button class="remove-preview-img" data-index="${index}">×</button>
        `;
        elements.imagePreview.appendChild(wrapper);
    });
    
    // Attach remove listeners
    document.querySelectorAll('.remove-preview-img').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            tempImages.splice(index, 1);
            renderImagePreview();
        });
    });
}

/**
 * Export data (encrypted)
 */
async function exportData() {
    try {
        // Export as encrypted JSON
        const encrypted = await CryptoManager.encrypt(pages, currentPassword);
        const exportData = {
            version: '1.0',
            encrypted: true,
            data: encrypted,
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `encrypted-memories-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('تم تصدير البيانات المشفرة بنجاح! 🔒');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('حدث خطأ في التصدير', 'error');
    }
}

/**
 * Import data (encrypted)
 */
function importData() {
    elements.importInput.click();
}

async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Check if encrypted
            if (importedData.encrypted && importedData.data) {
                const decrypted = await CryptoManager.decrypt(importedData.data, currentPassword);
                pages = decrypted;
            } else if (Array.isArray(importedData)) {
                // Plain format (legacy)
                pages = importedData;
            } else {
                throw new Error('تنسيق ملف غير صالح');
            }
            
            await saveEncryptedData();
            currentPageIndex = 0;
            renderBook();
            showNotification(`تم استيراد ${pages.length} صفحة بنجاح! ✓`);
        } catch (error) {
            console.error('Import error:', error);
            alert('فشل استيراد الملف. تأكد من كلمة المرور أو تنسيق الملف.');
        }
        
        e.target.value = '';
    };
    
    reader.readAsText(file);
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== Change Password ====================

/**
 * Open change password modal
 */
function openChangePasswordModal() {
    elements.changePasswordModal.classList.add('active');
    elements.oldPassword.value = '';
    elements.newPassword.value = '';
    elements.confirmPassword.value = '';
}

/**
 * Close change password modal
 */
function closeChangePasswordModal() {
    elements.changePasswordModal.classList.remove('active');
}

/**
 * Handle password strength for new password
 */
function checkNewPasswordStrength() {
    const password = elements.newPassword.value;
    const strengthBar = elements.changePasswordStrengthBar;
    const strengthText = elements.changePasswordStrengthText;
    
    if (password.length === 0) {
        strengthBar.className = 'password-strength-bar';
        strengthBar.style.width = '0%';
        strengthText.textContent = '';
        return;
    }
    
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    if (strength < 40) {
        strengthBar.className = 'password-strength-bar weak';
        strengthText.textContent = 'ضعيفة';
        strengthText.style.color = '#e74c3c';
    } else if (strength < 70) {
        strengthBar.className = 'password-strength-bar medium';
        strengthText.textContent = 'متوسطة';
        strengthText.style.color = '#f39c12';
    } else {
        strengthBar.className = 'password-strength-bar strong';
        strengthText.textContent = 'قوية ✓';
        strengthText.style.color = '#27ae60';
    }
}

/**
 * Handle change password form submission
 */
async function handleChangePassword(e) {
    e.preventDefault();
    
    const oldPass = elements.oldPassword.value;
    const newPass = elements.newPassword.value;
    const confirmPass = elements.confirmPassword.value;
    
    // Validation
    if (!oldPass || !newPass || !confirmPass) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }
    
    if (newPass.length < 8) {
        alert('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
        return;
    }
    
    if (newPass !== confirmPass) {
        alert('كلمة المرور الجديدة غير متطابقة');
        return;
    }
    
    if (oldPass === newPass) {
        alert('كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة');
        return;
    }
    
    try {
        // Verify old password
        const isValid = await SecureStorage.verifyPassword(oldPass);
        if (!isValid) {
            alert('كلمة المرور الحالية غير صحيحة');
            return;
        }
        
        // Load data with old password
        const data = await SecureStorage.loadData(oldPass);
        if (!data) {
            throw new Error('فشل في تحميل البيانات');
        }
        
        // Save data with new password
        await SecureStorage.saveData(data, newPass);
        
        // Update password hash
        await SecureStorage.setPassword(newPass);
        
        // Update current password in memory
        currentPassword = newPass;
        
        showNotification('تم تغيير كلمة المرور بنجاح! ✓');
        closeChangePasswordModal();
    } catch (error) {
        console.error('Change password error:', error);
        alert('حدث خطأ في تغيير كلمة المرور. حاول مرة أخرى.');
    }
}

// ==================== Event Listeners ====================

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Logout
    elements.logoutBtn.addEventListener('click', openLogoutModal);
    elements.closeLogoutModal.addEventListener('click', closeLogoutModal);
    elements.cancelLogoutBtn.addEventListener('click', closeLogoutModal);
    elements.simpleLogoutBtn.addEventListener('click', simpleLogout);
    elements.fullLogoutBtn.addEventListener('click', fullLogout);
    
    // Change password
    elements.changePasswordBtn.addEventListener('click', openChangePasswordModal);
    elements.closeChangePasswordModal.addEventListener('click', closeChangePasswordModal);
    elements.cancelChangePasswordBtn.addEventListener('click', closeChangePasswordModal);
    elements.changePasswordForm.addEventListener('submit', handleChangePassword);
    elements.newPassword.addEventListener('input', checkNewPasswordStrength);
    
    // Navigation
    elements.prevBtn.addEventListener('click', prevPage);
    elements.nextBtn.addEventListener('click', nextPage);
    
    // Toolbar
    elements.addPageBtn.addEventListener('click', () => openContentModal());
    elements.addImageBtn.addEventListener('click', () => {
        if (pages.length > 0) {
            editPage(currentPageIndex);
        } else {
            alert('قم بإضافة صفحة أولاً');
        }
    });
    elements.exportBtn.addEventListener('click', exportData);
    elements.importBtn.addEventListener('click', importData);
    elements.importInput.addEventListener('change', handleImportFile);
    
    // Modal
    elements.closeModal.addEventListener('click', closeContentModal);
    elements.cancelBtn.addEventListener('click', closeContentModal);
    elements.saveBtn.addEventListener('click', saveNewPage);
    elements.uploadImageBtn.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', handleImageSelect);
    
    // Close modal on outside click
    elements.contentModal.addEventListener('click', (e) => {
        if (e.target === elements.contentModal) {
            closeContentModal();
        }
    });
    
    elements.changePasswordModal.addEventListener('click', (e) => {
        if (e.target === elements.changePasswordModal) {
            closeChangePasswordModal();
        }
    });
    
    elements.logoutModal.addEventListener('click', (e) => {
        if (e.target === elements.logoutModal) {
            closeLogoutModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeContentModal();
            closeChangePasswordModal();
            closeLogoutModal();
        }
        if (e.key === 'ArrowLeft' && !elements.contentModal.classList.contains('active')) {
            nextPage();
        }
        if (e.key === 'ArrowRight' && !elements.contentModal.classList.contains('active')) {
            prevPage();
        }
    });
}

/**
 * Attach page control listeners
 */
function attachPageControlListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            editPage(index);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            deletePage(index);
        });
    });
}

// ==================== Initialize Application ====================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

// ==================== Service Worker for Offline Support ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}

