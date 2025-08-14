import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  StatusBar
} from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

interface PremiumScreenProps {
  onClose?: () => void
}

export default function PremiumScreen({ onClose }: PremiumScreenProps) {
  const { theme, isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')

  const plans = {
    monthly: {
      price: 19.99,
      billing: 'monthly',
      savings: 0,
      description: 'Billed monthly'
    },
    yearly: {
      price: 199.99,
      billing: 'yearly',
      savings: 40,
      monthlyPrice: 16.66,
      description: 'Billed annually - Save 17%'
    }
  }

  const premiumFeatures = [
    { icon: '📊', title: 'Real-time Level 2 market data', description: 'See order book depth and live trading activity' },
    { icon: '📈', title: 'Advanced technical indicators', description: '50+ professional indicators and overlays' },
    { icon: '🤖', title: 'AI-powered trade insights', description: 'Machine learning analysis and predictions' },
    { icon: '🔔', title: 'Unlimited price alerts', description: 'Set unlimited alerts across all markets' },
    { icon: '📱', title: 'Priority customer support', description: '24/7 chat support with response in minutes' },
    { icon: '📊', title: 'Enhanced portfolio analytics', description: 'Advanced performance metrics and analysis' },
    { icon: '⚡', title: 'Advanced order types', description: 'Stop-loss, trailing stops, and conditional orders' },
    { icon: '🎯', title: 'Pattern recognition alerts', description: 'AI detects chart patterns automatically' }
  ]

  const subscribeToPremium = async () => {
    setLoading(true)
    
    try {
      Alert.alert(
        'Demo Payment Mode',
        `This is a demo of the ${selectedPlan} plan ($${plans[selectedPlan].price}). In production, this would process a real Stripe payment.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Demo',
            onPress: async () => {
              await simulatePaymentSuccess()
            }
          }
        ]
      )
    } catch (error) {
      Alert.alert('Payment Failed', error.message)
    }
    
    setLoading(false)
  }

  const simulatePaymentSuccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        Alert.alert(
          'Payment Successful! 🎉',
          `Welcome to TradeMaster Pro Premium!\n\nPlan: ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}\nAmount: $${plans[selectedPlan].price}\n\nYou now have access to all premium features including real-time data, AI insights, and unlimited alerts.`,
          [
            {
              text: 'Start Trading',
              onPress: () => {
                onClose?.()
                console.log('User upgraded to premium!')
              }
            }
          ]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to activate premium features')
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 30,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primary,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      top: 60,
      left: 20,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    headerContent: {
      alignItems: 'center',
      marginTop: 40,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#E5E7EB',
      textAlign: 'center',
      lineHeight: 22,
    },
    crown: {
      fontSize: 40,
      marginBottom: 16,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    planSelector: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    planOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    planOption: {
      flex: 1,
      padding: 20,
      borderRadius: 16,
      borderWidth: 2,
      position: 'relative',
      alignItems: 'center',
    },
    planSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
      transform: [{ scale: 1.02 }],
    },
    planUnselected: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    savingsBadge: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: theme.colors.success,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    savingsText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    planPrice: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    planDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    originalPrice: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textDecorationLine: 'line-through',
      marginBottom: 4,
    },
    monthlyEquivalent: {
      fontSize: 12,
      color: theme.colors.success,
      fontWeight: '600',
      marginTop: 4,
    },
    featuresSection: {
      marginBottom: 30,
    },
    featuresList: {
      gap: 16,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    featureIcon: {
      fontSize: 24,
      marginRight: 12,
      marginTop: 2,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    subscribeButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    subscribeButtonDisabled: {
      opacity: 0.6,
    },
    subscribeButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Text style={styles.backButtonText}>×</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.headerTitle}>TradeMaster Pro Premium</Text>
          <Text style={styles.headerSubtitle}>
            Join 25,000+ premium traders and unlock professional-grade tools
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          <View style={styles.planSelector}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <View style={styles.planOptions}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'monthly' ? styles.planSelected : styles.planUnselected
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={styles.planPrice}>$19.99</Text>
                <Text style={styles.planDescription}>per month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' ? styles.planSelected : styles.planUnselected
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>SAVE 17%</Text>
                </View>
                <Text style={styles.originalPrice}>$239.88</Text>
                <Text style={styles.planPrice}>$199.99</Text>
                <Text style={styles.planDescription}>per year</Text>
                <Text style={styles.monthlyEquivalent}>Only $16.66/month</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Premium Features</Text>
            <View style={styles.featuresList}>
              {premiumFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
            onPress={subscribeToPremium}
            disabled={loading}
          >
            <Text style={styles.subscribeButtonText}>
              {loading ? 'Processing...' : 'Start Free Trial'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}