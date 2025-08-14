import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Modal
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'
import { ThemeToggle } from '../components/ThemeToggle'
import PremiumScreen from './PremiumScreen'

// Mock market data for rapid development
const getMarketData = () => {
  return {
    gainers: [
      { symbol: 'NVDA', price: 892.41, change: 8.73, volume: '45.2M' },
      { symbol: 'AMD', price: 164.22, change: 6.45, volume: '32.1M' },
      { symbol: 'TSLA', price: 248.50, change: 5.89, volume: '89.5M' },
    ],
    losers: [
      { symbol: 'INTC', price: 23.14, change: -7.23, volume: '62.8M' },
      { symbol: 'NFLX', price: 421.89, change: -4.56, volume: '15.3M' },
      { symbol: 'PYPL', price: 58.92, change: -3.78, volume: '18.7M' },
    ]
  }
}

export default function DashboardScreen() {
  const { theme, isDark } = useTheme()
  const [user, setUser] = useState(null)
  const [portfolio, setPortfolio] = useState({
    value: 100000,
    change: 2450,
    changePercent: 2.45
  })
  const [marketData, setMarketData] = useState({ gainers: [], losers: [] })
  const [refreshing, setRefreshing] = useState(false)
  const [showPremium, setShowPremium] = useState(false)

  useEffect(() => {
    loadUserData()
    loadMarketData()
    
    const interval = setInterval(loadMarketData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadMarketData = async () => {
    try {
      const data = getMarketData()
      const randomize = (stocks) => stocks.map(stock => ({
        ...stock,
        price: stock.price + (Math.random() - 0.5) * 2,
        change: stock.change + (Math.random() - 0.5) * 0.5
      }))
      
      setMarketData({
        gainers: randomize(data.gainers),
        losers: randomize(data.losers)
      })
    } catch (error) {
      console.error('Error loading market data:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMarketData()
    setPortfolio(prev => ({
      ...prev,
      change: prev.change + (Math.random() - 0.5) * 100
    }))
    setRefreshing(false)
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const StockItem = ({ stock, isGainer = true }) => (
    <View style={styles.stockItem}>
      <View style={styles.stockLeft}>
        <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>{stock.symbol}</Text>
        <Text style={[styles.stockVolume, { color: theme.colors.textSecondary }]}>Vol: {stock.volume}</Text>
      </View>
      <View style={styles.stockRight}>
        <Text style={[styles.stockPrice, { color: theme.colors.text }]}>${stock.price.toFixed(2)}</Text>
        <Text style={[
          styles.stockChange,
          { color: isGainer ? theme.colors.success : theme.colors.error }
        ]}>
          {isGainer ? '+' : ''}{stock.change.toFixed(2)}%
        </Text>
      </View>
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.header,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    greeting: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    liveIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.success,
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
    content: {
      flex: 1,
    },
    portfolioCard: {
      margin: 20,
      padding: 24,
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    portfolioLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    portfolioValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    portfolioChange: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    changeIcon: {
      fontSize: 16,
      marginRight: 4,
    },
    changeText: {
      fontSize: 16,
      color: theme.colors.success,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    section: {
      marginTop: 20,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    marketCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    marketCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: theme.colors.text,
    },
    stockItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    stockLeft: {},
    stockSymbol: {
      fontSize: 16,
      fontWeight: '600',
    },
    stockVolume: {
      fontSize: 12,
    },
    stockRight: {
      alignItems: 'flex-end',
    },
    stockPrice: {
      fontSize: 16,
      fontWeight: '500',
    },
    stockChange: {
      fontSize: 14,
      fontWeight: '600',
    },
    premiumCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    premiumContent: {
      flex: 1,
    },
    premiumTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    premiumSubtitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    premiumFeatures: {
      fontSize: 12,
      color: '#E5E7EB',
    },
    premiumButton: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    premiumButtonText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.card,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    actionEmoji: {
      fontSize: 24,
      marginBottom: 8,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    actionSubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    newsCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    newsItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    newsTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    newsTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.user_metadata?.first_name || 'Trader'}!
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.liveIndicator} />
            <Text style={styles.statusText}>Live Data</Text>
          </View>
        </View>
        
        <View style={styles.headerCenter}>
          <ThemeToggle />
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.profileButton} onPress={signOut}>
            <Text style={styles.profileText}>
              {user?.user_metadata?.first_name?.charAt(0) || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Portfolio Value</Text>
          <Text style={styles.portfolioValue}>
            ${portfolio.value.toLocaleString()}
          </Text>
          <View style={styles.portfolioChange}>
            <Text style={styles.changeIcon}>📈</Text>
            <Text style={styles.changeText}>
              +${portfolio.change.toLocaleString()} ({portfolio.changePercent}%)
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Global Rank</Text>
            <Text style={styles.statValue}>#4</Text>
            <Text style={styles.statSubtext}>Top 1%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>68%</Text>
            <Text style={styles.statSubtext}>128/188</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Movers</Text>
          
          <View style={styles.marketCard}>
            <Text style={styles.marketCardTitle}>🚀 Top Gainers</Text>
            {marketData.gainers.map((stock, index) => (
              <StockItem key={index} stock={stock} isGainer={true} />
            ))}
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketCardTitle}>📉 Top Losers</Text>
            {marketData.losers.map((stock, index) => (
              <StockItem key={index} stock={stock} isGainer={false} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.premiumCard}
            onPress={() => setShowPremium(true)}
          >
            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>👑 Upgrade to Premium</Text>
              <Text style={styles.premiumSubtitle}>$19.99/month</Text>
              <Text style={styles.premiumFeatures}>
                • Real-time data • Advanced charts • Unlimited alerts
              </Text>
            </View>
            <View style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionEmoji}>🏆</Text>
              <Text style={styles.actionText}>Join Tournament</Text>
              <Text style={styles.actionSubtext}>Win $25,000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionEmoji}>🎁</Text>
              <Text style={styles.actionText}>Refer Friends</Text>
              <Text style={styles.actionSubtext}>Earn $50 each</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          <View style={styles.newsCard}>
            <View style={styles.newsItem}>
              <Text style={styles.newsTitle}>📈 Apple Reports Strong Q4 Earnings</Text>
              <Text style={styles.newsTime}>2 hours ago</Text>
            </View>
            <View style={styles.newsItem}>
              <Text style={styles.newsTitle}>💰 Fed Signals Rate Cut</Text>
              <Text style={styles.newsTime}>4 hours ago</Text>
            </View>
            <View style={styles.newsItem}>
              <Text style={styles.newsTitle}>🚀 Bitcoin Hits New All-Time High</Text>
              <Text style={styles.newsTime}>6 hours ago</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      <Modal 
        visible={showPremium} 
        animationType="slide" 
        presentationStyle="fullScreen"
      >
        <PremiumScreen onClose={() => setShowPremium(false)} />
      </Modal>
    </SafeAreaView>
  )
}
