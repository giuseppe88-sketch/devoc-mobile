import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Calendar, DateData } from 'react-native-calendars'; 
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { Availability } from '../../types';
import { useDeveloperFirstCallAvailability, SaveFirstCallAvailabilityParams } from '../../hooks/useDeveloperFirstCallAvailability';
import { useDeveloperGeneralAvailability, SaveGeneralAvailabilityParams } from '../../hooks/useDeveloperGeneralAvailability'; 
import { colors as themeColors, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { DeveloperMainTabParamList } from '../../types';

type DeveloperAvailabilityScreenProps = BottomTabScreenProps<DeveloperMainTabParamList, 'Availability'>;

const localColors = themeColors.dark;

function DeveloperAvailabilityScreen({ navigation }: DeveloperAvailabilityScreenProps) {
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
    saveAvailability: saveGeneralWork,
    developerId: generalWorkDeveloperId, 
  } = useDeveloperGeneralAvailability();

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  const [rangeStartDate, setRangeStartDate] = useState<string | null>(null); 
  const [rangeEndDate, setRangeEndDate] = useState<string | null>(null);   

  const isLoading = isLoadingFirstCall || isLoadingGeneralWork;
  const isSaving = isSavingFirstCall || isSavingGeneralWork;

  const developerId = firstCallDeveloperId || generalWorkDeveloperId;

  useEffect(() => {
    const newSelectedTimeSlots: string[] = [];
    
    if (firstCallSlots) {
      firstCallSlots
        .filter(slot => slot.day_of_week === selectedDay)
        .forEach(slot => {
          const startHour = parseInt(slot.slot_start_time.split(':')[0]);
          const endHour = parseInt(slot.slot_end_time.split(':')[0]);
          
          for (let hour = startHour; hour < endHour; hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            newSelectedTimeSlots.push(timeSlot);
          }
        });
    }
    setSelectedTimeSlots(newSelectedTimeSlots);
  }, [selectedDay, firstCallSlots]);

  const handleSaveAvailability = async () => {
    if (!developerId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Developer profile not found. Cannot save availability.',
      });
      return;
    }

    const timeRangesToSave = selectedTimeSlots.map(slot => ({
      slot_start_time: slot,
      slot_end_time: `${String(parseInt(slot.split(':')[0], 10) + 1).padStart(2, '0')}:00`,
    }));

    const params: SaveFirstCallAvailabilityParams = {
      day_of_week: selectedDay,
      timeRanges: timeRangesToSave,
    };

    try {
      await saveFirstCall(params);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Weekly availability saved successfully!',
      });
    } catch (error) {
      console.error('Failed to save weekly availability:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: `Could not save weekly availability: ${errorMessage}`,
      });
    }
  };

  const handleDayPress = (day: DateData) => {
    if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
      setRangeStartDate(day.dateString);
      setRangeEndDate(null);
    } else if (day.dateString >= rangeStartDate) {
      setRangeEndDate(day.dateString);
    } else {
      setRangeStartDate(day.dateString);
      setRangeEndDate(null);
    }
  };

  const handleSaveGeneralAvailability = async () => {
    if (!developerId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Developer profile not found.' });
      return;
    }
    if (!rangeStartDate || !rangeEndDate) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a start and end date for the range.' });
      return;
    }

    const params: SaveGeneralAvailabilityParams = {
      range_start_date: rangeStartDate,
      range_end_date: rangeEndDate,
    };

    try {
      await saveGeneralWork(params);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'General availability range saved successfully!',
      });
      setRangeStartDate(null); 
      setRangeEndDate(null);
    } catch (error) {
      console.error('Failed to save general availability:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: `Could not save general availability: ${errorMessage}`,
      });
    }
  };

  const getMarkedDatesForCalendar = () => {
    const marked: { [key: string]: any } = {};
    
    if (rangeStartDate) {
      marked[rangeStartDate] = { startingDay: true, color: localColors.primary, textColor: 'white' };
      if (rangeEndDate) {
        marked[rangeEndDate] = { endingDay: true, color: localColors.primary, textColor: 'white' };
        let current = new Date(rangeStartDate);
        const end = new Date(rangeEndDate);
        current.setDate(current.getDate() + 1); 
        while (current < end) {
          const isoDate = current.toISOString().split('T')[0];
          marked[isoDate] = { color: localColors.primary, textColor: 'white', disabled: true, disableTouchEvent: true };
          current.setDate(current.getDate() + 1);
        }
      } else {
        marked[rangeStartDate] = { selected: true, startingDay: true, color: localColors.primary, textColor: 'white', endingDay: true };
      }
    }

    generalWorkSlots.forEach(slot => {
      if (slot.range_start_date && slot.range_end_date) {
        let current = new Date(slot.range_start_date);
        const end = new Date(slot.range_end_date);
        
        marked[slot.range_start_date] = {
          ...(marked[slot.range_start_date] || {}),
          startingDay: true, 
          color: marked[slot.range_start_date]?.color || localColors.accent, 
          textColor: 'white',
        };

        marked[slot.range_end_date] = {
          ...(marked[slot.range_end_date] || {}),
          endingDay: true, 
          color: marked[slot.range_end_date]?.color || localColors.accent, 
          textColor: 'white',
        };

        current.setDate(current.getDate() + 1);
        while (current < end) {
          const isoDate = current.toISOString().split('T')[0];
          if (!marked[isoDate] || !marked[isoDate].selected) { 
             marked[isoDate] = { color: localColors.accent, textColor: 'white', disabled: true, disableTouchEvent: true };
          }
          current.setDate(current.getDate() + 1);
        }
        if (slot.range_start_date === slot.range_end_date && (!marked[slot.range_start_date] || !marked[slot.range_start_date].selected)) {
          marked[slot.range_start_date] = { startingDay: true, endingDay: true, color: localColors.accent, textColor: 'white' };
        }
      }
    });
    return marked;
  };

  // Guard for developer profile loading
  if (isLoadingFirstCall || isLoadingGeneralWork) {
    return (
      <View style={[styles.centeredStatusContainer, { backgroundColor: localColors.background }]}>
        <ActivityIndicator size="large" color={localColors.primary} />
        <Text style={[styles.statusText, { color: localColors.text }]}>Loading developer profile...</Text>
      </View>
    );
  }

  // Guard for missing developer profile
  if (!developerId) {
    return (
      <View style={[styles.centeredStatusContainer, { backgroundColor: localColors.background }]}>
        <Icon name="account-alert-outline" size={48} color={localColors.error} style={{ marginBottom: 16 }} />
        <Text style={[styles.statusText, { color: localColors.text, textAlign: 'center', marginBottom: 20 }]}>
          Please complete your developer profile before setting your availability.
        </Text>
        <Button
          title="Go to Edit Profile"
          onPress={() => {
            navigation.navigate('Profile', { screen: 'DeveloperProfile' });
            Toast.show({
              type: 'info',
              text1: 'Navigating to Profile Edit',
              text2: 'Please ensure your profile is complete.',
            });
          }}
          color={localColors.primary}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={localColors.primary} style={styles.loadingIndicator} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Availability</Text>
          <Text style={styles.subtitle}>Let clients know when you're available for a first call</Text>
        </View>

        <View style={styles.daySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
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
          <Text style={styles.sectionTitle}>Set Your Weekly First Call Availability</Text>
          
          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((timeSlot) => (
            <TouchableOpacity
              key={timeSlot}
              style={[
                styles.timeSlot,
                selectedTimeSlots.includes(timeSlot) && styles.selectedTimeSlot,
                (isLoading || isSaving) && styles.disabledButton
              ]}
              onPress={() => !(isLoading || isSaving) && setSelectedTimeSlots(prev => [...prev, timeSlot])}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlots.includes(timeSlot) && styles.selectedTimeSlotText,
                ]}
              >
                {timeSlot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleSaveAvailability} style={[styles.saveButton, isSaving && styles.disabledButton]} disabled={isSaving || selectedTimeSlots.length === 0}>
          {isSavingFirstCall ? <ActivityIndicator color={localColors.text} /> : <Text style={styles.saveButtonText}>Save Weekly Slots</Text>}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Set Your General Work Availability (Date Ranges)</Text>
        <Calendar
          style={styles.calendar}
          current={new Date().toISOString().split('T')[0]} 
          onDayPress={handleDayPress}
          markingType={'period'}
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
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
        />
        
        {rangeStartDate && (
          <Text style={styles.infoText}>
            Selected Range: {rangeStartDate} {rangeEndDate ? `to ${rangeEndDate}` : ''}
          </Text>
        )}

        <TouchableOpacity 
          onPress={handleSaveGeneralAvailability} 
          style={[styles.saveButton, (!rangeStartDate || !rangeEndDate || isSavingGeneralWork) && styles.disabledButton]} 
          disabled={!rangeStartDate || !rangeEndDate || isSavingGeneralWork}
        >
          {isSavingGeneralWork ? <ActivityIndicator color={localColors.text} /> : <Text style={styles.saveButtonText}>Save Date Range</Text>}
        </TouchableOpacity>

        <Text style={styles.subSectionTitle}>Your Saved General Availability Ranges:</Text>
        {isLoadingGeneralWork && <ActivityIndicator color={localColors.primary} />}
        {generalWorkSlots.length === 0 && !isLoadingGeneralWork && (
          <Text style={styles.infoText}>No general availability ranges saved yet.</Text>
        )}
        <FlatList 
          data={generalWorkSlots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.generalAvailabilityItem}>
              <Text style={styles.generalAvailabilityText}>
                From: {item.range_start_date} To: {item.range_end_date}
              </Text>
              {/* TODO: Add a delete button here */}
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
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default DeveloperAvailabilityScreen;
