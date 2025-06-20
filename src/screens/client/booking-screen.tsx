import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BrowseStackParamList, Availability } from '@/types'; // Assuming @ is src/
import { useFetchDeveloperFirstCallAvailability } from '@/hooks/useFetchDeveloperFirstCallAvailability';
import { colors as themeColors, spacing } from '@/theme';
import { useCreateBooking } from '@/hooks/useCreateBooking'; // Added for booking mutation

// Define the type for the route prop
type BookingScreenRouteProp = RouteProp<BrowseStackParamList, 'BookingScreen'>;

// Define the type for the navigation prop
type BookingScreenNavigationProp = NativeStackNavigationProp<
  BrowseStackParamList,
  'BookingScreen'
>;

const BookingScreen: React.FC = () => {
  const route = useRoute<BookingScreenRouteProp>();
  const navigation = useNavigation<BookingScreenNavigationProp>();
  const { developerId, developerName } = route.params;

  const colors = themeColors.light; // Or based on your theme logic

  const { mutate: createBooking, isPending: isBookingPending } = useCreateBooking();

  const { availabilitySlots: fetchedSlotsFromHook, isLoading, error, refetch } = useFetchDeveloperFirstCallAvailability(developerId);
  const availabilitySlots = fetchedSlotsFromHook || [];
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (developerId) { // Ensure developerId is available before refetching
        refetch();
      }
      return () => {
        // Optional: any cleanup if needed when the screen loses focus
      };
    }, [developerId, refetch]) // Add developerId and refetch as dependencies
  );

  // Group slots by day of week
  const slotsByDay = useMemo(() => {
    return (fetchedSlotsFromHook || []).reduce((acc, slot) => {
      const day = slot.day_of_week;
      if (day === null || day === undefined) return acc;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(slot);
      return acc;
    }, {} as Record<number, Availability[]>);
  }, [fetchedSlotsFromHook]);

  // Get a sorted list of available days
  const availableDaysOfWeek = useMemo(() => {
    return Object.keys(slotsByDay).map(Number).sort((a, b) => a - b);
  }, [slotsByDay]);

  // Get slots for the currently selected day
  const slotsForSelectedDay = useMemo(() => {
    if (selectedDayOfWeek === null) return [];
    return slotsByDay[selectedDayOfWeek] || [];
  }, [selectedDayOfWeek, slotsByDay]);

  // Helper functions (can be moved to a utils file later)
  const getDayOfWeekName = (dayIndex: number | null | undefined): string => {
    if (dayIndex === null || dayIndex === undefined) return 'N/A';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Invalid Day';
  };

  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return 'N/A';
    // Ensure it's just HH:MM, supabase might return with seconds/timezone
    const parts = timeString.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeString; // Fallback if format is unexpected
  };

  const handleConfirmBooking = () => {
    if (selectedSlotId && developerId) {
      createBooking({ developerId, slotId: selectedSlotId });
    } else {
      // This case should ideally be prevented by disabling the button,
      // but as a fallback:
      // Toast.show({
      //   type: 'error',
      //   text1: 'Selection Missing',
      //   text2: 'Please select a time slot before confirming.',
      // });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          Book First Call with {developerName || 'Developer'}
        </Text>
        <Text style={[{ color: colors.text, marginBottom: spacing.md }]}>
          Developer ID: {developerId}
        </Text>
        
        {/* Day Selector */}
        {availableDaysOfWeek.length > 0 && (
          <View style={styles.daySelectorContainer}>
            <Text style={[styles.subHeader, { color: colors.text }]}>Select a Day:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScrollView}>
              {availableDaysOfWeek.map((dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayButton,
                    selectedDayOfWeek === dayIndex && styles.selectedDayButton,
                  ]}
                  onPress={() => {
                    setSelectedDayOfWeek(dayIndex);
                    setSelectedSlotId(null); // Reset slot selection when day changes
                  }}
                >
                  <Text style={[
                    styles.dayButtonText,
                    selectedDayOfWeek === dayIndex && styles.selectedDayButtonText,
                  ]}>
                    {getDayOfWeekName(dayIndex).substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Availability Slots for Selected Day */}
        <Text style={[styles.subHeader, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          {selectedDayOfWeek !== null ? `Available Times for ${getDayOfWeekName(selectedDayOfWeek)}:` : 'Please select a day to see available times.'}
        </Text>
        <ScrollView style={styles.slotsScrollView}>
          {isLoading && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }}/>
          )}
          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              Error loading availability: {error.message}
            </Text>
          )}
          {!isLoading && !error && availableDaysOfWeek.length === 0 && (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              No first call slots available for this developer at the moment.
            </Text>
          )}
          {!isLoading && !error && selectedDayOfWeek !== null && slotsForSelectedDay.length === 0 && (
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              No slots available for {getDayOfWeekName(selectedDayOfWeek)}.
            </Text>
          )}
          {!isLoading && !error && selectedDayOfWeek !== null && slotsForSelectedDay.length > 0 && (
            slotsForSelectedDay.map((slot: Availability, index: number) => (
              <TouchableOpacity 
                key={slot.id || `slot-${index}`} 
                style={[styles.slotItem, selectedSlotId === slot.id && styles.selectedSlotItem]}
                onPress={() => setSelectedSlotId(slot.id)}
              >
                <Text style={styles.slotText}>
                  {getDayOfWeekName(slot.day_of_week)}: {formatTime(slot.slot_start_time)} - {formatTime(slot.slot_end_time)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Button 
          title={isBookingPending ? 'Booking...' : 'Confirm Booking'}
          onPress={handleConfirmBooking}
          disabled={!selectedSlotId || isLoading || isBookingPending} 
          color={colors.primary} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  slotsScrollView: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  slotItem: {
    backgroundColor: themeColors.light.card,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.light.border,
  },
  selectedSlotItem: {
    backgroundColor: themeColors.light.primary,
    borderColor: themeColors.light.primary,
  },
  slotText: {
    fontSize: 16,
    color: themeColors.light.text,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  daySelectorContainer: {
    marginBottom: spacing.md,
  },
  daySelectorScrollView: {
    paddingVertical: spacing.sm,
  },
  dayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: themeColors.light.border,
    marginRight: spacing.sm,
    backgroundColor: themeColors.light.card,
  },
  selectedDayButton: {
    backgroundColor: themeColors.light.primary,
    borderColor: themeColors.light.primary,
  },
  dayButtonText: {
    color: themeColors.light.text,
    fontWeight: '500',
  },
  selectedDayButtonText: {
    color: themeColors.light.card, // Or themeColors.light.white if you have it
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: spacing.md,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});

export default BookingScreen;
