import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { Calendar, DateData } from "react-native-calendars";
import { useAuthStore } from "../../stores/auth-store";
import { Availability } from "../../types";
import {
  useDeveloperFirstCallAvailability,
  SaveFirstCallAvailabilityParams,
} from "../../hooks/useDeveloperFirstCallAvailability";
import {
  useDeveloperGeneralAvailability,
  SaveGeneralAvailabilityParams,
  DeleteGeneralAvailabilityParams,
} from "../../hooks/useDeveloperGeneralAvailability";
import { colors as themeColors, spacing } from "../../theme";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { AllMainTabsParamList } from "../../types"; // Corrected import from types file

type DeveloperAvailabilityScreenProps = BottomTabScreenProps<
  AllMainTabsParamList,
  "Availability"
>;

const localColors = themeColors.dark;

function DeveloperAvailabilityScreen({
  navigation,
}: DeveloperAvailabilityScreenProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"firstCall" | "general">(
    "firstCall"
  );

  // State for First Call Availability
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 for Monday, 0 for Sunday
  const {
    availabilitySlots: firstCallSlots, // These are the currently saved slots from DB
    isLoading: isLoadingFirstCall,
    isSaving: isSavingFirstCall,
    saveAvailability: saveFirstCall,
    developerId: firstCallDeveloperId,
  } = useDeveloperFirstCallAvailability();

  // This state holds the selections made by the user in the UI, per day
  const [selectedFirstCallSlotsByDay, setSelectedFirstCallSlotsByDay] =
    useState<Record<number, string[]>>({});
  const [firstCallSlotActiveStatusByDay, setFirstCallSlotActiveStatusByDay] =
    useState<Record<number, Record<string, boolean>>>({});

  // State for General Work Availability
  const {
    availabilitySlots: generalWorkSlots,
    isLoading: isLoadingGeneralWork,
    isSaving: isSavingGeneralWork,
    isDeleting: isDeletingGeneralWork,
    deleteAvailability: deleteGeneralWork,
    saveAvailability: saveGeneralWork,
    developerId: generalWorkDeveloperId,
  } = useDeveloperGeneralAvailability();
  const [rangeStartDate, setRangeStartDate] = useState<string | null>(null);
  const [rangeEndDate, setRangeEndDate] = useState<string | null>(null);
  const [selectedGeneralSlotId, setSelectedGeneralSlotId] = useState<
    string | number | null
  >(null);

  const isLoading = isLoadingFirstCall || isLoadingGeneralWork;
  const isSaving = isSavingFirstCall || isSavingGeneralWork;
  const isDeleting = isDeletingGeneralWork;
  const developerId = firstCallDeveloperId || generalWorkDeveloperId;

  // Initialize selectedFirstCallSlotsByDay from fetched firstCallSlots
  useEffect(() => {
    if (firstCallSlots) {
      const initialSlotsByDay: Record<number, string[]> = {};
      const activeSlotsForUISelection: Record<number, string[]> = {};
      const allSlotStatuses: Record<number, Record<string, boolean>> = {};

      firstCallSlots.forEach((slot) => {
        if (slot.day_of_week === undefined || slot.day_of_week === null) return;

        if (!activeSlotsForUISelection[slot.day_of_week]) {
          activeSlotsForUISelection[slot.day_of_week] = [];
        }
        if (!allSlotStatuses[slot.day_of_week]) {
          allSlotStatuses[slot.day_of_week] = {};
        }

        const startHour = parseInt(slot.slot_start_time.split(":")[0]);
        const endHour = parseInt(slot.slot_end_time.split(":")[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
          const isSlotActive = slot.is_active ?? true; // Default to true if null/undefined

          // Populate status for all slots (for rendering red, etc.)
          allSlotStatuses[slot.day_of_week][timeSlot] = isSlotActive;

          // Populate UI selectable slots ONLY if the slot is actually active
          if (isSlotActive) {
            if (
              !activeSlotsForUISelection[slot.day_of_week].includes(timeSlot)
            ) {
              activeSlotsForUISelection[slot.day_of_week].push(timeSlot);
            }
          }
        }
      });

      // Sort the UI selected slots for consistency
      for (const day in activeSlotsForUISelection) {
        activeSlotsForUISelection[day].sort();
      }

      setSelectedFirstCallSlotsByDay(activeSlotsForUISelection);
      setFirstCallSlotActiveStatusByDay(allSlotStatuses);
      // The comment about re-initializing on every fetch is important.
      // For a more robust UX that preserves unsaved changes during background refetches,
      // a more sophisticated merging strategy or only initializing if selectedFirstCallSlotsByDay is empty
      // would be needed. This current fix addresses the primary bug of booked slots being overridden.
    }
  }, [firstCallSlots]);

  const handleTimeSlotPress = (time: string) => {
    if (firstCallSlotActiveStatusByDay[selectedDay]?.[time] === false) {
      Toast.show({
        type: "info",
        text1: "Slot Booked",
        text2: "This time slot is already booked and cannot be modified.",
        visibilityTime: 3000,
      });
      return;
    }
    setSelectedFirstCallSlotsByDay((prevSlotsByDay) => {
      const currentDaySlots = prevSlotsByDay[selectedDay] || [];
      const newDaySlots = currentDaySlots.includes(time)
        ? currentDaySlots.filter((t) => t !== time) // Deselect
        : [...currentDaySlots, time].sort(); // Select and sort
      return {
        ...prevSlotsByDay,
        [selectedDay]: newDaySlots,
      };
    });
  };

  const handleSaveFirstCallAvailability = async () => {
    if (!developerId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Developer profile not found. Cannot save availability.",
      });
      return;
    }
    const allParams: SaveFirstCallAvailabilityParams[] = Object.entries(
      selectedFirstCallSlotsByDay
    )
      .map(([dayOfWeekStr, timeStringsForDay]) => {
        const day_of_week = parseInt(dayOfWeekStr, 10);

        // Defensive filter: Ensure only slots that are not marked as booked are processed for saving.
        const trulyAvailableTimeStrings = timeStringsForDay.filter(
          (timeSlot) => {
            const isActive =
              firstCallSlotActiveStatusByDay[day_of_week]?.[timeSlot];
            const shouldInclude = isActive !== false;
            return shouldInclude;
          }
        );

        const sortedTimeStrings = [...trulyAvailableTimeStrings].sort();
        const timeRanges = sortedTimeStrings.map((slot) => ({
          slot_start_time: slot,
          slot_end_time: `${String(
            parseInt(slot.split(":")[0], 10) + 1
          ).padStart(2, "0")}:00`,
        }));

        return { day_of_week, timeRanges };
      })
      // Filter out days that have no timeRanges after our defensive filtering
      .filter((dayParams) => dayParams.timeRanges.length > 0);

    try {
      await saveFirstCall(allParams); // saveFirstCall expects an array of params
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Weekly availability saved successfully!",
      });
    } catch (error) {
      console.error("Failed to save weekly availability:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: `Could not save weekly availability: ${errorMessage}`,
      });
    }
  };

  const renderFirstCallAvailabilityTab = () => {
    const dayButtonConfig = [
      { label: "Mon", dayValue: 1 },
      { label: "Tue", dayValue: 2 },
      { label: "Wed", dayValue: 3 },
      { label: "Thu", dayValue: 4 },
      { label: "Fri", dayValue: 5 },
      { label: "Sat", dayValue: 6 },
    ];
    const timeSlotsToDisplay = Array.from({ length: 11 }, (_, i) => {
      const hour = i + 9; // 9 AM to 7 PM (19:00)
      return `${hour.toString().padStart(2, "0")}:00`;
    });

    if (isLoadingFirstCall) {
      return (
        <ActivityIndicator
          style={styles.loadingIndicator}
          size="large"
          color={localColors.primary}
        />
      );
    }

    const currentDaySelectedSlots =
      selectedFirstCallSlotsByDay[selectedDay] || [];
    const noSlotsSelectedOverall = !Object.values(
      selectedFirstCallSlotsByDay
    ).some((slots) => slots && slots.length > 0);

    return (
      <ScrollView style={styles.tabContentContainer}>
        <Text style={styles.subHeader}>Select Day of Week:</Text>
        <View style={styles.daysOfWeekContainer}>
          {dayButtonConfig.map(({ label, dayValue }) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.dayButton,
                selectedDay === dayValue && styles.selectedDayButton,
              ]}
              onPress={() => setSelectedDay(dayValue)}
              disabled={isLoading || isSaving}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === dayValue && styles.selectedDayButtonText,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subHeader}>
          Select Time Slots for{" "}
          {dayButtonConfig.find((d) => d.dayValue === selectedDay)?.label || ""}
          :
        </Text>
        <View style={styles.timeSlotsContainer}>
          {timeSlotsToDisplay.map((timeSlot) => (
            <TouchableOpacity
              key={timeSlot}
              style={(() => {
                const slotStyle: ViewStyle[] = [styles.timeSlot];
                const isSlotBooked =
                  firstCallSlotActiveStatusByDay[selectedDay]?.[timeSlot] ===
                  false;

                if (isSlotBooked) {
                  slotStyle.push({ backgroundColor: "lightcoral" });
                } else if (currentDaySelectedSlots.includes(timeSlot)) {
                  slotStyle.push(styles.selectedTimeSlot);
                }

                if (isLoading || isSaving) {
                  slotStyle.push(styles.disabledButton);
                }
                return slotStyle;
              })()}
              onPress={() =>
                !(isLoading || isSaving) && handleTimeSlotPress(timeSlot)
              }
              disabled={isLoading || isSaving}
            >
              <Text
                style={(() => {
                  const textStyle: TextStyle[] = [styles.timeSlotText];
                  const isSlotBooked =
                    firstCallSlotActiveStatusByDay[selectedDay]?.[timeSlot] ===
                    false;

                  // If booked, text style is default. If not booked AND selected, then selected text style.
                  if (
                    !isSlotBooked &&
                    currentDaySelectedSlots.includes(timeSlot)
                  ) {
                    textStyle.push(styles.selectedTimeSlotText);
                  }
                  return textStyle;
                })()}
              >
                {timeSlot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSaveFirstCallAvailability}
          style={[
            styles.saveButton,
            (isSavingFirstCall || noSlotsSelectedOverall) &&
              styles.disabledButton,
          ]}
          disabled={isSavingFirstCall || noSlotsSelectedOverall}
        >
          {isSavingFirstCall ? (
            <ActivityIndicator color={localColors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save Weekly Availability</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const isDateInSlot = (date: string, slot: Availability): boolean => {
    if (!slot.range_start_date || !slot.range_end_date) return false;
    return date >= slot.range_start_date && date <= slot.range_end_date;
  };

  const getMarkedDatesForCalendar = () => {
    const marked: { [key: string]: any } = {};
    generalWorkSlots.forEach((slot) => {
      if (slot.range_start_date && slot.range_end_date) {
        let currentDate = new Date(slot.range_start_date + "T00:00:00"); // Ensure parsing as local date
        const endDate = new Date(slot.range_end_date + "T00:00:00");
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split("T")[0];
          marked[dateString] = {
            color: localColors.primary,
            textColor: localColors.text,
            startingDay: dateString === slot.range_start_date,
            endingDay: dateString === slot.range_end_date,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    if (rangeStartDate) {
      marked[rangeStartDate] = {
        ...(marked[rangeStartDate] || {}),
        startingDay: true,
        color: localColors.primary,
        textColor: localColors.background,
      };
    }
    if (rangeEndDate) {
      marked[rangeEndDate] = {
        ...(marked[rangeEndDate] || {}),
        endingDay: true,
        color: localColors.primary,
        textColor: localColors.background,
      };
      if (rangeStartDate && rangeStartDate !== rangeEndDate) {
        let fillDate = new Date(rangeStartDate + "T00:00:00");
        const finalEndDate = new Date(rangeEndDate + "T00:00:00");
        while (fillDate < finalEndDate) {
          fillDate.setDate(fillDate.getDate() + 1);
          const dateString = fillDate.toISOString().split("T")[0];
          if (dateString !== rangeEndDate) {
            marked[dateString] = {
              ...(marked[dateString] || {}),
              color: localColors.primary,
              textColor: localColors.background,
            };
          }
        }
      }
    }
    if (selectedGeneralSlotId) {
      const selectedSlot = generalWorkSlots.find(
        (s) => s.id === selectedGeneralSlotId
      );
      if (
        selectedSlot &&
        selectedSlot.range_start_date &&
        selectedSlot.range_end_date
      ) {
        let currentDate = new Date(selectedSlot.range_start_date + "T00:00:00");
        const endDate = new Date(selectedSlot.range_end_date + "T00:00:00");
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split("T")[0];
          marked[dateString] = {
            ...marked[dateString],
            color: localColors.secondary,
            textColor: localColors.text,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    return marked;
  };

  const handleDayPress = (day: DateData) => {
    const clickedDate = day.dateString;
    const existingSlot = generalWorkSlots.find((slot) =>
      isDateInSlot(clickedDate, slot)
    );

    if (
      existingSlot &&
      existingSlot.id &&
      existingSlot.range_start_date &&
      existingSlot.range_end_date
    ) {
      if (selectedGeneralSlotId === existingSlot.id) {
        setRangeStartDate(null);
        setRangeEndDate(null);
        setSelectedGeneralSlotId(null);
      } else {
        setRangeStartDate(existingSlot.range_start_date);
        setRangeEndDate(existingSlot.range_end_date);
        setSelectedGeneralSlotId(existingSlot.id);
      }
    } else {
      setSelectedGeneralSlotId(null);
      if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
        setRangeStartDate(clickedDate);
        setRangeEndDate(null);
      } else if (clickedDate >= rangeStartDate) {
        setRangeEndDate(clickedDate);
      } else {
        setRangeStartDate(clickedDate);
        setRangeEndDate(null);
      }
    }
  };

  const handleSaveGeneralAvailability = async () => {
    if (!developerId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Developer profile not found.",
      });
      return;
    }
    if (!rangeStartDate || !rangeEndDate) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a start and end date.",
      });
      return;
    }
    if (selectedGeneralSlotId) {
      Toast.show({
        type: "info",
        text1: "Info",
        text2:
          "Editing existing ranges is not directly supported. Delete and recreate if needed.",
      });
      return;
    }

    const params: SaveGeneralAvailabilityParams = {
      range_start_date: rangeStartDate,
      range_end_date: rangeEndDate,
    };

    try {
      await saveGeneralWork(params);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "General availability saved!",
      });
      setRangeStartDate(null);
      setRangeEndDate(null);
      setSelectedGeneralSlotId(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      Toast.show({ type: "error", text1: "Save Failed", text2: errorMessage });
    }
  };

  const handleDeleteGeneralAvailability = async () => {
    if (!selectedGeneralSlotId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No range selected to delete.",
      });
      return;
    }

    const params: DeleteGeneralAvailabilityParams = {
      availabilityId: selectedGeneralSlotId as string,
    };

    try {
      await deleteGeneralWork(params);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Availability range deleted!",
      });
      setRangeStartDate(null);
      setRangeEndDate(null);
      setSelectedGeneralSlotId(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      Toast.show({
        type: "error",
        text1: "Delete Failed",
        text2: errorMessage,
      });
    }
  };

  const renderGeneralAvailabilityTab = () => {
    if (isLoadingGeneralWork) {
      return (
        <ActivityIndicator
          style={styles.loadingIndicator}
          size="large"
          color={localColors.primary}
        />
      );
    }
    return (
      <ScrollView style={styles.tabContentContainer}>
        <Text style={styles.subHeader}>
          Select Date Range for General Work:
        </Text>
        <Calendar
          style={styles.calendar}
          current={new Date().toISOString().split("T")[0]}
          onDayPress={handleDayPress}
          markingType={"period"}
          markedDates={getMarkedDatesForCalendar()}
          theme={{
            calendarBackground: localColors.background,
            textSectionTitleColor: localColors.textSecondary,
            todayTextColor: localColors.primary,
            dayTextColor: localColors.text,
            textDisabledColor: localColors.border,
            arrowColor: localColors.primary,
            monthTextColor: localColors.text,
            indicatorColor: localColors.primary,
            selectedDayBackgroundColor: localColors.primary,
            selectedDayTextColor: localColors.background,
            // @ts-ignore
            "stylesheet.calendar.header": {
              week: {
                marginTop: spacing.sm,
                flexDirection: "row",
                justifyContent: "space-around",
              },
            },
          }}
        />
        {(rangeStartDate || selectedGeneralSlotId) && (
          <View style={styles.selectedRangeContainer}>
            <Text style={styles.selectedRangeText}>
              {selectedGeneralSlotId ? "Selected Range: " : "New Range: "}
              {rangeStartDate} {rangeEndDate ? ` - ${rangeEndDate}` : ""}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSaveGeneralAvailability}
          style={[
            styles.saveButton,
            (isSavingGeneralWork ||
              !rangeStartDate ||
              !rangeEndDate ||
              !!selectedGeneralSlotId) &&
              styles.disabledButton,
          ]}
          disabled={
            isSavingGeneralWork ||
            !rangeStartDate ||
            !rangeEndDate ||
            !!selectedGeneralSlotId
          }
        >
          {isSavingGeneralWork ? (
            <ActivityIndicator color={localColors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save General Availability</Text>
          )}
        </TouchableOpacity>

        {selectedGeneralSlotId && (
          <TouchableOpacity
            onPress={handleDeleteGeneralAvailability}
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={localColors.background} />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Selected Range</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollViewContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Manage Your Availability</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "firstCall" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("firstCall")}
          >
            <Text style={styles.tabButtonText}>First Call (Weekly)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "general" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("general")}
          >
            <Text style={styles.tabButtonText}>General Work (Ranges)</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "firstCall"
          ? renderFirstCallAvailabilityTab()
          : renderGeneralAvailabilityTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: localColors.background,
  },
  scrollViewContainer: {
    flex: 1,
  },
  headerContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: localColors.border,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: localColors.text,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: localColors.card,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: localColors.border,
  },
  tabButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
  },
  activeTabButton: {
    backgroundColor: localColors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: localColors.text,
    fontWeight: "500",
  },
  tabContentContainer: {
    padding: spacing.md,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: localColors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  daysOfWeekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  dayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: localColors.border,
    borderRadius: spacing.sm,
    alignItems: "center",
    minWidth: 45,
  },
  selectedDayButton: {
    backgroundColor: localColors.primary,
    borderColor: localColors.primary,
    color: localColors.text,
  },
  dayButtonText: {
    color: localColors.text,
    fontSize: 14,
  },
  selectedDayButtonText: {
    fontWeight: "bold",
    color: localColors.text,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: spacing.lg,
  },
  timeSlot: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: localColors.border,
    borderRadius: spacing.sm,
    margin: spacing.xsmall,
    minWidth: "28%",
    alignItems: "center",
  },
  selectedTimeSlot: {
    backgroundColor: localColors.primary,
    borderColor: localColors.primary,
  },
  timeSlotText: {
    color: localColors.text,
    fontSize: 14,
  },
  selectedTimeSlotText: {
    color: localColors.text,
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: localColors.primary,
    padding: spacing.md,
    borderRadius: spacing.sm,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  saveButtonText: {
    color: localColors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: localColors.subtle, // Use subtle for disabled state
    opacity: 0.7,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
    alignSelf: "center",
  },
  calendar: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: localColors.border,
    borderRadius: spacing.sm,
  },
  selectedRangeContainer: {
    padding: spacing.md,
    backgroundColor: localColors.card,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  selectedRangeText: {
    color: localColors.text,
    fontSize: 16,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: localColors.error,
    padding: spacing.md,
    borderRadius: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  deleteButtonText: {
    color: localColors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DeveloperAvailabilityScreen;
