/**
 * Resume Builder - Main Application
 * Coordinates all components and handles page-specific functionality
 */
import { FormBuilder } from '/resume-builder/FormBuilder.js';
import { Resume } from '/resume-builder/Resume.js';
import { Storage } from '/resume-builder/storage.js';
import { PDFGenerator } from '/resume-builder/pdf.js';

class ResumeBuilderApp {
    constructor() {
        this.formBuilder = null;
        this.resume = new Resume();
        this.storage = new Storage();
        this.pdfGenerator = new PDFGenerator();
        this.templates = [];
        this.currentTemplate = null;
        this.autoSaveTimer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            await this.loadTemplates();
            this.initializePage();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Load templates from JSON file
     */
    async loadTemplates() {
        try {
            const response = await fetch('/resume-builder/templates.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.templates = data.templates || [];
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.showError('Failed to load resume templates. Please check your connection.');
            // Fallback templates
            this.templates = this.getFallbackTemplates();
        }
    }

    /**
     * Get fallback templates if loading fails
     */
    getFallbackTemplates() {
        return [
            {
                id: 'modern',
                name: 'Modern Professional',
                description: 'Clean and modern design',
                theme: 'modern',
                sections: [
                    {
                        id: 'personal',
                        name: 'Personal Information',
                        required: true,
                        fields: [
                            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
                            { name: 'email', label: 'Email', type: 'email', required: true },
                            { name: 'phone', label: 'Phone', type: 'tel', required: true },
                            { name: 'location', label: 'Location', type: 'text' }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Initialize page-specific functionality
     */
    initializePage() {
        const path = window.location.pathname;
        const page = this.getPageFromPath(path);

        switch (page) {
            case 'index':
                this.initIndexPage();
                break;
            case 'builder':
                this.initBuilderPage();
                break;
            case 'preview':
                this.initPreviewPage();
                break;
            default:
                console.warn('Unknown page:', page);
        }
    }

    /**
     * Get page name from path
     */
    getPageFromPath(path) {
        if (path.includes('builder.html')) return 'builder';
        if (path.includes('preview.html')) return 'preview';
        return 'index';
    }

    /**
     * Initialize index page
     */
    initIndexPage() {
        this.populateTemplatesGrid();
        this.setupIndexEventListeners();
        this.checkForSavedResumes();
    }

    /**
     * Initialize builder page
     */
    initBuilderPage() {
        this.setupBuilderPage();
        this.loadSavedState();
        this.setupAutoSave();
    }

    /**
     * Initialize preview page
     */
    initPreviewPage() {
        this.setupPreviewPage();
        this.loadResumeForPreview();
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.initializePage();
        });

        // Handle visibility change for auto-save
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.formBuilder) {
                this.saveCurrentState();
            }
        });

        // Handle beforeunload for unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * Setup index page event listeners
     */
    setupIndexEventListeners() {
        // Load resume button
        const loadResumeBtn = document.getElementById('loadResumeBtn');
        const loadResumeModal = document.getElementById('loadResumeModal');
        const closeModal = document.getElementById('closeModal');

        if (loadResumeBtn && loadResumeModal) {
            loadResumeBtn.addEventListener('click', () => {
                this.showLoadResumeModal();
            });

            closeModal?.addEventListener('click', () => {
                this.hideModal(loadResumeModal);
            });

            loadResumeModal.addEventListener('click', (e) => {
                if (e.target === loadResumeModal) {
                    this.hideModal(loadResumeModal);
                }
            });
        }
    }

    /**
     * Populate templates grid on index page
     */
    populateTemplatesGrid() {
        const grid = document.getElementById('templatesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-preview">
                    <div class="template-preview-content theme-${template.theme}">
                        <div class="preview-header"></div>
                        <div class="preview-lines">
                            <div class="preview-line long"></div>
                            <div class="preview-line medium"></div>
                            <div class="preview-line short"></div>
                        </div>
                    </div>
                </div>
                <div class="template-info">
                    <h4 class="template-name">${template.name}</h4>
                    <p class="template-description">${template.description}</p>
                    <button class="btn btn-primary" data-template="${template.id}">
                        Use This Template
                    </button>
                </div>
            `;

            const button = card.querySelector('button');
            button.addEventListener('click', () => {
                this.selectTemplate(template.id);
            });

            grid.appendChild(card);
        });
    }

    /**
     * Select template and navigate to builder
     */
    selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            this.storage.saveSettings({ selectedTemplate: templateId });
            window.location.href = 'builder.html';
        }
    }

    /**
     * Setup builder page
     */
    setupBuilderPage() {
        const formContainer = document.getElementById('formContainer');
        const templateSelect = document.getElementById('templateSelect');
        const previewContainer = document.getElementById('resumePreview');

        if (!formContainer || !templateSelect || !previewContainer) {
            console.error('Builder page elements not found');
            return;
        }

        // Initialize form builder
        this.formBuilder = new FormBuilder(formContainer);
        this.formBuilder.onChange((data) => {
            this.handleFormChange(data);
        });

        // Populate template selector
        this.populateTemplateSelector(templateSelect);

        // Setup builder event listeners
        this.setupBuilderEventListeners();
    }

    /**
     * Populate template selector
     */
    populateTemplateSelector(select) {
        select.innerHTML = '';
        
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            select.appendChild(option);
        });

        // Set default template
        const settings = this.storage.getSettings();
        const defaultTemplate = settings.selectedTemplate || settings.defaultTemplate || this.templates[0]?.id;
        if (defaultTemplate) {
            select.value = defaultTemplate;
            this.selectTemplateForBuilder(defaultTemplate);
        }

        select.addEventListener('change', (e) => {
            this.selectTemplateForBuilder(e.target.value);
        });
    }

    /**
     * Select template for builder
     */
    selectTemplateForBuilder(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        this.currentTemplate = template;
        this.resume.setTemplate(template);
        this.resume.setTheme(template.theme);
        
        if (this.formBuilder) {
            this.formBuilder.init(template);
        }
        
        this.updatePreview();
    }

    /**
     * Setup builder page event listeners
     */
    setupBuilderEventListeners() {
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        const saveModal = document.getElementById('saveModal');
        const closeSaveModal = document.getElementById('closeSaveModal');
        const cancelSave = document.getElementById('cancelSave');
        const confirmSave = document.getElementById('confirmSave');

        if (saveBtn && saveModal) {
            saveBtn.addEventListener('click', () => {
                this.showSaveModal();
            });

            closeSaveModal?.addEventListener('click', () => {
                this.hideModal(saveModal);
            });

            cancelSave?.addEventListener('click', () => {
                this.hideModal(saveModal);
            });

            confirmSave?.addEventListener('click', () => {
                this.saveResume();
            });

            saveModal.addEventListener('click', (e) => {
                if (e.target === saveModal) {
                    this.hideModal(saveModal);
                }
            });
        }

        // Load button
        const loadBtn = document.getElementById('loadBtn');
        const loadModal = document.getElementById('loadModal');
        const closeLoadModal = document.getElementById('closeLoadModal');

        if (loadBtn && loadModal) {
            loadBtn.addEventListener('click', () => {
                this.showLoadResumeModal('loadModal');
            });

            closeLoadModal?.addEventListener('click', () => {
                this.hideModal(loadModal);
            });

            loadModal.addEventListener('click', (e) => {
                if (e.target === loadModal) {
                    this.hideModal(loadModal);
                }
            });
        }

        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.goToPreview();
            });
        }

        // Zoom controls
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const zoomLevel = document.getElementById('zoomLevel');

        if (zoomIn && zoomOut && zoomLevel) {
            let currentZoom = 100;
            
            zoomIn.addEventListener('click', () => {
                currentZoom = Math.min(currentZoom + 25, 200);
                this.updateZoom(currentZoom, zoomLevel);
            });

            zoomOut.addEventListener('click', () => {
                currentZoom = Math.max(currentZoom - 25, 50);
                this.updateZoom(currentZoom, zoomLevel);
            });
        }
    }

    /**
     * Setup preview page
     */
    setupPreviewPage() {
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            this.populateTemplateSelector(templateSelect);
        }

        this.setupPreviewEventListeners();
    }

    /**
     * Setup preview page event listeners
     */
    setupPreviewEventListeners() {
        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadPDF();
            });
        }

        // Print button
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Zoom controls
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const zoomLevel = document.getElementById('zoomLevel');

        if (zoomIn && zoomOut && zoomLevel) {
            let currentZoom = 100;
            
            zoomIn.addEventListener('click', () => {
                currentZoom = Math.min(currentZoom + 25, 200);
                this.updateZoom(currentZoom, zoomLevel);
            });

            zoomOut.addEventListener('click', () => {
                currentZoom = Math.max(currentZoom - 25, 50);
                this.updateZoom(currentZoom, zoomLevel);
            });
        }
    }

    /**
     * Handle form data changes
     */
    handleFormChange(data) {
        this.resume.setData(data);
        this.updatePreview();
        this.scheduleAutoSave();
    }

    /**
     * Update resume preview
     */
    updatePreview() {
        const previewContainer = document.getElementById('resumePreview');
        if (!previewContainer) return;

        const html = this.resume.generateHTML();
        previewContainer.innerHTML = html;
    }

    /**
     * Show save modal
     */
    showSaveModal() {
        const modal = document.getElementById('saveModal');
        const nameInput = document.getElementById('resumeName');
        
        if (modal && nameInput) {
            // Generate default name
            const personal = this.resume.getData().personal || {};
            const defaultName = personal.fullName 
                ? `${personal.fullName} Resume`
                : 'My Resume';
            
            nameInput.value = this.storage.generateUniqueName(defaultName);
            this.showModal(modal);
            nameInput.focus();
            nameInput.select();
        }
    }

    /**
     * Save resume
     */
    async saveResume() {
        const nameInput = document.getElementById('resumeName');
        const modal = document.getElementById('saveModal');
        
        if (!nameInput || !modal) return;

        const name = nameInput.value.trim();
        if (!name) {
            this.showError('Please enter a resume name');
            return;
        }

        try {
            const resumeData = this.resume.export();
            this.storage.saveResume(name, resumeData);
            this.hideModal(modal);
            this.showSuccess('Resume saved successfully!');
        } catch (error) {
            console.error('Failed to save resume:', error);
            this.showError('Failed to save resume. Please try again.');
        }
    }

    /**
     * Show load resume modal
     */
    showLoadResumeModal(modalId = 'loadResumeModal') {
        const modal = document.getElementById(modalId);
        const list = modal?.querySelector('#savedResumesList') || document.getElementById('savedResumesList');
        const noResumes = modal?.querySelector('#noSavedResumes') || document.getElementById('noSavedResumes');
        
        if (!modal || !list) return;

        const resumes = this.storage.getResumeList();
        
        list.innerHTML = '';
        
        if (resumes.length === 0) {
            list.style.display = 'none';
            if (noResumes) noResumes.style.display = 'block';
        } else {
            list.style.display = 'block';
            if (noResumes) noResumes.style.display = 'none';
            
            resumes.forEach(resume => {
                const item = document.createElement('div');
                item.className = 'saved-resume-item';
                item.innerHTML = `
                    <div class="resume-item-name">${this.escapeHtml(resume.name)}</div>
                    <div class="resume-item-date">
                        Last modified: ${this.formatDate(resume.updatedAt)}
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    this.loadResume(resume.id);
                    this.hideModal(modal);
                });
                
                list.appendChild(item);
            });
        }
        
        this.showModal(modal);
    }

