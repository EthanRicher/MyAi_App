import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { MedicationProvider } from "./src/features/Medview/hooks/useMedication";
import { UserProfileProvider } from "./src/profile/hooks/useUserProfile";
import { DocsProvider } from "./src/features/Docs/hooks/useDocs";
import { AlertsProvider } from "./src/features/Docs/hooks/useAlerts";

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProfileProvider>
      <MedicationProvider>
      <DocsProvider>
      <AlertsProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#04041c" />
        </NavigationContainer>
      </AlertsProvider>
      </DocsProvider>
      </MedicationProvider>
      </UserProfileProvider>
    </SafeAreaProvider>
  );
}