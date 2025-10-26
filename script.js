// ==================== الإعدادات العامة ====================
const CONFIG = {
    // إعدادات التخزين
    STORAGE_KEY: 'memoryBook_pages',
    
    // إعدادات الصفحات
    MAX_IMAGES_PER_PAGE: 4
};

// ==================== المتغيرات العامة ====================
let pages = [];
let currentPageIndex = 0;
let tempImages = [];

// ==================== عناصر DOM ====================
const elements = {
    book: document.getElementById('book'),
    currentPageNum: document.getElementById('currentPageNum'),
    totalPagesNum: document.getElementById('totalPagesNum'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    addPageBtn: document.getElementById('addPageBtn'),
    addImageBtn: document.getElementById('addImageBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importInput: document.getElementById('importInput'),
    
    // نافذة المحتوى
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

// ==================== التهيئة ====================
function init() {
    loadPages();
    renderBook();
    attachEventListeners();
    updateNavigation();
    
    // تعيين التاريخ الافتراضي لليوم
    const today = new Date().toISOString().split('T')[0];
    elements.entryDate.value = today;
    
    console.log('تم تحميل دفتر المذكرات بنجاح!');
}

// ==================== تحميل وحفظ البيانات ====================
function loadPages() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (stored) {
            pages = JSON.parse(stored);
        }
        
        // إضافة صفحة افتراضية إذا كانت القائمة فارغة
        if (pages.length === 0) {
            pages.push(createWelcomePage());
        }
    } catch (error) {
        console.error('خطأ في تحميل الصفحات:', error);
        pages = [createWelcomePage()];
    }
}

function savePages() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(pages));
        console.log('تم حفظ الصفحات بنجاح');
    } catch (error) {
        console.error('خطأ في حفظ الصفحات:', error);
        alert('عذراً، حدث خطأ في حفظ البيانات');
    }
}

function createWelcomePage() {
    return {
        id: Date.now(),
        date: new Date().toLocaleDateString('ar-EG'),
        title: 'مرحباً بك في دفتر مذكراتي',
        text: 'هذا هو دفتر مذكراتك الشخصي.\n\nاضغط على زر "+" لإضافة صفحة جديدة.\n\nيمكنك إضافة:\n• التاريخ والعنوان\n• نصوص بخط يدوي جميل\n• صور من جهازك (حتى 4 صور)\n• تحريك الصور بالسحب والإفلات\n\nجميع بياناتك محفوظة في متصفحك بأمان.',
        images: []
    };
}

// ==================== عرض الكتاب ====================
function renderBook() {
    elements.book.innerHTML = '';
    
    if (pages.length === 0) {
        renderEmptyBook();
        return;
    }
    
    // عرض الصفحة الحالية والصفحة التالية (تصميم الكتاب المفتوح)
    renderPage(currentPageIndex, 'left');
    if (currentPageIndex + 1 < pages.length) {
        renderPage(currentPageIndex + 1, 'right');
    }
    
    updatePageCounter();
}

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

// ==================== التنقل بين الصفحات ====================
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
    const book = elements.book;
    book.style.opacity = '0';
    book.style.transform = direction === 'next' ? 'rotateY(-5deg)' : 'rotateY(5deg)';
    
    setTimeout(() => {
        renderBook();
        book.style.transform = 'rotateY(0deg)';
        book.style.opacity = '1';
    }, 300);
}

function updateNavigation() {
    elements.prevBtn.disabled = currentPageIndex === 0;
    elements.nextBtn.disabled = currentPageIndex + 2 >= pages.length;
}

function updatePageCounter() {
    const currentPage = Math.floor(currentPageIndex / 2) + 1;
    const totalPages = Math.ceil(pages.length / 2);
    elements.currentPageNum.textContent = currentPage;
    elements.totalPagesNum.textContent = totalPages;
}

// ==================== إضافة محتوى جديد ====================
let editingPageIndex = -1; // لتتبع الصفحة التي يتم تعديلها

function openContentModal(editMode = false) {
    if (!editMode) {
        resetContentModal();
    }
    elements.contentModal.classList.add('active');
}

function closeContentModal() {
    elements.contentModal.classList.remove('active');
    resetContentModal();
}

function resetContentModal() {
    elements.entryDate.value = new Date().toISOString().split('T')[0];
    elements.entryTitle.value = '';
    elements.entryText.value = '';
    elements.imagePreview.innerHTML = '';
    tempImages = [];
    editingPageIndex = -1;
    
    // إعادة تعيين النصوص الافتراضية
    const modalTitle = elements.contentModal.querySelector('.modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'إضافة محتوى';
    }
    if (elements.saveBtn) {
        elements.saveBtn.textContent = 'حفظ';
    }
}

