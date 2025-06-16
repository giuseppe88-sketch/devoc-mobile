import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth-store';
import { useClientProfile } from '../../hooks/useClientProfile';
import { useDeveloperProfile } from '../../hooks/useDeveloperProfile';
import { colors as themeColors, spacing } from '../../theme';

const colors = themeColors.light;

// Define types for MenuItem props
interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onPress, isDestructive = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={isDestructive ? colors.error : colors.primary} style={styles.menuIcon} />
    <Text style={[styles.menuText, isDestructive && { color: colors.error }]}>{text}</Text>
    <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
  </TouchableOpacity>
);

const AccountScreen = () => {
  const navigation = useNavigation<any>();
  const { user, userRole, signOut } = useAuthStore();
  const userId = user?.id;

  // Correctly call hooks with one argument
  const { data: clientProfile, isLoading: isLoadingClient } = useClientProfile(userId);
  const { data: developerProfile, isLoading: isLoadingDeveloper } = useDeveloperProfile(userId);

  const isLoading = isLoadingClient || isLoadingDeveloper;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleNavigateToProfile = () => {
    if (userRole === 'developer') {
      navigation.navigate('Profile', { screen: 'DeveloperProfile' });
    } else if (userRole === 'client') {
      navigation.navigate('Profile', { screen: 'ClientProfile' });
    }
  };
  
  const handleTerms = () => {
    Alert.alert('Terms & Conditions', 'This feature is coming soon!');
  };

  const profileName = userRole === 'developer' ? developerProfile?.name : clientProfile?.client_name;
  const profileEmail = user?.email;
  const avatarUrl = userRole === 'developer' ? developerProfile?.avatar_url : clientProfile?.logo_url;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person-circle-outline" size={60} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profileName || 'User'}</Text>
          <Text style={styles.userEmail}>{profileEmail}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <MenuItem
          icon="person-outline"
          text="Profile"
          onPress={handleNavigateToProfile}
        />
        <MenuItem
          icon="document-text-outline"
          text="Terms & Conditions"
          onPress={handleTerms}
        />
        <MenuItem
          icon="log-out-outline"
          text="Logout"
          onPress={handleLogout}
          isDestructive
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg, // Use correct theme key
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.md, // Use correct theme key
  },
  avatarPlaceholder: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  menuContainer: {
    marginTop: spacing.lg, // Use correct theme key
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.md, // Use correct theme key
    paddingHorizontal: spacing.lg, // Use correct theme key
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    marginRight: spacing.md, // Use correct theme key
  },
  menuText: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
  },
});

export default AccountScreen;
