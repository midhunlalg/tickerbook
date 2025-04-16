import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TradeScreen from './TradeScreen';
import { ToastAndroid, Platform } from 'react-native';

import { BannerAd, BannerAdSize, TestIds, useForeground } from 'react-native-google-mobile-ads';
import NativeAdComponent from './NativeAdComponent';
// const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyyyy';
const adUnitId = TestIds.ADAPTIVE_BANNER;

const TradeHistoryScreen = () => {
    const [trades, setTrades] = useState([]);
    const [sortBy, setSortBy] = useState('stock');
    const [strategy, setStrategy] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [selectedStock, setSelectedStock] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // const navigation = useNavigation();

    const fetchTrades = async () => {
        const existingTrades = await AsyncStorage.getItem('trades');
        const trades = existingTrades ? JSON.parse(existingTrades) : [];
        setTrades(trades);
    };

    // Simulate refresh logic
    useEffect(() => {
        fetchTrades();
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const groupedTrades = trades.reduce((acc, trade) => {
        const matchesSearch = trade.stockName.toLowerCase().includes(searchText.toLowerCase());
        const matchesStrategy = strategy.toLowerCase() === 'all' || trade.strategy.toLowerCase() === strategy.toLowerCase();

        if (!matchesSearch || !matchesStrategy) return acc;

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
        let totalBuyQty = 0;
        let totalSellQty = 0;
        let totalInvested = 0;
        let totalSellValue = 0;
        let avgBuyPrice = 0;
        let avgSellPrice = 0;
        let pnl = 0;
        let totalBuyPrice = 0;
        let totalSellPrice = 0;

        trades.forEach((t) => {
            const qty = parseFloat(t.quantity);
            const price = parseFloat(t.price);
            if (t.type === 'Buy') {
                totalInvested += qty * price;
                // totalQty += qty;
                totalBuyQty += qty;
                totalBuyPrice += qty * price;
                avgBuyPrice = totalBuyQty > 0 ? (totalInvested / totalBuyQty).toFixed(2) : 0;

            } else if (t.type === 'Sell') {
                totalSellValue += qty * price;
                // if (totalBuyQty === 0)
                //totalQty -= qty;
                totalSellQty += qty;
                totalSellPrice += qty * price;
                avgSellPrice = totalSellQty > 0 ? (totalSellValue / totalSellQty).toFixed(2) : 0;
            }
        });

        if (totalBuyQty >= totalSellQty)
            totalQty = totalBuyQty - totalSellQty;
        else
            totalQty = totalSellQty - totalBuyQty;


        totalQty = totalBuyQty >= totalSellQty ? totalBuyQty : totalSellQty;

        totalInvested = totalQty * avgBuyPrice;
        console.log('totalInvested :', totalInvested)
        if (totalInvested === 0)
            totalInvested = totalQty * avgSellPrice;

        if (totalBuyQty > 0 && totalSellPrice > 0)
            pnl = (totalSellQty * avgSellPrice) - (totalSellQty * avgBuyPrice);

        return { totalQty, avgBuyPrice, avgSellPrice, totalInvested, pnl };
    };

    const showToast = (msg) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
            // Fallback — you can integrate a custom snackbar here
            console.log('Toast:', msg);
        }
    };

    const deleteTradesForStock = async (stock) => {
        const buttons = [
            {
                text: 'Cancel',
                style: 'cancel',
            },
        ];

        if (strategy !== 'all') {
            buttons.push({
                text: `Only ${strategy.toUpperCase()}`,
                onPress: async () => {
                    const updatedTrades = trades.filter((t) => {
                        return !(t.stockName === stock && t.strategy === strategy);
                    });
                    await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
                    setSelectedStock(null);
                    fetchTrades();
                    showToast(`Deleted ${strategy.toUpperCase()} trades for ${stock}`);
                },
                style: 'destructive',
            });
        }

        buttons.push({
            text: 'Delete All',
            onPress: async () => {
                const updatedTrades = trades.filter((t) => t.stockName !== stock);
                await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
                setSelectedStock(null);
                fetchTrades();
                showToast(`Deleted all trades for ${stock}`);
            },
            style: 'destructive',
        });

        Alert.alert(
            `Delete Trades for ${stock}`,
            strategy !== 'all'
                ? `Do you want to delete only ${strategy.toUpperCase()} trades or all trades for this stock?`
                : `Are you sure you want to delete all trades for ${stock}?`,
            buttons
        );
    };

    const deleteSingleTrade = async (tradeId) => {
        Alert.alert(
            'Delete Trade',
            'Are you sure you want to delete this trade?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const updatedTrades = trades.filter((t) => t.id !== tradeId);
                        await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
                        fetchTrades();
                        showToast('Trade deleted successfully');
                    },
                },
            ]
        );
    };

    const renderGroupItem = (stock) => {
        const tradesForStock = groupedTrades[stock];
        const stats = calculateStats(tradesForStock);
        return (
            <TouchableOpacity
                key={stock}
                style={styles.tradeItem}
                onPress={() => setSelectedStock(stock)}
                onLongPress={() => deleteTradesForStock(stock)}
            >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.stock}>{stock}</Text>
                    <Text style={styles.detail}>Qty: {stats.totalQty}</Text>
                </View>
                <Text style={styles.detail}>Avg Buy Price: ₹{stats.avgBuyPrice}</Text>
                <Text style={styles.detail}>Avg Sell Price: ₹{stats.avgSellPrice}</Text>
                <Text style={styles.detail}>Total Invested: ₹{stats.totalInvested.toFixed(2)}</Text>
                <Text style={[styles.detail, { color: stats.pnl >= 0 ? '#4CAF50' : '#F44336' }]}>P/L: ₹{stats.pnl.toFixed(2)}</Text>
            </TouchableOpacity>
        );
    };

    const renderStockTrades = () => {
        const filtered = trades.filter((t) => {
            const matchesStock = t.stockName === selectedStock;
            const matchesStrategy = strategy.toLowerCase() === 'all' || t.strategy.toLowerCase() === strategy.toLowerCase();
            return matchesStock && matchesStrategy;
        });

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
                        <TouchableOpacity
                            onLongPress={() => deleteSingleTrade(item.id)}
                            delayLongPress={400}
                            style={styles.subTrade}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={styles.detail}>Type: <Text style={item.type === 'Buy' ? styles.buy : styles.sell}>{item.type.toUpperCase()}</Text></Text>
                                <Text style={styles.detail}>Strategy: {item.strategy}</Text>
                            </View>
                            <Text style={styles.detail}>Qty: {item.quantity} | Price: ₹{item.price}</Text>
                            <Text style={styles.detail}>Date: {formatDate(item.date)}</Text>
                        </TouchableOpacity>
                    )}
                />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTradesForStock(selectedStock)}>
                    <Text style={styles.deleteBtnText}>🗑️ Delete All Trades for {selectedStock}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Ad Space */}
            <View style={styles.adBanner}>
                {/* <Text style={{ color: '#999' }}>-- Ad Placeholder--</Text> */}
                {/* <BannerAd unitId={adUnitId} size={BannerAdSize.LARGE_BANNER} /> */}
                <NativeAdComponent></NativeAdComponent>
            </View>
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
                        {['All', 'Intraday', 'Swing'].map((type) => (
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

                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </>
            ) : (
                renderStockTrades()
            )}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <TradeScreen onModalClosefunc={(returnValue) => {
                    setModalVisible(false);
                    // if (returnValue)
                    fetchTrades();
                    console.log(returnValue);
                }}></TradeScreen>
            </Modal>

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
    adBanner: {
        // Remove the fixed height!
        // height: 50,

        // width: '100%',
        //  justifyContent: 'center',
        // alignItems: 'center',
        // borderBottomColor: '#D3D3D3',
        //  borderWidth: .5,
        //padding: 2,
        borderRadius: 15,
        backgroundColor: "#34796B",
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#3A4D8F',
        marginBottom: 12,
        marginTop: 5,
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
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#F9A825',
        padding: 16,
        borderRadius: 32,
        shadowColor: '#00000044',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    deleteBtn: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#F44336',
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});