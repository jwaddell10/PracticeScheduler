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
import theme from "./styles/theme";

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
	extraTopPadding = false,
}) {
	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent={false}
		>
			<SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
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
											color={theme.colors.white}
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
											color={theme.colors.white}
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
											color={theme.colors.white}
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
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cancelButton: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  clearButton: {
    fontSize: 16,
    color: theme.colors.error,
  },
  modalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: theme.colors.white,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: theme.colors.white,
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