import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { Availability } from '../../types';
import { useDeveloperFirstCallAvailability, SaveFirstCallAvailabilityParams } from '../../hooks/useDeveloperFirstCallAvailability';
import { colors as themeColors, spacing } from '../../theme';

const localColors = themeColors.dark;

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

function DeveloperAvailabilityScreen() {
  const { user } = useAuthStore();
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{[key: string]: boolean}>({});

  const {
    availabilitySlots,
    isLoading,
    isError,
    error: availabilityError,
    saveAvailability,
    isSaving,
    developerId, // Can be used to check if developer profile exists before allowing save
  } = useDeveloperFirstCallAvailability();

  useEffect(() => {
    const newSelectedTimeSlots: {[key: string]: boolean} = {};
    
    if (availabilitySlots) {
      availabilitySlots
        .filter(slot => slot.day_of_week === selectedDay)
        .forEach(slot => {
          const startHour = parseInt(slot.slot_start_time.split(':')[0]);
          const endHour = parseInt(slot.slot_end_time.split(':')[0]);
          
          for (let hour = startHour; hour < endHour; hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            newSelectedTimeSlots[timeSlot] = true;
          }
        });
    }
    setSelectedTimeSlots(newSelectedTimeSlots);
  }, [selectedDay, availabilitySlots]);

  const handleSaveAvailability = async () => {

    if (!user || !developerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: "User or developer profile not found. Cannot save availability."
      });
      console.log('[handleSaveAvailability] User or developer profile not found, aborting.');
      return;
    }

    console.log(`[handleSaveAvailability] Attempting to save for day: ${DAYS_OF_WEEK[selectedDay]} (index: ${selectedDay})`);

    const timeRanges: Array<{ slot_start_time: string; slot_end_time: string }> = [];
    let currentStartTime: string | null = null;
    let currentEndTime: string | null = null;

    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const timeSlot = TIME_SLOTS[i];
      const nextSlotHour = parseInt(timeSlot.split(':')[0]) + 1;
      const nextSlotFormatted = `${nextSlotHour.toString().padStart(2, '0')}:00`;

      if (selectedTimeSlots[timeSlot]) {
        if (currentStartTime === null) {
          currentStartTime = timeSlot;
        }
        currentEndTime = nextSlotFormatted;
      } else {
        if (currentStartTime !== null && currentEndTime !== null) {
          timeRanges.push({ slot_start_time: currentStartTime, slot_end_time: currentEndTime });
          currentStartTime = null;
          currentEndTime = null;
        }
      }
    }

    if (currentStartTime !== null && currentEndTime !== null) {
      timeRanges.push({ slot_start_time: currentStartTime, slot_end_time: currentEndTime });
    }

    console.log('[handleSaveAvailability] Calculated timeRanges:', JSON.stringify(timeRanges, null, 2));

    try {
      console.log('[handleSaveAvailability] Calling saveAvailability mutation...');
      const saveResult = await saveAvailability({
        day_of_week: selectedDay,
        timeRanges,
      });
      console.log('[handleSaveAvailability] saveAvailability mutation completed. Result:', saveResult);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Availability for ${DAYS_OF_WEEK[selectedDay]} saved successfully!`
      });
    } catch (e) {
      const err = e as Error;
      console.error('[handleSaveAvailability] Error during saveAvailability call:', err.message, err.stack);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Failed to save availability: ${err.message}`
      });
    }
  };

  const toggleTimeSlot = (timeSlot: string) => {
    setSelectedTimeSlots(prev => ({
      ...prev,
      [timeSlot]: !prev[timeSlot]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your First Call Availability</Text>
          <Text style={styles.subtitle}>Let clients know when you're available for a first call</Text>
        </View>

        <View style={styles.daySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DAYS_OF_WEEK.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  selectedDay === index && styles.selectedDayButton,
                  (isLoading || isSaving) && styles.disabledButton
                ]}
                onPress={() => !(isLoading || isSaving) && setSelectedDay(index)}
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
          <Text style={styles.sectionTitle}>{DAYS_OF_WEEK[selectedDay]}</Text>
          
          {isLoading && <ActivityIndicator size="large" color={localColors.primary} style={styles.loadingIndicator} />}
          {isError && availabilityError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error fetching availability: {availabilityError.message}</Text>
            </View>
          )}

          {!isLoading && !isError && TIME_SLOTS.map((timeSlot) => (
            <TouchableOpacity
              key={timeSlot}
              style={[
                styles.timeSlot,
                selectedTimeSlots[timeSlot] && styles.selectedTimeSlot,
                (isLoading || isSaving) && styles.disabledButton
              ]}
              onPress={() => !(isLoading || isSaving) && toggleTimeSlot(timeSlot)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlots[timeSlot] && styles.selectedTimeSlotText,
                ]}
              >
                {timeSlot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (isLoading || isSaving) && styles.disabledButton ]}
          onPress={handleSaveAvailability}
          disabled={isLoading || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={localColors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save Availability</Text>
          )}
        </TouchableOpacity>
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
    fontWeight: 'bold',
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
    fontWeight: '600',
    color: localColors.textSecondary,
  },
  selectedDayButtonText: {
    color: localColors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    color: localColors.text,
  },
  timeSlotContainer: {
    padding: spacing.lg,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: localColors.primary,
    borderRadius: 8,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: localColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: localColors.error || '#f8d7da',
    borderColor: localColors.error || '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: localColors.error || '#721c24',
    fontSize: 14,
  },
  loadingIndicator: {
    marginVertical: spacing.xl,
  }
});

export default DeveloperAvailabilityScreen;
