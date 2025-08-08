import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function DrillFilterModal({
	visible,
	onClose,
	selectedFilters,
	skillFocusOptions,
	difficultyOptions,
	typeOptions,
	toggleFilter,
	clearAllFilters,
	filteredCount,
}) {
	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
		>
			<SafeAreaView style={styles.modalContainer}>
				<View style={styles.modalHeader}>
					<TouchableOpacity onPress={onClose}>
						<Text style={styles.cancelButton}>Cancel</Text>
					</TouchableOpacity>
					<Text style={styles.modalTitle}>Filter Drills</Text>
					<TouchableOpacity onPress={clearAllFilters}>
						<Text style={styles.clearButton}>Clear All</Text>
					</TouchableOpacity>
				</View>

				<ScrollView style={styles.modalContent}>
					{/* Skill Focus Filters */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>
							Skill Focus
						</Text>
						<View style={styles.filterOptionsContainer}>
							{skillFocusOptions.map((option) => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.skillFocus.includes(
											option
										) && styles.filterOptionSelected,
									]}
									onPress={() =>
										toggleFilter("skillFocus", option)
									}
								>
									<Text
										style={[
											styles.filterOptionText,
											selectedFilters.skillFocus.includes(
												option
											) &&
												styles.filterOptionTextSelected,
										]}
									>
										{option}
									</Text>
									{selectedFilters.skillFocus.includes(
										option
									) && (
										<MaterialIcons
											name="check"
											size={20}
											color="#007AFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Difficulty Filters */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>
							Difficulty
						</Text>
						<View style={styles.filterOptionsContainer}>
							{difficultyOptions.map((option) => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.difficulty.includes(
											option
										) && styles.filterOptionSelected,
									]}
									onPress={() =>
										toggleFilter("difficulty", option)
									}
								>
									<Text
										style={[
											styles.filterOptionText,
											selectedFilters.difficulty.includes(
												option
											) &&
												styles.filterOptionTextSelected,
										]}
									>
										{option}
									</Text>
									{selectedFilters.difficulty.includes(
										option
									) && (
										<MaterialIcons
											name="check"
											size={20}
											color="#007AFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* Type Filters */}
					<View style={styles.filterSection}>
						<Text style={styles.filterSectionTitle}>Type</Text>
						<View style={styles.filterOptionsContainer}>
							{typeOptions.map((option) => (
								<TouchableOpacity
									key={option}
									style={[
										styles.filterOption,
										selectedFilters.type.includes(option) &&
											styles.filterOptionSelected,
									]}
									onPress={() => toggleFilter("type", option)}
								>
									<Text
										style={[
											styles.filterOptionText,
											selectedFilters.type.includes(
												option
											) &&
												styles.filterOptionTextSelected,
										]}
									>
										{option}
									</Text>
									{selectedFilters.type.includes(option) && (
										<MaterialIcons
											name="check"
											size={20}
											color="#007AFF"
										/>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>
				</ScrollView>

				<View style={styles.modalFooter}>
					<TouchableOpacity
						style={styles.applyButton}
						onPress={onClose}
					>
						<Text style={styles.applyButtonText}>
							Apply Filters ({filteredCount} drills)
						</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</Modal>
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
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  removeFilterButton: {
    padding: 2,
  },
});