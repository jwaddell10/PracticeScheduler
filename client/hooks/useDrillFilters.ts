// hooks/useDrillFilters.js
import { useState } from "react";

export function useDrillFilters() {
	const [selectedFilters, setSelectedFilters] = useState({
		skillFocus: [],
		difficulty: [],
		type: [],
	});

	// Filter options
	const skillFocusOptions = [
		"Offense",
		"Defense",
		"Serve",
		"Serve Receive",
		"Blocking",
	];
	const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];
	const typeOptions = ["Team Drill", "Individual"];

	const toggleFilter = (filterType, value) => {
		setSelectedFilters((prev) => {
			const currentFilters = prev[filterType];
			const newFilters = currentFilters.includes(value)
				? currentFilters.filter((f) => f !== value)
				: [...currentFilters, value];

			return {
				...prev,
				[filterType]: newFilters,
			};
		});
	};

	const clearAllFilters = () => {
		setSelectedFilters({
			skillFocus: [],
			difficulty: [],
			type: [],
		});
	};

	const hasActiveFilters = () => {
		return (
			selectedFilters.skillFocus.length > 0 ||
			selectedFilters.difficulty.length > 0 ||
			selectedFilters.type.length > 0
		);
	};

	const parseArrayValue = (value) => {
		if (!value) return [];

		if (typeof value === "string") {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed)
					? parsed.map((s) => s.toLowerCase())
					: [value.toLowerCase()];
			} catch (e) {
				return [value.toLowerCase()];
			}
		}
		return [];
	};

	const filterDrills = (drillsToFilter) => {
		if (!hasActiveFilters()) {
			return drillsToFilter;
		}

		return drillsToFilter.filter((drill) => {
			const drillSkillFocus = parseArrayValue(drill.skillFocus);
			const drillDifficulty = parseArrayValue(drill.difficulty);
			const drillType = parseArrayValue(drill.type);

			const skillFocusMatch =
				selectedFilters.skillFocus.length === 0 ||
				selectedFilters.skillFocus.some((filter) =>
					drillSkillFocus.includes(filter.toLowerCase())
				);

			const difficultyMatch =
				selectedFilters.difficulty.length === 0 ||
				selectedFilters.difficulty.some((filter) =>
					drillDifficulty.includes(filter.toLowerCase())
				);

			const typeMatch =
				selectedFilters.type.length === 0 ||
				selectedFilters.type.some((filter) =>
					drillType.includes(filter.toLowerCase())
				);

			return skillFocusMatch && difficultyMatch && typeMatch;
		});
	};

	return {
		selectedFilters,
		skillFocusOptions,
		difficultyOptions,
		typeOptions,
		toggleFilter,
		clearAllFilters,
		hasActiveFilters,
		filterDrills,
	};
}
