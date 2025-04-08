// TradeHistoryScreen.js
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const TradeHistoryScreen = (navigation) => {
    const [trades, setTrades] = useState([]);
    const [strategy, setStrategy] = useState('all');
    const [sortBy, setSortBy] = useState('stock');
    const [searchText, setSearchText] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);

    useEffect(() => {
        fetchTrades();
    }, []);

    // useFocusEffect(
    //     React.useCallback(() => {
    //         fetchTrades();
    //         return () => {
    //             // Do something when the screen is unfocused
    //             // Useful for cleanup functions
    //         };
    //     }, [])
    // );

    const fetchTrades = async () => {
        const existingTrades = await AsyncStorage.getItem('trades');
        const trades = existingTrades ? JSON.parse(existingTrades) : [];
        setTrades(trades);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const groupedTrades = trades.reduce((acc, trade) => {
        if (strategy !== 'all' && trade.strategy !== strategy) return acc;
        if (!trade.stockName.toLowerCase().includes(searchText.toLowerCase())) return acc;
        if (!acc[trade.stockName]) acc[trade.stockName] = [];
        acc[trade.stockName].push(trade);
        return acc;
    }, {});

    const sortedStocks = Object.keys(groupedTrades).sort((a, b) => {
        if (sortBy === 'stock') return a.localeCompare(b);
        const aDate = new Date(groupedTrades[a][0]?.date || 0);
        const bDate = new Date(groupedTrades[b][0]?.date || 0);
        return bDate - aDate;
    });

    const calculateStats = (trades) => {
        let totalQty = 0;
        let totalInvested = 0;
        let avgPrice = 0;
        let pnl = 0;
        trades.forEach((t) => {
            const qty = parseFloat(t.quantity);
            const price = parseFloat(t.price);
            if (t.type === 'Buy') {
                totalQty += qty;
                totalInvested += qty * price;
            } else if (t.type === 'Sell') {
                pnl += qty * price;
                totalQty -= qty;
                totalInvested -= qty * price;
            }
        });
        avgPrice = totalQty > 0 ? (totalInvested / totalQty).toFixed(2) : 0;
        return { totalQty, avgPrice, totalInvested, pnl };
    };

    const renderGroupItem = (stock) => {
        const tradesForStock = groupedTrades[stock];
        const stats = calculateStats(tradesForStock);
        return (
            <TouchableOpacity
                key={stock}
                style={styles.tradeItem}
                onPress={() => setSelectedStock(stock)}
            >
                <Text style={styles.stock}>{stock}</Text>
                <Text style={styles.detail}>Qty: {stats.totalQty}</Text>
                <Text style={styles.detail}>Avg Buy Price: ₹{stats.avgPrice}</Text>
                <Text style={styles.detail}>Total Invested: ₹{stats.totalInvested.toFixed(2)}</Text>
                <Text style={[styles.detail, { color: stats.pnl >= 0 ? '#4CAF50' : '#F44336' }]}>P/L: ₹{stats.pnl.toFixed(2)}</Text>
            </TouchableOpacity>
        );
    };

    const renderStockTrades = () => {
        const filtered = trades.filter((t) => t.stockName === selectedStock);
        return (
            <View style={styles.detailView}>
                <TouchableOpacity onPress={() => setSelectedStock(null)}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{selectedStock} - Trades</Text>
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.subTrade}>
                            <Text style={styles.detail}>Type: <Text style={item.type === 'Buy' ? styles.buy : styles.sell}>{item.type}</Text></Text>
                            <Text style={styles.detail}>Qty: {item.quantity} | Price: ₹{item.price}</Text>
                            <Text style={styles.detail}>Date: {formatDate(item.date)}</Text>
                            <Text style={styles.detail}>Strategy: {item.strategy}</Text>
                        </View>
                    )}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddTrade')}
            >
                <Text style={styles.addButtonText}>+ Add Trade</Text>
            </TouchableOpacity>
            {!selectedStock ? (
                <>
                    <Text style={styles.title}>Trade Summary</Text>
                    <TextInput
                        placeholder="Search Stock"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                        placeholderTextColor="#888"
                    />

                    <View style={styles.filterRow}>
                        {['all', 'intraday', 'swing'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.filterButton, strategy === type && styles.activeFilter]}
                                onPress={() => setStrategy(type)}
                            >
                                <Text
                                    style={strategy === type ? styles.activeFilterText : styles.filterText}
                                >
                                    {type.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.sortButton}
                            onPress={() => setSortBy((prev) => (prev === 'date' ? 'stock' : 'date'))}
                        >
                            <Text style={styles.sortText}>Sort: {sortBy}</Text>
                        </TouchableOpacity>
                    </View>

                    {sortedStocks.length === 0 ? (
                        <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No trades found.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={sortedStocks}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => renderGroupItem(item)}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </>
            ) : (
                renderStockTrades()
            )}
        </SafeAreaView>
    );
};

export default TradeHistoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F3F6',
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#3A4D8F',
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        fontSize: 16,
        color: '#1A1A1A',
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    activeFilter: {
        backgroundColor: '#F9A825',
    },
    filterText: {
        color: '#3A4D8F',
    },
    activeFilterText: {
        color: 'white',
        fontWeight: 'bold',
    },
    sortButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sortText: {
        color: '#1A1A1A',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 16,
    },
    tradeItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#00000022',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    stock: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    detail: {
        fontSize: 14,
        color: '#1A1A1A',
        marginTop: 2,
    },
    noResultsContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    noResultsText: {
        fontSize: 16,
        color: '#888',
    },
    detailView: {
        flex: 1,
        paddingBottom: 16,
    },
    backBtn: {
        fontSize: 16,
        color: '#3A4D8F',
        marginBottom: 12,
    },
    subTrade: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    buy: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    sell: {
        color: '#F44336',
        fontWeight: 'bold',
    },
});
