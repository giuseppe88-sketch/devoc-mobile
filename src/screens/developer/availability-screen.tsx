import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { Availability } from '../../types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

function DeveloperAvailabilityScreen() {
  const { user } = useAuthStore();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // fetchAvailability();
    }
  }, [user]);

  useEffect(() => {
    // Reset selected time slots when day changes
    const newSelectedTimeSlots: {[key: string]: boolean} = {};
    
    // Pre-select time slots based on existing availability
    availability
      .filter(slot => slot.dayOfWeek === selectedDay)
      .forEach(slot => {
        const startHour = parseInt(slot.startTime.split(':')[0]);
        const endHour = parseInt(slot.endTime.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          newSelectedTimeSlots[timeSlot] = true;
        }
      });
    
    setSelectedTimeSlots(newSelectedTimeSlots);
  }, [selectedDay, availability]);

  // const fetchAvailability = async () => {
  //   try {
  //     // First get the developer profile
  //     const { data: developerData, error: developerError } = await supabase
  //       .from('developers')
  //       .select('id')
  //       .eq('userId', user?.id)
  //       .single();

  //     if (developerError) throw developerError;
  //     if (!developerData) return;

  //     const { data, error } = await supabase
  //       .from('availability')
  //       .select('*')
  //       .eq('developerId', developerData.id);

  //     if (error) throw error;

  //     if (data) {
  //       setAvailability(data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching availability:', error);
  //   }
  // };

  // const saveAvailability = async () => {
  //   if (!user) return;

  //   setLoading(true);
  //   try {
  //     // First get the developer profile
  //     const { data: developerData, error: developerError } = await supabase
  //       .from('developers')
  //       .select('id')
  //       .eq('userId', user?.id)
  //       .single();

  //     if (developerError) throw developerError;
  //     if (!developerData) {
  //       setLoading(false);
  //       return;
  //     }

  //     // Delete existing availability for the selected day
  //     const { error: deleteError } = await supabase
  //       .from('availability')
  //       .delete()
  //       .eq('developerId', developerData.id)
  //       .eq('dayOfWeek', selectedDay);

  //     if (deleteError) throw deleteError;

  //     // Group consecutive time slots
  //     const timeRanges = [];
  //     let startTime = null;
  //     let endTime = null;

  //     for (let i = 0; i < TIME_SLOTS.length; i++) {
  //       const currentSlot = TIME_SLOTS[i];
  //       const nextSlot = TIME_SLOTS[i + 1];
        
  //       if (selectedTimeSlots[currentSlot]) {
  //         if (startTime === null) {
  //           startTime = currentSlot;
  //         }
  //         endTime = nextSlot || '20:00'; // If it's the last slot, set end time to next hour
  //       } else if (startTime !== null) {
  //         timeRanges.push({ startTime, endTime });
  //         startTime = null;
  //         endTime = null;
  //       }
  //     }

  //     // If there's an open range at the end
  //     if (startTime !== null) {
  //       timeRanges.push({ startTime, endTime: '20:00' });
  //     }

  //     // Insert new availability records
  //     for (const range of timeRanges) {
  //       const { error: insertError } = await supabase
  //         .from('availability')
  //         .insert({
  //           developerId: developerData.id,
  //           dayOfWeek: selectedDay,
  //           startTime: range.startTime,
  //           endTime: range.endTime,
  //         });

  //       if (insertError) throw insertError;
  //     }

  //     // Refresh availability data
  //     fetchAvailability();
  //   } catch (error) {
  //     console.error('Error saving availability:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
          <Text style={styles.title}>Set Your Availability</Text>
          <Text style={styles.subtitle}>Let clients know when you're available</Text>
        </View>

        <View style={styles.daySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DAYS_OF_WEEK.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  selectedDay === index && styles.selectedDayButton,
                ]}
                onPress={() => setSelectedDay(index)}
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
          
          {TIME_SLOTS.map((timeSlot) => (
            <TouchableOpacity
              key={timeSlot}
              style={[
                styles.timeSlot,
                selectedTimeSlots[timeSlot] && styles.selectedTimeSlot,
              ]}
              onPress={() => toggleTimeSlot(timeSlot)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlots[timeSlot] && styles.selectedTimeSlotText,
                ]}
              >
                {timeSlot}
              </Text>
              {selectedTimeSlots[timeSlot] && (
                <Ionicons name="checkmark" size={18} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          // onPress={saveAvailability}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Availability'}
          </Text>
        </TouchableOpacity>

        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Monthly View</Text>
          <Text style={styles.calendarNote}>
            Your weekly schedule will repeat each week
          </Text>
          <Calendar
            markedDates={{
              '2025-04-15': { selected: true, marked: true, selectedColor: '#4A80F0' },
              '2025-04-22': { selected: true, marked: true, selectedColor: '#4A80F0' },
              '2025-04-29': { selected: true, marked: true, selectedColor: '#4A80F0' },
            }}
            theme={{
              selectedDayBackgroundColor: '#4A80F0',
              todayTextColor: '#4A80F0',
              arrowColor: '#4A80F0',
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  daySelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  selectedDayButton: {
    backgroundColor: '#4A80F0',
  },
  dayButtonText: {
    fontWeight: '600',
    color: '#666',
  },
  selectedDayButtonText: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  timeSlotContainer: {
    padding: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedTimeSlot: {
    backgroundColor: '#4A80F0',
    borderColor: '#4A80F0',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTimeSlotText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    padding: 15,
    margin: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContainer: {
    padding: 20,
    paddingTop: 0,
  },
  calendarNote: {
    color: '#666',
    marginBottom: 15,
    fontSize: 14,
  },
});

export default DeveloperAvailabilityScreen;
