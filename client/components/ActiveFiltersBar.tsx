import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from './styles/theme';

export default function ActiveFiltersBar({
  selectedFilters,
  toggleFilter,
  hasActiveFilters,
}) {
  if (!hasActiveFilters()) return null;

  const removeFilter = (filter) => {
    if (selectedFilters.skillFocus.includes(filter)) {
      toggleFilter('skillFocus', filter);
    } else if (selectedFilters.difficulty.includes(filter)) {
      toggleFilter('difficulty', filter);
    } else {
      toggleFilter('type', filter);
    }
  };

  return (
    <View style={styles.activeFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          ...selectedFilters.skillFocus,
          ...selectedFilters.difficulty,
          ...selectedFilters.type,
        ].map((filter, index) => (
          <View key={index} style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>{filter}</Text>
            <TouchableOpacity
              onPress={() => removeFilter(filter)}
              style={styles.removeFilterButton}
            >
              <MaterialIcons name="close" size={16} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF3B30',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  filterOptionsContainer: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#007AFF',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Active filters styles
  activeFiltersContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '500',
    marginRight: 4,
  },
  removeFilterButton: {
    padding: 2,
  },
});