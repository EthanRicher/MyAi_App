import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "../screens/SplashScreen";
import { LandingPage } from "../screens/LandingPage";
import { LoginScreen } from "../screens/LoginScreen";
import { LockoutScreen } from "../screens/LockoutScreen";
import { MainDashboard } from "../screens/MainDashboard";
import { HomeMenu } from "../screens/HomeMenu";
import { ClarityLanding } from "../screens/ClarityLanding";
import { ClarityRecord } from "../screens/ClarityRecord";
import { ClarityResult } from "../screens/ClarityResult";
import { ClarityChat } from "../screens/ClarityChat";
import { MedViewLanding } from "../screens/MedViewLanding";
import { MedViewSchedule } from "../screens/MedViewSchedule";
import { MedViewDetail } from "../screens/MedViewDetail";
import { MedViewAdd } from "../screens/MedViewAdd";
import { MedViewChat } from "../screens/MedViewChat";
import { SenseGuard } from "../screens/SenseGuard";
import { Companion } from "../screens/Companion";
import { CompanionChat } from "../screens/CompanionChat";
import { SafeHarbour } from "../screens/SafeHarbour";
import { SettingsScreen } from "../screens/SettingsScreen";

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  Lockout: undefined;
  Main: undefined;
  Home: undefined;
  Clarity: undefined;
  ClarityRecord: undefined;
  ClarityResult: undefined;
  ClarityChat: { title?: string; initialMessage?: string; chips?: string[] };
  MedView: undefined;
  MedViewSchedule: undefined;
  MedViewDetail: { id: string };
  MedViewAdd: undefined;
  MedViewChat: undefined;
  SenseGuard: undefined;
  Companion: undefined;
  CompanionChat: { title?: string; initialMessage?: string };
  SafeHarbour: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: "none" }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Lockout" component={LockoutScreen} />
      <Stack.Screen name="Main" component={MainDashboard} />
      <Stack.Screen name="Home" component={HomeMenu} />
      <Stack.Screen name="Clarity" component={ClarityLanding} />
      <Stack.Screen name="ClarityRecord" component={ClarityRecord} />
      <Stack.Screen name="ClarityResult" component={ClarityResult} />
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
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
