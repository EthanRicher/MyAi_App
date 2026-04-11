import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { MedicationProvider } from "./src/features/Medview/hooks/useMedication";

export default function App() {
  return (
    <SafeAreaProvider>
      <MedicationProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#04041c" />
        </NavigationContainer>
      </MedicationProvider>
    </SafeAreaProvider>
  );
}