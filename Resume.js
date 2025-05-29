/**
 * Resume - Data model and rendering engine for resume content
 * Handles resume data structure and HTML generation for different themes
 */
export class Resume {
    constructor(template = null) {
        this.template = template;
        this.data = {};
        this.theme = 'modern';
    }

    /**
     * Set resume template
     * @param {Object} template - Template configuration
     */
    setTemplate(template) {
        this.template = template;
    }

    /**
     * Set resume data
     * @param {Object} data - Resume form data
     */
    setData(data) {
        this.data = { ...data };
    }

    /**
     * Set resume theme
     * @param {string} theme - Theme name (modern, classic, creative)
     */
    setTheme(theme) {
        this.theme = theme;
    }

    /**
     * Get current resume data
     * @returns {Object} Resume data
     */
    getData() {
        return { ...this.data };
    }

    /**
     * Get current theme
     * @returns {string} Current theme
     */
    getTheme() {
        return this.theme;
    }

    /**
     * Generate HTML for resume preview
     * @returns {string} HTML content
     */
    generateHTML() {
        if (!this.template || !this.data || Object.keys(this.data).length === 0) {
            return this.generateEmptyState();
        }

        const html = `
            <div class="resume-content theme-${this.theme}">
                ${this.generateHeader()}
                ${this.generateSections()}
            </div>
        `;

        return html;
    }

    /**
     * Generate empty state HTML
     * @returns {string} Empty state HTML
     */
    generateEmptyState() {
        return `
            <div class="empty-preview">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                <p>Fill out the form to see your resume preview</p>
            </div>
        `;
    }

    /**
     * Generate resume header section
     * @returns {string} Header HTML
     */
    generateHeader() {
        const personal = this.data.personal || {};
        
        if (!personal || Object.keys(personal).length === 0) {
            return '';
        }

        const name = personal.fullName || '';
        const title = personal.title || personal.jobTitle || '';
        const contact = this.generateContactInfo(personal);

        return `
            <div class="resume-header">
                ${name ? `<h1 class="resume-name">${this.escapeHtml(name)}</h1>` : ''}
                ${title ? `<div class="resume-title">${this.escapeHtml(title)}</div>` : ''}
                ${contact ? `<div class="resume-contact">${contact}</div>` : ''}
            </div>
        `;
    }

    /**
     * Generate contact information
     * @param {Object} personal - Personal data
     * @returns {string} Contact HTML
     */
    generateContactInfo(personal) {
        const contactItems = [];

        if (personal.email) {
            contactItems.push(`
                <div class="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>${this.escapeHtml(personal.email)}</span>
                </div>
            `);
        }

        if (personal.phone) {
            contactItems.push(`
                <div class="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>${this.escapeHtml(personal.phone)}</span>
                </div>
            `);
        }

        if (personal.location) {
            contactItems.push(`
                <div class="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>${this.escapeHtml(personal.location)}</span>
                </div>
            `);
        }

        if (personal.website || personal.portfolio) {
            const url = personal.website || personal.portfolio;
            contactItems.push(`
                <div class="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>${this.escapeHtml(url)}</span>
                </div>
            `);
        }

        if (personal.linkedin) {
            contactItems.push(`
                <div class="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                        <rect x="2" y="9" width="4" height="12"/>
                        <circle cx="4" cy="4" r="2"/>
                    </svg>
                    <span>LinkedIn</span>
                </div>
            `);
        }

        return contactItems.join('');
    }

    /**
     * Generate all resume sections
     * @returns {string} Sections HTML
     */
    generateSections() {
        if (!this.template || !this.template.sections) return '';

        const sectionsHTML = [];

        this.template.sections.forEach(sectionConfig => {
            if (sectionConfig.id === 'personal') return; // Skip personal, handled in header

            const sectionData = this.data[sectionConfig.id];
            if (!sectionData || Object.keys(sectionData).length === 0) return;

            const sectionHTML = this.generateSection(sectionConfig, sectionData);
            if (sectionHTML) {
                sectionsHTML.push(sectionHTML);
            }
        });

        return sectionsHTML.join('');
    }

    /**
     * Generate individual section
     * @param {Object} sectionConfig - Section configuration
     * @param {Object} sectionData - Section data
     * @returns {string} Section HTML
     */
    generateSection(sectionConfig, sectionData) {
        const sectionName = this.getSectionDisplayName(sectionConfig);
        let content = '';

        if (sectionConfig.repeatable) {
            content = this.generateRepeatableSection(sectionConfig, sectionData);
        } else {
            content = this.generateSingleSection(sectionConfig, sectionData);
        }

        if (!content) return '';

        return `
            <div class="resume-section" data-section="${sectionConfig.id}">
                <h2 class="section-title">${sectionName}</h2>
                ${content}
            </div>
        `;
    }

