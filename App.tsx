import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { MedicationProvider } from "./src/features/Medview/hooks/useMedication";
import { UserProfileProvider } from "./src/profile/hooks/useUserProfile";

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProfileProvider>
      <MedicationProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#04041c" />
        </NavigationContainer>
      </MedicationProvider>
      </UserProfileProvider>
    </SafeAreaProvider>
  );
}