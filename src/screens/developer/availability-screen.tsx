import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Calendar, DateData } from "react-native-calendars";
import { supabase } from "../../lib/supabase";
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
import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { AppTabParamList } from "../../navigation/main-navigator"; // Adjust path if needed

type DeveloperAvailabilityScreenProps = BottomTabScreenProps<
  AppTabParamList,
  "Availability"
>;

const localColors = themeColors.dark;

function DeveloperAvailabilityScreen({
  navigation,
}: DeveloperAvailabilityScreenProps) {
  const { user } = useAuthStore();

  const [selectedDay, setSelectedDay] = useState<number>(1);

  const {
    availabilitySlots: firstCallSlots,
    isLoading: isLoadingFirstCall,
    isSaving: isSavingFirstCall,
    saveAvailability: saveFirstCall,
    developerId: firstCallDeveloperId,
  } = useDeveloperFirstCallAvailability();

  const {
    availabilitySlots: generalWorkSlots,
    isLoading: isLoadingGeneralWork,
    isSaving: isSavingGeneralWork,
    isDeleting: isDeletingGeneralWork,
    deleteAvailability: deleteGeneralWork,
    saveAvailability: saveGeneralWork,
    developerId: generalWorkDeveloperId,
  } = useDeveloperGeneralAvailability();

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  const [rangeStartDate, setRangeStartDate] = useState<string | null>(null);
  const [rangeEndDate, setRangeEndDate] = useState<string | null>(null);

  const [selectedGeneralSlotId, setSelectedGeneralSlotId] = useState<
    string | number | null
  >(null);

  const isLoading = isLoadingFirstCall || isLoadingGeneralWork;
  const isSaving = isSavingFirstCall || isSavingGeneralWork;
  const isDeleting = isDeletingGeneralWork;

  const developerId = firstCallDeveloperId || generalWorkDeveloperId;

  useEffect(() => {
    const newSelectedTimeSlots: string[] = [];

    if (firstCallSlots) {
      firstCallSlots
        .filter((slot) => slot.day_of_week === selectedDay)
        .forEach((slot) => {
          const startHour = parseInt(slot.slot_start_time.split(":")[0]);
          const endHour = parseInt(slot.slot_end_time.split(":")[0]);

          for (let hour = startHour; hour < endHour; hour++) {
            const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
            newSelectedTimeSlots.push(timeSlot);
          }
        });
    }
    setSelectedTimeSlots(newSelectedTimeSlots);
  }, [selectedDay, firstCallSlots]);

  const handleSaveAvailability = async () => {
    if (!developerId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Developer profile not found. Cannot save availability.",
      });
      return;
    }

    const timeRangesToSave = selectedTimeSlots.map((slot) => ({
      slot_start_time: slot,
      slot_end_time: `${String(parseInt(slot.split(":")[0], 10) + 1).padStart(
        2,
        "0"
      )}:00`,
    }));

    const params: SaveFirstCallAvailabilityParams = {
      day_of_week: selectedDay,
      timeRanges: timeRangesToSave,
    };

    try {
      await saveFirstCall([params]);
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
        console.log(`Deselected existing slot ID: ${existingSlot.id}`);
      } else {
        setRangeStartDate(existingSlot.range_start_date);
        setRangeEndDate(existingSlot.range_end_date);
        setSelectedGeneralSlotId(existingSlot.id);
        console.log(
          `Selected existing slot ID: ${existingSlot.id} [${existingSlot.range_start_date} - ${existingSlot.range_end_date}]`
        );
      }
    } else {
      setSelectedGeneralSlotId(null);
      if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
        setRangeStartDate(clickedDate);
        setRangeEndDate(null);
        console.log(`Started new range selection: ${clickedDate}`);
      } else if (clickedDate >= rangeStartDate) {
        setRangeEndDate(clickedDate);
        console.log(`Set end date for new range: ${clickedDate}`);
      } else {
        setRangeStartDate(clickedDate);
        setRangeEndDate(null);
        console.log(`Reset range selection to start: ${clickedDate}`);
      }
    }
  };

  const handleSaveGeneralAvailability = async () => {
    if (selectedGeneralSlotId) {
      Toast.show({
        type: "info",
        text1: "Info",
        text2: "Editing ranges not yet supported. Delete and recreate.",
      });
      return;
    }
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
        text2: "Please select a start and end date for the range.",
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
        text2: "General availability range saved successfully!",
      });
      setRangeStartDate(null);
      setRangeEndDate(null);
      setSelectedGeneralSlotId(null); // Reset state
    } catch (error) {
      console.error("Failed to save general availability:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: `Could not save general availability: ${errorMessage}`,
      });
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
    if (!developerId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Developer profile not found.",
      });
      return;
    }
    console.log(`Attempting deletion for slot ID: ${selectedGeneralSlotId}`);
    const params: DeleteGeneralAvailabilityParams = {
      availabilityId: selectedGeneralSlotId,
    };
    try {
      await deleteGeneralWork(params);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "General availability range deleted successfully!",
      });
      setRangeStartDate(null);
      setRangeEndDate(null);
      setSelectedGeneralSlotId(null); // Reset state
    } catch (error) {
      console.error("Failed to delete general availability:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      Toast.show({
        type: "error",
        text1: "Delete Failed",
        text2: `Could not delete general availability: ${errorMessage}`,
      });
    }
  };

  const getMarkedDatesForCalendar = () => {
    const marked: {
      [key: string]: {
        color?: string;
        textColor?: string;
        startingDay?: boolean;
        endingDay?: boolean;
        marked?: boolean;
        dotColor?: string;
      };
    } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mark existing general work slots
    generalWorkSlots.forEach((slot) => {
      if (slot.range_start_date && slot.range_end_date) {
        let currentDate = new Date(slot.range_start_date);
        currentDate.setHours(12, 0, 0, 0); // Avoid timezone issues crossing midnight
        const endDate = new Date(slot.range_end_date);
        endDate.setHours(12, 0, 0, 0);

        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split("T")[0];
          const isSelectedExisting = selectedGeneralSlotId === slot.id; // Check if this existing slot is the one selected
          marked[dateString] = {
            ...marked[dateString], // Keep other markings like 'selected' if applicable
            color: isSelectedExisting
              ? localColors.warning
              : localColors.secondary, // Different color if selected
            textColor: localColors.text, // Ensure text is readable
            startingDay: dateString === slot.range_start_date,
            endingDay: dateString === slot.range_end_date,
            marked: true,
            dotColor: isSelectedExisting
              ? localColors.warning
              : localColors.secondary,
          };
          if (dateString === slot.range_start_date)
            marked[dateString].startingDay = true;
          if (dateString === slot.range_end_date)
            marked[dateString].endingDay = true;

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    // Mark newly selected range if not selecting an existing one
    if (!selectedGeneralSlotId && rangeStartDate && rangeEndDate) {
      let currentDate = new Date(rangeStartDate);
      currentDate.setHours(12, 0, 0, 0);
      const endDate = new Date(rangeEndDate);
      endDate.setHours(12, 0, 0, 0);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        // If the date is already marked by an existing slot, don't overwrite it
        if (
          !marked[dateString] ||
          !marked[dateString].dotColor ||
          marked[dateString].dotColor !== localColors.secondary
        ) {
          marked[dateString] = {
            ...marked[dateString],
            color: localColors.primary, // Color for new range selection
            textColor: localColors.text,
            startingDay: dateString === rangeStartDate,
            endingDay: dateString === rangeEndDate,
            marked: true,
            dotColor: localColors.primary,
          };
          if (dateString === rangeStartDate)
            marked[dateString].startingDay = true;
          if (dateString === rangeEndDate) marked[dateString].endingDay = true;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (!selectedGeneralSlotId && rangeStartDate) {
      // Mark single start date if end not selected
      marked[rangeStartDate] = {
        ...marked[rangeStartDate],
        color: localColors.primary, // Color for new range selection
        textColor: localColors.text,
        startingDay: true,
        endingDay: true,
        marked: true,
        dotColor: localColors.primary,
      };
    }

    return marked;
  };

  const isDateInSlot = (dateStr: string, slot: Availability): boolean => {
    if (!slot.range_start_date || !slot.range_end_date) return false;
    // Ensure consistent comparison by parsing as local dates (assuming calendar uses local)
    const date = new Date(dateStr);
    const start = new Date(slot.range_start_date);
    const end = new Date(slot.range_end_date);
    // Adjust for timezone offset if necessary, or ensure all are treated as UTC if stored that way
    // For simplicity, assuming direct YYYY-MM-DD comparison works for local context here.
    date.setHours(0, 0, 0, 0); // Normalize time part for date comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return date >= start && date <= end;
  };

  // Guard for developer profile loading
  if (isLoadingFirstCall || isLoadingGeneralWork) {
    return (
      <View
        style={[
          styles.centeredStatusContainer,
          { backgroundColor: localColors.background },
        ]}
      >
        <ActivityIndicator size={50} color={localColors.primary} />
        <Text style={[styles.statusText, { color: localColors.text }]}>
          Loading developer profile...
        </Text>
      </View>
    );
  }
  console.log("devId", developerId);
  // Guard for missing developer profile
  if (!developerId) {
    return (
      <View
        style={[
          styles.centeredStatusContainer,
          { backgroundColor: localColors.background },
        ]}
      >
        <Icon
          name="account-alert-outline"
          size={48}
          color={localColors.error}
          style={{ marginBottom: 16 }}
        />
        <Text
          style={[
            styles.statusText,
            { color: localColors.text, textAlign: "center", marginBottom: 20 },
          ]}
        >
          Please complete your developer profile before setting your
          availability.
        </Text>
        <Button
          title="Go to Edit Profile"
          onPress={() => {
            navigation.navigate("Profile", { screen: "DeveloperProfile" });
            // Toast.show({
            //   type: "info",
            //   text1: "Navigating to Profile Edit",
            //   text2: "Please ensure your profile is complete.",
            // });
          }}
          color={localColors.primary}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size={50}
          color={localColors.primary}
          style={styles.loadingIndicator}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Availability</Text>
          <Text style={styles.subtitle}>
            Let clients know when you're available for a first call
          </Text>
        </View>

        <View style={styles.daySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  selectedDay === index && styles.selectedDayButton,
                  (isLoading || isSaving) && styles.disabledButton,
                ]}
                onPress={() =>
                  !(isLoading || isSaving) && setSelectedDay(index)
                }
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDay === index && styles.selectedDayButtonText,
                  ]}
                >
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeSlotContainer}>
          <Text style={styles.sectionTitle}>
            Set Your Weekly First Call Availability
          </Text>

          {[
            "08:00",
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
            "18:00",
            "19:00",
          ].map((timeSlot) => (
            <TouchableOpacity
              key={timeSlot}
              style={[
                styles.timeSlot,
                selectedTimeSlots.includes(timeSlot) && styles.selectedTimeSlot,
                (isLoading || isSaving) && styles.disabledButton,
              ]}
              onPress={() =>
                !(isLoading || isSaving) &&
                setSelectedTimeSlots((prev) => [...prev, timeSlot])
              }
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlots.includes(timeSlot) &&
                    styles.selectedTimeSlotText,
                ]}
              >
                {timeSlot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSaveAvailability}
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          disabled={isSaving || selectedTimeSlots.length === 0}
        >
          {isSavingFirstCall ? (
            <ActivityIndicator color={localColors.text} />
          ) : (
            <Text style={styles.saveButtonText}>Save Weekly Slots</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Set Your General Work Availability (Date Ranges)
        </Text>
        <Calendar
          style={styles.calendar}
          current={new Date().toISOString().split("T")[0]}
          onDayPress={handleDayPress}
          markingType={"period"}
          markedDates={getMarkedDatesForCalendar()}
          theme={{
            backgroundColor: localColors.background,
            calendarBackground: localColors.card,
            textSectionTitleColor: localColors.textSecondary,
            selectedDayBackgroundColor: localColors.primary,
            selectedDayTextColor: localColors.text,
            todayTextColor: localColors.accent,
            dayTextColor: localColors.text,
            textDisabledColor: localColors.subtle,
            dotColor: localColors.primary,
            selectedDotColor: localColors.text,
            arrowColor: localColors.primary,
            disabledArrowColor: localColors.subtle,
            monthTextColor: localColors.text,
            indicatorColor: localColors.primary,
            textDayFontFamily: "System",
            textMonthFontFamily: "System",
            textDayHeaderFontFamily: "System",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
        />

        {rangeStartDate && (
          <Text style={styles.infoText}>
            Selected Range: {rangeStartDate}{" "}
            {rangeEndDate ? `to ${rangeEndDate}` : ""}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSaveGeneralAvailability}
          style={[
            styles.saveButton,
            !rangeStartDate ||
            !rangeEndDate ||
            isSavingGeneralWork ||
            selectedGeneralSlotId
              ? styles.disabledButton
              : null,
          ]}
          disabled={
            !rangeStartDate ||
            !rangeEndDate ||
            isSavingGeneralWork ||
            !!selectedGeneralSlotId
          }
        >
          {isSavingGeneralWork ? (
            <ActivityIndicator color={localColors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save New Range</Text>
          )}
        </TouchableOpacity>

        {selectedGeneralSlotId && ( // Only show if an existing slot is selected
          <TouchableOpacity
            onPress={handleDeleteGeneralAvailability}
            style={[
              styles.deleteButton,
              isDeleting ? styles.disabledButton : null,
            ]}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color={localColors.text} />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Selected Range</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.subSectionTitle}>
          Your Saved General Availability Ranges:
        </Text>
        {isLoadingGeneralWork && (
          <ActivityIndicator color={localColors.primary} />
        )}
        {generalWorkSlots.length === 0 && !isLoadingGeneralWork && (
          <Text style={styles.infoText}>
            No general availability ranges saved yet.
          </Text>
        )}
        <FlatList
          data={generalWorkSlots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.generalAvailabilityItem}>
              <Text style={styles.generalAvailabilityText}>
                From: {item.range_start_date} To: {item.range_end_date}
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: localColors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: localColors.text,
  },
  subtitle: {
    fontSize: 16,
    color: localColors.textSecondary,
    marginTop: spacing.xs,
  },
  daySelector: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  dayButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    marginRight: spacing.md,
    backgroundColor: localColors.card,
  },
  selectedDayButton: {
    backgroundColor: localColors.primary,
  },
  dayButtonText: {
    fontWeight: "600",
    color: localColors.textSecondary,
  },
  selectedDayButtonText: {
    color: localColors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.lg,
    color: localColors.text,
  },
  timeSlotContainer: {
    padding: spacing.lg,
  },
  timeSlot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
    backgroundColor: localColors.card,
    borderWidth: 1,
    borderColor: localColors.border,
  },
  selectedTimeSlot: {
    backgroundColor: localColors.primary,
    borderColor: localColors.primary,
  },
  timeSlotText: {
    fontSize: 16,
    color: localColors.text,
  },
  selectedTimeSlotText: {
    color: localColors.text,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: localColors.primary,
    borderRadius: 8,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: "center",
  },
  saveButtonText: {
    color: localColors.background, // Changed for contrast
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: localColors.error, // Use theme error color
    borderRadius: 8,
    padding: spacing.lg,
    marginHorizontal: spacing.lg, // Align with save button
    marginTop: spacing.md, // Add some space above
    alignItems: "center",
  },
  deleteButtonText: {
    color: themeColors.dark.text, // Ensure text is readable on error background
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: localColors.error,
    borderColor: localColors.error,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: localColors.error,
    fontSize: 14,
  },
  loadingIndicator: {
    marginVertical: spacing.xl,
  },
  calendar: {
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: localColors.border,
    borderRadius: 8,
  },
  infoText: {
    color: localColors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: localColors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  generalAvailabilityItem: {
    backgroundColor: localColors.card,
    padding: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: localColors.border,
  },
  generalAvailabilityText: {
    color: localColors.text,
    fontSize: 14,
  },
  centeredStatusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default DeveloperAvailabilityScreen;
