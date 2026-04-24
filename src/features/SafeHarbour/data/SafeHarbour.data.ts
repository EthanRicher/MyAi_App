import { AlertTriangle, Link, Eye, DollarSign } from "lucide-react-native";

export interface EducationCard {
  title: string;
  icon: any;
  content: string;
}

export interface SafeHabit {
  n: number;
  title: string;
  desc: string;
}

export const educationCards: EducationCard[] = [
  { title: "Scam Warning Signs", icon: AlertTriangle, content: "Watch for: urgent language, requests for personal info, threats, unexpected prizes, and pressure to keep secrets." },
  { title: "Before Clicking Links", icon: Link, content: "Check: Does the email look real? Is the URL correct? Were you expecting it? When in doubt, type the address directly." },
  { title: "If I Suspect Fraud", icon: Eye, content: "Don't send money or details. Contact your bank. Call Scamwatch 1300 795 995. Tell someone you trust. Keep evidence." },
  { title: "Financial Safety", icon: DollarSign, content: "Never share PINs or passwords. Don't transfer money to strangers. Banks never ask for passwords by phone or email." },
];

export const safeHabits: SafeHabit[] = [
  { n: 1, title: "Pause First", desc: "If urgent, take a breath. Scammers want quick action." },
  { n: 2, title: "Verify Yourself", desc: "Call the organisation using a number you trust." },
  { n: 3, title: "Protect Info", desc: "Never share passwords or financial details online." },
  { n: 4, title: "Talk to Someone", desc: "Discuss money decisions with someone you trust." },
  { n: 5, title: "Report It", desc: "Report scams to Scamwatch (1300 795 995)." },
];
