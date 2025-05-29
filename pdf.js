/**
 * PDF - PDF generation utilities using jsPDF
 * Handles PDF creation, formatting, and download
 */
export class PDFGenerator {
    constructor() {
        this.jsPDF = null;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Ensure jsPDF is loaded
     * @returns {Promise} Promise that resolves when jsPDF is ready
     */
    async ensureLoaded() {
        if (this.isLoaded) {
            return Promise.resolve();
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {
            if (window.jsPDF) {
                this.jsPDF = window.jsPDF;
                this.isLoaded = true;
                resolve();
                return;
            }

            // Check if script is already loading
            const existingScript = document.querySelector('script[src*="jspdf"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    this.jsPDF = window.jsPDF;
                    this.isLoaded = true;
                    resolve();
                });
                existingScript.addEventListener('error', reject);
                return;
            }

            // Load jsPDF script
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                this.jsPDF = window.jsPDF;
                this.isLoaded = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load jsPDF library'));
            };
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    /**
     * Generate PDF from resume HTML
     * @param {string} html - Resume HTML content
     * @param {Object} options - PDF generation options
     * @returns {Promise<Blob>} PDF blob
     */
    async generatePDF(html, options = {}) {
        await this.ensureLoaded();

        const defaultOptions = {
            filename: 'resume.pdf',
            format: 'a4',
            unit: 'mm',
            orientation: 'portrait',
            margin: 10,
            quality: 2,
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                allowTaint: false
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            // Create temporary container for rendering
            const container = this.createRenderContainer(html);
            document.body.appendChild(container);

            // Wait for fonts and images to load
            await this.waitForAssets(container);

            // Generate PDF using html2canvas
            const canvas = await this.htmlToCanvas(container, config.html2canvas);
            const pdf = this.canvasToPDF(canvas, config);

            // Cleanup
            document.body.removeChild(container);

            return pdf;
        } catch (error) {
            console.error('PDF generation failed:', error);
            throw new Error('Failed to generate PDF: ' + error.message);
        }
    }

    /**
     * Generate and download PDF
     * @param {string} html - Resume HTML content
     * @param {Object} options - PDF generation options
     * @param {Function} progressCallback - Progress callback function
     */
    async downloadPDF(html, options = {}, progressCallback = null) {
        try {
            if (progressCallback) progressCallback(10, 'Preparing document...');

            const pdf = await this.generatePDF(html, options);
            
            if (progressCallback) progressCallback(90, 'Finalizing PDF...');

            // Create download link
            const blob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = options.filename || 'resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            if (progressCallback) progressCallback(100, 'Download complete!');
        } catch (error) {
            console.error('PDF download failed:', error);
            throw error;
        }
    }

    /**
     * Create render container for PDF generation
     * @param {string} html - HTML content
     * @returns {HTMLElement} Container element
     */
    createRenderContainer(html) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: 210mm;
            min-height: 297mm;
            background: white;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #000;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
        `;
        
        container.innerHTML = html;
        
        // Apply print-specific styles
        this.applyPrintStyles(container);
        
        return container;
    }

    /**
     * Apply print-specific styles
     * @param {HTMLElement} container - Container element
     */
    applyPrintStyles(container) {
        // Override colors for print
        const elementsWithColor = container.querySelectorAll('*');
        elementsWithColor.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            
            // Convert light colors to darker for better print visibility
            if (computedStyle.color && this.isLightColor(computedStyle.color)) {
                element.style.color = '#000000';
            }
            
            // Remove background colors except for dark text on light backgrounds
            if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                element.style.backgroundColor = 'transparent';
            }
        });

        // Ensure text is black and backgrounds are white
        const resumeContent = container.querySelector('.resume-content');
        if (resumeContent) {
            resumeContent.style.color = '#000000';
            resumeContent.style.backgroundColor = '#ffffff';
        }

        // Make headers darker
        const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headers.forEach(header => {
            header.style.color = '#000000';
            header.style.fontWeight = 'bold';
        });

        // Style section titles
        const sectionTitles = container.querySelectorAll('.section-title');
        sectionTitles.forEach(title => {
            title.style.color = '#000000';
            title.style.borderBottom = '1px solid #000000';
        });
    }

    /**
     * Check if color is light
     * @param {string} color - Color string
     * @returns {boolean} Whether color is light
     */
    isLightColor(color) {
        // Simple light color detection
        const rgb = color.match(/\d+/g);
        if (!rgb || rgb.length < 3) return false;
        
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        return brightness > 128;
    }

    /**
     * Wait for assets to load
     * @param {HTMLElement} container - Container element
     * @returns {Promise} Promise that resolves when assets are loaded
     */
    async waitForAssets(container) {
        const promises = [];

        // Wait for images
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            if (!img.complete) {
                promises.push(new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails
                    setTimeout(resolve, 3000); // Timeout after 3 seconds
                }));
            }
        });

        // Wait for fonts
        if (document.fonts && document.fonts.ready) {
            promises.push(document.fonts.ready);
        }

        await Promise.all(promises);
        
        // Additional delay to ensure rendering is complete
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Convert HTML to canvas using html2canvas
     * @param {HTMLElement} element - Element to convert
     * @param {Object} options - html2canvas options
     * @returns {Promise<HTMLCanvasElement>} Canvas element
     */
    async htmlToCanvas(element, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if html2canvas is available
            if (!window.html2canvas) {
                // Load html2canvas dynamically
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => {
                    window.html2canvas(element, options)
                        .then(resolve)
                        .catch(reject);
                };
                script.onerror = () => {
                    reject(new Error('Failed to load html2canvas library'));
                };
                document.head.appendChild(script);
            } else {
                window.html2canvas(element, options)
                    .then(resolve)
                    .catch(reject);
            }
        });
    }

    /**
     * Convert canvas to PDF
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} config - PDF configuration
     * @returns {Object} jsPDF instance
     */
    canvasToPDF(canvas, config) {
        const { jsPDF } = this;
        const pdf = new jsPDF({
            orientation: config.orientation,
            unit: config.unit,
            format: config.format
        });

        // Calculate dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = config.margin;
        
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate scale to fit page
        const scaleX = availableWidth / (canvasWidth * 0.264583); // Convert px to mm
        const scaleY = availableHeight / (canvasHeight * 0.264583);
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = (canvasWidth * 0.264583) * scale;
        const scaledHeight = (canvasHeight * 0.264583) * scale;
        
        // Center the content
        const x = margin + (availableWidth - scaledWidth) / 2;
        const y = margin;

        // Add image to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);

        return pdf;
    }

    /**
     * Get PDF dimensions for a format
     * @param {string} format - Paper format (a4, letter, etc.)
     * @returns {Object} Dimensions in mm
     */
    getPDFDimensions(format = 'a4') {
        const dimensions = {
            a4: { width: 210, height: 297 },
            letter: { width: 216, height: 279 },
            legal: { width: 216, height: 356 },
            a3: { width: 297, height: 420 },
            a5: { width: 148, height: 210 }
        };

        return dimensions[format.toLowerCase()] || dimensions.a4;
    }

    /**
     * Validate PDF generation requirements
     * @returns {Object} Validation result
     */
    validateRequirements() {
        const issues = [];
        const warnings = [];

        // Check for jsPDF
        if (!window.jsPDF && !this.isLoaded) {
            issues.push('jsPDF library is not loaded');
        }

        // Check for html2canvas
        if (!window.html2canvas) {
            warnings.push('html2canvas library will be loaded dynamically');
        }

        // Check browser compatibility
        if (!window.Blob) {
            issues.push('Browser does not support Blob API');
        }

        if (!document.createElement('canvas').getContext) {
            issues.push('Browser does not support Canvas API');
        }

        return {
            isValid: issues.length === 0,
            issues,
            warnings
        };
    }

    /**
     * Get supported formats
     * @returns {Array} Supported format list
     */
    getSupportedFormats() {
        return [
            { id: 'a4', name: 'A4 (210 × 297 mm)', width: 210, height: 297 },
            { id: 'letter', name: 'Letter (8.5 × 11 in)', width: 216, height: 279 },
            { id: 'legal', name: 'Legal (8.5 × 14 in)', width: 216, height: 356 }
        ];
    }

    /**
     * Estimate PDF file size
     * @param {string} html - HTML content
     * @returns {number} Estimated size in bytes
     */
    estimateFileSize(html) {
        // Rough estimation based on content length and complexity
        const baseSize = 50000; // Base PDF overhead
        const contentSize = html.length * 0.5; // Estimated compression
        const imageEstimate = (html.match(/<img/g) || []).length * 20000; // 20KB per image
        
        return Math.round(baseSize + contentSize + imageEstimate);
    }
}