    /**
     * Load resume by ID
     */
    loadResume(resumeId) {
        try {
            const resumeData = this.storage.loadResume(resumeId);
            if (!resumeData) {
                this.showError('Resume not found');
                return;
            }

            this.resume.import(resumeData);
            
            if (resumeData.template) {
                this.currentTemplate = resumeData.template;
                const templateSelect = document.getElementById('templateSelect');
                if (templateSelect) {
                    templateSelect.value = resumeData.template.id;
                }
            }

            if (this.formBuilder) {
                this.formBuilder.setData(resumeData.data || {});
            }

            this.updatePreview();
            this.showSuccess('Resume loaded successfully!');
        } catch (error) {
            console.error('Failed to load resume:', error);
            this.showError('Failed to load resume. Please try again.');
        }
    }

    /**
     * Go to preview page
     */
    goToPreview() {
        this.saveCurrentState();
        window.location.href = 'preview.html';
    }

    /**
     * Load resume for preview page
     */
    loadResumeForPreview() {
        const currentData = this.storage.loadCurrentResume();
        if (currentData) {
            this.resume.import(currentData);
            
            // Set template selector
            const templateSelect = document.getElementById('templateSelect');
            if (templateSelect && currentData.template) {
                templateSelect.value = currentData.template.id;
            }
            
            this.updatePreview();
        } else {
            this.showError('No resume data found. Please return to the builder.');
        }
    }

