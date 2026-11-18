import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

type TransactionInput = {
  description: string;
  amount: number;
};

export const CATEGORIES = [
  "Food & Dining",
  "Rent & Housing",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Entertainment",
  "Utilities",
  "Medicine",
  "Income",
  "Other",
];

// Smart rule-based heuristic for instant & reliable categorization fallback
export function heuristicCategorize(description: string): string {
  const desc = (description || "").toLowerCase();

  // Food & Dining
  if (
    desc.includes("swiggy") ||
    desc.includes("zomato") ||
    desc.includes("mcdonald") ||
    desc.includes("kfc") ||
    desc.includes("burger") ||
    desc.includes("pizza") ||
    desc.includes("domino") ||
    desc.includes("starbucks") ||
    desc.includes("cafe") ||
    desc.includes("restaurant") ||
    desc.includes("dining") ||
    desc.includes("food") ||
    desc.includes("blinkit") ||
    desc.includes("zepto") ||
    desc.includes("instamart") ||
    desc.includes("grocery") ||
    desc.includes("supermarket") ||
    desc.includes("bakery") ||
    desc.includes("chai") ||
    desc.includes("tea")
  ) {
    return "Food & Dining";
  }

  // Transportation
  if (
    desc.includes("uber") ||
    desc.includes("ola") ||
    desc.includes("rapido") ||
    desc.includes("metro") ||
    desc.includes("petrol") ||
    desc.includes("fuel") ||
    desc.includes("hpcl") ||
    desc.includes("bpcl") ||
    desc.includes("ioc") ||
    desc.includes("indian oil") ||
    desc.includes("toll") ||
    desc.includes("fastag") ||
    desc.includes("irctc") ||
    desc.includes("flight") ||
    desc.includes("railway") ||
    desc.includes("indigo") ||
    desc.includes("air india")
  ) {
    return "Transportation";
  }

  // Subscriptions
  if (
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("prime") ||
    desc.includes("hotstar") ||
    desc.includes("youtube") ||
    desc.includes("apple") ||
    desc.includes("icloud") ||
    desc.includes("aws") ||
    desc.includes("google one") ||
    desc.includes("subscription") ||
    desc.includes("openai") ||
    desc.includes("chatgpt") ||
    desc.includes("github") ||
    desc.includes("patreon") ||
    desc.includes("membership")
  ) {
    return "Subscriptions";
  }

  // Shopping
  if (
    desc.includes("amazon") ||
    desc.includes("flipkart") ||
    desc.includes("myntra") ||
    desc.includes("ajio") ||
    desc.includes("zara") ||
    desc.includes("h&m") ||
    desc.includes("shopping") ||
    desc.includes("retail") ||
    desc.includes("store") ||
    desc.includes("mall")
  ) {
    return "Shopping";
  }

  // Rent & Housing
  if (
    desc.includes("rent") ||
    desc.includes("housing") ||
    desc.includes("maintenance") ||
    desc.includes("society") ||
    desc.includes("landlord") ||
    desc.includes("flat") ||
    desc.includes("apartment")
  ) {
    return "Rent & Housing";
  }

  // Utilities
  if (
    desc.includes("electricity") ||
    desc.includes("water") ||
    desc.includes("gas") ||
    desc.includes("wifi") ||
    desc.includes("broadband") ||
    desc.includes("airtel") ||
    desc.includes("jio") ||
    desc.includes("vi ") ||
    desc.includes("vodafone") ||
    desc.includes("bill") ||
    desc.includes("recharge")
  ) {
    return "Utilities";
  }

  // Medicine & Healthcare
  if (
    desc.includes("apollo") ||
    desc.includes("pharmacy") ||
    desc.includes("pharma") ||
    desc.includes("chemist") ||
    desc.includes("medicine") ||
    desc.includes("medplus") ||
    desc.includes("1mg") ||
    desc.includes("netmeds") ||
    desc.includes("pharmeasy") ||
    desc.includes("hospital") ||
    desc.includes("clinic") ||
    desc.includes("doctor") ||
    desc.includes("dr.") ||
    desc.includes("dr ") ||
    desc.includes("healthcare") ||
    desc.includes("health") ||
    desc.includes("diagnostics") ||
    desc.includes("pathology") ||
    desc.includes("path lab") ||
    desc.includes("lal path") ||
    desc.includes("metropolis") ||
    desc.includes("thyrocare") ||
    desc.includes("medical") ||
    desc.includes("druggist") ||
    desc.includes("dental") ||
    desc.includes("max healthcare") ||
    desc.includes("fortis") ||
    desc.includes("manipal") ||
    desc.includes("narayana") ||
    desc.includes("practo")
  ) {
    return "Medicine";
  }

  // Entertainment
  if (
    desc.includes("bookmyshow") ||
    desc.includes("pvr") ||
    desc.includes("inox") ||
    desc.includes("movie") ||
    desc.includes("cinema") ||
    desc.includes("game") ||
    desc.includes("steam") ||
    desc.includes("playstation")
  ) {
    return "Entertainment";
  }

  // Income
  if (
    desc.includes("salary") ||
    desc.includes("stipend") ||
    desc.includes("dividend") ||
    desc.includes("interest") ||
    desc.includes("refund") ||
    desc.includes("cashback") ||
    desc.includes("deposit") ||
    desc.includes("credit")
  ) {
    return "Income";
  }

  return "Other";
}