function saveNewPage() {
    const date = elements.entryDate.value;
    const title = elements.entryTitle.value.trim();
    const text = elements.entryText.value.trim();
    
    if (!title && !text && tempImages.length === 0) {
        alert('الرجاء إضافة محتوى على الأقل (عنوان أو نص أو صورة)');
        return;
    }
    
    if (editingPageIndex >= 0) {
        // وضع التعديل
        pages[editingPageIndex] = {
            ...pages[editingPageIndex],
            date: date ? new Date(date).toLocaleDateString('ar-EG') : '',
            title: title,
            text: text,
            images: [...tempImages]
        };
        showNotification('تم تحديث الصفحة بنجاح! ✓');
        editingPageIndex = -1;
    } else {
        // وضع الإضافة
        const newPage = {
            id: Date.now(),
            date: date ? new Date(date).toLocaleDateString('ar-EG') : '',
            title: title,
            text: text,
            images: [...tempImages]
        };
        
        pages.push(newPage);
        
        // الانتقال إلى الصفحة الجديدة
        currentPageIndex = pages.length - 1;
        if (currentPageIndex % 2 !== 0) {
            currentPageIndex -= 1;
        }
        
        showNotification('تم إضافة الصفحة بنجاح! ✓');
    }
    
    savePages();
    closeContentModal();
    renderBook();
    updateNavigation();
}

// ==================== إدارة الصور ====================
function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                addImageToPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

function addImageToPreview(imageData) {
    if (tempImages.length >= CONFIG.MAX_IMAGES_PER_PAGE) {
        alert(`يمكنك إضافة حتى ${CONFIG.MAX_IMAGES_PER_PAGE} صور في الصفحة الواحدة`);
        return;
    }
    
    tempImages.push(imageData);
    renderImagePreview();
}

function renderImagePreview() {
    elements.imagePreview.innerHTML = tempImages.map((img, index) => `
        <div class="preview-item">
            <img src="${img}" alt="صورة ${index + 1}">
            <button class="remove-image" onclick="removeImage(${index})">&times;</button>
        </div>
    `).join('');
}

function removeImage(index) {
    tempImages.splice(index, 1);
    renderImagePreview();
}

