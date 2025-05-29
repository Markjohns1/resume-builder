/**
 * Storage - localStorage wrapper for resume data persistence
 * Provides methods for saving, loading, and managing resume data
 */
export class Storage {
    constructor() {
        this.prefix = 'resume_builder_';
        this.resumesKey = `${this.prefix}resumes`;
        this.currentKey = `${this.prefix}current`;
        this.settingsKey = `${this.prefix}settings`;
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Whether localStorage is available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage is not available:', error);
            return false;
        }
    }

    /**
     * Save resume data
     * @param {string} name - Resume name
     * @param {Object} resumeData - Resume data to save
     * @returns {boolean} Whether save was successful
     */
    saveResume(name, resumeData) {
        if (!this.isAvailable()) {
            throw new Error('Storage is not available');
        }

        try {
            const resumes = this.getAllResumes();
            const resumeId = this.generateResumeId(name);
            
            const saveData = {
                id: resumeId,
                name: name.trim(),
                data: resumeData.data || {},
                template: resumeData.template || null,
                theme: resumeData.theme || 'modern',
                metadata: {
                    ...resumeData.metadata,
                    createdAt: resumes[resumeId]?.metadata?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    version: '1.0'
                }
            };

            resumes[resumeId] = saveData;
            localStorage.setItem(this.resumesKey, JSON.stringify(resumes));
            
            // Update current resume
            this.setCurrentResume(resumeId);
            
            return true;
        } catch (error) {
            console.error('Failed to save resume:', error);
            throw new Error('Failed to save resume');
        }
    }

    /**
     * Load resume by ID
     * @param {string} resumeId - Resume ID
     * @returns {Object|null} Resume data or null if not found
     */
    loadResume(resumeId) {
        if (!this.isAvailable()) {
            throw new Error('Storage is not available');
        }

        try {
            const resumes = this.getAllResumes();
            return resumes[resumeId] || null;
        } catch (error) {
            console.error('Failed to load resume:', error);
            return null;
        }
    }

    /**
     * Delete resume by ID
     * @param {string} resumeId - Resume ID
     * @returns {boolean} Whether deletion was successful
     */
    deleteResume(resumeId) {
        if (!this.isAvailable()) {
            throw new Error('Storage is not available');
        }

        try {
            const resumes = this.getAllResumes();
            
            if (resumes[resumeId]) {
                delete resumes[resumeId];
                localStorage.setItem(this.resumesKey, JSON.stringify(resumes));
                
                // Clear current resume if it was deleted
                const currentResumeId = this.getCurrentResumeId();
                if (currentResumeId === resumeId) {
                    this.clearCurrentResume();
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to delete resume:', error);
            return false;
        }
    }

    /**
     * Get all saved resumes
     * @returns {Object} All resumes data
     */
    getAllResumes() {
        if (!this.isAvailable()) {
            return {};
        }

        try {
            const data = localStorage.getItem(this.resumesKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load resumes:', error);
            return {};
        }
    }

    /**
     * Get list of saved resume summaries
     * @returns {Array} Array of resume summaries
     */
    getResumeList() {
        const resumes = this.getAllResumes();
        
        return Object.values(resumes)
            .map(resume => ({
                id: resume.id,
                name: resume.name,
                template: resume.template?.name || 'Unknown Template',
                theme: resume.theme || 'modern',
                createdAt: resume.metadata?.createdAt,
                updatedAt: resume.metadata?.updatedAt,
                hasContent: this.hasContent(resume.data)
            }))
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    /**
     * Check if resume data has content
     * @param {Object} data - Resume data
     * @returns {boolean} Whether data has content
     */
    hasContent(data) {
        if (!data || typeof data !== 'object') return false;
        
        return Object.values(data).some(section => {
            if (!section) return false;
            if (typeof section === 'string') return section.trim().length > 0;
            if (typeof section === 'object') return Object.keys(section).length > 0;
            return false;
        });
    }

    /**
     * Save current working resume data
     * @param {Object} resumeData - Current resume data
     */
    saveCurrentResume(resumeData) {
        if (!this.isAvailable()) return;

        try {
            const saveData = {
                data: resumeData.data || {},
                template: resumeData.template || null,
                theme: resumeData.theme || 'modern',
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem(this.currentKey, JSON.stringify(saveData));
        } catch (error) {
            console.error('Failed to save current resume:', error);
        }
    }

    /**
     * Load current working resume data
     * @returns {Object|null} Current resume data or null
     */
    loadCurrentResume() {
        if (!this.isAvailable()) return null;

        try {
            const data = localStorage.getItem(this.currentKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load current resume:', error);
            return null;
        }
    }

    /**
     * Clear current working resume
     */
    clearCurrentResume() {
        if (!this.isAvailable()) return;

        try {
            localStorage.removeItem(this.currentKey);
        } catch (error) {
            console.error('Failed to clear current resume:', error);
        }
    }

    /**
     * Set current resume ID
     * @param {string} resumeId - Resume ID
     */
    setCurrentResume(resumeId) {
        if (!this.isAvailable()) return;

        try {
            localStorage.setItem(`${this.prefix}current_id`, resumeId);
        } catch (error) {
            console.error('Failed to set current resume ID:', error);
        }
    }

    /**
     * Get current resume ID
     * @returns {string|null} Current resume ID or null
     */
    getCurrentResumeId() {
        if (!this.isAvailable()) return null;

        try {
            return localStorage.getItem(`${this.prefix}current_id`);
        } catch (error) {
            console.error('Failed to get current resume ID:', error);
            return null;
        }
    }

    /**
     * Save application settings
     * @param {Object} settings - Settings object
     */
    saveSettings(settings) {
        if (!this.isAvailable()) return;

        try {
            const currentSettings = this.getSettings();
            const newSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get application settings
     * @returns {Object} Settings object
     */
    getSettings() {
        if (!this.isAvailable()) {
            return this.getDefaultSettings();
        }

        try {
            const data = localStorage.getItem(this.settingsKey);
            const settings = data ? JSON.parse(data) : {};
            return { ...this.getDefaultSettings(), ...settings };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Get default settings
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return {
            defaultTheme: 'modern',
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            defaultTemplate: 'modern',
            showHints: true,
            preferredZoom: 100
        };
    }

    /**
     * Generate unique resume ID
     * @param {string} name - Resume name
     * @returns {string} Unique resume ID
     */
    generateResumeId(name) {
        const base = name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            || 'resume';
        
        const timestamp = Date.now();
        return `${base}_${timestamp}`;
    }

    /**
     * Export all resume data
     * @returns {Object} All resume data for export
     */
    exportAllData() {
        return {
            resumes: this.getAllResumes(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import resume data
     * @param {Object} importData - Data to import
     * @returns {boolean} Whether import was successful
     */
    importData(importData) {
        if (!this.isAvailable()) {
            throw new Error('Storage is not available');
        }

        try {
            if (importData.resumes) {
                localStorage.setItem(this.resumesKey, JSON.stringify(importData.resumes));
            }
            
            if (importData.settings) {
                localStorage.setItem(this.settingsKey, JSON.stringify(importData.settings));
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            throw new Error('Failed to import data');
        }
    }

    /**
     * Clear all data
     * @returns {boolean} Whether clearing was successful
     */
    clearAllData() {
        if (!this.isAvailable()) {
            throw new Error('Storage is not available');
        }

        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage information
     */
    getStorageInfo() {
        if (!this.isAvailable()) {
            return { available: false };
        }

        try {
            const resumes = this.getAllResumes();
            const resumeCount = Object.keys(resumes).length;
            
            // Estimate storage usage
            const dataString = JSON.stringify(resumes);
            const sizeInBytes = new Blob([dataString]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            return {
                available: true,
                resumeCount,
                sizeInKB,
                sizeInBytes
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return { available: false, error: error.message };
        }
    }

    /**
     * Auto-save current resume
     * @param {Object} resumeData - Resume data to auto-save
     */
    autoSave(resumeData) {
        const settings = this.getSettings();
        if (settings.autoSave) {
            this.saveCurrentResume(resumeData);
        }
    }

    /**
     * Check if a resume name already exists
     * @param {string} name - Resume name to check
     * @param {string} excludeId - Resume ID to exclude from check
     * @returns {boolean} Whether name exists
     */
    resumeNameExists(name, excludeId = null) {
        const resumes = this.getAllResumes();
        return Object.values(resumes).some(resume => 
            resume.name.toLowerCase() === name.toLowerCase() && resume.id !== excludeId
        );
    }

    /**
     * Generate unique resume name
     * @param {string} baseName - Base name
     * @returns {string} Unique name
     */
    generateUniqueName(baseName) {
        let name = baseName;
        let counter = 1;
        
        while (this.resumeNameExists(name)) {
            name = `${baseName} (${counter})`;
            counter++;
        }
        
        return name;
    }
}
