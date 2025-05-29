/**
 * FormBuilder - Dynamic form generation and management
 * Handles creation of form sections, fields, and validation
 */
export class FormBuilder {
    constructor(container) {
        this.container = container;
        this.sections = new Map();
        this.data = {};
        this.callbacks = {
            onChange: null,
            onSectionToggle: null
        };
    }

    /**
     * Initialize form with template configuration
     * @param {Object} template - Template configuration
     */
    init(template) {
        this.template = template;
        this.container.innerHTML = '';
        this.sections.clear();
        this.data = {};
        
        if (template && template.sections) {
            template.sections.forEach(section => {
                this.createSection(section);
            });
        }
    }

    /**
     * Create a form section
     * @param {Object} sectionConfig - Section configuration
     */
    createSection(sectionConfig) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'form-section';
        sectionElement.dataset.sectionId = sectionConfig.id;

        const header = this.createSectionHeader(sectionConfig);
        const content = this.createSectionContent(sectionConfig);
        
        sectionElement.appendChild(header);
        sectionElement.appendChild(content);
        
        this.container.appendChild(sectionElement);
        this.sections.set(sectionConfig.id, {
            config: sectionConfig,
            element: sectionElement,
            content: content,
            items: sectionConfig.repeatable ? [] : null
        });

        // Initialize with one item if repeatable
        if (sectionConfig.repeatable) {
            this.addRepeatableItem(sectionConfig.id);
        }
    }

    /**
     * Create section header with toggle functionality
     * @param {Object} sectionConfig - Section configuration
     * @returns {HTMLElement} Header element
     */
    createSectionHeader(sectionConfig) {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <h4 class="section-title">${sectionConfig.name}</h4>
            <span class="section-toggle">▼</span>
        `;

        header.addEventListener('click', () => {
            this.toggleSection(sectionConfig.id);
        });

        return header;
    }

    /**
     * Create section content container
     * @param {Object} sectionConfig - Section configuration
     * @returns {HTMLElement} Content element
     */
    createSectionContent(sectionConfig) {
        const content = document.createElement('div');
        content.className = 'section-content expanded';
        
        if (!sectionConfig.repeatable) {
            const fieldsContainer = this.createFieldsContainer(sectionConfig.fields, sectionConfig.id);
            content.appendChild(fieldsContainer);
        }

        return content;
    }

    /**
     * Create fields container
     * @param {Array} fields - Field configurations
     * @param {string} sectionId - Section ID
     * @param {number} itemIndex - Item index for repeatable sections
     * @returns {HTMLElement} Fields container
     */
    createFieldsContainer(fields, sectionId, itemIndex = null) {
        const container = document.createElement('div');
        container.className = 'fields-container';

        fields.forEach(field => {
            const fieldElement = this.createField(field, sectionId, itemIndex);
            container.appendChild(fieldElement);
        });

        return container;
    }

    /**
     * Create a form field
     * @param {Object} fieldConfig - Field configuration
     * @param {string} sectionId - Section ID
     * @param {number} itemIndex - Item index for repeatable sections
     * @returns {HTMLElement} Field element
     */
    createField(fieldConfig, sectionId, itemIndex = null) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = fieldConfig.label;
        if (fieldConfig.required) {
            label.innerHTML += ' <span style="color: red;">*</span>';
        }

        const fieldId = this.getFieldId(sectionId, fieldConfig.name, itemIndex);
        label.setAttribute('for', fieldId);

        let input;
        switch (fieldConfig.type) {
            case 'textarea':
                input = document.createElement('textarea');
                input.className = 'form-textarea';
                input.rows = 4;
                break;
            case 'select':
                input = document.createElement('select');
                input.className = 'form-select';
                if (fieldConfig.options) {
                    fieldConfig.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        input.appendChild(optionElement);
                    });
                }
                break;
            case 'checkbox':
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'form-checkbox';
                
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = fieldId;
                
                const checkboxLabel = document.createElement('label');
                checkboxLabel.setAttribute('for', fieldId);
                checkboxLabel.textContent = fieldConfig.label;
                
                checkboxContainer.appendChild(input);
                checkboxContainer.appendChild(checkboxLabel);
                
                group.appendChild(checkboxContainer);
                
                input.addEventListener('change', () => {
                    this.updateData(sectionId, fieldConfig.name, input.checked, itemIndex);
                    this.triggerChange();
                });
                
                return group;
            default:
                input = document.createElement('input');
                input.type = fieldConfig.type || 'text';
                input.className = 'form-input';
        }

        input.id = fieldId;
        input.name = fieldId;
        
        if (fieldConfig.placeholder) {
            input.placeholder = fieldConfig.placeholder;
        }
        
        if (fieldConfig.required) {
            input.required = true;
        }

        // Add event listeners
        const eventType = fieldConfig.type === 'checkbox' ? 'change' : 'input';
        input.addEventListener(eventType, () => {
            const value = fieldConfig.type === 'checkbox' ? input.checked : input.value;
            this.updateData(sectionId, fieldConfig.name, value, itemIndex);
            this.triggerChange();
        });

        group.appendChild(label);
        group.appendChild(input);

        return group;
    }

    /**
     * Generate unique field ID
     * @param {string} sectionId - Section ID
     * @param {string} fieldName - Field name
     * @param {number} itemIndex - Item index
     * @returns {string} Field ID
     */
    getFieldId(sectionId, fieldName, itemIndex = null) {
        return itemIndex !== null 
            ? `${sectionId}_${itemIndex}_${fieldName}`
            : `${sectionId}_${fieldName}`;
    }

    /**
     * Add repeatable item to section
     * @param {string} sectionId - Section ID
     */
    addRepeatableItem(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section || !section.config.repeatable) return;

        const itemIndex = section.items.length;
        const item = {
            index: itemIndex,
            data: {}
        };

        const itemElement = document.createElement('div');
        itemElement.className = 'repeatable-item';
        itemElement.dataset.itemIndex = itemIndex;

        const itemHeader = document.createElement('div');
        itemHeader.className = 'item-header';
        itemHeader.innerHTML = `
            <h5 class="item-title">${section.config.name} ${itemIndex + 1}</h5>
        `;

        // Add remove button if not the first item
        if (itemIndex > 0) {
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-item';
            removeButton.type = 'button';
            removeButton.innerHTML = '×';
            removeButton.title = 'Remove this item';
            removeButton.addEventListener('click', () => {
                this.removeRepeatableItem(sectionId, itemIndex);
            });
            itemHeader.appendChild(removeButton);
        }

        const fieldsContainer = this.createFieldsContainer(section.config.fields, sectionId, itemIndex);
        
        itemElement.appendChild(itemHeader);
        itemElement.appendChild(fieldsContainer);

        section.content.appendChild(itemElement);
        section.items.push(item);

        // Add "Add Item" button if it doesn't exist
        this.ensureAddButton(sectionId);
        
        // Initialize data structure
        this.initializeItemData(sectionId, itemIndex);
    }

    /**
     * Remove repeatable item from section
     * @param {string} sectionId - Section ID
     * @param {number} itemIndex - Item index to remove
     */
    removeRepeatableItem(sectionId, itemIndex) {
        const section = this.sections.get(sectionId);
        if (!section || !section.config.repeatable) return;

        const itemElement = section.content.querySelector(`[data-item-index="${itemIndex}"]`);
        if (itemElement) {
            itemElement.remove();
        }

        // Remove from data
        if (this.data[sectionId] && this.data[sectionId][itemIndex]) {
            delete this.data[sectionId][itemIndex];
        }

        // Update remaining items indices
        this.reindexRepeatableItems(sectionId);
        this.triggerChange();
    }

    /**
     * Reindex repeatable items after removal
     * @param {string} sectionId - Section ID
     */
    reindexRepeatableItems(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section) return;

        const items = section.content.querySelectorAll('.repeatable-item');
        const newData = {};
        
        items.forEach((item, newIndex) => {
            const oldIndex = parseInt(item.dataset.itemIndex);
            item.dataset.itemIndex = newIndex;
            
            // Update item title
            const title = item.querySelector('.item-title');
            if (title) {
                title.textContent = `${section.config.name} ${newIndex + 1}`;
            }
            
            // Update field IDs and names
            const fields = item.querySelectorAll('input, textarea, select');
            fields.forEach(field => {
                const oldId = field.id;
                const oldName = field.name;
                const fieldName = oldId.split('_').pop();
                
                const newId = this.getFieldId(sectionId, fieldName, newIndex);
                field.id = newId;
                field.name = newId;
                
                const label = item.querySelector(`label[for="${oldId}"]`);
                if (label) {
                    label.setAttribute('for', newId);
                }
            });
            
            // Preserve data
            if (this.data[sectionId] && this.data[sectionId][oldIndex]) {
                newData[newIndex] = this.data[sectionId][oldIndex];
            }
        });
        
        // Update data structure
        if (this.data[sectionId]) {
            this.data[sectionId] = newData;
        }
        
        // Update section items array
        section.items = section.items.filter((_, index) => index < items.length);
    }

    /**
     * Ensure add button exists for repeatable section
     * @param {string} sectionId - Section ID
     */
    ensureAddButton(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section || !section.config.repeatable) return;

        let addButton = section.content.querySelector('.add-item');
        if (!addButton) {
            addButton = document.createElement('button');
            addButton.className = 'add-item';
            addButton.type = 'button';
            addButton.innerHTML = `+ Add ${section.config.name}`;
            
            addButton.addEventListener('click', () => {
                this.addRepeatableItem(sectionId);
            });
            
            section.content.appendChild(addButton);
        }
    }

    /**
     * Toggle section visibility
     * @param {string} sectionId - Section ID
     */
    toggleSection(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section) return;

        const header = section.element.querySelector('.section-header');
        const content = section.element.querySelector('.section-content');
        const toggle = header.querySelector('.section-toggle');

        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            header.classList.add('collapsed');
            toggle.textContent = '▶';
        } else {
            content.classList.add('expanded');
            header.classList.remove('collapsed');
            toggle.textContent = '▼';
        }

        if (this.callbacks.onSectionToggle) {
            this.callbacks.onSectionToggle(sectionId, content.classList.contains('expanded'));
        }
    }

    /**
     * Update form data
     * @param {string} sectionId - Section ID
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @param {number} itemIndex - Item index for repeatable sections
     */
    updateData(sectionId, fieldName, value, itemIndex = null) {
        if (!this.data[sectionId]) {
            this.data[sectionId] = {};
        }

        if (itemIndex !== null) {
            if (!this.data[sectionId][itemIndex]) {
                this.data[sectionId][itemIndex] = {};
            }
            this.data[sectionId][itemIndex][fieldName] = value;
        } else {
            this.data[sectionId][fieldName] = value;
        }
    }

    /**
     * Initialize item data structure
     * @param {string} sectionId - Section ID
     * @param {number} itemIndex - Item index
     */
    initializeItemData(sectionId, itemIndex) {
        if (!this.data[sectionId]) {
            this.data[sectionId] = {};
        }
        if (!this.data[sectionId][itemIndex]) {
            this.data[sectionId][itemIndex] = {};
        }
    }

    /**
     * Set form data from external source
     * @param {Object} data - Form data
     */
    setData(data) {
        this.data = { ...data };
        this.populateForm();
    }

    /**
     * Populate form fields with current data
     */
    populateForm() {
        Object.keys(this.data).forEach(sectionId => {
            const section = this.sections.get(sectionId);
            if (!section) return;

            const sectionData = this.data[sectionId];
            
            if (section.config.repeatable) {
                // Clear existing items
                this.clearRepeatableItems(sectionId);
                
                // Add items based on data
                Object.keys(sectionData).forEach(itemIndex => {
                    const index = parseInt(itemIndex);
                    this.addRepeatableItem(sectionId);
                    
                    const itemData = sectionData[index];
                    Object.keys(itemData).forEach(fieldName => {
                        this.setFieldValue(sectionId, fieldName, itemData[fieldName], index);
                    });
                });
            } else {
                // Regular section
                Object.keys(sectionData).forEach(fieldName => {
                    this.setFieldValue(sectionId, fieldName, sectionData[fieldName]);
                });
            }
        });
    }

    /**
     * Clear all repeatable items from section
     * @param {string} sectionId - Section ID
     */
    clearRepeatableItems(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section || !section.config.repeatable) return;

        const items = section.content.querySelectorAll('.repeatable-item');
        items.forEach(item => item.remove());
        
        const addButton = section.content.querySelector('.add-item');
        if (addButton) {
            addButton.remove();
        }
        
        section.items = [];
    }

    /**
     * Set field value
     * @param {string} sectionId - Section ID
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @param {number} itemIndex - Item index for repeatable sections
     */
    setFieldValue(sectionId, fieldName, value, itemIndex = null) {
        const fieldId = this.getFieldId(sectionId, fieldName, itemIndex);
        const field = document.getElementById(fieldId);
        
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = Boolean(value);
            } else {
                field.value = value || '';
            }
        }
    }

    /**
     * Get current form data
     * @returns {Object} Current form data
     */
    getData() {
        return { ...this.data };
    }

    /**
     * Validate form data
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];
        const warnings = [];

        this.sections.forEach((section, sectionId) => {
            if (section.config.required && (!this.data[sectionId] || Object.keys(this.data[sectionId]).length === 0)) {
                errors.push(`${section.config.name} is required`);
                return;
            }

            if (section.config.repeatable && this.data[sectionId]) {
                Object.keys(this.data[sectionId]).forEach(itemIndex => {
                    const itemData = this.data[sectionId][itemIndex];
                    section.config.fields.forEach(field => {
                        if (field.required && (!itemData[field.name] || itemData[field.name].toString().trim() === '')) {
                            errors.push(`${field.label} is required in ${section.config.name} ${parseInt(itemIndex) + 1}`);
                        }
                    });
                });
            } else if (this.data[sectionId]) {
                section.config.fields.forEach(field => {
                    if (field.required && (!this.data[sectionId][field.name] || this.data[sectionId][field.name].toString().trim() === '')) {
                        errors.push(`${field.label} is required in ${section.config.name}`);
                    }
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Set change callback
     * @param {Function} callback - Change callback function
     */
    onChange(callback) {
        this.callbacks.onChange = callback;
    }

    /**
     * Set section toggle callback
     * @param {Function} callback - Section toggle callback function
     */
    onSectionToggle(callback) {
        this.callbacks.onSectionToggle = callback;
    }

    /**
     * Trigger change event
     */
    triggerChange() {
        if (this.callbacks.onChange) {
            this.callbacks.onChange(this.getData());
        }
    }

    /**
     * Reset form to initial state
     */
    reset() {
        this.data = {};
        if (this.template) {
            this.init(this.template);
        }
    }

    /**
     * Get section by ID
     * @param {string} sectionId - Section ID
     * @returns {Object} Section object
     */
    getSection(sectionId) {
        return this.sections.get(sectionId);
    }

    /**
     * Check if section is expanded
     * @param {string} sectionId - Section ID
     * @returns {boolean} Whether section is expanded
     */
    isSectionExpanded(sectionId) {
        const section = this.sections.get(sectionId);
        if (!section) return false;
        
        const content = section.element.querySelector('.section-content');
        return content && content.classList.contains('expanded');
    }
}
