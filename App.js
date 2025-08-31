import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, Button, FlatList, 
  ActivityIndicator, Alert, StyleSheet, TouchableOpacity 
} from "react-native";

const API_BASE = "https://groviq.shop/wp-json/custom-api/v1";

export default function App() {
  const [vendorId, setVendorId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🛒 Fetch vendor orders
  const fetchOrders = async (id) => {
    if (!id) {
      Alert.alert("Error", "Please enter vendor ID");
      return;
    }
    try {
      setLoading(true);

      // ✅ FIXED — backticks used
      const response = await fetch(`${API_BASE}/vendor-orders/${id}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
        Alert.alert("No Orders", "No orders found for this vendor.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to fetch orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update order status
  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE}/update-order-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", data.message);
        fetchOrders(vendorId); // Refresh list
      } else {
        Alert.alert("Error", data.message || "Failed to update order");
      }
    } catch (err) {
      Alert.alert("Error", "Failed: " + err.message);
    }
  };

  // Auto refresh every 15s
  useEffect(() => {
    let interval;
    if (vendorId) {
      fetchOrders(vendorId);
      interval = setInterval(() => fetchOrders(vendorId), 15000);
    }
    return () => clearInterval(interval);
  }, [vendorId]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Groviq Vendor Orders</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Vendor ID"
        value={vendorId}
        onChangeText={setVendorId}
        keyboardType="numeric"
      />
      <Button title="Fetch Orders" onPress={() => fetchOrders(vendorId)} />

      {loading && <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.orderBox}>
            <Text style={styles.orderTitle}>Order #{item.order_id}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Total: ₹{item.total}</Text>
            <Text>Date: {item.date_created}</Text>

            <Text style={styles.subHeading}>Products:</Text>
            {item.items && item.items.length > 0 ? (
              item.items.map((p, idx) => (
                <Text key={idx} style={styles.productLine}>
                  • {p.name} (x{p.quantity}) – ₹{p.total}
                </Text>
              ))
            ) : (
              <Text>No products found</Text>
            )}

            {/* ✅ Accept / Reject buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: "green" }]} 
                onPress={() => updateOrderStatus(item.order_id, "completed")}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: "red" }]} 
                onPress={() => updateOrderStatus(item.order_id, "cancelled")}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40 },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  orderBox: { padding: 15, marginVertical: 5, backgroundColor: "#f2f2f2", borderRadius: 5 },
  orderTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  subHeading: { marginTop: 8, fontWeight: "600" },
  productLine: { marginLeft: 10, fontSize: 13 },
  actionRow: { flexDirection: "row", marginTop: 10, gap: 10 },
  btn: { flex: 1, padding: 10, borderRadius: 5, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" }
});