export async function categorizeTransactions(
  transactions: TransactionInput[]
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 800,
      },
    });

    const prompt = `You are an expert financial transaction categorizer specialized in Indian and global banking transactions.
Assign each transaction to the most accurate category from this exact list:
${CATEGORIES.join(", ")}.

Specialized Domain Guidelines:
- "Medicine": Any pharmacy, medical store, chemist (Apollo Pharmacy, Medplus, Frank Ross), online medicine apps (Tata 1mg, Netmeds, PharmEasy), hospitals (Max, Fortis, Apollo, Manipal, Narayana), doctors, clinics, dental care, lab tests, pathology (Dr Lal PathLabs, Thyrocare, Metropolis), medicines, and medical equipment.
- "Food & Dining": Restaurants, food delivery (Swiggy, Zomato, EatClub), groceries (Blinkit, Zepto, Instamart, BigBasket, DMart), cafes (Starbucks, CCD, Chaayos), dining, bakeries.
- "Transportation": Rides & cabs (Uber, Ola, Rapido), metro card recharge, fuel/petrol pumps (HPCL, BPCL, IOCL, Indian Oil), FASTag, train/flight tickets (IRCTC, MakeMyTrip, IndiGo, Air India), bus tickets.
- "Subscriptions": Digital subscriptions & SaaS (Netflix, Spotify, Prime Video, YouTube Premium, Disney+ Hotstar, Apple iCloud, Google One, OpenAI ChatGPT, GitHub, AWS).
- "Shopping": E-commerce & retail (Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, Zara, H&M, Uniqlo, Croma, Reliance Digital).
- "Utilities": Home utilities (Electricity bills, Water board, Piped gas, Mobile & DTH recharges via Airtel, Jio, Vi, Broadband/Wi-Fi).
- "Entertainment": Movies (BookMyShow, PVR, INOX, Cinepolis), gaming (Steam, PlayStation), concerts, clubs.
- "Rent & Housing": Apartment rent, society maintenance, brokerage, housing society charges.
- "Income": Salary credits, interest, dividend payments, refunds, cashbacks.
- "Other": Only use if the transaction genuinely does not fit any category above.

Transactions:
${transactions
  .map((t, i) => `${i + 1}. "${t.description}" - amount: ${t.amount}`)
  .join("\n")}

Respond ONLY with a valid JSON array of category strings in the exact same order. Example: ["Medicine", "Food & Dining", "Shopping"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const categories = JSON.parse(text) as string[];

    if (Array.isArray(categories) && categories.length === transactions.length) {
      return categories.map((cat) => (CATEGORIES.includes(cat) ? cat : "Other"));
    }
  } catch (err) {
    console.warn("Gemini AI categorization unavailable or failed, applying intelligent heuristic engine:", err);
  }

  // 100% Reliable Fallback: Categorizes common Indian and international merchants
  return transactions.map((t) => heuristicCategorize(t.description));
}

export async function categorizeWithHint(
  description: string,
  amount: number,
  hint: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 800,
      },
    });

    const prompt = `You are a financial transaction categorizer. Assign this transaction to exactly one of these categories: ${CATEGORIES.join(", ")}.

Transaction: "${description}" - amount: ${amount}
The user provided this extra context about what this payment was for: "${hint}"

Respond ONLY with a JSON array containing exactly one category string. Example: ["Food & Dining"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const categories = JSON.parse(text) as string[];

    if (categories[0] && CATEGORIES.includes(categories[0])) {
      return categories[0];
    }
  } catch (err) {
    console.warn("Gemini AI hint categorization unavailable, applying fallback:", err);
  }

  return heuristicCategorize(hint || description);
}
