/**
 * @jest-environment jsdom
 */

const BulkDinerSelector = require('../../public/js/bulk-diner-selector.js');

describe('BulkDinerSelector', () => {
    let selector;
    let familyMembers;

    beforeEach(() => {
        familyMembers = [
            { id: '1', name: 'Juan' },
            { id: '2', name: 'María' },
            { id: '3', name: 'Pedro' }
        ];
    });

    afterEach(() => {
        if (selector) {
            selector.destroy();
            selector = null;
        }
    });

    describe('Constructor', () => {
        it('should create instance with valid meal type', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            
            expect(selector.mealType).toBe('lunch');
            expect(selector.familyMembers).toEqual(familyMembers);
            expect(selector.getSelectedDiners()).toEqual([]);
        });

        it('should throw error for invalid meal type', () => {
            expect(() => {
                new BulkDinerSelector('breakfast', familyMembers, []);
            }).toThrow('mealType must be "lunch" or "dinner"');
        });

        it('should initialize with selected diners', () => {
            selector = new BulkDinerSelector('dinner', familyMembers, ['1', '3']);
            
            expect(selector.getSelectedDiners()).toEqual(expect.arrayContaining(['1', '3']));
            expect(selector.getSelectedDiners().length).toBe(2);
        });

        it('should handle empty family members array', () => {
            selector = new BulkDinerSelector('lunch', [], []);
            
            expect(selector.familyMembers).toEqual([]);
            expect(selector.getSelectedDiners()).toEqual([]);
        });
    });

    describe('render()', () => {
        it('should render with family members', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            
            expect(element).toBeTruthy();
            expect(element.className).toBe('bulk-diner-selector');
            expect(element.dataset.mealType).toBe('lunch');
            
            const checkboxes = element.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBe(3);
        });

        it('should render with correct meal type label for lunch', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            
            expect(element.innerHTML).toContain('Almuerzo');
        });

        it('should render with correct meal type label for dinner', () => {
            selector = new BulkDinerSelector('dinner', familyMembers, []);
            const element = selector.render();
            
            expect(element.innerHTML).toContain('Cena');
        });

        it('should render empty state when no family members', () => {
            selector = new BulkDinerSelector('lunch', [], []);
            const element = selector.render();
            
            expect(element.innerHTML).toContain('No hay miembros de familia disponibles');
            
            const checkboxes = element.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBe(0);
        });

        it('should render with initially selected checkboxes', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1', '2']);
            const element = selector.render();
            
            const checkboxes = element.querySelectorAll('input[type="checkbox"]');
            const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
            
            expect(checkedBoxes.length).toBe(2);
            expect(checkedBoxes[0].value).toBe('1');
            expect(checkedBoxes[1].value).toBe('2');
        });

        it('should render all family member names', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            
            expect(element.innerHTML).toContain('Juan');
            expect(element.innerHTML).toContain('María');
            expect(element.innerHTML).toContain('Pedro');
        });
    });

    describe('getSelectedDiners()', () => {
        it('should return empty array when nothing selected', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            
            expect(selector.getSelectedDiners()).toEqual([]);
        });

        it('should return selected diner IDs', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1', '3']);
            
            const selected = selector.getSelectedDiners();
            expect(selected).toEqual(expect.arrayContaining(['1', '3']));
            expect(selected.length).toBe(2);
        });

        it('should return array not set', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1']);
            
            const selected = selector.getSelectedDiners();
            expect(Array.isArray(selected)).toBe(true);
        });
    });

    describe('setSelectedDiners()', () => {
        it('should update selected diners', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            
            selector.setSelectedDiners(['1', '2']);
            
            expect(selector.getSelectedDiners()).toEqual(expect.arrayContaining(['1', '2']));
            expect(selector.getSelectedDiners().length).toBe(2);
        });

        it('should update checkboxes when rendered', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            document.body.appendChild(element);
            
            selector.setSelectedDiners(['2', '3']);
            
            const checkboxes = element.querySelectorAll('input[type="checkbox"]');
            const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
            
            expect(checkedBoxes.length).toBe(2);
            expect(checkedBoxes[0].value).toBe('2');
            expect(checkedBoxes[1].value).toBe('3');
            
            document.body.removeChild(element);
        });

        it('should clear selection when passed empty array', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1', '2']);
            
            selector.setSelectedDiners([]);
            
            expect(selector.getSelectedDiners()).toEqual([]);
        });

        it('should replace previous selection', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1']);
            
            selector.setSelectedDiners(['2', '3']);
            
            const selected = selector.getSelectedDiners();
            expect(selected).not.toContain('1');
            expect(selected).toEqual(expect.arrayContaining(['2', '3']));
        });
    });

    describe('onChange event', () => {
        it('should call onChange when checkbox is clicked', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            document.body.appendChild(element);
            
            const onChangeMock = jest.fn();
            selector.setOnChange(onChangeMock);
            
            const checkbox = element.querySelector('input[value="1"]');
            checkbox.click();
            
            expect(onChangeMock).toHaveBeenCalledTimes(1);
            expect(onChangeMock).toHaveBeenCalledWith(['1']);
            
            document.body.removeChild(element);
        });

        it('should call onChange with updated selection', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1']);
            const element = selector.render();
            document.body.appendChild(element);
            
            const onChangeMock = jest.fn();
            selector.setOnChange(onChangeMock);
            
            const checkbox = element.querySelector('input[value="2"]');
            checkbox.click();
            
            expect(onChangeMock).toHaveBeenCalledWith(expect.arrayContaining(['1', '2']));
            
            document.body.removeChild(element);
        });

        it('should call onChange when unchecking', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1', '2']);
            const element = selector.render();
            document.body.appendChild(element);
            
            const onChangeMock = jest.fn();
            selector.setOnChange(onChangeMock);
            
            const checkbox = element.querySelector('input[value="1"]');
            checkbox.click();
            
            expect(onChangeMock).toHaveBeenCalledWith(['2']);
            
            document.body.removeChild(element);
        });

        it('should not throw error if onChange not set', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            document.body.appendChild(element);
            
            const checkbox = element.querySelector('input[value="1"]');
            
            expect(() => {
                checkbox.click();
            }).not.toThrow();
            
            document.body.removeChild(element);
        });
    });

    describe('updateFamilyMembers()', () => {
        it('should update family members and re-render', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            document.body.appendChild(element);
            
            const newMembers = [
                { id: '4', name: 'Ana' },
                { id: '5', name: 'Luis' }
            ];
            
            selector.updateFamilyMembers(newMembers);
            
            expect(element.innerHTML).toContain('Ana');
            expect(element.innerHTML).toContain('Luis');
            expect(element.innerHTML).not.toContain('Juan');
            
            const checkboxes = element.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBe(2);
            
            document.body.removeChild(element);
        });

        it('should preserve selected diners that still exist', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1', '2']);
            const element = selector.render();
            document.body.appendChild(element);
            
            const newMembers = [
                { id: '1', name: 'Juan' },
                { id: '4', name: 'Ana' }
            ];
            
            selector.updateFamilyMembers(newMembers);
            
            const selected = selector.getSelectedDiners();
            expect(selected).toContain('1');
            expect(selected).toContain('2'); // Still in internal state
            
            document.body.removeChild(element);
        });
    });

    describe('destroy()', () => {
        it('should remove element from DOM', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            document.body.appendChild(element);
            
            expect(document.body.contains(element)).toBe(true);
            
            selector.destroy();
            
            expect(document.body.contains(element)).toBe(false);
        });

        it('should clean up references', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            selector.render();
            
            selector.destroy();
            
            expect(selector.container).toBeNull();
            expect(selector.onChange).toBeNull();
        });

        it('should not throw if not rendered', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            
            expect(() => {
                selector.destroy();
            }).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle duplicate IDs in initial selection', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['1', '1', '2']);
            
            const selected = selector.getSelectedDiners();
            expect(selected.length).toBe(2);
            expect(selected).toEqual(expect.arrayContaining(['1', '2']));
        });

        it('should handle selection of non-existent family member ID', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, ['999']);
            const element = selector.render();
            
            // Should not crash, just won't have a checkbox for it
            expect(element).toBeTruthy();
            expect(selector.getSelectedDiners()).toContain('999');
        });

        it('should handle rapid checkbox clicks', () => {
            selector = new BulkDinerSelector('lunch', familyMembers, []);
            const element = selector.render();
            document.body.appendChild(element);
            
            const onChangeMock = jest.fn();
            selector.setOnChange(onChangeMock);
            
            const checkbox = element.querySelector('input[value="1"]');
            
            checkbox.click();
            checkbox.click();
            checkbox.click();
            
            expect(onChangeMock).toHaveBeenCalledTimes(3);
            expect(selector.getSelectedDiners()).toContain('1');
            
            document.body.removeChild(element);
        });
    });
});
