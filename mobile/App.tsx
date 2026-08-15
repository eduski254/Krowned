import { View, Text, StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

function TestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Krowned</Text>
        <Text style={styles.subtitle}>App is loading correctly!</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0C0B0A" />
      <TestScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0B0A",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#D9B36C",
  },
  subtitle: {
    fontSize: 16,
    color: "#F2E7D3",
    marginTop: 12,
  },
});
