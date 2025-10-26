// ==================== Crypto Utilities ====================
// Client-side encryption/decryption using Web Crypto API (AES-GCM)

const CryptoManager = {
    // Configuration
    SALT_LENGTH: 16,
    IV_LENGTH: 12,
    KEY_LENGTH: 256,
    ITERATIONS: 100000,
    
    /**
     * Generate encryption key from password
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        // Import password as key
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        // Derive AES-GCM key
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: this.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    },
    
    /**
     * Encrypt data with password
     */
    async encrypt(data, password) {
        try {
            // Convert data to string
            const jsonString = JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(jsonString);
            
            // Generate random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
            const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
            
            // Derive key from password
            const key = await this.deriveKey(password, salt);
            
            // Encrypt data
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );
            
            // Combine salt + iv + encrypted data
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(encryptedArray, salt.length + iv.length);
            
            // Convert to base64 for storage
            return this.arrayBufferToBase64(combined);
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    },
    
    /**
     * Decrypt data with password
     */
    async decrypt(encryptedBase64, password) {
        try {
            // Convert base64 to array buffer
            const combined = this.base64ToArrayBuffer(encryptedBase64);
            
            // Extract salt, iv, and encrypted data
            const salt = combined.slice(0, this.SALT_LENGTH);
            const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
            const encryptedData = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);
            
            // Derive key from password
            const key = await this.deriveKey(password, salt);
            
            // Decrypt data
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encryptedData
            );
            
            // Convert buffer to string and parse JSON
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decryptedBuffer);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Invalid password or corrupted data');
        }
    },
    
    /**
     * Hash password for verification
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
    },
    
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        const newHash = await this.hashPassword(password);
        return newHash === hash;
    },
    
    /**
     * Generate secure random password
     */
    generatePassword(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const randomValues = crypto.getRandomValues(new Uint8Array(length));
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }
        return password;
    },
    
    /**
     * Convert ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },
    
    /**
     * Convert Base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
};

// ==================== Secure Storage Manager ====================
const SecureStorage = {
    STORAGE_KEY: 'encrypted_memory_book',
    PASSWORD_HASH_KEY: 'memory_book_auth',
    SESSION_KEY: 'memory_book_session',
    SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const session = sessionStorage.getItem(this.SESSION_KEY);
        if (!session) return false;
        
        try {
            const { timestamp, hash } = JSON.parse(session);
            const now = Date.now();
            
            // Check if session is expired
            if (now - timestamp > this.SESSION_DURATION) {
                this.clearSession();
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * Create authentication session
     */
    createSession(passwordHash) {
        const session = {
            timestamp: Date.now(),
            hash: passwordHash
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },
    
    /**
     * Clear authentication session
     */
    clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
    },
    
    /**
     * Check if password is set
     */
    hasPassword() {
        return localStorage.getItem(this.PASSWORD_HASH_KEY) !== null;
    },
    
    /**
     * Set master password (first time setup)
     */
    async setPassword(password) {
        const hash = await CryptoManager.hashPassword(password);
        localStorage.setItem(this.PASSWORD_HASH_KEY, hash);
        this.createSession(hash);
    },
    
    /**
     * Verify password
     */
    async verifyPassword(password) {
        const storedHash = localStorage.getItem(this.PASSWORD_HASH_KEY);
        if (!storedHash) return false;
        
        const isValid = await CryptoManager.verifyPassword(password, storedHash);
        if (isValid) {
            this.createSession(storedHash);
        }
        return isValid;
    },
    
    /**
     * Save encrypted data
     */
    async saveData(data, password) {
        try {
            const encrypted = await CryptoManager.encrypt(data, password);
            localStorage.setItem(this.STORAGE_KEY, encrypted);
            return true;
        } catch (error) {
            console.error('Save error:', error);
            return false;
        }
    },
    
    /**
     * Load encrypted data
     */
    async loadData(password) {
        try {
            const encrypted = localStorage.getItem(this.STORAGE_KEY);
            if (!encrypted) return null;
            
            return await CryptoManager.decrypt(encrypted, password);
        } catch (error) {
            console.error('Load error:', error);
            throw error;
        }
    },
    
    /**
     * Check if encrypted data exists
     */
    hasData() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },
    
    /**
     * Clear all data (dangerous!)
     */
    clearAll() {
        if (confirm('⚠️ هذا سيحذف جميع البيانات نهائياً! هل أنت متأكد؟\n\n(تأكد من تصدير نسخة احتياطية أولاً)')) {
            if (confirm('⚠️ تأكيد نهائي: سيتم حذف كل شيء!\n\nهل أنت متأكد 100%؟')) {
                localStorage.removeItem(this.STORAGE_KEY);
                localStorage.removeItem(this.PASSWORD_HASH_KEY);
                this.clearSession();
                return true;
            }
        }
        return false;
    },
    
    /**
     * Change password
     */
    async changePassword(oldPassword, newPassword) {
        try {
            // Verify old password
            const isValid = await this.verifyPassword(oldPassword);
            if (!isValid) {
                throw new Error('كلمة المرور القديمة غير صحيحة');
            }
            
            // Load data with old password
            const data = await this.loadData(oldPassword);
            if (!data) {
                throw new Error('فشل في تحميل البيانات');
            }
            
            // Save data with new password
            await this.saveData(data, newPassword);
            
            // Update password hash
            await this.setPassword(newPassword);
            
            return true;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoManager, SecureStorage };
}

