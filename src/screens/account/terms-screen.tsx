import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { colors as themeColors, spacing } from "../../theme";

const colors = themeColors.light;

function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.lastUpdated}>Last updated: June 16, 2025</Text>

        <Text style={styles.disclaimer}>
          Disclaimer: These Terms and Conditions are a template and not legal
          advice. You should consult with a legal professional to ensure they
          are appropriate for your specific situation.
        </Text>

        <Text style={styles.heading}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to Devoc! These terms and conditions outline the rules and
          regulations for the use of Devoc's mobile application. By accessing
          this app, we assume you accept these terms and conditions. Do not
          continue to use Devoc if you do not agree to all of the terms and
          conditions stated on this page.
        </Text>

        <Text style={styles.heading}>2. Accounts</Text>
        <Text style={styles.paragraph}>
          When you create an account with us, you must provide information that
          is accurate, complete, and current at all times. Failure to do so
          constitutes a breach of the Terms, which may result in immediate
          termination of your account on our Service. You are responsible for
          safeguarding the password that you use to access the Service and for
          any activities or actions under your password.
        </Text>

        <Text style={styles.heading}>
          3. Service for Clients and Developers
        </Text>
        <Text style={styles.paragraph}>
          Devoc provides a platform for clients to find and book software
          developers for consultations. We act as a facilitator for this
          connection. We are not a party to any agreement or contract between
          clients and developers. We do not guarantee the quality, suitability,
          or legality of the services provided by developers.
        </Text>
        <Text style={styles.paragraph}>
          Developers are independent contractors and not employees of Devoc.
          Developers are responsible for their own conduct, the information they
          provide in their profiles, and the services they offer.
        </Text>

        <Text style={styles.heading}>4. Bookings and Payments</Text>
        <Text style={styles.paragraph}>
          Clients can book sessions with developers based on their availability.
          All payments for services are handled through our designated payment
          processor. Devoc may charge a service fee, which will be clearly
          disclosed to you before you confirm a booking.
        </Text>

        <Text style={styles.heading}>5. Cancellations and Refunds</Text>
        <Text style={styles.paragraph}>
          Cancellation policies will be clearly stated at the time of booking.
          Refunds, if any, will be processed according to the cancellation
          policy applicable to your booking. Devoc reserves the right to handle
          disputes on a case-by-case basis.
        </Text>

        <Text style={styles.heading}>6. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree not to use the service for any unlawful purpose or any
          purpose prohibited under this clause. You agree not to use the service
          in any way that could damage the app, services, or general business of
          Devoc.
        </Text>
        <Text style={styles.paragraph}>
          Harassment, discrimination, or any form of abusive behavior towards
          other users is strictly prohibited and will result in account
          termination.
        </Text>

        <Text style={styles.heading}>7. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The Service and its original content, features, and functionality are
          and will remain the exclusive property of Devoc and its licensors.
        </Text>

        <Text style={styles.heading}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          In no event shall Devoc, nor its directors, employees, partners,
          agents, suppliers, or affiliates, be liable for any indirect,
          incidental, special, consequential or punitive damages, including
          without limitation, loss of profits, data, use, goodwill, or other
          intangible losses, resulting from your access to or use of or
          inability to access or use the Service.
        </Text>

        <Text style={styles.heading}>9. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. We will provide at least 30 days' notice
          before any new terms take effect. What constitutes a material change
          will be determined at our sole discretion.
        </Text>

        <Text style={styles.heading}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at
          support@devoc.app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  disclaimer: {
    fontSize: 14,
    color: colors.warning,
    fontStyle: "italic",
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
});

export default TermsScreen;