// ==================== تصدير واستيراد البيانات ====================
function exportData() {
    const dataStr = JSON.stringify(pages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-book-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('تم تصدير البيانات بنجاح!');
}

function importData() {
    elements.importInput.click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // تأكيد قبل الاستيراد
    const confirmImport = confirm(
        'هل تريد استيراد هذه المذكرات؟\n\n' +
        'ملاحظة: يمكنك الاختيار بين:\n' +
        '• OK = استبدال المذكرات الحالية\n' +
        '• Cancel = إلغاء العملية\n\n' +
        'انقر OK للمتابعة'
    );
    
    if (!confirmImport) {
        event.target.value = ''; // إعادة تعيين input
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedPages = JSON.parse(e.target.result);
            
            // التحقق من صحة البيانات
            if (!Array.isArray(importedPages)) {
                alert('ملف غير صالح! الرجاء اختيار ملف مذكرات صحيح.');
                return;
            }
            
            // استبدال البيانات الحالية
            pages = importedPages;
            savePages();
            
            // إعادة العرض
            currentPageIndex = 0;
            renderBook();
            updateNavigation();
            
            showNotification(`تم استيراد ${pages.length} صفحة بنجاح! ✓`);
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            alert('حدث خطأ في قراءة الملف. تأكد من أنه ملف JSON صحيح.');
        }
        
        // إعادة تعيين input
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// ==================== الإشعارات ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 3000;
        font-family: 'Aref Ruqaa', serif;
        font-size: 16px;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ==================== Event Listeners ====================
function attachEventListeners() {
    // التنقل
    elements.prevBtn.addEventListener('click', prevPage);
    elements.nextBtn.addEventListener('click', nextPage);
    
    // شريط الأدوات
    elements.addPageBtn.addEventListener('click', () => openContentModal());
    elements.addImageBtn.addEventListener('click', () => {
        // إذا كانت هناك صفحات، افتح نافذة التعديل للصفحة الحالية
        if (pages.length > 0) {
            const currentPage = currentPageIndex < pages.length ? currentPageIndex : 0;
            editPage(currentPage);
        } else {
            alert('قم بإضافة صفحة أولاً باستخدام زر +');
        }
    });
    elements.exportBtn.addEventListener('click', exportData);
    elements.importBtn.addEventListener('click', importData);
    elements.importInput.addEventListener('change', handleImportFile);
    
    // نافذة المحتوى
    elements.closeModal.addEventListener('click', closeContentModal);
    elements.cancelBtn.addEventListener('click', closeContentModal);
    elements.saveBtn.addEventListener('click', saveNewPage);
    elements.uploadImageBtn.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', handleImageUpload);
    
    // إغلاق النوافذ عند الضغط خارجها
    elements.contentModal.addEventListener('click', (e) => {
        if (e.target === elements.contentModal) {
            closeContentModal();
        }
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            prevPage();
        } else if (e.key === 'ArrowLeft') {
            nextPage();
        } else if (e.key === 'Escape') {
            closeContentModal();
        }
    });
}

// ==================== تعديل وحذف الصفحات ====================
function editPage(index) {
    if (index < 0 || index >= pages.length) return;
    
    const page = pages[index];
    editingPageIndex = index;
    
    // ملء البيانات في النموذج
    if (page.date) {
        // تحويل التاريخ العربي إلى صيغة input[type="date"]
        const parts = page.date.split('/');
        if (parts.length === 3) {
            const dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            elements.entryDate.value = dateStr;
        }
    }
    
    elements.entryTitle.value = page.title || '';
    elements.entryText.value = page.text || '';
    
    // تحميل الصور
    tempImages = page.images ? [...page.images] : [];
    renderImagePreview();
    
    // تغيير عنوان النافذة
    const modalTitle = elements.contentModal.querySelector('.modal-header h2');
    modalTitle.textContent = 'تعديل الصفحة';
    
    // تغيير نص زر الحفظ
    elements.saveBtn.textContent = 'تحديث';
    
    openContentModal(true);
}

function deletePage(index) {
    if (index < 0 || index >= pages.length) return;
    
    const page = pages[index];
    const pageTitle = page.title || 'هذه الصفحة';
    
    // تأكيد الحذف
    const confirmDelete = confirm(`هل أنت متأكد من حذف "${pageTitle}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`);
    
    if (confirmDelete) {
        // حذف الصفحة
        pages.splice(index, 1);
        savePages();
        
        // تعديل currentPageIndex إذا لزم الأمر
        if (currentPageIndex >= pages.length) {
            currentPageIndex = Math.max(0, pages.length - 2);
            if (currentPageIndex % 2 !== 0) {
                currentPageIndex -= 1;
            }
        }
        
        renderBook();
        updateNavigation();
        showNotification('تم حذف الصفحة بنجاح ✓');
    }
}

// ==================== تحريك الصور (Drag & Drop) ====================
function initImageDragging(pageIndex) {
    const pageImages = document.querySelectorAll(`[data-page-index="${pageIndex}"].page-image`);
    
    pageImages.forEach(imageDiv => {
        let isDragging = false;
        let startX, startY;
        let currentX = 0, currentY = 0;
        
        // الحصول على الموضع الحالي من transform
        const transform = imageDiv.style.transform;
        const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (translateMatch) {
            currentX = parseFloat(translateMatch[1]);
            currentY = parseFloat(translateMatch[2]);
        }
        
        imageDiv.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'IMG') {
                isDragging = true;
                startX = e.clientX - currentX;
                startY = e.clientY - currentY;
                imageDiv.style.cursor = 'grabbing';
                imageDiv.style.zIndex = '1000';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && imageDiv) {
                currentX = e.clientX - startX;
                currentY = e.clientY - startY;
                
                // الحصول على زاوية الدوران الحالية
                const rotateMatch = imageDiv.style.transform.match(/rotate\(([^)]+)deg\)/);
                const rotation = rotateMatch ? rotateMatch[1] : '0';
                
                imageDiv.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                imageDiv.style.cursor = 'grab';
                imageDiv.style.zIndex = '';
                
                // حفظ الموضع الجديد
                const imgIndex = parseInt(imageDiv.dataset.imgIndex);
                const page = pages[pageIndex];
                
                if (!page.imagePositions) {
                    page.imagePositions = [];
                }
                
                page.imagePositions[imgIndex] = { x: currentX, y: currentY };
                savePages();
            }
        });
        
        // دعم اللمس للموبايل
        imageDiv.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'IMG') {
                isDragging = true;
                const touch = e.touches[0];
                startX = touch.clientX - currentX;
                startY = touch.clientY - currentY;
                imageDiv.style.cursor = 'grabbing';
                imageDiv.style.zIndex = '1000';
                e.preventDefault();
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging && imageDiv) {
                const touch = e.touches[0];
                currentX = touch.clientX - startX;
                currentY = touch.clientY - startY;
                
                const rotateMatch = imageDiv.style.transform.match(/rotate\(([^)]+)deg\)/);
                const rotation = rotateMatch ? rotateMatch[1] : '0';
                
                imageDiv.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                imageDiv.style.cursor = 'grab';
                imageDiv.style.zIndex = '';
                
                const imgIndex = parseInt(imageDiv.dataset.imgIndex);
                const page = pages[pageIndex];
                
                if (!page.imagePositions) {
                    page.imagePositions = [];
                }
                
                page.imagePositions[imgIndex] = { x: currentX, y: currentY };
                savePages();
            }
        });
    });
}

// جعل الوظائف متاحة عالمياً
window.editPage = editPage;
window.deletePage = deletePage;

// إضافة CSS للأنيميشن
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// ==================== بدء التطبيق ====================
document.addEventListener('DOMContentLoaded', init);

