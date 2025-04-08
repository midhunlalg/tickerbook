import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Switch,
    Platform,
    Alert,
    FlatList,
    Pressable,
    Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useEffect } from 'react';

const COLORS = {
    primary: '#3A4D8F',
    accent: '#F9A825',
    secondary: '#F1F3F6',
    text: '#1A1A1A',
    success: '#4CAF50',
    alert: '#F44336',
};

const TradeScreen = ({ onModalClosefunc }) => {
    // const [modalVisible, setModalVisible] = useState(false);
    const [stockName, setStockName] = useState('');
    const [isBuy, setIsBuy] = useState(true);
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [filteredStocks, setFilteredStocks] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tradeStrategy, setTradeStrategy] = useState('Intraday'); // NEW
    const [allStockNames, setAllStockNames] = useState([]);

    // Inside the component:
    useEffect(() => {
        const loadStocks = async () => {
            try {
                const stored = await AsyncStorage.getItem('stockList');
                if (stored) {
                    setAllStockNames(JSON.parse(stored));
                }
            } catch (error) {
                console.log("Error loading stock list", error);
            }
        };
        loadStocks();
    }, []);

    const onStockInputChange = (text) => {
        setStockName(text);
        if (text.length > 0) {
            const matches = allStockNames.filter((s) =>
                s.toLowerCase().startsWith(text.toLowerCase())
            );
            setFilteredStocks(matches);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };


    const selectStock = (name) => {
        setStockName(name);
        setShowSuggestions(false);
    };

    const resetFields = () => {
        setStockName('');
        setIsBuy(true);
        setPrice('');
        setQuantity('');
        setDate(new Date());
    };

    const saveTrade = async () => {
        if (!stockName || !quantity || !price || !date) {
            Alert.alert("Error", "Please fill all required fields.");
            return;
        }

        const trade = {
            id: Date.now().toString(),
            stockName,
            type: isBuy ? 'Buy' : 'Sell',
            price: parseFloat(price),
            quantity: parseInt(quantity),
            date: date.toISOString(),
            strategy: tradeStrategy, // include strategy if needed
        };

        try {
            const existingTrades = await AsyncStorage.getItem('trades');
            const trades = existingTrades ? JSON.parse(existingTrades) : [];
            trades.push(trade);
            await AsyncStorage.setItem('trades', JSON.stringify(trades));

            // Save unique stock name
            const storedStocks = await AsyncStorage.getItem('stockList');
            const stockArray = storedStocks ? JSON.parse(storedStocks) : [];

            if (!stockArray.includes(stockName)) {
                const updatedList = [...stockArray, stockName];
                await AsyncStorage.setItem('stockList', JSON.stringify(updatedList));
                setAllStockNames(updatedList);
            }

            resetFields();
            onModalClosefunc(true);
            // setModalVisible(false);
        } catch (error) {
            console.error('Error saving trade:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Ad Space */}
            <View style={styles.adBanner}>
                <Text style={{ color: '#999' }}>-- Ad Placeholder --</Text>
            </View>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.label}>Search Stock</Text>
                    <TextInput
                        value={stockName}
                        // onChangeText={setStockName}
                        onChangeText={onStockInputChange}
                        style={styles.input}
                        placeholder="Enter stock name"
                        placeholderTextColor="#999"
                    />
                    {showSuggestions && (
                        <FlatList
                            data={filteredStocks}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        Keyboard.dismiss(); // 👈 hides the keyboard
                                        selectStock(item);
                                    }}
                                    style={styles.suggestionItem}
                                >
                                    <Text>{item}</Text>
                                </Pressable>
                            )}
                            style={styles.suggestionList}
                        />
                    )}

                    <View style={styles.toggleRow}>
                        <Text
                            style={[
                                styles.label,
                                { color: isBuy ? COLORS.success : COLORS.text } // Green if isBuy, else default text color
                            ]}
                        >
                            Buy
                        </Text>
                        <Switch style={{ width: 30 }}
                            value={isBuy}
                            onValueChange={setIsBuy}
                            trackColor={{ false: COLORS.alert, true: COLORS.success }}
                            thumbColor="#fff"
                        />
                        <Text
                            style={[
                                styles.label,
                                { color: !isBuy ? COLORS.alert : COLORS.text } // Red if !isBuy, else default text color
                            ]}
                        >
                            Sell
                        </Text>
                    </View>
                    <View style={styles.strategyToggle}>
                        <TouchableOpacity
                            style={[
                                styles.strategyButton,
                                tradeStrategy === 'Intraday' && styles.strategyActive,
                            ]}
                            onPress={() => setTradeStrategy('Intraday')}
                        >
                            <Text style={styles.strategyText}>Intraday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.strategyButton,
                                tradeStrategy === 'Swing' && styles.strategyActive,
                            ]}
                            onPress={() => setTradeStrategy('Swing')}
                        >
                            <Text style={styles.strategyText}>Swing</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        value={price}
                        onChangeText={setPrice}
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Price"
                        placeholderTextColor="#999"
                    />

                    <TextInput
                        value={quantity}
                        onChangeText={setQuantity}
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Quantity"
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.dateText}>
                            Date: {date.toLocaleDateString('en-GB')}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (event.type === 'set') {
                                    setDate(selectedDate);
                                }
                            }
                            }
                        />
                    )}


                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.saveButton} onPress={saveTrade}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                resetFields();
                                onModalClosefunc(false);
                                // setModalVisible(false);
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {/* </Modal > */}
        </View >
    );
};

export default TradeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //  backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        //padding: 20,
    },
    adBanner: {
        height: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    strategyToggle: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 16,
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },

    strategyButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ddd',
    },

    strategyActive: {
        backgroundColor: COLORS.accent,
    },

    strategyText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },

    suggestionList: {
        maxHeight: 120,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
    },

    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    addButton: {
        backgroundColor: COLORS.accent,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    addButtonText: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    modalContent: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 20,
        elevation: 10,
    },
    label: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        color: COLORS.text,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 16,
        color: COLORS.primary,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: COLORS.alert,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
