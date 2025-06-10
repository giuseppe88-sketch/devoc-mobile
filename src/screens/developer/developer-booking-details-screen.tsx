import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
// import Toast from 'react-native-toast-message'; // Not used yet
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors, spacing } from "../../theme";
import { DeveloperBookingsStackParamList } from "../../types"; // Import the correct ParamList
import { useFetchDeveloperBookingDetails } from "../../hooks/useFetchDeveloperBookingDetails";
import { useCancelBooking } from "../../hooks/useCancelBooking";

const colors = themeColors.dark; // Or themeColors.dark based on developer theme

type DeveloperBookingDetailsScreenRouteProp = RouteProp<
  DeveloperBookingsStackParamList,
  "DeveloperBookingDetails"
>;

const DeveloperBookingDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DeveloperBookingDetailsScreenRouteProp>();
  const { bookingId } = route.params; // bookingId is guaranteed by DeveloperBookingsStackParamList

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useFetchDeveloperBookingDetails(bookingId);
  const {
    mutate: cancelBookingMutate,
    isPending: isCancelling,
    isSuccess: isCancellationSuccess,
  } = useCancelBooking();

  useEffect(() => {
    if (isCancellationSuccess) {
      // Navigate back after a short delay to allow toast to be seen
      const timer = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCancellationSuccess, navigation]);

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.centered}
      />
    );
  }

  if (isError || !booking) {
    return (
      <Text style={styles.errorText}>
        {error?.message || "Booking not found or error loading details."}
      </Text>
    );
  }

  const clientName = booking.client_profile?.client_name || "N/A";
  const clientAvatar = booking.client_profile?.user?.avatar_url;
  const bookingDate = new Date(booking.start_time).toLocaleDateString();
  const bookingStartTime = new Date(booking.start_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const bookingEndTime = new Date(booking.end_time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const bookingStatus =
    booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

  const handleCancelBooking = () => {
    if (!booking) return;

    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        {
          text: "Do Not Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Cancel Booking",
          style: "destructive",
          onPress: () => {
            cancelBookingMutate({
              bookingId: booking.id,
              clientId: booking.client_id, // Ensure these are available in your booking object
              developerId: booking.developer_id, // Ensure these are available in your booking object
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        <View style={styles.headerSection}>
          {clientAvatar ? (
            <Image source={{ uri: clientAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name="person-circle-outline"
                size={40}
                color={colors.textSecondary}
              />
            </View>
          )}
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{bookingDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Time:</Text>
          <Text
            style={styles.detailValue}
          >{`${bookingStartTime} - ${bookingEndTime}`}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={
              booking.status === "confirmed" ? colors.success : colors.warning
            }
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Status:</Text>
          <Text
            style={[
              styles.detailValue,
              {
                color:
                  booking.status === "confirmed"
                    ? colors.success
                    : colors.warning,
              },
            ]}
          >
            {bookingStatus}
          </Text>
        </View>
        {booking.notes && (
          <View style={styles.detailRow}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.icon}
            />
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>{booking.notes}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Booking ID:</Text>
          <Text style={[styles.detailValue, styles.bookingIdText]}>
            {booking.id}
          </Text>
        </View>

        {/* Developer-specific actions can be added here later */}

        {(booking.status === "confirmed" || booking.status === "pending") && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.cancelButton,
              isCancelling && styles.disabledButton,
            ]}
            onPress={handleCancelBooking}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.actionButtonText}>Cancel Booking</Text>
            )}
            
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.subtle,
    justifyContent: "center",
    alignItems: "center",
  },
  clientName: {
    // Changed from developerName
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start", // Use flex-start for notes to align icon properly
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
    marginTop: 2, // Slight adjustment for icon alignment with text
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
    minWidth: 70,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  bookingIdText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    padding: spacing.lg,
    fontSize: 16,
  },
  actionButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  // Add any other styles needed, e.g., for action buttons
});

export default DeveloperBookingDetailsScreen;
