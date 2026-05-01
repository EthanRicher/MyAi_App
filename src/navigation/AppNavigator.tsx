import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/SplashScreen";
import { LandingPage } from "../screens/LandingPage";
import { LoginScreen } from "../screens/LoginScreen";
import { LockoutScreen } from "../screens/LockoutScreen";
import { MainDashboard } from "../screens/MainDashboard";
import { HomeMenu } from "../screens/HomeMenu";
import { ClarityLanding } from "../features/Clarity/screens/ClarityLanding";
import { ClarityChat } from "../features/Clarity/screens/ClarityChat";
import { MedViewLanding } from "../features/Medview/screens/MedViewLanding";
import { MedViewSchedule } from "../features/Medview/screens/MedViewSchedule";
import { MedViewDetail } from "../features/Medview/screens/MedViewDetail";
import { MedViewAdd } from "../features/Medview/screens/MedViewAdd";
import { MedViewChat } from "../features/Medview/screens/MedViewChat";
import { SenseGuard } from "../features/SenseGuard/screens/SenseGuard";
import { Companion } from "../features/Companion/screens/Companion";
import { CompanionChat } from "../features/Companion/screens/CompanionChat";
import { SafeHarbour } from "../features/SafeHarbour/screens/SafeHarbour";
import { DocsLanding } from "../features/Docs/screens/DocsLanding";
import { DocsFeature } from "../features/Docs/screens/DocsFeature";
import { DocsCategory } from "../features/Docs/screens/DocsCategory";
import { DocsDetail } from "../features/Docs/screens/DocsDetail";
import { AlertsLog } from "../features/Docs/screens/AlertsLog";
import { DocCategory } from "../features/Docs/models/Doc";
import { FeatureGroupId } from "../features/Docs/models/FeatureGroup";
import { SettingsScreen } from "../screens/SettingsScreen";
import { Medication } from "../features/Medview/models/Medication";
export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  Lockout: undefined;
  Main: undefined;
  Home: undefined;
  Clarity: undefined;
  ClarityChat: { title?: string; initialMessage?: string; chips?: string[]; scopeId?: string };
  MedView: undefined;
  MedViewSchedule: undefined;
  MedViewDetail: { id: string };

  MedViewAdd: { med?: Medication } | undefined;

  MedViewChat: { med?: Medication } | undefined;
  SenseGuard: undefined;
  Companion: undefined;
  CompanionChat: { title?: string; initialMessage?: string };
  SafeHarbour: undefined;
  Docs: undefined;
  DocsFeature: { featureId: FeatureGroupId };
  DocsCategory: { category: DocCategory };
  DocsDetail: { id: string };
  AlertsLog: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, animation: "none" }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Lockout" component={LockoutScreen} />
      <Stack.Screen name="Main" component={MainDashboard} />
      <Stack.Screen name="Home" component={HomeMenu} />
      <Stack.Screen name="Clarity" component={ClarityLanding} />
      <Stack.Screen name="ClarityChat" component={ClarityChat} />
      <Stack.Screen name="MedView" component={MedViewLanding} />
      <Stack.Screen name="MedViewSchedule" component={MedViewSchedule} />
      <Stack.Screen name="MedViewDetail" component={MedViewDetail} />
      <Stack.Screen name="MedViewAdd" component={MedViewAdd} />
      <Stack.Screen name="MedViewChat" component={MedViewChat} />
      <Stack.Screen name="SenseGuard" component={SenseGuard} />
      <Stack.Screen name="Companion" component={Companion} />
      <Stack.Screen name="CompanionChat" component={CompanionChat} />
      <Stack.Screen name="SafeHarbour" component={SafeHarbour} />
      <Stack.Screen name="Docs" component={DocsLanding} />
      <Stack.Screen name="DocsFeature" component={DocsFeature} />
      <Stack.Screen name="DocsCategory" component={DocsCategory} />
      <Stack.Screen name="DocsDetail" component={DocsDetail} />
      <Stack.Screen name="AlertsLog" component={AlertsLog} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