    /**
     * Get display name for section
     * @param {Object} sectionConfig - Section configuration
     * @returns {string} Display name
     */
    getSectionDisplayName(sectionConfig) {
        const nameMap = {
            summary: 'Professional Summary',
            objective: 'Objective',
            about: 'About Me',
            experience: 'Experience',
            education: 'Education',
            skills: 'Skills',
            projects: 'Projects',
            portfolio: 'Portfolio',
            certifications: 'Certifications'
        };

        return nameMap[sectionConfig.id] || sectionConfig.name;
    }

    /**
     * Generate repeatable section content
     * @param {Object} sectionConfig - Section configuration
     * @param {Object} sectionData - Section data
     * @returns {string} Section HTML
     */
    generateRepeatableSection(sectionConfig, sectionData) {
        const items = [];

        Object.keys(sectionData).forEach(itemIndex => {
            const itemData = sectionData[itemIndex];
            if (!itemData || Object.keys(itemData).length === 0) return;

            const itemHTML = this.generateRepeatableItem(sectionConfig, itemData);
            if (itemHTML) {
                items.push(itemHTML);
            }
        });

        return items.join('');
    }

    /**
     * Generate repeatable item
     * @param {Object} sectionConfig - Section configuration
     * @param {Object} itemData - Item data
     * @returns {string} Item HTML
     */
    generateRepeatableItem(sectionConfig, itemData) {
        const sectionId = sectionConfig.id;
        const itemClass = `${sectionId}-item`;

        switch (sectionId) {
            case 'experience':
                return this.generateExperienceItem(itemData, itemClass);
            case 'education':
                return this.generateEducationItem(itemData, itemClass);
            case 'projects':
            case 'portfolio':
                return this.generateProjectItem(itemData, itemClass);
            case 'certifications':
                return this.generateCertificationItem(itemData, itemClass);
            default:
                return this.generateGenericItem(itemData, itemClass);
        }
    }

    /**
     * Generate experience item
     * @param {Object} data - Experience data
     * @param {string} itemClass - CSS class
     * @returns {string} Experience HTML
     */
    generateExperienceItem(data, itemClass) {
        const title = data.jobTitle || '';
        const company = data.company || '';
        const location = data.location || '';
        const dateRange = this.formatDateRange(data.startDate, data.endDate, data.current);
        const description = data.description || '';

        return `
            <div class="${itemClass}">
                <div class="item-header">
                    <div>
                        ${title ? `<h3 class="item-title">${this.escapeHtml(title)}</h3>` : ''}
                        ${company ? `<div class="item-subtitle">${this.escapeHtml(company)}${location ? `, ${this.escapeHtml(location)}` : ''}</div>` : ''}
                    </div>
                    ${dateRange ? `<div class="item-date">${dateRange}</div>` : ''}
                </div>
                ${description ? `<div class="item-description">${this.formatDescription(description)}</div>` : ''}
            </div>
        `;
    }

