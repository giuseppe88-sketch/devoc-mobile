import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
// import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Not used yet
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors, spacing } from "../../theme";
import { ClientDashboardStackParamList } from "../../navigation/main-navigator";
import {
  useFetchBookingDetails,
  Booking,
} from "../../hooks/useFetchBookingDetails"; // Import hook and Booking type
import { useCancelBooking } from "../../hooks/useCancelBooking"; // Restore cancel hook
import { useDeleteBooking } from "../../hooks/useDeleteBooking"; // Keep delete hook

const colors = themeColors.light;

type BookingDetailsScreenRouteProp = RouteProp<
  ClientDashboardStackParamList,
  "BookingDetails"
>;

const BookingDetailsScreen: React.FC = () => {
  const navigation = useNavigation(); // For potential navigation
  const route = useRoute<BookingDetailsScreenRouteProp>();
  const { bookingId } = route.params;

  const {
    data: booking,
    isLoading,
    isError,
    error,
  } = useFetchBookingDetails(bookingId);
  const { mutate: cancelBookingMutate, isPending: isCancelling } =
    useCancelBooking();
  const { mutate: deleteBookingMutate, isPending: isDeleting } =
    useDeleteBooking();

  const handleCancelBooking = () => {
    if (!booking) return;
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: () => {
            cancelBookingMutate({
              bookingId,
              clientId: booking.client_id,
              developerId: booking.developer_id,
            });
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleDeleteBooking = () => {
    if (!booking) return;
    Alert.alert(
      "Delete Booking",
      "Are you sure you want to permanently delete this booking? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          onPress: () => {
            deleteBookingMutate({ bookingId, clientId: booking.client_id });
          },
          style: "destructive",
        },
      ]
    );
  };

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

  const developerName = booking.developer_profile?.user?.full_name || "N/A";
  const developerAvatar = booking.developer_profile?.user?.avatar_url;
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        <View style={styles.headerSection}>
          {developerAvatar ? (
            <Image source={{ uri: developerAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name="person-circle-outline"
                size={40}
                color={colors.textSecondary}
              />
            </View>
          )}
          <Text style={styles.developerName}>{developerName}</Text>
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
        <View style={styles.detailRow}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailLabel}>Booking ID:</Text>
          <Text style={[styles.detailValue, styles.bookingIdText]}>
            {bookingId}
          </Text>
        </View>

        {/* Conditional Action Buttons */}
        {booking.status === "confirmed" && (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              isCancelling && styles.cancelButtonDisabled,
            ]}
            onPress={handleCancelBooking}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator
                size="small"
                color={colors.card}
                style={{ marginRight: spacing.sm }}
              />
            ) : (
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={colors.card}
                style={{ marginRight: spacing.sm }}
              />
            )}
            <Text style={styles.cancelButtonText}>
              {isCancelling ? "Cancelling..." : "Cancel Booking"}
            </Text>
          </TouchableOpacity>
        )}

        {booking.status === "cancelled" && (
          <TouchableOpacity
            style={[
              styles.deleteButton, // Using a new style for delete
              isDeleting && styles.cancelButtonDisabled, // Re-use disabled style
            ]}
            onPress={handleDeleteBooking}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator
                size="small"
                color={colors.card}
                style={{ marginRight: spacing.sm }}
              />
            ) : (
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.card}
                style={{ marginRight: spacing.sm }}
              />
            )}
            <Text style={styles.cancelButtonText}>
              {isDeleting ? "Deleting..." : "Delete Booking"}
            </Text>
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
  developerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    // marginLeft: spacing.sm, // Icon provides spacing
    fontWeight: "600",
    minWidth: 70, // Align values
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.xs,
    flex: 1, // Allow text to take remaining space and wrap
  },
  bookingIdText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.lg,
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  deleteButton: {
    // Style for the delete button
    backgroundColor: "#CC3333", // A more vibrant red
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  cancelButtonText: {
    color: colors.card, // White text on error background
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonDisabled: {
    backgroundColor: "#D3D3D3", // Light grey for disabled state
    opacity: 0.7,
  },
});

export default BookingDetailsScreen;