    /**
     * Download PDF
     */
    async downloadPDF() {
        const previewContainer = document.getElementById('resumePreview');
        const downloadModal = document.getElementById('downloadModal');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (!previewContainer) {
            this.showError('No resume content to download');
            return;
        }

        try {
            // Show progress modal
            if (downloadModal) {
                this.showModal(downloadModal);
            }

            const progressCallback = (progress, text) => {
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }
                if (progressText) {
                    progressText.textContent = text;
                }
            };

            const html = previewContainer.innerHTML;
            const personal = this.resume.getData().personal || {};
            const filename = personal.fullName 
                ? `${personal.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`
                : 'Resume.pdf';

            await this.pdfGenerator.downloadPDF(html, { filename }, progressCallback);
            
            // Hide progress modal
            if (downloadModal) {
                setTimeout(() => {
                    this.hideModal(downloadModal);
                }, 1000);
            }
        } catch (error) {
            console.error('PDF download failed:', error);
            this.showError('Failed to generate PDF. Please try again.');
            
            if (downloadModal) {
                this.hideModal(downloadModal);
            }
        }
    }

    /**
     * Update zoom level
     */
    updateZoom(level, zoomLevelElement) {
        const previewContent = document.getElementById('resumePreview');
        if (previewContent) {
            previewContent.style.transform = `scale(${level / 100})`;
        }
        
        if (zoomLevelElement) {
            zoomLevelElement.textContent = `${level}%`;
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        const settings = this.storage.getSettings();
        if (settings.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                this.saveCurrentState();
            }, settings.autoSaveInterval);
        }
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveCurrentState();
        }, 5000); // Save after 5 seconds of inactivity
    }

    /**
     * Save current state
     */
    saveCurrentState() {
        if (this.formBuilder && this.resume) {
            const resumeData = this.resume.export();
            this.storage.saveCurrentResume(resumeData);
        }
    }

    /**
     * Load saved state
     */
    loadSavedState() {
        const currentData = this.storage.loadCurrentResume();
        if (currentData && currentData.data) {
            this.resume.import(currentData);
            
            if (this.formBuilder) {
                this.formBuilder.setData(currentData.data);
            }
            
            // Set template if available
            if (currentData.template) {
                const templateSelect = document.getElementById('templateSelect');
                if (templateSelect) {
                    templateSelect.value = currentData.template.id;
                    this.selectTemplateForBuilder(currentData.template.id);
                }
            }
            
            this.updatePreview();
        }
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // Simple check - could be enhanced
        return this.formBuilder && this.resume.hasContent();
    }

    /**
     * Check for saved resumes on index page
     */
    checkForSavedResumes() {
        const loadResumeBtn = document.getElementById('loadResumeBtn');
        if (loadResumeBtn) {
            const resumes = this.storage.getResumeList();
            if (resumes.length === 0) {
                loadResumeBtn.style.display = 'none';
            }
        }
    }

    /**
     * Show modal
     */
    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide modal
     */
    hideModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resumeBuilderApp = new ResumeBuilderApp();
    window.resumeBuilderApp.init();
});

// Export for global access
window.ResumeBuilderApp = ResumeBuilderApp;