    /**
     * Generate education item
     * @param {Object} data - Education data
     * @param {string} itemClass - CSS class
     * @returns {string} Education HTML
     */
    generateEducationItem(data, itemClass) {
        const degree = data.degree || '';
        const school = data.school || '';
        const location = data.location || '';
        const graduationDate = this.formatDate(data.graduationDate);
        const gpa = data.gpa || '';
        const honors = data.honors || '';

        return `
            <div class="${itemClass}">
                <div class="item-header">
                    <div>
                        ${degree ? `<h3 class="item-title">${this.escapeHtml(degree)}</h3>` : ''}
                        ${school ? `<div class="item-subtitle">${this.escapeHtml(school)}${location ? `, ${this.escapeHtml(location)}` : ''}</div>` : ''}
                    </div>
                    ${graduationDate ? `<div class="item-date">${graduationDate}</div>` : ''}
                </div>
                ${(gpa || honors) ? `
                    <div class="item-description">
                        ${gpa ? `<p><strong>GPA:</strong> ${this.escapeHtml(gpa)}</p>` : ''}
                        ${honors ? `<p><strong>Honors:</strong> ${this.escapeHtml(honors)}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Generate project item
     * @param {Object} data - Project data
     * @param {string} itemClass - CSS class
     * @returns {string} Project HTML
     */
    generateProjectItem(data, itemClass) {
        const name = data.name || '';
        const role = data.role || '';
        const description = data.description || '';
        const technologies = data.technologies || '';
        const url = data.url || '';

        return `
            <div class="${itemClass}">
                <div class="item-header">
                    <div>
                        ${name ? `<h3 class="item-title">${this.escapeHtml(name)}</h3>` : ''}
                        ${role ? `<div class="item-subtitle">${this.escapeHtml(role)}</div>` : ''}
                    </div>
                    ${url ? `<div class="item-date"><a href="${this.escapeHtml(url)}" target="_blank">View Project</a></div>` : ''}
                </div>
                ${description ? `<div class="item-description">${this.formatDescription(description)}</div>` : ''}
                ${technologies ? `<div class="item-description"><strong>Technologies:</strong> ${this.escapeHtml(technologies)}</div>` : ''}
            </div>
        `;
    }

    /**
     * Generate certification item
     * @param {Object} data - Certification data
     * @param {string} itemClass - CSS class
     * @returns {string} Certification HTML
     */
    generateCertificationItem(data, itemClass) {
        const name = data.name || '';
        const issuer = data.issuer || '';
        const date = this.formatDate(data.date);

        return `
            <div class="${itemClass}">
                <div class="item-header">
                    <div>
                        ${name ? `<h3 class="item-title">${this.escapeHtml(name)}</h3>` : ''}
                        ${issuer ? `<div class="item-subtitle">${this.escapeHtml(issuer)}</div>` : ''}
                    </div>
                    ${date ? `<div class="item-date">${date}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Generate generic repeatable item
     * @param {Object} data - Item data
     * @param {string} itemClass - CSS class
     * @returns {string} Generic HTML
     */
    generateGenericItem(data, itemClass) {
        const title = data.title || data.name || Object.values(data)[0] || '';
        const subtitle = data.subtitle || data.company || data.organization || '';
        const description = data.description || '';

        return `
            <div class="${itemClass}">
                ${title ? `<h3 class="item-title">${this.escapeHtml(title)}</h3>` : ''}
                ${subtitle ? `<div class="item-subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
                ${description ? `<div class="item-description">${this.formatDescription(description)}</div>` : ''}
            </div>
        `;
    }

    /**
     * Generate single (non-repeatable) section
     * @param {Object} sectionConfig - Section configuration
     * @param {Object} sectionData - Section data
     * @returns {string} Section HTML
     */
    generateSingleSection(sectionConfig, sectionData) {
        const sectionId = sectionConfig.id;

        switch (sectionId) {
            case 'summary':
            case 'objective':
            case 'about':
                return this.generateTextSection(sectionData);
            case 'skills':
                return this.generateSkillsSection(sectionData);
            default:
                return this.generateGenericSection(sectionData);
        }
    }

    /**
     * Generate text section (summary, objective, about)
     * @param {Object} sectionData - Section data
     * @returns {string} Text section HTML
     */
    generateTextSection(sectionData) {
        const content = sectionData.summary || sectionData.objective || sectionData.about || '';
        
        if (!content) return '';

        return `<div class="section-content">${this.formatDescription(content)}</div>`;
    }

    /**
     * Generate skills section
     * @param {Object} sectionData - Skills data
     * @returns {string} Skills HTML
     */
    generateSkillsSection(sectionData) {
        if (this.theme === 'modern') {
            return this.generateModernSkills(sectionData);
        } else if (this.theme === 'creative') {
            return this.generateCreativeSkills(sectionData);
        } else {
            return this.generateClassicSkills(sectionData);
        }
    }

    /**
     * Generate modern theme skills
     * @param {Object} sectionData - Skills data
     * @returns {string} Skills HTML
     */
    generateModernSkills(sectionData) {
        const categories = [];

        if (sectionData.technical) {
            categories.push(`
                <div class="skills-category">
                    <h4 class="skills-title">Technical Skills</h4>
                    <div class="skills-content">${this.escapeHtml(sectionData.technical)}</div>
                </div>
            `);
        }

        if (sectionData.soft) {
            categories.push(`
                <div class="skills-category">
                    <h4 class="skills-title">Soft Skills</h4>
                    <div class="skills-content">${this.escapeHtml(sectionData.soft)}</div>
                </div>
            `);
        }

        if (sectionData.design) {
            categories.push(`
                <div class="skills-category">
                    <h4 class="skills-title">Design Skills</h4>
                    <div class="skills-content">${this.escapeHtml(sectionData.design)}</div>
                </div>
            `);
        }

        if (sectionData.tools) {
            categories.push(`
                <div class="skills-category">
                    <h4 class="skills-title">Tools & Software</h4>
                    <div class="skills-content">${this.escapeHtml(sectionData.tools)}</div>
                </div>
            `);
        }

        if (sectionData.skills) {
            categories.push(`
                <div class="skills-category">
                    <h4 class="skills-title">Skills</h4>
                    <div class="skills-content">${this.escapeHtml(sectionData.skills)}</div>
                </div>
            `);
        }

        return `<div class="skills-grid">${categories.join('')}</div>`;
    }

    /**
     * Generate creative theme skills
     * @param {Object} sectionData - Skills data
     * @returns {string} Skills HTML
     */
    generateCreativeSkills(sectionData) {
        const allSkills = [];

        Object.values(sectionData).forEach(skillText => {
            if (skillText && typeof skillText === 'string') {
                const skills = skillText.split(',').map(skill => skill.trim()).filter(skill => skill);
                allSkills.push(...skills);
            }
        });

        if (allSkills.length === 0) return '';

        const skillTags = allSkills.map(skill => 
            `<span class="skill-tag">${this.escapeHtml(skill)}</span>`
        ).join('');

        return `<div class="skills-grid">${skillTags}</div>`;
    }

    /**
     * Generate classic theme skills
     * @param {Object} sectionData - Skills data
     * @returns {string} Skills HTML
     */
    generateClassicSkills(sectionData) {
        const allSkills = [];

        Object.values(sectionData).forEach(skillText => {
            if (skillText && typeof skillText === 'string') {
                const skills = skillText.split(',').map(skill => skill.trim()).filter(skill => skill);
                allSkills.push(...skills);
            }
        });

        if (allSkills.length === 0) return '';

        const skillItems = allSkills.map(skill => 
            `<div class="skill-item">• ${this.escapeHtml(skill)}</div>`
        ).join('');

        return `<div class="skills-list">${skillItems}</div>`;
    }

    /**
     * Generate generic section
     * @param {Object} sectionData - Section data
     * @returns {string} Generic section HTML
     */
    generateGenericSection(sectionData) {
        const content = Object.values(sectionData).filter(value => value && typeof value === 'string').join(' ');
        
        if (!content) return '';

        return `<div class="section-content">${this.formatDescription(content)}</div>`;
    }

    /**
     * Format date range for experience/education
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @param {boolean} current - Is current position
     * @returns {string} Formatted date range
     */
    formatDateRange(startDate, endDate, current = false) {
        const start = this.formatDate(startDate);
        const end = current ? 'Present' : this.formatDate(endDate);

        if (!start && !end) return '';
        if (!start) return end;
        if (!end) return start;

        return `${start} - ${end}`;
    }

    /**
     * Format individual date
     * @param {string} dateString - Date string (YYYY-MM format)
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '';

        try {
            const [year, month] = dateString.split('-');
            if (!year) return '';

            if (!month) return year;

            const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];

            const monthIndex = parseInt(month) - 1;
            const monthName = monthNames[monthIndex] || month;

            return `${monthName} ${year}`;
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Format description text with proper line breaks
     * @param {string} text - Raw description text
     * @returns {string} Formatted HTML
     */
    formatDescription(text) {
        if (!text) return '';

        // Convert bullet points and line breaks to proper HTML
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => {
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                    return `<li>${this.escapeHtml(line.substring(1).trim())}</li>`;
                }
                return `<p>${this.escapeHtml(line)}</p>`;
            })
            .join('')
            .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
            .replace(/<\/ul><ul>/g, '');
    }

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check if resume has content
     * @returns {boolean} Whether resume has content
     */
    hasContent() {
        return this.data && Object.keys(this.data).length > 0 && Object.values(this.data).some(section => {
            if (!section) return false;
            if (typeof section === 'string') return section.trim().length > 0;
            if (typeof section === 'object') return Object.keys(section).length > 0;
            return false;
        });
    }

    /**
     * Get resume metadata
     * @returns {Object} Resume metadata
     */
    getMetadata() {
        const personal = this.data.personal || {};
        
        return {
            name: personal.fullName || 'Untitled Resume',
            email: personal.email || '',
            lastModified: new Date().toISOString(),
            template: this.template ? this.template.id : null,
            theme: this.theme,
            hasContent: this.hasContent()
        };
    }

    /**
     * Export resume data for saving
     * @returns {Object} Export data
     */
    export() {
        return {
            data: this.getData(),
            template: this.template,
            theme: this.theme,
            metadata: this.getMetadata()
        };
    }

    /**
     * Import resume data from saved state
     * @param {Object} importData - Import data
     */
    import(importData) {
        if (importData.data) {
            this.setData(importData.data);
        }
        if (importData.template) {
            this.setTemplate(importData.template);
        }
        if (importData.theme) {
            this.setTheme(importData.theme);
        }
    }
}
