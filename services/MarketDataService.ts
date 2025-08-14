// services/MarketDataService.ts
interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: string
  marketCap?: string
  type: 'stock' | 'crypto' | 'forex'
}

interface NewsItem {
  id: string
  title: string
  summary: string
  url: string
  source: string
  timestamp: string
  sentiment: 'positive' | 'negative' | 'neutral'
  symbols: string[]
}

interface ChartData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

class MarketDataService {
  private readonly ALPHA_VANTAGE_KEY = 'YOUR_ALPHA_VANTAGE_KEY' // Get free key from alphavantage.co
  private readonly FINNHUB_KEY = 'YOUR_FINNHUB_KEY' // Get free key from finnhub.io
  private readonly baseURL = 'https://www.alphavantage.co/query'
  private readonly finnhubURL = 'https://finnhub.io/api/v1'

  // Cache for reducing API calls
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  private isDataFresh(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && this.isDataFresh(cached.timestamp)) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Get real-time stock quote
  async getStockQuote(symbol: string): Promise<MarketQuote | null> {
    const cacheKey = `quote_${symbol}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseURL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()
      
      if (data['Global Quote']) {
        const quote = data['Global Quote']
        const result: MarketQuote = {
          symbol: quote['01. symbol'],
          name: quote['01. symbol'], // We'll enhance this with company name later
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: quote['06. volume'],
          type: 'stock'
        }
        
        this.setCachedData(cacheKey, result)
        return result
      }
      return null
    } catch (error) {
      console.error('Error fetching stock quote:', error)
      return null
    }
  }

  // Get top gainers and losers
  async getTopMovers(): Promise<{ gainers: MarketQuote[]; losers: MarketQuote[] }> {
    const cacheKey = 'top_movers'
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseURL}?function=TOP_GAINERS_LOSERS&apikey=${this.ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()

      const gainers: MarketQuote[] = data.top_gainers?.slice(0, 5).map((stock: any) => ({
        symbol: stock.ticker,
        name: stock.ticker,
        price: parseFloat(stock.price),
        change: parseFloat(stock.change_amount),
        changePercent: parseFloat(stock.change_percentage.replace('%', '')),
        volume: stock.volume,
        type: 'stock' as const
      })) || []

      const losers: MarketQuote[] = data.top_losers?.slice(0, 5).map((stock: any) => ({
        symbol: stock.ticker,
        name: stock.ticker,
        price: parseFloat(stock.price),
        change: parseFloat(stock.change_amount),
        changePercent: parseFloat(stock.change_percentage.replace('%', '')),
        volume: stock.volume,
        type: 'stock' as const
      })) || []

      const result = { gainers, losers }
      this.setCachedData(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error fetching top movers:', error)
      // Return fallback data
      return this.getFallbackMovers()
    }
  }

  // Get cryptocurrency data
  async getCryptoQuote(symbol: string): Promise<MarketQuote | null> {
    const cacheKey = `crypto_${symbol}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseURL}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${this.ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()

      if (data['Meta Data']) {
        const timeSeries = data['Time Series (Digital Currency Daily)']
        const latestDate = Object.keys(timeSeries)[0]
        const latestData = timeSeries[latestDate]

        const result: MarketQuote = {
          symbol: symbol,
          name: data['Meta Data']['3. Digital Currency Name'],
          price: parseFloat(latestData['4a. close (USD)']),
          change: 0, // Calculate from previous day
          changePercent: 0,
          type: 'crypto'
        }

        this.setCachedData(cacheKey, result)
        return result
      }
      return null
    } catch (error) {
      console.error('Error fetching crypto quote:', error)
      return null
    }
  }

  // Get forex data
  async getForexQuote(fromCurrency: string, toCurrency: string): Promise<MarketQuote | null> {
    const cacheKey = `forex_${fromCurrency}_${toCurrency}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseURL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${this.ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()

      if (data['Realtime Currency Exchange Rate']) {
        const rate = data['Realtime Currency Exchange Rate']
        const result: MarketQuote = {
          symbol: `${fromCurrency}/${toCurrency}`,
          name: `${fromCurrency} to ${toCurrency}`,
          price: parseFloat(rate['5. Exchange Rate']),
          change: 0, // Calculate from bid/ask
          changePercent: 0,
          type: 'forex'
        }

        this.setCachedData(cacheKey, result)
        return result
      }
      return null
    } catch (error) {
      console.error('Error fetching forex quote:', error)
      return null
    }
  }

  // Get historical chart data
  async getChartData(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' = 'daily'): Promise<ChartData[]> {
    const cacheKey = `chart_${symbol}_${interval}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const functionName = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY'
      const url = interval === 'daily' 
        ? `${this.baseURL}?function=${functionName}&symbol=${symbol}&apikey=${this.ALPHA_VANTAGE_KEY}`
        : `${this.baseURL}?function=${functionName}&symbol=${symbol}&interval=${interval}&apikey=${this.ALPHA_VANTAGE_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      const timeSeriesKey = interval === 'daily' 
        ? 'Time Series (Daily)' 
        : `Time Series (${interval})`

      if (data[timeSeriesKey]) {
        const timeSeries = data[timeSeriesKey]
        const chartData: ChartData[] = Object.entries(timeSeries)
          .slice(0, 100) // Limit to last 100 data points
          .map(([timestamp, values]: [string, any]) => ({
            timestamp: new Date(timestamp).getTime(),
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
          }))
          .reverse() // Oldest first

        this.setCachedData(cacheKey, chartData)
        return chartData
      }
      return []
    } catch (error) {
      console.error('Error fetching chart data:', error)
      return []
    }
  }

  // Get market news
  async getMarketNews(symbols: string[] = []): Promise<NewsItem[]> {
    const cacheKey = `news_${symbols.join('_')}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      // Using Alpha Vantage News & Sentiment API
      const symbolParam = symbols.length > 0 ? `&tickers=${symbols.join(',')}` : ''
      const response = await fetch(
        `${this.baseURL}?function=NEWS_SENTIMENT${symbolParam}&apikey=${this.ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()

      if (data.feed) {
        const news: NewsItem[] = data.feed.slice(0, 20).map((article: any) => ({
          id: article.url,
          title: article.title,
          summary: article.summary,
          url: article.url,
          source: article.source,
          timestamp: article.time_published,
          sentiment: this.mapSentiment(article.overall_sentiment_score),
          symbols: article.ticker_sentiment?.map((t: any) => t.ticker) || []
        }))

        this.setCachedData(cacheKey, news)
        return news
      }
      return []
    } catch (error) {
      console.error('Error fetching news:', error)
      return this.getFallbackNews()
    }
  }

  // Search for symbols
  async searchSymbols(query: string): Promise<MarketQuote[]> {
    if (query.length < 2) return []

    const cacheKey = `search_${query}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseURL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.ALPHA_VANTAGE_KEY}`
      )
      const data = await response.json()

      if (data.bestMatches) {
        const results: MarketQuote[] = data.bestMatches.slice(0, 10).map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          price: 0, // Will be fetched separately
          change: 0,
          changePercent: 0,
          type: this.determineSymbolType(match['1. symbol'])
        }))

        this.setCachedData(cacheKey, results)
        return results
      }
      return []
    } catch (error) {
      console.error('Error searching symbols:', error)
      return []
    }
  }

  // Helper methods
  private mapSentiment(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive'
    if (score < -0.1) return 'negative'
    return 'neutral'
  }

  private determineSymbolType(symbol: string): 'stock' | 'crypto' | 'forex' {
    if (symbol.includes('/')) return 'forex'
    if (['BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'DOT'].includes(symbol)) return 'crypto'
    return 'stock'
  }

  private getFallbackMovers() {
    return {
      gainers: [
        { symbol: 'NVDA', name: 'NVIDIA Corp', price: 892.41, change: 18.73, changePercent: 2.14, volume: '32.8M', type: 'stock' as const },
        { symbol: 'AMD', name: 'Advanced Micro Devices', price: 164.22, change: 6.45, changePercent: 4.08, volume: '45.2M', type: 'stock' as const },
        { symbol: 'TSLA', name: 'Tesla Inc', price: 248.50, change: 5.89, changePercent: 2.43, volume: '89.5M', type: 'stock' as const }
      ],
      losers: [
        { symbol: 'INTC', name: 'Intel Corp', price: 23.14, change: -7.23, changePercent: -23.82, volume: '62.8M', type: 'stock' as const },
        { symbol: 'NFLX', name: 'Netflix Inc', price: 421.89, change: -4.56, changePercent: -1.07, volume: '15.3M', type: 'stock' as const }
      ]
    }
  }

  private getFallbackNews(): NewsItem[] {
    return [
      {
        id: '1',
        title: 'Apple Reports Strong Q4 Earnings',
        summary: 'Revenue beats expectations with iPhone sales surge',
        url: '#',
        source: 'Reuters',
        timestamp: new Date().toISOString(),
        sentiment: 'positive',
        symbols: ['AAPL']
      }
    ]
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService()
export type { MarketQuote, NewsItem, ChartData }